# State 05: Reorder empty (node 30:1533)

Source: "Required States" (30:1494) → "State row" (30:1532) → `State / Reorder empty` (30:1533).

## Type
Documentation spec card representing an **inline empty state**, positively framed (nothing needs action right now) — the only state card that uses the "success" semantic color instead of neutral/info.

## Layout
Card container (30:1533): flex column, gap 10px, width 410px.

1. **State Card** (30:1534) — "State Card / Reorder empty"
   - Background: `--tillcount-color-status-success-bg` `#ddede5` (green-tinted)
   - Border: 1px solid `--tillcount-color-status-success` `#4d8b6e`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1535): `"Reorder empty"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1536): `"Nothing currently needs ordering based on the latest counts and targets."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1537) — flex row, height 44px (single button)
   - **Button "Done"** (30:1538/30:1539)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Done"` — Type/Button, white

## Icons
None.

## Notes
- Uses the success color pair (`status-success` / `status-success-bg`) — the only one of the 12 states to do so — reinforcing that an empty reorder list is a good outcome, not a problem.
