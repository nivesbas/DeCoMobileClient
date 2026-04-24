import Constants from 'expo-constants';
import type { TenantConfig } from './types';

const tenant = Constants.expoConfig?.extra?.tenant as TenantConfig | undefined;

if (!tenant?.slug) {
  throw new Error('Tenant config missing from expoConfig.extra — rebuild with TENANT=<slug>.');
}

// Static requires per tenant. Metro resolves each branch at bundle time,
// so every tenant's assets are bundled and the active one is selected at runtime
// from the slug baked into expoConfig.extra. Add a case when onboarding a new tenant.
const tenantLogo = (() => {
  switch (tenant.slug) {
    case 'uril':
      return require('../../tenants/uril/assets/tenant-logo.png');
    default:
      throw new Error(`No tenantLogo mapping for slug "${tenant.slug}" in tenantAssets.ts.`);
  }
})();

export { tenantLogo };
