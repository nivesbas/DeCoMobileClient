// Expo config plugin that hard-removes permissions that Expo + auto-linked
// modules pull in by default but the app does not actually use. The standard
// `android.permissions` whitelist in app.config.ts is additive — modules can
// still inject extras — so we layer this on top using the AAPT manifest-merger
// `tools:node="remove"` directive.
//
// Targeted removals (audit 2026-04-26):
//   READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE — never accessed; dangerous-level on legacy Android.
//   SYSTEM_ALERT_WINDOW                            — overlay perm, raises Play review flags.
//   USE_FINGERPRINT                                — deprecated since API 28; USE_BIOMETRIC covers it.
const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSIONS_TO_REMOVE = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.USE_FINGERPRINT',
];

module.exports = function withDropPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure xmlns:tools is declared so `tools:node="remove"` resolves.
    manifest.$ = manifest.$ ?? {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    manifest['uses-permission'] = manifest['uses-permission'] ?? [];

    // Strip any existing entry for the targeted permissions, then add a
    // `tools:node="remove"` marker so the merger drops them when modules
    // re-inject them at merge time.
    for (const perm of PERMISSIONS_TO_REMOVE) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (entry) => entry?.$?.['android:name'] !== perm,
      );
      manifest['uses-permission'].push({
        $: {
          'android:name': perm,
          'tools:node': 'remove',
        },
      });
    }

    return cfg;
  });
};
