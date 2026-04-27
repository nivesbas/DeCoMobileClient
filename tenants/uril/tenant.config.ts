import type { TenantConfig } from '../../src/tenant/types';

const tenant: TenantConfig = {
  slug: 'uril',
  // Bundle id changed 2026-04-27: original `rs.uril.deco.client` got
  // permanently locked in Google's package-name registry by an early debug
  // keystore signature (visible to Play Protect once a sideloaded APK ran on
  // a Play-Services device). Recovery via support is gambling on a tight
  // timeline; cleaner path is a fresh package name with our proper upload
  // keystore. The `.app` suffix is the minimum disambiguator.
  bundleId: 'rs.uril.deco.client.app',
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
