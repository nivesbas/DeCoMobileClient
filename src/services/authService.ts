import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { CONFIG } from '../constants/config';
import { api, getDeviceId } from './apiClient';
import type {
  ApiResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types/api';

export async function register(
  customerId: string,
  phoneNumber: string,
): Promise<RegisterResponse> {
  const deviceId = await getDeviceId();

  const body: RegisterRequest = {
    customerId,
    phoneNumber,
    deviceId,
    deviceModel: Device.modelName ?? 'Unknown',
    osVersion: `${Platform.OS} ${Device.osVersion ?? ''}`.trim(),
    appVersion: CONFIG.APP_VERSION,
  };

  const response = await api.post<ApiResponse<RegisterResponse>>(
    '/auth/register',
    body,
    { skipAuth: true },
  );

  if (!response.data) {
    console.error('[Auth] register returned no data:', JSON.stringify(response));
    throw new Error(response.message ?? 'Registration failed.');
  }

  return response.data;
}

export async function verifyOtp(
  customerId: string,
  otpCode: string,
): Promise<VerifyOtpResponse> {
  const deviceId = await getDeviceId();

  const body: VerifyOtpRequest = {
    customerId,
    deviceId,
    otpCode,
  };

  const response = await api.post<ApiResponse<VerifyOtpResponse>>(
    '/auth/verify-otp',
    body,
    { skipAuth: true },
  );

  if (!response.data) {
    console.error('[Auth] verify-otp returned no data:', JSON.stringify(response));
    throw new Error(response.message ?? 'Verification failed.');
  }

  const result = response.data;

  // Store tokens on success
  if (result.success && result.accessToken && result.refreshToken) {
    await Promise.all([
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID, customerId),
      SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT,
        String(Date.now() + (result.accessTokenExpiresInSeconds ?? 900) * 1000),
      ),
    ]);
  }

  return result;
}

export async function refreshToken(): Promise<boolean> {
  try {
    const [storedRefreshToken, deviceId] = await Promise.all([
      SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      getDeviceId(),
    ]);

    if (!storedRefreshToken) return false;

    const body: RefreshTokenRequest = {
      refreshToken: storedRefreshToken,
      deviceId,
    };

    const response = await api.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      body,
      { skipAuth: true },
    );

    const result = response.data!;

    if (result.success && result.accessToken && result.refreshToken) {
      await Promise.all([
        SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
        SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
        SecureStore.setItemAsync(
          CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT,
          String(Date.now() + (result.accessTokenExpiresInSeconds ?? 900) * 1000),
        ),
      ]);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    // Try to deregister device (best-effort)
    await api.post('/auth/deregister');
  } catch {
    // Ignore — local cleanup is what matters
  }

  await Promise.all([
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT),
  ]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  return !!token;
}
