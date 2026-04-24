# Tenants

Per-tenant config + assets. Every tenant is a folder here. `TENANT=<slug>` env var
(or `--tenant=<slug>` CLI flag to `build:tenant`) selects which one the build uses.

```
tenants/
├── <slug>/
│   ├── tenant.config.ts        # slug, bundleId, appName, gatewayUrl, backendUrl, brandColor
│   ├── google-services.json    # gitignored; fetched from Firebase Console
│   └── assets/
│       ├── icon.png
│       ├── adaptive-icon.png
│       ├── splash-icon.png
│       └── tenant-logo.png     # shown in RegisterScreen footer
```

The active tenant's `tenant.config.ts` is consumed by `app.config.ts` at
`expo prebuild` time and baked into the native manifest (`extra.tenant`).
At runtime `src/constants/config.ts` and `src/tenant/tenantAssets.ts` read
it back via `expo-constants`. No runtime switching — the tenant is fixed
per APK.

## Adding a new tenant

1. **Firebase**
   - Create a new Firebase project (or reuse an existing client project).
   - Register an Android app with the tenant's bundle id (e.g. `me.uril.deco.client`).
   - Download `google-services.json`.

2. **Tenant folder**
   ```
   cp -r tenants/uril tenants/<slug>
   # replace google-services.json with the one you just downloaded
   # replace assets/* with the tenant's icon / adaptive-icon / splash-icon / logo
   ```

3. **Edit `tenants/<slug>/tenant.config.ts`**
   - `slug` — folder name, unique
   - `bundleId` — reverse-DNS, matches Firebase registration
   - `appName` — visible name on the home screen
   - `gatewayUrl` — DeCo Gateway URL for this tenant
   - `backendUrl` — DeCo Backend URL (for translations)
   - `brandColor` — hex, used for notification icon tint and channel
   - `firebaseProjectId` — informational; helps match the google-services.json to Console

4. **Register the tenant's logo in `src/tenant/tenantAssets.ts`**
   Add a `case '<slug>':` branch returning `require('../../tenants/<slug>/assets/tenant-logo.png')`.
   (This step is required because Metro resolves `require` statically at bundle time.)

5. **Build**
   ```
   npm run build:tenant -- --tenant=<slug>
   ```
   This runs `expo prebuild --clean` (regenerates `android/` from the new config),
   then `gradlew assembleRelease`, then `adb install -r --user 0` onto the connected
   device. The `--user 0` flag is required on Samsung OneUI devices — without it
   the APK clones into User 95 (DUAL_APP) as a side effect.

## Verifying a build locally

- Check the installed app's display name + icon on the home screen match the tenant.
- Login flow: the RegisterScreen footer logo should be the tenant's, not URIL's.
- Push notification banner color should match `brandColor`.
- API calls should hit the tenant's `gatewayUrl` (verify via Charles / device logs).

## Notes

- `google-services.json` is gitignored per tenant. New devs must re-fetch from the
  tenant's Firebase Console before their first build.
- `expo prebuild --clean` wipes and regenerates `android/`, including the debug
  keystore. Devices with an older build of the same bundle id must uninstall before
  reinstalling (signature mismatch).
- Switching tenants locally is lossless — `npm run build:tenant -- --tenant=uril`
  after building `mne` just regenerates everything from URIL's config.
