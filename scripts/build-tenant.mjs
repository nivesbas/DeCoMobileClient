#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tenantArg = process.argv.find((a) => a.startsWith('--tenant='));
const tenant = tenantArg?.split('=')[1] ?? process.env.TENANT;
const isAab = process.argv.includes('--aab');
const skipInstall = process.argv.includes('--no-install') || isAab;

if (!tenant) {
  console.error('Usage: npm run build:tenant -- --tenant=<slug> [--aab] [--no-install]');
  console.error('  --aab          Build .aab for Play Store upload (skips adb install)');
  console.error('  --no-install   Skip adb install');
  process.exit(1);
}

const tenantDir = resolve(repoRoot, 'tenants', tenant);
const required = [
  'tenant.config.ts',
  'google-services.json',
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash-icon.png',
  'assets/tenant-logo.png',
];
const missing = required.filter((f) => !existsSync(resolve(tenantDir, f)));
if (missing.length > 0) {
  console.error(`Tenant "${tenant}" is missing these files under tenants/${tenant}/:`);
  missing.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const env = { ...process.env, TENANT: tenant };
const isWin = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env, ...opts });
  if (res.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status ?? 1);
  }
}

console.log(`=== Building tenant "${tenant}" ${isAab ? '(AAB for Play Store)' : '(APK for side-load)'} ===`);

run('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], { cwd: repoRoot });

const gradlew = isWin ? '.\\gradlew.bat' : './gradlew';
const gradleTask = isAab ? 'bundleRelease' : 'assembleRelease';
run(gradlew, [gradleTask], { cwd: resolve(repoRoot, 'android') });

if (isAab) {
  const aab = resolve(repoRoot, 'android/app/build/outputs/bundle/release/app-release.aab');
  if (!existsSync(aab)) {
    console.error(`AAB not found at ${aab}`);
    process.exit(1);
  }
  console.log(`\n=== Done. AAB built: ${aab} ===`);
  console.log('Upload to Play Console → Internal/Closed testing → Create new release.');
  console.log('First upload will trigger Play App Signing enrollment — accept Google-managed app signing.');
  process.exit(0);
}

const apk = resolve(repoRoot, 'android/app/build/outputs/apk/release/app-release.apk');
if (!existsSync(apk)) {
  console.error(`APK not found at ${apk}`);
  process.exit(1);
}

console.log(`\nAPK built: ${apk}`);

if (skipInstall) {
  console.log(`=== Done. Skipped adb install. ===`);
  process.exit(0);
}

console.log('Installing on connected device (user 0)...');
run('adb', ['install', '-r', '--user', '0', apk]);

console.log(`\n=== Done. Tenant "${tenant}" installed. ===`);
