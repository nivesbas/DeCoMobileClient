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
    console.error('[Auth] register returned no data', { correlationId: response.correlationId });
    throw new Error(response.message ?? 'Registration failed.');
  }

  return response.data;
}

export async function verifyOtp(
  customerId: string,
  otpCode: string,
  phoneNumber?: string,
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
    console.error('[Auth] verify-otp returned no data', { correlationId: response.correlationId });
    throw new Error(response.message ?? 'Verification failed.');
  }

  const result = response.data;

  // Store tokens on success. PhoneNumber is persisted (when caller passes it)
  // so DeleteAccountScreen can verify the user typed their own number even
  // after a session restore. SecureStore is Keystore-encrypted so this is no
  // worse than the existing customerId/refresh token persistence.
  if (result.success && result.accessToken && result.refreshToken) {
    const writes: Promise<void>[] = [
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
      SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID, customerId),
      SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT,
        String(Date.now() + (result.accessTokenExpiresInSeconds ?? 900) * 1000),
      ),
    ];
    if (phoneNumber) {
      writes.push(SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.PHONE_NUMBER, phoneNumber));
    }
    await Promise.all(writes);
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

/**
 * Permanently delete the user's account on the server (GDPR / Play Store
 * mandate). Strips PII (phone, sessions) from every device row of the calling
 * customer and deletes their push tokens. Bank-side debt and message history
 * is retained per legal-retention rules and is unaffected.
 *
 * On success, the local session is cleared just like logout(). Throws if the
 * server call fails — the caller decides whether to retry or surface the
 * error to the user. The token is sent in the Authorization header by
 * apiClient automatically.
 */
export async function deleteAccount(): Promise<void> {
  // Server-side erasure first — if it fails, we keep the local session intact
  // so the user can retry. apiClient throws ApiError on non-2xx.
  await api.delete('/auth/account');

  // Mirror logout's local cleanup. Don't reuse logout() because that would
  // POST /auth/deregister, which is redundant — the account-deletion SP
  // already revoked all device sessions server-side.
  await Promise.all([
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.CUSTOMER_ID),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.PHONE_NUMBER),
    SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT),
  ]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  return !!token;
}
