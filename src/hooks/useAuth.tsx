import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import { setTokenRefreshHandler } from '../services/apiClient';
import * as authService from '../services/authService';
import { registerForPushNotificationsAsync } from '../services/pushNotificationService';
import type { RegisterResponse, VerifyOtpResponse } from '../types/api';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  customerId: string | null;
  phoneNumber: string | null;
  isRestoredSession: boolean; // true if session was restored from storage (needs biometric)
}

interface AuthContextValue extends AuthState {
  register: (customerId: string, phoneNumber: string) => Promise<RegisterResponse>;
  verifyOtp: (customerId: string, otpCode: string, phoneNumber?: string) => Promise<VerifyOtpResponse>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    customerId: null,
    phoneNumber: null,
    isRestoredSession: false,
  });

  // Check stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, customerId, phoneNumber, expiresAt] = await Promise.all([
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.PHONE_NUMBER),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT),
        ]);

        if (token && customerId) {
          // Token exists — check if expired and try refresh
          if (expiresAt && Date.now() > Number(expiresAt)) {
            const refreshed = await authService.refreshToken();
            if (refreshed) {
              setState({ isLoading: false, isAuthenticated: true, customerId, phoneNumber, isRestoredSession: true });
              // Re-register push token on session restore — it may have rotated
              // while the app was backgrounded. Fire-and-forget.
              void registerForPushNotificationsAsync();
            } else {
              setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
            }
          } else {
            setState({ isLoading: false, isAuthenticated: true, customerId, phoneNumber, isRestoredSession: true });
            void registerForPushNotificationsAsync();
          }
        } else {
          setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
        }
      } catch (err) {
        console.error('[Auth] Restore failed:', err);
        setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
      }
    })();
  }, []);

  // Register token refresh handler for apiClient
  useEffect(() => {
    setTokenRefreshHandler(async () => {
      const success = await authService.refreshToken();
      if (!success) {
        setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
      }
      return success;
    });
  }, []);

  const register = useCallback(async (customerId: string, phoneNumber: string) => {
    return authService.register(customerId, phoneNumber);
  }, []);

  const verifyOtp = useCallback(async (customerId: string, otpCode: string, phoneNumber?: string) => {
    const result = await authService.verifyOtp(customerId, otpCode, phoneNumber);
    if (result.success) {
      // Fresh login — no biometric needed
      setState({ isLoading: false, isAuthenticated: true, customerId, phoneNumber: phoneNumber ?? null, isRestoredSession: false });
      // Fresh login is the ideal moment to ask for push permission — we've
      // just earned trust via OTP, and the token lands before any scheduled
      // job fires for this customer. Fire-and-forget on purpose; registration
      // failure must never surface to the OTP screen.
      void registerForPushNotificationsAsync();
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
  }, []);

  const deleteAccount = useCallback(async () => {
    // Server side first — throws on failure so the screen can show an error
    // and the local session stays intact (user can retry).
    await authService.deleteAccount();
    setState({ isLoading: false, isAuthenticated: false, customerId: null, phoneNumber: null, isRestoredSession: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, verifyOtp, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
