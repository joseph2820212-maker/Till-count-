# State 08: Discard current count confirmation (node 30:1557)

Source: "Required States" (30:1494) → "State row" (30:1547) → `State / Discard current count?` (30:1557).

## Type
Documentation spec card representing a **destructive confirmation dialog** shown before discarding an in-progress count.

## Layout
Card container (30:1557): flex column, gap 10px, width 410px.

1. **State Card** (30:1558) — "State Card / Discard current count?"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1559): `"Discard current count?"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1560): `"The unfinished count and its entered quantities will be removed. Completed history is not affected."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1561) — flex row, gap 8px, height 44px
   - **Button "Keep count"** (30:1562/30:1563)
     - Size 120×44, radius 12px, background `#1a2540` (navy — safe/dismiss action)
     - Label `"Keep count"` — Type/Button, white
   - **Button "Discard"** (30:1564/30:1565)
     - Size 132×44, radius 12px, background `#b14d38` (red — destructive action)
     - Label `"Discard"` — Type/Button, white

## Icons
None.

## Notes
- Same two-button danger pattern as State 07 (safe navy + destructive red), applied to abandoning an unfinished stocktake rather than deleting a product.
