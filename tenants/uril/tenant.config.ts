import type { TenantConfig } from '../../src/tenant/types';

const tenant: TenantConfig = {
  slug: 'uril',
  bundleId: 'rs.uril.deco.client',
  appName: 'DeCo',
  gatewayUrl: 'https://gw.demo.uril.rs/api/v1',
  backendUrl: 'https://development.uril.rs/api',
  brandColor: '#0066CC',
  firebaseProjectId: 'deco-client-app',
};

export default tenant;
