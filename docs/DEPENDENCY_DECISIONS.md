# TillCount — Dependency decisions

TillCount starts from the TillCalc donor (read-only, `main` @ `e7ea8ca`). This file lists
what changed in the dependency set and why. Runtime dependencies are in `package.json`
`dependencies`. Development and screenshot tooling is in `devDependencies` and never
reaches the APK.

## D-01 — `expo-crypto` added (secure random on Hermes)

Hermes has no `crypto.getRandomValues`. Backup salts and nonces, and record IDs, come from
`src/utils/secureRandom.ts`: `globalThis.crypto` when present, otherwise
`expo-crypto.getRandomBytes`. If neither exists it throws. It never falls back to
`Math.random`. The donor's backup code assumed Web Crypto, which fails on a Hermes device.

## Removed from the donor

| Package | Why removed |
|---|---|
| `react-native-pdf`, `react-native-blob-util`, `react-native-webview`, pdfium plugin, `android-libs` | TillCount has no in-app PDF viewer. The previews are native page mocks (DECISIONS D-14), and PDFs are rendered by `expo-print` and handed to the share sheet. Removing them cut three native modules, which means less APK size and less attack surface. |
| `expo-updates` | No over-the-air updates. The app never downloads code (see the offline boundary). |
| `expo-secure-store` | Nothing is stored in the keystore. Backup passphrases are never saved. |
| `@config-plugins/*` | Only served the removed modules. |

## Kept and used

| Package | Use |
|---|---|
| `expo-camera` | Barcode scanning. It uses Google ML Kit barcode scanning, bundled on-device (see `OFFLINE_PRIVACY_BOUNDARY.md` for ML Kit's usage metrics). |
| `expo-document-picker`, `expo-file-system` | CSV / transfer / backup files the user picks. Exports are written to the app cache and handed to the share sheet. |
| `expo-print`, `expo-sharing` | A4 PDF reports, and the share sheet. |
| `expo-haptics` | Scan feedback. Can be switched off in Count settings. |
| `expo-localization` | First-run language and region. |
| `@react-native-async-storage/async-storage` | All app data. The Android database size is raised to 128 MB by `plugins/asyncStorageSize.js`. The crash-safe layer is in `src/storage/kv.ts`. |
| `@noble/ciphers`, `@noble/hashes` | AES-256-GCM and scrypt for `.tcb` backups (pure JS, audited). |
| `react-native-purchases` | RevenueCat, used only inside `src/modules/billing/` (the verify gate enforces this). It is not configured when no key is present, as in the review build. |
| `i18next`, `react-i18next` | Six languages. |
| `react-native-keyboard-controller` | The single keyboard path (DECISIONS D-13). |
| `@expo-google-fonts/ibm-plex-sans-arabic` | Arabic type. The fonts are bundled, not downloaded. |

## Development-only additions

| Package | Use |
|---|---|
| `react-native-web`, `react-dom`, `@expo/metro-runtime` | Web build of the screenshot harness (`index.web.js`, `tools/screenshots/`). The Android bundle does not include them. |
| `playwright-core` | Drives the preinstalled Chromium to capture `artifacts/screenshots`. |
| `@expo-google-fonts/roboto` | Roboto for the web renders, so they match Android's system font. |
