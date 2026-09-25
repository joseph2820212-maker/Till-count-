# TillCount — Build plan (handoff v1.0, 24 September 2026)

TillCount (Stocktake & Reorder, "Scan. Count. Reorder. Done.") is built from the TillCalc
donor (read-only, `main` @ `e7ea8ca`) against Figma `lAEpXQNqnPehtBMB7K6oWd` (71 screens,
12 states). Status words follow the handoff: CODE COMPLETE / REVIEW APK READY / DEVICE
VERIFIED / STORE CONFIG PENDING / HUMAN LANGUAGE REVIEW PENDING.

| Phase | Scope | Where | State |
|---|---|---|---|
| A–B | Bootstrap and design system: Expo 54, strict TS, palette, type scale, UI kit, RTL-safe text | `app.json`, `src/theme`, `src/ui`, `src/components` | Done |
| C | Domain model and storage keys | `src/domain/types.ts`, `src/storage/keys.ts` | Done |
| D | One barcode normalisation path (EAN-13/8, UPC-A/E, Code 128/39, ITF) | `src/domain/barcode.ts` | Done |
| E | Counting engine: scope, scan, list, case + loose, pause, finish (idempotent), skipped never zeroed | `src/domain/countEngine.ts`, `src/state/actions.ts` | Done |
| F | Reorder engine (one formula, no forecast) | `src/domain/reorderEngine.ts` | Done |
| G | Catalogue: products, barcodes, categories, suppliers, locations, archive rules | `src/modules/products` | Done |
| H | CSV / TillCalc import (no silent overwrite), family transfer, CSV / PDF export | `src/modules/data` | Done |
| I | Encrypted `.tcb` backup and journaled restore | `src/backup`, `src/modules/backup` | Done |
| J | One Free/Pro gate (`limits.ts`) and the review-only bypass with build guard | `src/modules/billing`, `scripts/buildGuard.js` | Done: caps provisional (OD-02) |
| K | Six languages, Arabic RTL, CLDR plurals | `src/locales`, `src/i18n.ts` | Done: native review pending |
| L | Help, FAQ, About, legal documents, licences | `src/modules/more` | Done |
| M | Onboarding, camera explainer, sample data (marked, removable) | `src/modules/onboarding` | Done |
| N | All 71 screens and the 12 states | `src/navigation/screens.ts` | Done |
| O | Navigation contract: 5 tab stacks, tab bar only on roots, every screen reachable | `src/navigation`, `routeMap.test.ts` | Done |
| P | Tests: domain, storage, flows, import, backup, 71-screen walk × 6 languages, route map, adversarial, performance | `src/**/__tests__` | Done: 29 suites / 273 tests |
| Q | Screenshots: EN and AR for 71 screens and 11 web-renderable states | `artifacts/screenshots` | Done: web render (D-23) |
| R | Performance at 2,000 / 5,000 products | `performance.test.ts` | Done |
| S | Security and offline audit | `OFFLINE_PRIVACY_BOUNDARY.md`, verify gates 7–8 | Done |
| T | Figma screen audit (71 rows) | `FIGMA_SCREEN_AUDIT.md`, verify gate 11 | Done: 0 FAIL |
| U | `npm run verify`, 11 gates | `scripts/verify.mjs`, CI | Green |
| V | Review APK `TillCount_V1_Review_016cd09.apk` + SHA-256 | `.github/workflows/review-apk.yml` | REVIEW APK READY (CI run 36082673100) |
| W | Clean-install smoke test | Needs a device or emulator | HUMAN REVIEW |
| X | Sample data fixture | `src/modules/onboarding/sampleData.ts` | Done |
| Y | Code quality and git discipline (TC-00 …) | git history | Done |
| Z | Final handover | `FINAL_HANDOVER.md` | See file |
