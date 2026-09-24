# 59 Help (node 28:1328)

## Header
- Title: "Help"
- Start slot: back arrow (chevron-left icon, white, 24x24), navigates back — inferred: pops to previous screen (likely More/Settings)
- End slot: empty (44x44 reserved space, no icon)
- No subtitle
- Header bg: `#1a2540` (navy, `--tillcount-color-action-primary`), height 78px, title text color `#ffffff` (`--tillcount-color-text-on-navy`), title font Roboto Bold 20/24

## Bottom navigation
None (this is a pushed detail screen, no tab bar shown)

## Body
Screen background: `#f7f3e8` (`--tillcount-color-bg-app`). Body padding 16px, vertical gap 12px between items.

- Section label: "How to use TillCount" — Roboto Bold 16/20, color `#1a2540`
- List row (card, bg `#fffdf8` `--tillcount-color-surface-card`, border 1px `#ddd3be` `--tillcount-color-border-default`, radius 12px, chevron-right icon 20x20 at end):
  - Title: "Start a stock count" (Roboto Bold 15/19, `#1a2540`)
  - Subtitle: "Everything, category, supplier, location or selected products" (Roboto Medium 12/16, `#5b6476` `--tillcount-color-text-secondary`) — text appears clipped/truncated in the screenshot (row height fixed at 68px)
- List row: "Scan products" / "Repeated scans can add one each time"
- List row: "Count cases + loose" / "Enter cases/packs and loose units together"
- List row: "Build a reorder list" / "Low stock and target quantity explained"
- List row: "Import products" / "CSV and Till family transfer"
- List row: "Backup & restore" / "Encrypted local backup"
- List row: "Contact support" / "What to include and what never to send"

All rows are identical "List Row" components (358px wide, 68px tall, chevron icon).

## Interactive elements (inferred destinations)
- Back arrow → previous screen (More/Settings)
- "Start a stock count" row → a help article / detail screen on starting a stock count, or possibly directly to Start Count flow
- "Scan products" row → help article on scanning
- "Count cases + loose" row → help article on cases/loose units
- "Build a reorder list" row → help article on reorder lists
- "Import products" row → help article on importing (CSV / Till family transfer)
- "Backup & restore" row → help article on backup/restore, or Backup & Restore settings screen
- "Contact support" row → Contact & support screen (screen 61 lists "Contact & support")

## Empty/error/notice states
None shown on this screen.
