import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import { setTokenRefreshHandler } from '../services/apiClient';
import * as authService from '../services/authService';
import type { RegisterResponse, VerifyOtpResponse } from '../types/api';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  customerId: string | null;
  isRestoredSession: boolean; // true if session was restored from storage (needs biometric)
}

interface AuthContextValue extends AuthState {
  register: (customerId: string, phoneNumber: string) => Promise<RegisterResponse>;
  verifyOtp: (customerId: string, otpCode: string) => Promise<VerifyOtpResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    customerId: null,
    isRestoredSession: false,
  });

  // Check stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, customerId, expiresAt] = await Promise.all([
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT),
        ]);

        console.log('[Auth] Restore check:', {
          hasToken: !!token,
          customerId,
          expiresAt,
          now: Date.now(),
          expired: expiresAt ? Date.now() > Number(expiresAt) : 'no expiry',
        });

        if (token && customerId) {
          // Token exists — check if expired and try refresh
          if (expiresAt && Date.now() > Number(expiresAt)) {
            console.log('[Auth] Access token expired, attempting refresh...');
            const refreshed = await authService.refreshToken();
            if (refreshed) {
              console.log('[Auth] Token refreshed successfully');
              setState({ isLoading: false, isAuthenticated: true, customerId, isRestoredSession: true });
            } else {
              console.log('[Auth] Refresh failed, user must re-login');
              setState({ isLoading: false, isAuthenticated: false, customerId: null, isRestoredSession: false });
            }
          } else {
            setState({ isLoading: false, isAuthenticated: true, customerId, isRestoredSession: true });
          }
        } else {
          setState({ isLoading: false, isAuthenticated: false, customerId: null, isRestoredSession: false });
        }
      } catch (err) {
        console.error('[Auth] Restore failed:', err);
        setState({ isLoading: false, isAuthenticated: false, customerId: null, isRestoredSession: false });
      }
    })();
  }, []);

  // Register token refresh handler for apiClient
  useEffect(() => {
    setTokenRefreshHandler(async () => {
      const success = await authService.refreshToken();
      if (!success) {
        setState({ isLoading: false, isAuthenticated: false, customerId: null, isRestoredSession: false });
      }
      return success;
    });
  }, []);

  const register = useCallback(async (customerId: string, phoneNumber: string) => {
    return authService.register(customerId, phoneNumber);
  }, []);

  const verifyOtp = useCallback(async (customerId: string, otpCode: string) => {
    const result = await authService.verifyOtp(customerId, otpCode);
    if (result.success) {
      // Fresh login — no biometric needed
      setState({ isLoading: false, isAuthenticated: true, customerId, isRestoredSession: false });
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ isLoading: false, isAuthenticated: false, customerId: null, isRestoredSession: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
