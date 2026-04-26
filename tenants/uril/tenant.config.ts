import type { TenantConfig } from '../../src/tenant/types';

const tenant: TenantConfig = {
  slug: 'uril',
  bundleId: 'rs.uril.deco.client',
  appName: 'DeCo',
  // Gateway: the only host the app should normally talk to. All authenticated
  // traffic + customer data flows here.
  gatewayUrl: 'https://gw.demo.uril.rs/api/v1',
  // Backend: temporary direct-to-backend escape hatch for the public translations
  // endpoint only (`/localization/translations/{locale}`). Long term this should
  // be served behind the gateway; until then, `backendUrl` shares the showroom
  // hostname with the operator UI (https://demo.uril.rs/) so we never ship a
  // build pointing at the dev environment.
  backendUrl: 'https://demo.uril.rs/api',
  brandColor: '#0066CC',
  firebaseProjectId: 'deco-client-push',
};

export default tenant;
