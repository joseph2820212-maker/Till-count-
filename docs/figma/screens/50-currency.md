# 50 Currency (node 27:1168)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to Units & formats (screen 49) or Data & backup, whichever screen links here
- Title: "Currency" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Section label: "Currency" — Roboto Bold 16/20, #1a2540
- List row / radio-style selection rows (card, bg #fffdf8, border #ddd3be, radius 12px, height 68px, chevron ">" icon at end):
  - "GBP · £" / "Selected" (subtitle indicates current selection state — no distinct checkmark/radio glyph visible; selection communicated via subtitle text "Selected") — inferred: currently selected currency
  - "EUR · €" / "Euro"
  - "USD · $" / "US Dollar"
  - "AED · د.إ" / "UAE Dirham"
  - "TRY · ₺" / "Turkish Lira"
  - Each row inferred to select that currency and return to previous screen on tap
- Notice card "Used for stock value only" (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 82px):
  - Title: "Used for stock value only" (bold 15px, #1a2540)
  - Body: "Counts themselves are quantities, not money." (medium 12px, #5b6476)

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, info notice bg #e3e9f3, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Informational notice: "Used for stock value only — Counts themselves are quantities, not money."
