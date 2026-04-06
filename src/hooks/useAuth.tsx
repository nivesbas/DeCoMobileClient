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
  });

  // Check stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, customerId] = await Promise.all([
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
          SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID),
        ]);

        if (token && customerId) {
          setState({ isLoading: false, isAuthenticated: true, customerId });
        } else {
          setState({ isLoading: false, isAuthenticated: false, customerId: null });
        }
      } catch {
        setState({ isLoading: false, isAuthenticated: false, customerId: null });
      }
    })();
  }, []);

  // Register token refresh handler for apiClient
  useEffect(() => {
    setTokenRefreshHandler(async () => {
      const success = await authService.refreshToken();
      if (!success) {
        setState({ isLoading: false, isAuthenticated: false, customerId: null });
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
      setState({ isLoading: false, isAuthenticated: true, customerId });
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ isLoading: false, isAuthenticated: false, customerId: null });
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
