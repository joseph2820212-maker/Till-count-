# State 09: Wrong backup password (node 30:1567)

Source: "Required States" (30:1494) → "State row" (30:1566) → `State / Wrong backup password` (30:1567).

## Type
Documentation spec card representing an **error dialog** shown when a backup file cannot be decrypted/unlocked with the given password.

## Layout
Card container (30:1567): flex column, gap 10px, width 410px.

1. **State Card** (30:1568) — "State Card / Wrong backup password"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1569): `"Wrong backup password"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1570): `"The backup could not be unlocked. No current data was changed. Try again or choose another file."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1571) — flex row, gap 8px, height 44px
   - **Button "Try again"** (30:1572/30:1573)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Try again"` — Type/Button, white
   - **Button "Choose file"** (30:1574/30:1575)
     - Size 132×44, radius 12px, background `#b14d38` (red/danger-accent — alternate path out of the error)
     - Label `"Choose file"` — Type/Button, white

## Icons
None.

## Notes
- Copy explicitly guarantees no current app data was changed by the failed restore attempt — must be preserved in implementation copy/behavior.
