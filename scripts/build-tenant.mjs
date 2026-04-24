#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const arg = process.argv.find((a) => a.startsWith('--tenant='));
const tenant = arg?.split('=')[1] ?? process.env.TENANT;

if (!tenant) {
  console.error('Usage: npm run build:tenant -- --tenant=<slug>');
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

console.log(`=== Building tenant "${tenant}" ===`);

run('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], { cwd: repoRoot });

const gradlew = isWin ? '.\\gradlew.bat' : './gradlew';
run(gradlew, ['assembleRelease'], { cwd: resolve(repoRoot, 'android') });

const apk = resolve(repoRoot, 'android/app/build/outputs/apk/release/app-release.apk');
if (!existsSync(apk)) {
  console.error(`APK not found at ${apk}`);
  process.exit(1);
}

console.log(`\nAPK built: ${apk}`);
console.log('Installing on connected device (user 0)...');
run('adb', ['install', '-r', '--user', '0', apk]);

console.log(`\n=== Done. Tenant "${tenant}" installed. ===`);
