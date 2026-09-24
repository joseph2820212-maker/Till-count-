# 55 Restore file (node 27:1354)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Data & backup (screen 52)
- Title: "Restore file" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Restore TillCount" — Roboto Bold 16/20, #1a2540
- Notice card "Choose a .tcb backup" (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 82px):
  - Title: "Choose a .tcb backup" (bold 15px, #1a2540)
  - Body: "The file is checked before anything on this phone changes." (medium 12px, #5b6476)
- List row (card, bg #fffdf8, border #ddd3be, radius 12px, h 68px, chevron ">" at end):
  - "Choose backup file" / "Browse device files" — inferred: opens native file picker, then proceeds to screen 56 Restore password (if file is encrypted) or directly to screen 57 Restore preview
- Notice card "Current data is protected" (bg #ddede5 success-bg, border #ddd3be, radius 12px, h 92px):
  - Title: "Current data is protected" (bold 15px, #1a2540)
  - Body: "Restore uses a staged replacement and rolls back if interrupted." (medium 12px, #5b6476)
- Primary button (bg #1a2540, h 50px, radius 12px): "Choose file" (bold 15px, white) — inferred: same action as the "Choose backup file" row, opens file picker

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, info card bg #e3e9f3, success card bg #ddede5, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Informational card: "Choose a .tcb backup — file checked before changes are made"
- Reassurance card: "Current data is protected — staged replacement with rollback"
- Inferred error state (not shown): invalid/corrupt file selected would show an error notice before proceeding
