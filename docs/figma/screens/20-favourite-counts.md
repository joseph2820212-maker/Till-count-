# 20 Favourite counts (node 22:534)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white).
- Title (center): "Favourite counts" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack screen, reached from Count or More).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Favourite counts" — Roboto Bold 16/20, `#1a2540`.
- **List row** ×4, each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Weekly cigarettes" / "Category · Tobacco · 42 products"
  - "Daily fridge" / "Location · Fridge · 28 products"
  - "Sunday full shop" / "Everything · all active products"
  - "Monthly stockroom" / "Location · Stockroom · 96 products"
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "New favourite". (inferred → opens a create-favourite flow, similar to Edit favourite screen)

## Interactive elements → inferred destinations
- Back arrow → previous screen (Count tab or More menu).
- Each list row → Edit favourite screen (node 22:572) pre-filled with that favourite's config.
- "New favourite" button → new favourite creation form (same layout as Edit favourite, blank).

## Empty/error/notice states
- None shown; 4 example favourites populated. (inferred: an empty state would show if no favourites are saved yet.)
