# TillCount — Release recipe

Expo SDK 54 · React Native 0.81.5 · Node 20+ · JDK 17 · Android SDK 36 (build-tools 36.0.0,
NDK 27.1.12297006).

## 0. Gates (every build)

```bash
npm ci
npm run verify        # 11 gates; writes artifacts/verify-report.json
```

The gates are: typecheck, lint, Jest (no skipped tests), locale parity with CLDR plurals, the
raw-key scan, TillCalc naming, network/analytics and permissions, the billing-bypass guard,
the 71-route inventory with 5 tabs, the legal documents, and the Figma audit manifest. Any red
gate stops the build.

## 1. Review APK (Pro unlocked, no store)

**CI path (used for the current review APK).** Pushing to a `claude/**` branch runs
`.github/workflows/review-apk.yml`. It runs verify, prebuilds with the review identity, runs
`assembleRelease`, and uploads the artifact `TillCount_V1_Review_<shortSHA>` with these files:

- `TillCount_V1_Review_<shortSHA>.apk`
- `TillCount_V1_Review_<shortSHA>_SHA256.txt`
- `TillCount_V1_Review_<shortSHA>_BUILD_INFO.txt`: package, version, SDK levels, permissions,
  ABIs, size and SHA-256

**Local path.**

```bash
export APP_VARIANT=review EXPO_PUBLIC_APP_VARIANT=review EXPO_PUBLIC_BILLING_BYPASS=1
node scripts/buildGuard.js                     # refuses unsafe combinations
npx expo prebuild -p android --clean --no-install
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64
# → android/app/build/outputs/apk/release/app-release.apk (package com.tillcount.app.review)
```

The review build is signed with the Expo template's debug keystore. It installs beside a
production install and is not for the store. The build machine needs network access to
`dl.google.com` (Google Maven). The Claude build container blocks that host, which is why the
CI path exists.

## 2. Production (store) build: after the owner decisions

Settle `OWNER_DECISIONS.md` first (package ID, Free caps, RevenueCat IDs, price, backup gating).

```bash
export APP_VARIANT=production EXPO_PUBLIC_APP_VARIANT=production
export EXPO_PUBLIC_RC_ANDROID_KEY=goog_...            # RevenueCat public SDK key
export EXPO_PUBLIC_RC_LIFETIME_ID_ANDROID=...         # Play product id of the lifetime unlock
# EXPO_PUBLIC_BILLING_BYPASS must be unset: the guard refuses the build otherwise
eas build -p android --profile production            # app bundle (.aab)
```

Before submitting, check the following:

- Upload key and Play App Signing are set up. A production keystore is never committed.
- The store data-safety form lists camera use (on-device), purchases (Google Play / RevenueCat)
  and Google ML Kit usage metrics (`OFFLINE_PRIVACY_BOUNDARY.md` §2).
- The in-app legal pages match the store listing (`src/appMeta.ts`).
- Arabic, Turkish, French, Spanish and German strings have had a native-speaker review.
