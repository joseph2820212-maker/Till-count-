# State 04: Count history empty (node 30:1525)

Source: "Required States" (30:1494) → "State row" (30:1515) → `State / Count history empty` (30:1525).

## Type
Documentation spec card representing an **inline empty state** for the Count History list.

## Layout
Card container (30:1525): flex column, gap 10px, width 410px.

1. **State Card** (30:1526) — "State Card / Count history empty"
   - Background: `--tillcount-color-status-info-bg` `#e3e9f3` (neutral)
   - Border: 1px solid `--tillcount-color-border-default` `#ddd3be`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1527): `"Count history empty"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1528): `"No completed counts yet. Explain that completed stocktakes will appear here."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1529) — flex row, height 44px (single button, no gap needed)
   - **Button "Start count"** (30:1530/30:1531)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Start count"` — Type/Button, white

## Icons
None.

## Notes
- Single-CTA empty state — only one action ("Start count") is offered, driving the user directly into the count flow.
