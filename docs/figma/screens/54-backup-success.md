# 54 Backup success (node 27:1334)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Data & backup (screen 52), though likely disabled/final step
- Title: "Backup success" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Backup created" — Roboto Bold 16/20, #1a2540
- Success/status card (bg #ddede5 success-bg, border 1px #4d8b6e success, radius 12px, h 88px):
  - Title: "TillCount_Backup_2026-09-24.tcb" (bold 15px, #1a2540) — sample filename with today's date and .tcb extension
  - Body: "632 products · 23 completed counts · settings included" (medium 12px, #5b6476)
- Body text (medium 14px, #5b6476): "Save the file somewhere you control, such as Files, Drive or external storage."
- Primary button (bg #1a2540, h 50px, radius 12px): "Share backup file" (bold 15px, white) — inferred: opens native OS share sheet for the .tcb file
- Secondary/outline button (bg #fffdf8, border 1px #ddd3be, radius 12px, h 50px): "Done" (bold 15px, #1a2540) — inferred: returns to Data & backup (screen 52) or More (screen 46)

## Colors
- App bg #f7f3e8, success card bg #ddede5 / border #4d8b6e, text primary #1a2540, text secondary #5b6476, secondary button bg #fffdf8 / border #ddd3be

## Empty/error/notice states
- Success confirmation card (green) with backup filename and contents summary
