# TillCount — Final handover

Handoff v1.0 (24 September 2026) · branch `claude/check-repos-start-till-count-fsklt6` ·
repository `joseph2820212-maker/Till-count-` · donor TillCalc `main` @ `e7ea8ca` (read-only,
not edited).

## Status

| Status word | State |
|---|---|
| **CODE COMPLETE** | Yes. All 71 Figma screens and the 12 states are implemented. `npm run verify` is 11/11 green. |
| **REVIEW APK READY** | Yes. `TillCount_V1_Review_016cd09.apk` (details below). |
| **DEVICE VERIFIED** | **No.** No device or emulator was available: the build container has no KVM. See HUMAN REVIEW. |
| **STORE CONFIG PENDING** | Yes. See the OWNER DECISION BEFORE STORE and PRODUCTION CREDENTIAL items. |
| **HUMAN LANGUAGE REVIEW PENDING** | Yes, for ar, tr, fr, es and de. |

## Review APK

| Field | Value |
|---|---|
| File | `TillCount_V1_Review_016cd09.apk` |
| SHA-256 | `77ac29a836dbd892b5338a606cd0db8c1be47c2b3f408c12442b32d0cfe90f94` |
| Size | 83,250,377 bytes (79.4 MiB) |
| Package | `com.tillcount.app.review` (installs beside a production `com.tillcount.app`) |
| Label | TillCount Review |
| versionName / versionCode | 1.0.0 / 1 |
| SDK | compile 36 · target 36 · min 24 |
| ABIs | arm64-v8a, armeabi-v7a, x86_64 |
| Built from commit | `016cd098b2c82b46cee6489686b916465aaed566` (later commits change docs only) |
| Built | 2026-09-25T01:52:48Z on GitHub Actions, run [36082673100](https://github.com/joseph2820212-maker/Till-count-/actions/runs/36082673100) |
| Profile | review: `APP_VARIANT=review`, `EXPO_PUBLIC_BILLING_BYPASS=1`, no RevenueCat keys. The build guard passed and verify was 11/11 before the build. |
| Signing | Expo template debug keystore (review only, never for the store) |
| Download | GitHub Actions artifact `TillCount_V1_Review_016cd09`, which holds the APK, `_SHA256.txt` and `_BUILD_INFO.txt`. It is kept for 30 days, until 2026-10-25. |

Permissions in the APK, from `aapt2 dump badging`:

- `CAMERA`
- `VIBRATE`
- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `com.android.vending.BILLING`
- `com.tillcount.app.review.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (an AndroidX internal permission)

Each one is explained in `OFFLINE_PRIVACY_BOUNDARY.md` §4.

Check the file after downloading: `sha256sum -c TillCount_V1_Review_016cd09_SHA256.txt`.

## Evidence

| What | Where |
|---|---|
| Release gates (typecheck, lint, 28 suites / 259 tests, locale parity, raw keys, naming, offline/permissions, billing guard, 71 routes, legal, Figma manifest) | `npm run verify` (and CI) |
| Figma audit: 71 rows, 54 PASS, 17 PASS WITH DOCUMENTED NATIVE DIFFERENCE, 0 FAIL, plus the 12 states | `docs/FIGMA_SCREEN_AUDIT.md` |
| Screenshots in EN and AR: 71 screens plus 11 states (web renders, D-23) | `artifacts/screenshots/en`, `artifacts/screenshots/ar` |
| Every screen reachable, no navigation to unknown routes | `src/__tests__/routeMap.test.ts` |
| 71 screens × 6 languages render with no raw key and no undefined or NaN text | `src/__tests__/screenWalk.test.tsx` |
| Non-negotiables: skipped products are never zeroed, history is immutable, no silent CSV overwrite, one barcode path, crash safety, restore rollback | `countFlow`, `adversarial`, `productImport`, `backupRestore`, `kv` tests |
| Performance: 5,000 products, full count 0.25 s | `src/domain/__tests__/performance.test.ts` |
| Offline and privacy boundary | `docs/OFFLINE_PRIVACY_BOUNDARY.md` |
| Decisions, dependency changes, build plan, release recipe, UI rules | `docs/` |

## Open items

### OWNER DECISION BEFORE STORE
Details are in `OWNER_DECISIONS.md`.

- **OD-01:** the package ID.
- **OD-02:** the Free caps (provisionally 100 products and 1 favourite).
- **OD-03:** which features are Pro-only.
- **OD-04:** the RevenueCat entitlement, offering and product IDs.
- **OD-05:** whether backup and restore should be Pro. It is Free today, because Figma lists it as Pro but the data-preserving choice was taken.
- **OD-06:** the lifetime price.
- **OD-07:** the publisher and legal details.
- **OD-08:** the store listing assets.

### PRODUCTION CREDENTIAL
- RevenueCat Android public SDK key (`EXPO_PUBLIC_RC_ANDROID_KEY`) and the Play product ID
  of the lifetime unlock (`EXPO_PUBLIC_RC_LIFETIME_ID_ANDROID`).
- Play upload keystore and Play App Signing.

### HUMAN REVIEW
- **Device smoke test on a clean install.** Cover onboarding, camera permission and real
  barcode scans (EAN-13, UPC-A, a case barcode), and a full count through Finish and Results.
  Also cover CSV import, the PDF / CSV share sheets, and a backup-then-restore round trip on a
  second install. Test TalkBack and large font scale, and Arabic RTL on the device. None of
  this has been run on hardware.
- **Device screenshots**, to set beside the web renders.
- **Native-speaker review** of the ar, tr, fr, es and de strings, including the legal texts
  and the Arabic plural forms.
- **Store data-safety form:** declare Google ML Kit usage metrics from the barcode scanner
  (`OFFLINE_PRIVACY_BOUNDARY.md` §2).

## Build notes

- The Claude build container cannot reach `dl.google.com` (Google Maven), so the APK is built by
  `.github/workflows/review-apk.yml` on push. To build locally, see `RELEASE_RECIPE.md`.
- Fixes made while getting the APK to build:
  - `react-native-gesture-handler` 2.24 → 2.28, which Expo SDK 54 expects and which compiles
    against the React Native 0.81 C++ API.
  - The iOS-only camera text in `native-locales` is marked `ios`, which clears the Android
    lint `ExtraTranslation` errors.
