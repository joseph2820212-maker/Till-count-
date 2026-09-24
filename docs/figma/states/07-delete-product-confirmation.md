# State 07: Delete product confirmation (node 30:1548)

Source: "Required States" (30:1494) → "State row" (30:1547) → `State / Delete product?` (30:1548).

## Type
Documentation spec card representing a **destructive confirmation dialog** (bottom sheet or modal alert) shown before deleting a product.

## Layout
Card container (30:1548): flex column, gap 10px, width 410px.

1. **State Card** (30:1549) — "State Card / Delete product?"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1550): `"Delete product?"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1551): `"Deleting removes the active product from future counts. Historical completed counts remain unchanged."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1552) — flex row, gap 8px, height 44px
   - **Button "Cancel"** (30:1553/30:1554)
     - Size 120×44, radius 12px, background `--tillcount-color-action-primary` `#1a2540` (navy — safe/dismiss action)
     - Label `"Cancel"` — Type/Button, white
   - **Button "Delete"** (30:1555/30:1556)
     - Size 132×44, radius 12px, background `--tillcount-color-status-danger` `#b14d38` (red — destructive action)
     - Label `"Delete"` — Type/Button, white

## Icons
None.

## Notes
- Two-button confirm pattern: navy "Cancel" (safe/default) + red "Delete" (destructive), matching the danger card coloring.
- Copy is explicit that historical completed counts are unaffected by deleting an active product — important behavioral detail to preserve in implementation.
