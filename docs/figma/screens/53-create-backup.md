# 53 Create backup (node 27:1306)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Data & backup (screen 52)
- Title: "Create backup" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Protect this backup" — Roboto Bold 16/20, #1a2540
- Notice card "Includes" (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 96px):
  - Title: "Includes" (bold 15px, #1a2540)
  - Body: "Products, barcodes, suppliers, locations, count history, reorder settings and app settings." (medium 12px, #5b6476)
- Password field, label "Backup password" (medium 12px, #5b6476), input box (card, 50px, bg #fffdf8, border #ddd3be): value shown masked "••••••••••••" (medium 16px, #1a2540)
- Password field, label "Confirm password", input box: value masked "••••••••••••"
- Danger/warning notice card "Important" (bg #fbe3de danger-bg, border 1px #b14d38 danger, radius 12px, h 82px):
  - Title: "Important" (bold 15px, #1a2540)
  - Body: "TillCount cannot recover a forgotten backup password." (medium 12px, #5b6476)
- Primary button (bg #1a2540, h 50px, radius 12px): "Create backup" (bold 15px, white) — inferred: validates matching passwords, generates encrypted .tcb file, navigates to screen 54 Backup success

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, info notice bg #e3e9f3, danger notice bg #fbe3de / border #b14d38, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Informational "Includes" card (blue) listing backup contents
- Warning "Important" card (red border/bg) about unrecoverable password
- Inferred validation error state (not shown in design): password mismatch or too-short password would likely block the "Create backup" action
