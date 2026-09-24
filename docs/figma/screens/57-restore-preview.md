# 57 Restore preview (node 28:1264)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Restore password (screen 56) or Restore file (screen 55)
- Title: "Restore preview" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Ready to restore" — Roboto Bold 16/20, #1a2540
- File info card (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 78px):
  - Title: "TillCount_Backup_2026-09-24.tcb" (bold 15px, #1a2540)
  - Body: "Created 24 Sep 2026 · backup verified" (medium 12px, #5b6476)
- List rows (card, bg #fffdf8, border #ddd3be, radius 12px, h 68px, chevron ">" at end) — summary of what will be restored, each presumably expandable/drill-in for detail:
  - "Products" / "632 products · barcodes included"
  - "Count history" / "23 completed counts"
  - "Suppliers & locations" / "4 suppliers · 4 locations"
  - "Settings" / "Count, reorder, units and language"
- Danger/warning notice card "This replaces current TillCount data" (bg #fbe3de danger-bg, border 1px #b14d38 danger, radius 12px, h 92px):
  - Title: "This replaces current TillCount data" (bold 15px, #1a2540)
  - Body: "A staged restore protects the current data until the replacement is complete." (medium 12px, #5b6476)
- Primary button (bg #1a2540, h 50px, radius 12px): "Restore backup" (bold 15px, white) — inferred: begins staged restore, navigates to screen 58 Restore complete on success
- Secondary/outline button (bg #fffdf8, border #ddd3be, radius 12px, h 50px): "Cancel" (bold 15px, #1a2540) — inferred: aborts restore, returns to Data & backup (screen 52)

## Colors
- App bg #f7f3e8, card #fffdf8, info card bg #e3e9f3, danger card bg #fbe3de / border #b14d38, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Verified-backup info card (blue)
- Destructive-action warning card (red) before the primary "Restore backup" action
