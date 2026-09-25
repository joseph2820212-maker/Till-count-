# TillCount

**Stocktake & Reorder — Scan. Count. Reorder. Done.**

TillCount is an offline Android app (Expo / React Native) for small shops. You scan or list-count
your stock, keep each product's *last counted quantity*, and get a reorder list from simple
targets. Everything stays on the device unless you export it.

## Quick start

```bash
npm ci
npm run verify     # typecheck, lint, tests and 8 more release gates
npm start          # Expo dev server
```

## Map

| Path | What |
|---|---|
| `src/domain` | Pure logic: barcodes, quantities, count engine, reorder engine, catalogue index |
| `src/storage` | Crash-safe AsyncStorage layer (chunked collections, transaction journal, migrations) |
| `src/state` | Store, actions (the only writers) and memoised selectors |
| `src/modules/*` | Screens by area: home, count, products, reorder, data, backup, billing, more, onboarding |
| `src/ui` | TillCount UI kit, fields, overlays and the RTL-safe `Text` |
| `src/navigation` | The 71-screen registry and the five tab stacks |
| `src/locales` | en, ar, tr, fr, es, de |
| `tools/screenshots` | Web screenshot harness and capture script |
| `docs/` | Build plan, decisions, owner decisions, offline boundary, Figma audit, release recipe, handover |

Start with `docs/FINAL_HANDOVER.md`.
