import Constants from 'expo-constants';
import type { TenantConfig } from '../tenant/types';

const tenant = Constants.expoConfig?.extra?.tenant as TenantConfig | undefined;

if (!tenant?.gatewayUrl || !tenant?.backendUrl) {
  throw new Error(
    'Tenant config missing from expoConfig.extra — rebuild with `npm run build:tenant -- --tenant=<slug>`.',
  );
}

export const CONFIG = {
  // Gateway API URL — the only external endpoint the app talks to.
  // Baked in at `expo prebuild` time from tenants/<slug>/tenant.config.ts.
  API_BASE_URL: tenant.gatewayUrl,

  // Backend API URL — for public endpoints (translations, locales).
  BACKEND_URL: tenant.backendUrl,

  // Timeouts
  REQUEST_TIMEOUT_MS: 30_000,
  TOKEN_REFRESH_THRESHOLD_SECONDS: 120,

  // Storage keys (SecureStore)
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'deco_access_token',
    REFRESH_TOKEN: 'deco_refresh_token',
    DEVICE_ID: 'deco_device_id',
    CUSTOMER_ID: 'deco_customer_id',
    TOKEN_EXPIRES_AT: 'deco_token_expires_at',
    LOCALE: 'deco_locale',
  },

  // App
  APP_VERSION: '1.0.0',
} as const;
