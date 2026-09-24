# 67 TillCount Pro (node 29:1492)

## Header
- Title: "TillCount Pro"
- Start slot: back arrow (24x24 white) — inferred: back to previous screen (Settings/More)
- End slot: empty
- Header bg `#1a2540`, height 78px

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px, gap 12px.

- Page heading: "Unlock TillCount Pro" — Roboto Bold 20/24, `#1a2540`
- Info/price card (badge-like banner, bg `#e3e9f3`, border `#ddd3be`, radius 12px):
  - Title: "One-time purchase" (Roboto Bold 15/19, `#1a2540`)
  - Body: "Upgrade once. Exact store price is shown by Apple or Google before purchase." (Roboto Medium 12/16, `#5b6476`)
- Feature list (checkmark/bullet list) — each item: small filled circle/dot icon (8x8, `#e8842d` orange accent per Ellipse icon; exact icon fill not resolved from code but rendered as a solid dot, likely `--tillcount-color-action-accent` or similar accent green/orange) + text (Roboto Medium 14/18, `#1a2540`):
  - "Larger product catalogue and counting workflows"
  - "Full count history and reusable favourites"
  - "PDF and CSV reporting/export tools"
  - "Advanced reorder and data tools"
  - "Encrypted backup and restore"
- Primary button: "Upgrade to Pro" (bg `#1a2540`, text white, Roboto Bold 15/18, height 50px, radius 12px, full width 358px)
- Secondary button: "Restore purchase" (bg `#fffdf8`, border `#ddd3be`, text `#1a2540`, height 50px, radius 12px)

## Interactive elements (inferred destinations)
- Back arrow → previous screen
- "Upgrade to Pro" button → triggers native in-app-purchase flow (Apple/Google store purchase sheet)
- "Restore purchase" button → screen 68 Restore purchase

## Empty/error/notice states
None shown (purchase price itself is deferred to the OS store sheet, as stated in the info card).
