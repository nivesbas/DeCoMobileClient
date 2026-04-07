import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
    this.name = 'AuthError';
  }
}

// Token refresh listener — set by useAuth hook
let onTokenRefreshNeeded: (() => Promise<boolean>) | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function setTokenRefreshHandler(handler: () => Promise<boolean>) {
  onTokenRefreshNeeded = handler;
}

async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    // Generate a stable unique device identifier
    deviceId = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: extraHeaders, skipAuth = false, timeout = CONFIG.REQUEST_TIMEOUT_MS } = options;

  const url = `${CONFIG.API_BASE_URL}${path}`;
  const deviceId = await getDeviceId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId,
    'X-App-Version': CONFIG.APP_VERSION,
    'X-Client-Channel': '1', // MobileApp
    ...extraHeaders,
  };

  if (!skipAuth) {
    const token = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 — try token refresh once
    if (response.status === 401 && !skipAuth && onTokenRefreshNeeded) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = onTokenRefreshNeeded();
      }

      const refreshed = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (refreshed) {
        // Retry original request with new token
        return request<T>(method, path, options);
      }

      throw new AuthError();
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new ApiError(429, `Too many requests. Retry after ${retryAfter ?? '?'} seconds.`);
    }

    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error(`[API] Invalid JSON from ${method} ${path}:`, text.slice(0, 500));
      throw new ApiError(response.status, 'Invalid response from server.');
    }

    if (!response.ok) {
      console.warn(`[API] ${method} ${path} → ${response.status}:`, data?.message);
      throw new ApiError(
        response.status,
        data?.message ?? `Request failed with status ${response.status}`,
        data?.correlationId,
      );
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out. Please check your connection.');
    }
    throw new ApiError(0, 'Network error. Please check your connection.');
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
};

export { ApiError, AuthError, getDeviceId };
