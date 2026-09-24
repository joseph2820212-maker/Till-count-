# 52 Data & backup (node 27:1261)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to More (screen 46)
- Title: "Data & backup" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Your data" — Roboto Bold 16/20, #1a2540
- List rows (card, bg #fffdf8, border #ddd3be, radius 12px, height 68px, chevron ">" at end):
  - "Create encrypted backup" / "Password-protected TillCount file" — inferred → screen 53 Create backup
  - "Restore backup" / "Preview before replacing data" — inferred → screen 55 Restore file
  - "Import products" / "CSV or Till family file" — inferred → import flow (not in this batch)
  - "Export products" / "CSV or Till family transfer" — inferred → export flow (not in this batch)
  - "Export reports" / "Count and reorder PDF/CSV" — inferred → reports export flow (not in this batch)
- Notice card "Offline" (bg #ddede5 success-bg, border #ddd3be, radius 12px, h 82px):
  - Title: "Offline" (bold 15px, #1a2540)
  - Body: "Your operational data stays on this device unless you export/share it." (medium 12px, #5b6476)

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, success/offline notice bg #ddede5, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Informational notice (green/success style): "Offline — Your operational data stays on this device unless you export/share it."
