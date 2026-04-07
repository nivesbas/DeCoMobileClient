export const CONFIG = {
  // Gateway API URL — the only external endpoint the app talks to
  API_BASE_URL: __DEV__
    ? 'https://development.uril.rs/api/v1' // Dev: Cloudflare tunnel to Gateway
    : 'https://gateway.yourdomain.com/api/v1', // Prod: DMZ Gateway

  // Timeouts
  REQUEST_TIMEOUT_MS: 30_000,
  TOKEN_REFRESH_THRESHOLD_SECONDS: 120, // Refresh 2 min before expiry

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
  BUNDLE_ID: 'rs.uril.deco.client',
} as const;
