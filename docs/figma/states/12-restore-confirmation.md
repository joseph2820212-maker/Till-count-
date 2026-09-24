# State 12: Restore confirmation (node 30:1591)

Source: "Required States" (30:1494) → "State row" (30:1583) → `State / Restore confirmation` (30:1591).

## Type
Documentation spec card representing a **confirmation dialog** shown before restoring a backup (a data-replacing, non-destructive-by-mistake action, hence neutral/info coloring rather than danger).

## Layout
Card container (30:1591): flex column, gap 10px, width 410px.

1. **State Card** (30:1592) — "State Card / Restore confirmation"
   - Background: `--tillcount-color-status-info-bg` `#e3e9f3` (neutral)
   - Border: 1px solid `--tillcount-color-border-default` `#ddd3be`
   - Corner radius 16px, padding 18px, gap 10px, width 410px
   - **Title** (30:1593): `"Restore confirmation"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1594): `"Show the backup summary and make replacement explicit before the final Restore action."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1595) — flex row, gap 8px, height 44px
   - **Button "Cancel"** (30:1596/30:1597)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary)
     - Label `"Cancel"` — Type/Button, white
   - **Button "Restore"** (30:1598/30:1599)
     - Size 120×44, radius 12px, background `#1a2540` (navy primary — both buttons share the same navy styling; no red/destructive variant used here despite Restore overwriting current data)
     - Label `"Restore"` — Type/Button, white

## Icons
None.

## Notes
- Unlike Delete/Discard confirmations, both buttons are navy (no red destructive variant), even though Restore replaces current data — the spec instead requires the dialog body to show a backup summary and make the replacement explicit in copy, rather than relying on button color alone.
