# State 06: Search no results (node 30:1540)

Source: "Required States" (30:1494) → "State row" (30:1532) → `State / Search no results` (30:1540).

## Type
Documentation spec card representing an **inline empty state** shown within a search results list.

## Layout
Card container (30:1540): flex column, gap 10px, width 410px.

1. **State Card** (30:1541) — "State Card / Search no results"
   - Background: `--tillcount-color-status-info-bg` `#e3e9f3` (neutral)
   - Border: 1px solid `--tillcount-color-border-default` `#ddd3be`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1542): `"Search no results"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1543): `"No product matches this name, barcode or SKU. Keep the search and offer Add product."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1544) — flex row, height 44px (single button)
   - **Button "Add product"** (30:1545/30:1546)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Add product"` — Type/Button, white

## Icons
None.

## Notes
- Copy explicitly instructs to keep the search query/text visible (not clear it) while showing this empty state, and to offer creating a new product directly from the unmatched search term.
