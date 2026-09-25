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

## Pre-release audit (25 September 2026)

Five parallel reviewers covered domain and counting, storage/backup/security, import/export,
billing/config/release, and screens/UX. Every finding was checked against the code, and a
regression test was added where one was practical (tests: 273, suites: 29). Fixed:

| Severity | Finding | Fix |
|---|---|---|
| Critical | RevenueCat key and product IDs were read with a computed `process.env[...]`, which Expo does not inline into a release bundle, so a store build could never sell or restore Pro | Static `process.env.EXPO_PUBLIC_*` reads, confirmed with a release Babel transform. Verify gate 8 now fails on any computed env read. |
| High | Backup encryption used Web Crypto only, which is missing on Hermes, so **creating a backup would fail on a phone** | Salt and nonce come from `secureRandomBytes` (expo-crypto on device). Test runs with Web Crypto removed. |
| High | An edit or Discard that arrived while Finish was saving could reopen or delete the completed count on disk | A store "closing" lock: no edit or discard is written for a count being finished. Race tests fail on the old code and pass now. |
| High | The restore journal was one value (unreadable on Android over ~2 MB); a damaged journal was deleted and start-up carried on with half-restored data | The journal is chunked, a damaged journal is kept, and start-up fails closed. The stale transaction journal is cleared after a restore. |
| High | Holding the camera on a barcode added +1 every 1.5 s | Every sighting restarts the duplicate window, and scanning pauses while the out-of-scope alert is open (D-33). |
| Medium | Two quick catalogue edits could overwrite each other | Catalogue writes are serialised (import included). |
| Medium | A restore could accept onboarding, settings or currency data the app then refuses to open, plus unknown keys | Those keys are now checked with the same validators the app uses at start-up. |
| Medium | Import: bad or negative price, level or target values were dropped silently; an unclosed quote swallowed the file; Excel `5.01E+12` codes were accepted; rows refused at plan time still created categories and were not listed; a family ID could be reused | Each case is now an attention row, a readable error or a rollback. Refused rows are listed on Import complete. |
| Medium | Archive, create, restore could get past the Free product cap | The cap counts archived products (D-34). |
| Medium | An offline start with an expired cached entitlement kept Pro | Cached Pro is used only while it is still valid. |
| Medium | Pause did not stick (the screen auto-resumed); camera access granted in Settings was not noticed; the camera and torch kept running behind other screens; "Type code" worked only once | Each one is fixed. |
| Medium | The Android back button skipped screen back logic (pause, closing an import) | `Screen` routes the hardware back button to the same handler as the header arrow. |
| Low | Double taps on Save for favourites, lists and barcodes; − on an uncounted item recorded 0 (D-32); a typed UPC-E and the scanned code were different products (D-35); fractional levels, packs and loose items were allowed on counted items; restored number and date formats needed a restart; the alert could not be closed with back; the crash screen had no retry | Each one is fixed. |

Accepted and not changed (low):

- Backup header dates are not covered by the GCM tag. They are only shown on screen; the data itself is authenticated.
- `countSnapshots` is one document, so it reaches the Android 2 MB value limit at about 15,000 products. That is beyond the 5,000 tested.
- Manual code entry uses a number pad, so letter-based Code 128 labels can't be typed.
- EAN/UPC check digits are not enforced on manual entry, because shops use internal codes.

## Build notes

- The Claude build container cannot reach `dl.google.com` (Google Maven), so the APK is built by
  `.github/workflows/review-apk.yml` on push. To build locally, see `RELEASE_RECIPE.md`.
- Fixes made while getting the APK to build:
  - `react-native-gesture-handler` 2.24 → 2.28, which Expo SDK 54 expects and which compiles
    against the React Native 0.81 C++ API.
  - The iOS-only camera text in `native-locales` is marked `ios`, which clears the Android
    lint `ExtraTranslation` errors.
