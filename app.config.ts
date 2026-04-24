import type { ExpoConfig, ConfigContext } from 'expo/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TenantConfig } from './src/tenant/types';

export default ({ config }: ConfigContext): ExpoConfig => {
  const slug = process.env.TENANT;
  if (!slug) {
    throw new Error(
      'TENANT env var is required. Run `npm run build:tenant -- --tenant=<slug>` or set TENANT manually.',
    );
  }

  const tenantDir = path.resolve(__dirname, 'tenants', slug);
  if (!fs.existsSync(tenantDir)) {
    throw new Error(`Tenant folder not found: ${tenantDir}`);
  }

  const tenantConfigPath = path.join(tenantDir, 'tenant.config.ts');
  if (!fs.existsSync(tenantConfigPath)) {
    throw new Error(`Missing tenant.config.ts in ${tenantDir}`);
  }

  const googleServicesFile = path.join(tenantDir, 'google-services.json');
  if (!fs.existsSync(googleServicesFile)) {
    throw new Error(
      `Missing google-services.json in ${tenantDir}. Download it from Firebase Console.`,
    );
  }

  // app.config.ts runs under ts-node/esbuild inside Expo CLI — dynamic require works here.
  const tenant: TenantConfig = require(tenantConfigPath).default;

  const assetsDir = `./tenants/${slug}/assets`;
  const googleServicesRel = `./tenants/${slug}/google-services.json`;

  return {
    ...config,
    name: tenant.appName,
    slug: 'DeCoClientApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: `${assetsDir}/icon.png`,
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: `${assetsDir}/splash-icon.png`,
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: tenant.bundleId,
      infoPlist: {
        NSFaceIDUsageDescription: 'Koristimo Face ID za brzu prijavu.',
      },
    },
    android: {
      package: tenant.bundleId,
      googleServicesFile: googleServicesRel,
      adaptiveIcon: {
        foregroundImage: `${assetsDir}/adaptive-icon.png`,
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'pan',
    },
    notification: {
      color: tenant.brandColor,
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-notifications',
        {
          color: tenant.brandColor,
          defaultChannel: 'default',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '4798a173-f383-4b58-b1a7-c61f35f4a95e',
      },
      tenant,
    },
    owner: 'nivesbas',
  };
};
