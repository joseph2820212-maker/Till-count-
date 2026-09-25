# TillCount — Offline and privacy boundary

TillCount is an offline app. Counting, products, reorder, import, export, backup and
restore all work with no network connection. This page lists **everything** that can
leave the device, and when.

## 1. What the app itself sends

| Path | When | What leaves the device | Where it goes |
|---|---|---|---|
| **Share sheet** (CSV, PDF, `.tcb` backup, Till-family transfer file) | Only when the user taps Share / Export / Create backup and picks a destination | The file the user just made. Backups are AES-256-GCM encrypted with the user's passphrase. | Wherever the user sends it (Files, email, Drive…). TillCount never uploads it. |
| **Support email** (About › Contact support) | Only when the user taps it | A draft email with the app version, platform and OS version. It never includes products, counts, backups or passwords. The user can edit it and decides whether to send. | The user's email app |
| **Store purchase** (RevenueCat, `react-native-purchases`) | Production builds only, when the Pro screen loads offerings, and on Buy / Restore purchase | The purchase and entitlement data that RevenueCat and Google Play need. No catalogue, count or backup data. | RevenueCat, Google Play Billing |

The **review APK** configures no RevenueCat key. The billing SDK is never set up, so the app
makes no billing network call (see `src/modules/billing/bypass.ts`).

## 2. Third-party SDK traffic the app does not control

| Component | Traffic | Notes |
|---|---|---|
| Google ML Kit barcode scanning (bundled model, via `expo-camera`) | Google states that ML Kit APIs may contact Google servers for model and bug-fix updates, and send usage and performance metrics about the ML Kit APIs. | Scanning itself runs on the device, and no images or barcodes are uploaded by TillCount. The metrics come from Google's SDK. This is disclosed in the Data storage page, and it is a **HUMAN REVIEW** item for the store data-safety form. |
| Google Play Billing (production only) | Normal Play Billing traffic during a purchase. | Not active in the review build. |

## 3. What the app never does

- There is no analytics, crash reporting, advertising, attribution or push SDK. The verify
  gate (gate 7) fails the build if one is added.
- No `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `sendBeacon` anywhere in `src/`
  (verify gate 7).
- No over-the-air updates. `expo-updates` has been removed, so the app never downloads code.
- No web views, and no remote fonts or images. Every font and icon is bundled.
- No account, login or cloud sync.

## 4. Android permissions

| Permission | Why |
|---|---|
| `CAMERA` | Barcode scanning. The app asks only when the user opens the scanner, after the Camera permission explainer. Typing a code always works without the camera. |
| `VIBRATE` | Scan feedback (can be switched off). |
| `INTERNET` | Added by React Native and the billing SDK. Used only by the paths in sections 1–2. |
| `com.android.vending.BILLING` | Added by the billing SDK (store purchase). |

The build blocks these permissions: `RECORD_AUDIO`, fine and coarse location, contacts,
external storage read/write, `SYSTEM_ALERT_WINDOW` and the advertising ID (`AD_ID`), all
listed under `blockedPermissions` in `app.json`. The permissions in the built APK are
recorded in `docs/FINAL_HANDOVER.md`.

## 5. Data at rest

- All data lives in the app's private AsyncStorage database on the device.
- `android:allowBackup="false"`: Android cloud / adb backups do not copy TillCount data. The
  user's own encrypted `.tcb` backup is the backup path.
- Export files are written to the app cache (`tillcount-exports/`) and pruned on start-up.
- Backup passphrases are never stored. A lost passphrase cannot be recovered.
- Device-only keys (language, error log, restore journal) are never put in a backup.

## 6. How this is enforced

- `npm run verify` gate 7: dependency deny-list, network-API scan of `src/`, the billing SDK
  only inside `src/modules/billing/`, and the permission allow-list.
- `npm run verify` gate 8: the billing bypass can never be set in a production build, and a
  review build can never carry RevenueCat keys.
- `src/__tests__/` security tests: HTML escaping in PDF reports, safe file names, and the
  support email carrying no user data.
