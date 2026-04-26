#!/usr/bin/env node
// One-shot keystore bootstrap. Generates a strong random password, creates the
// upload keystore via keytool, and writes signing properties into the user's
// ~/.gradle/gradle.properties. The password never leaves this script's stdout.
//
// Re-running is safe: if the keystore already exists or gradle.properties already
// has DECO_UPLOAD_* keys, the script aborts without overwriting anything.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, chmodSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const HOME = homedir();
const KEYSTORE_DIR = join(HOME, '.android-keystores');
const KEYSTORE_PATH = join(KEYSTORE_DIR, 'uril-deco-upload.jks');
const GRADLE_DIR = join(HOME, '.gradle');
const GRADLE_PROPS = join(GRADLE_DIR, 'gradle.properties');

const ALIAS = 'uril-deco-upload';
const VALIDITY_DAYS = 10000; // ~27 years; Play wants ≥25
const KEY_ALG = 'RSA';
const KEY_SIZE = 2048;
const DNAME = 'CN=DeCo Upload, OU=URIL, O=URIL Solutions, L=Belgrade, S=Serbia, C=RS';

function findKeytool() {
  if (process.env.KEYTOOL_PATH && existsSync(process.env.KEYTOOL_PATH)) return process.env.KEYTOOL_PATH;
  const candidates = platform() === 'win32'
    ? [
        'C:/Program Files/Java/jdk-17/bin/keytool.exe',
        'C:/Program Files/Common Files/Oracle/Java/javapath/keytool.exe',
        'C:/Program Files/Eclipse Adoptium/jdk-17/bin/keytool.exe',
      ]
    : ['/usr/bin/keytool', '/usr/local/bin/keytool'];
  for (const c of candidates) if (existsSync(c)) return c;
  return 'keytool'; // hope PATH has it
}

function abort(msg) {
  console.error(`\n[generate-keystore] ${msg}`);
  process.exit(1);
}

if (existsSync(KEYSTORE_PATH)) {
  abort(`Keystore already exists at ${KEYSTORE_PATH}. Refusing to overwrite. Delete it manually if you really want to regenerate (you'll need to upload a new key to Play Console).`);
}

if (existsSync(GRADLE_PROPS)) {
  const existing = readFileSync(GRADLE_PROPS, 'utf8');
  if (/^DECO_UPLOAD_/m.test(existing)) {
    abort(`${GRADLE_PROPS} already has DECO_UPLOAD_* properties. Refusing to overwrite. Edit manually if needed.`);
  }
}

mkdirSync(KEYSTORE_DIR, { recursive: true });
mkdirSync(GRADLE_DIR, { recursive: true });

// 32 bytes base64url → ~43 chars, no shell-special characters
const password = randomBytes(32).toString('base64url');

const keytool = findKeytool();
console.log(`[generate-keystore] Using keytool: ${keytool}`);
console.log(`[generate-keystore] Generating ${KEY_ALG} ${KEY_SIZE}-bit key, validity ${VALIDITY_DAYS} days...`);

const args = [
  '-genkeypair',
  '-v',
  '-keystore', KEYSTORE_PATH,
  '-storetype', 'PKCS12',
  '-alias', ALIAS,
  '-keyalg', KEY_ALG,
  '-keysize', String(KEY_SIZE),
  '-validity', String(VALIDITY_DAYS),
  '-dname', DNAME,
  '-storepass', password,
  '-keypass', password,
];

const res = spawnSync(keytool, args, { stdio: ['ignore', 'pipe', 'pipe'] });
if (res.status !== 0) {
  abort(`keytool failed (exit ${res.status}): ${res.stderr?.toString() ?? ''}`);
}

if (!existsSync(KEYSTORE_PATH)) abort(`keytool reported success but ${KEYSTORE_PATH} missing.`);

// Append signing config to user-level gradle.properties.
// Java Properties treats `\u` as a unicode escape, so Windows paths must use
// forward slashes (Gradle's `file()` accepts either on both OSes).
const keystoreForProps = KEYSTORE_PATH.split('\\').join('/');
const block = `
# DeCo Android upload keystore (Play App Signing). Generated ${new Date().toISOString()}.
# Used by android/app/build.gradle release signingConfig.
# Do NOT commit this file or share these values.
DECO_UPLOAD_STORE_FILE=${keystoreForProps}
DECO_UPLOAD_STORE_PASSWORD=${password}
DECO_UPLOAD_KEY_ALIAS=${ALIAS}
DECO_UPLOAD_KEY_PASSWORD=${password}
`;

if (existsSync(GRADLE_PROPS)) {
  appendFileSync(GRADLE_PROPS, block);
} else {
  writeFileSync(GRADLE_PROPS, block.trimStart());
}
try { chmodSync(GRADLE_PROPS, 0o600); } catch { /* Windows ACLs don't map cleanly; skip */ }

console.log('[generate-keystore] ✓ Keystore created:', KEYSTORE_PATH);
console.log('[generate-keystore] ✓ Signing properties written to:', GRADLE_PROPS);
console.log('[generate-keystore]');
console.log('[generate-keystore] Verify:');
console.log(`[generate-keystore]   "${keytool}" -list -v -keystore "${KEYSTORE_PATH}" -alias ${ALIAS} -storepass "$DECO_UPLOAD_STORE_PASSWORD" | grep SHA-256`);
console.log('[generate-keystore]');
console.log('[generate-keystore] BACKUP THIS FILE NOW: ' + KEYSTORE_PATH);
console.log('[generate-keystore] Store the password (in ~/.gradle/gradle.properties) in your password manager too.');
