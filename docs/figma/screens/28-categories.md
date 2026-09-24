# 28 Categories (node 23:769)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Products or More menu)
- Title (center): "Categories" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Categories" — Roboto Bold 16/20, `#1a2540`.
- **List row** ×5, each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Drinks" / "84 products"
  - "Grocery" / "126 products"
  - "Tobacco" / "42 products"
  - "Confectionery" / "63 products"
  - "Household" / "31 products"
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Add category". (inferred → Category form screen, node 24:718, blank)

## Interactive elements → inferred destinations
- Back arrow → previous screen (Products list or More menu).
- Each category row → Category form screen (node 24:718) pre-filled with that category's data.
- "Add category" button → Category form screen, blank/new-category mode.

## Empty/error/notice states
- None shown; 5 example categories populated. (inferred: an empty state would show if no categories exist.)
