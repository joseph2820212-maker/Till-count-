# 56 Restore password (node 27:1380)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Restore file (screen 55)
- Title: "Restore password" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Unlock backup" — Roboto Bold 16/20, #1a2540
- File info card (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 76px):
  - Title: "TillCount_Backup_2026-09-24.tcb" (bold 15px, #1a2540)
  - Body: "Created 24 Sep · encrypted" (medium 12px, #5b6476)
- Password field, label "Backup password" (medium 12px, #5b6476), input box (card, 50px, bg #fffdf8, border #ddd3be): value masked "••••••••••••"
- Primary button (bg #1a2540, h 50px, radius 12px): "Continue" (bold 15px, white) — inferred: verifies password, on success navigates to screen 57 Restore preview; on failure shows an error (not depicted)
- Secondary/outline button (bg #fffdf8, border #ddd3be, radius 12px, h 50px): "Choose another file" (bold 15px, #1a2540) — inferred: returns to screen 55 Restore file

## Colors
- App bg #f7f3e8, card #fffdf8, info card bg #e3e9f3, border #ddd3be, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- File info card shows encrypted status
- Inferred error state (not shown): incorrect password would likely show an inline error message under the password field
