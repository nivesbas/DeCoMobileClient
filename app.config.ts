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
    version: '1.0.1',
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
      // Increment versionCode on every Play Store upload — Play rejects
      // duplicates. 1 = first Play submission (rejected, see 2026-05-18
      // Broken Functionality review notice). 2 = chat keyboard fix +
      // removed non-standard ✕ exit button (got tagged on Play's
      // READ_MEDIA_IMAGES manifest check before final submit). 3 =
      // same fixes + READ_MEDIA_IMAGES stripped via withDropPermissions.
      versionCode: 3,
      googleServicesFile: googleServicesRel,
      adaptiveIcon: {
        foregroundImage: `${assetsDir}/adaptive-icon.png`,
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'pan',
      // Block adb/cloud backups of app data. SecureStore values are already
      // Keystore-encrypted, but AsyncStorage (translations cache, locale) is not,
      // and we don't want a debtor's phone backup to expose chat or debt history.
      allowBackup: false,
      // Explicit permission whitelist. Without this, Expo + auto-linked native
      // modules pull in a wider default set (READ/WRITE_EXTERNAL_STORAGE,
      // SYSTEM_ALERT_WINDOW, USE_FINGERPRINT) that we do not need and that
      // raise unnecessary flags during Play Store review.
      permissions: [
        'INTERNET',
        'VIBRATE',
        'USE_BIOMETRIC',
        'POST_NOTIFICATIONS',
      ],
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
      [
        'expo-build-properties',
        {
          // R8 + resource shrinking on release. Reduces APK size (~30%) and
          // strips symbols/string-table entries that make reverse-engineering
          // the wire contract trivial. Keep rules for React Native runtime
          // come from android/app/proguard-rules.pro.
          android: {
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      './plugins/withReleaseSigning.js',
      './plugins/withCertPinning.js',
      './plugins/withDropPermissions.js',
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
