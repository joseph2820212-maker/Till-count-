# 10 Choose category (node 21:283)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Choose category" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Category" — Bold 16/20, `#1a2540`.
- **List rows** (tappable, chevron-right icon 20×20), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding pl14/pr12/py12, gap 10:
  1. Title "Drinks" (Bold 15/19 `#1a2540`), subtitle "84 products" (Medium 12/16 `#5b6476`).
  2. Title "Grocery", subtitle "126 products".
  3. Title "Tobacco", subtitle "42 products".
  4. Title "Confectionery", subtitle "63 products".
  5. Title "Household", subtitle "31 products".
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Use selected category".

## Interactive elements → inferred destinations
- List rows (Drinks / Grocery / Tobacco / Confectionery / Household) → tap selects that category (single-select; visual selected state not distinctly shown in this static export, but chevron + row style implies navigation-style selection).
- "Use selected category" → proceeds to Count setup (21:251) or directly to Scan & Count (17:270) scoped to the chosen category.
- Back chevron → returns to Start Count screen (17:184).

## Empty/error/notice states
- None; list fully populated with example categories and counts.
