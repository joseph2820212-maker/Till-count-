# State 02: Free limit reached (node 30:1506)

Source: "Required States" (30:1494) → "State row" (30:1496) → `State / Free limit reached` (30:1506).

## Type
Documentation spec card representing an **upsell / paywall modal dialog**, shown when a Free-tier limit (e.g. product count cap) is hit.

## Layout
Card container (30:1506): flex column, gap 10px, width 410px.

1. **State Card** (30:1507) — "State Card / Free limit reached"
   - Background: `--tillcount-color-status-info-bg` `#e3e9f3` (neutral/info, NOT danger — this is informational, not an error)
   - Border: 1px solid `--tillcount-color-border-default` `#ddd3be`
   - Corner radius: 16px (`--tillcount-radius-lg`)
   - Padding 18px, gap 10px, width 410px
   - **Title** (30:1508): `"Free limit reached"`
     - Type/Section Title — Roboto Bold 16/20/0, color `#1a2540`
   - **Body text** (30:1509): `"Explain which Free limit was reached without locking existing data. Offer Upgrade and Not now."`
     - Type/Body Small — Roboto Medium 12/16/0, color `#5b6476`

2. **Actions row** (30:1510) — flex row, gap 8px, height 44px
   - **Button "Upgrade"** (30:1511/30:1512)
     - Size 120×44, radius 12px, background `--tillcount-color-action-primary` `#1a2540` (navy)
     - Label `"Upgrade"` — Type/Button (Bold 15/18), color white `#ffffff`
   - **Button "Not now"** (30:1513/30:1514)
     - Size 120×44, radius 12px, background `--tillcount-color-action-primary` `#1a2540` (navy — both buttons share the same navy primary styling; there is no visually distinct secondary/dismiss variant here)
     - Label `"Not now"` — Type/Button, color white `#ffffff`

## Icons
None.

## Notes
- Unlike the danger states, both buttons use the same navy "primary" fill — the design does not visually de-emphasize "Not now"; it must remain equally tappable/dismissible without penalizing the user.
- Copy explicitly instructs: do not lock/hide existing data when the limit is hit — only block further additions and prompt to upgrade.
