# 11 Choose supplier (node 21:327)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Choose supplier" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Supplier" — Bold 16/20, `#1a2540`.
- **List rows** (tappable, chevron-right icon 20×20), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding pl14/pr12/py12, gap 10:
  1. Title "Booker" (Bold 15/19 `#1a2540`), subtitle "124 products" (Medium 12/16 `#5b6476`).
  2. Title "Bestway", subtitle "87 products".
  3. Title "Local dairy", subtitle "18 products".
  4. Title "Direct bakery", subtitle "14 products".
  5. Title "No supplier", subtitle "33 products".
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Use selected supplier".

## Interactive elements → inferred destinations
- List rows (Booker / Bestway / Local dairy / Direct bakery / No supplier) → tap selects that supplier scope.
- "Use selected supplier" → proceeds to Count setup (21:251) or Scan & Count (17:270), scoped to the chosen supplier.
- Back chevron → returns to Start Count screen (17:184).

## Empty/error/notice states
- None; list fully populated. "No supplier" row functions as a catch-all/unassigned bucket.
