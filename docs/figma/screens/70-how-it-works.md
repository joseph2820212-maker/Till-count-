# 70 How it works (node 29:1566)

## Header
- Title: "How it works"
- Start slot: back arrow (24x24 white) — inferred: back to Welcome
- End slot: empty
- Header bg `#1a2540`, height 78px

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px, gap 12px. This is a step list (onboarding explainer).

- Section label: "Three simple steps" — Roboto Bold 16/20, `#1a2540`
- Step card 1 (bg `#fffdf8`, border `#ddd3be`, radius 12px):
  - Title: "1 · Build your product list" (Roboto Bold 15/19, `#1a2540`)
  - Body: "Add by scan, type manually, import CSV or use a Till-family transfer." (Roboto Medium 12/16, `#5b6476`)
- Step card 2:
  - Title: "2 · Count stock"
  - Body: "Scan or use list mode. Count single units, packs/cases and loose items."
- Step card 3:
  - Title: "3 · Reorder"
  - Body: "See low and out-of-stock items and create a supplier-grouped reorder list."
- Highlight/notice card (bg `#ddede5` `--tillcount-color-status-success-bg`, border `#ddd3be`, radius 12px):
  - Title: "Offline by design" (Roboto Bold 15/19, `#1a2540`)
  - Body: "Core counting works locally on your phone." (Roboto Medium 12/16, `#5b6476`)
- Primary button: "Continue" (bg `#1a2540`, white text, 50px height, radius 12px)

## Interactive elements (inferred destinations)
- Back arrow → Welcome screen
- "Continue" button → screen 71 Camera permission (next onboarding step)

## Empty/error/notice states
- "Offline by design" card functions as a reassurance/notice banner (green success-tinted background), not an error state.
