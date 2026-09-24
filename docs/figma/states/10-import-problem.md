# State 10: Import problem (node 30:1576)

Source: "Required States" (30:1494) → "State row" (30:1566) → `State / Import problem` (30:1576).

## Type
Documentation spec card representing an **error state** shown after a product import (e.g. CSV) partially fails.

## Layout
Card container (30:1576): flex column, gap 10px, width 410px.

1. **State Card** (30:1577) — "State Card / Import problem"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1578): `"Import problem"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1579): `"Some rows could not be read. Keep the original file unchanged and show row-level reasons."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1580) — flex row, height 44px (single button)
   - **Button "Review issues"** (30:1581/30:1582)
     - Size 132×44, radius 12px, background `--tillcount-color-status-danger` `#b14d38` (red)
     - Label `"Review issues"` — Type/Button, white

## Icons
None.

## Notes
- Single red CTA (no safe/dismiss counterpart shown) — implementation should still provide a way to close/dismiss, just not depicted on this compact spec card.
- Copy requires: keep the original import file unchanged, and surface row-level (per-row) failure reasons when "Review issues" is tapped.
