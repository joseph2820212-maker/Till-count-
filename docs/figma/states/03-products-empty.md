# State 03: Products empty (node 30:1516)

Source: "Required States" (30:1494) → "State row" (30:1515) → `State / Products empty` (30:1516).

## Type
Documentation spec card representing an **inline empty state** (e.g. shown on the Products list screen when no products exist yet).

## Layout
Card container (30:1516): flex column, gap 10px, width 410px.

1. **State Card** (30:1517) — "State Card / Products empty"
   - Background: `--tillcount-color-status-info-bg` `#e3e9f3` (neutral)
   - Border: 1px solid `--tillcount-color-border-default` `#ddd3be`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1518): `"Products empty"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1519): `"No products yet. Start with Scan first product, Add manually or Import products."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1520) — flex row, gap 8px, height 44px
   - **Button "Scan product"** (30:1521/30:1522)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Scan product"` — Type/Button, white
   - **Button "Import"** (30:1523/30:1524)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Import"` — Type/Button, white

## Icons
None (icon-less text card; the copy mentions a third path — "Add manually" — that has no corresponding button in this card, only "Scan product" and "Import" are rendered as CTAs).

## Notes
- Copy names three entry points (Scan first product / Add manually / Import products) but only two buttons are drawn ("Scan product", "Import"); "Add manually" should likely be reachable via a secondary/tertiary affordance (e.g. a text link or the screen's own "+" action) not shown on this spec card.
