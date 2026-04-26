// Expo config plugin that wires Play Store release signing into the
// generated android/app/build.gradle. Runs on every `expo prebuild --clean`,
// so the signing config never has to be re-applied by hand.
//
// Reads four Gradle project properties — these live in the developer's
// ~/.gradle/gradle.properties (user-level, never in repo):
//
//   DECO_UPLOAD_STORE_FILE      absolute path to the .jks
//   DECO_UPLOAD_STORE_PASSWORD  keystore password
//   DECO_UPLOAD_KEY_ALIAS       key alias (e.g. uril-deco-upload)
//   DECO_UPLOAD_KEY_PASSWORD    key password (typically same as store)
//
// If the props are absent (CI, fresh checkout, or before scripts/generate-keystore.mjs
// has run), the release signingConfig falls back to the debug keystore — same
// behavior as Expo's default — so dev/internal-side-load builds keep working.
// Play Store builds MUST have the props set; check by running
// `gradlew :app:signingReport` and confirming the release variant uses uril-deco-upload.
const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_SIGNING_CONFIG = `        release {
            if (project.hasProperty('DECO_UPLOAD_STORE_FILE')) {
                storeFile file(project.property('DECO_UPLOAD_STORE_FILE'))
                storePassword project.property('DECO_UPLOAD_STORE_PASSWORD')
                keyAlias project.property('DECO_UPLOAD_KEY_ALIAS')
                keyPassword project.property('DECO_UPLOAD_KEY_PASSWORD')
            } else {
                // Fallback to debug keystore for local dev/side-load builds.
                // Play Store uploads require DECO_UPLOAD_* in ~/.gradle/gradle.properties.
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
`;

/**
 * Insert a `release {}` block into signingConfigs and switch the buildTypes.release
 * signingConfig to it. Idempotent — running on an already-patched build.gradle is a no-op.
 */
function patchBuildGradle(contents) {
  if (contents.includes("signingConfig signingConfigs.release")) {
    return contents; // already patched
  }

  // 1) Add `release {}` inside `signingConfigs { ... }` immediately after the
  //    closing brace of the `debug {}` block. Anchored on Expo's default template.
  const signingConfigsAnchor = /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*)/m;
  if (!signingConfigsAnchor.test(contents)) {
    throw new Error(
      "[withReleaseSigning] Could not find `signingConfigs { debug { ... } }` block in build.gradle. " +
      "The Expo template may have changed; update the regex in plugins/withReleaseSigning.js.",
    );
  }
  contents = contents.replace(signingConfigsAnchor, `$1\n${RELEASE_SIGNING_CONFIG}    `);

  // 2) Flip the buildTypes.release.signingConfig from debug to release.
  const releaseSigningLine = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/m;
  if (!releaseSigningLine.test(contents)) {
    throw new Error(
      "[withReleaseSigning] Could not find `buildTypes.release { signingConfig signingConfigs.debug }`. " +
      "The Expo template may have changed; update the regex in plugins/withReleaseSigning.js.",
    );
  }
  contents = contents.replace(releaseSigningLine, "$1signingConfig signingConfigs.release");

  return contents;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(`[withReleaseSigning] Expected Groovy build.gradle, got ${cfg.modResults.language}`);
    }
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents);
    return cfg;
  });
};
