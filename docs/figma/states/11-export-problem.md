# State 11: Export problem (node 30:1584)

Source: "Required States" (30:1494) → "State row" (30:1583) → `State / Export problem` (30:1584).

## Type
Documentation spec card representing an **error state** shown when generating/sharing an export/report file fails.

## Layout
Card container (30:1584): flex column, gap 10px, width 410px.

1. **State Card** (30:1585) — "State Card / Export problem"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1586): `"Export problem"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1587): `"The report file could not be created or shared. Existing TillCount data is unchanged."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1588) — flex row, height 44px (single button)
   - **Button "Try again"** (30:1589/30:1590)
     - Size 132×44, radius 12px, background `--tillcount-color-status-danger` `#b14d38` (red)
     - Label `"Try again"` — Type/Button, white

## Icons
None.

## Notes
- Single red retry CTA. Copy guarantees existing TillCount data is unaffected by the failed export.
- Note the button here is red/danger-styled even though its label ("Try again") is identical to State 09's navy "Try again" button — color follows the card's overall danger context consistently, not the specific label text.
