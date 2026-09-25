# TillCount — Owner decisions

These choices belong to the owner. None of them blocks the review APK. Each is marked
**OWNER DECISION BEFORE STORE**: it must be settled before a production (store) build.
Until then the app ships with the provisional value shown, and every value lives in one
place in the code.

| ID | Decision needed | Provisional value in the review build | Where it lives |
|---|---|---|---|
| OD-01 | **Package / bundle ID.** Once the app is published on Google Play, the ID cannot change. | `com.tillcount.app` (production), `com.tillcount.app.review` (review build, installs beside production) | `app.json`, `scripts/buildGuard.js` |
| OD-02 | **Free-plan caps.** How many active products and favourite counts Free allows. | 100 products (archived ones included, so archive/restore cannot get past the cap), 1 favourite count. Existing data is never locked. A cap only blocks creating a new product or favourite. | `src/modules/billing/limits.ts` (`FREE_CAPS`) |
| OD-03 | **Which features are Pro-only.** | PDF / CSV reports and the Till-family transfer file are Pro. Counting, reorder list, CSV import, backup and restore are Free. | `src/modules/billing/limits.ts` (`LIMIT_CAPS`) |
| OD-04 | **RevenueCat configuration.** API keys, entitlement ID, offering ID and store product IDs. | Entitlement `pro`, offering `default`, package `$rc_lifetime`. Keys and product IDs come from the build environment (`EXPO_PUBLIC_RC_ANDROID_KEY`, `EXPO_PUBLIC_RC_LIFETIME_ID_ANDROID`, iOS equivalents). None are set in the review build. The build guard refuses a review build that carries keys. | `src/modules/billing/billingConfig.ts`, `docs/RELEASE_RECIPE.md` |
| OD-05 | **Is encrypted backup / restore a Pro feature?** Figma lists "Encrypted backup and restore" among the Pro benefits. | Backup and restore stay Free, so a user can always take their data out and put it back (DECISIONS D-15). The Pro screen lists "Till-family product transfer" instead (D-31). | `src/modules/billing/limits.ts`, `pro.feature.*` strings |
| OD-06 | **Lifetime price** and whether there is any subscription. | One lifetime unlock. There is no subscription and no trial. The price shown in the app comes from the store at runtime; the review build shows "Upgrade to Pro" with no price. | Store consoles / RevenueCat |
| OD-07 | **Publisher and legal details** in the in-app legal pages (company name, registered office, emails). | The publisher details in `src/appMeta.ts`. Every address can be overridden per build with `EXPO_PUBLIC_*` variables. Effective date: 24 September 2026. | `src/appMeta.ts` |
| OD-08 | **Store listing assets** (icon, feature graphic, screenshots, description). | App icon and splash in `assets/` (TillCount navy/cream). Store copy is not written. | `assets/` |

## Not owner decisions (settled in `DECISIONS.md`)

The wording "last counted quantity", immutable history, never zeroing skipped items and
explicit CSV updates are non-negotiables from the handoff. The offline boundary is set out
in `OFFLINE_PRIVACY_BOUNDARY.md`.
