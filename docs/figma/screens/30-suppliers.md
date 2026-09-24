# 30 Suppliers (node 24:740)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Products or More menu)
- Title (center): "Suppliers" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Suppliers" — Roboto Bold 16/20, `#1a2540`.
- **List row** ×4, each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Booker" / "124 products"
  - "Bestway" / "87 products"
  - "Local dairy" / "18 products"
  - "Direct bakery" / "14 products"
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Add supplier". (inferred → opens a supplier form screen, same layout pattern as Category form, node 31 supplier-form)

## Interactive elements → inferred destinations
- Back arrow → previous screen (Products list or More menu).
- Each supplier row → a supplier detail/edit form pre-filled with that supplier's data (see existing 31-supplier-form.md).
- "Add supplier" button → supplier form screen, blank/new-supplier mode.

## Empty/error/notice states
- None shown; 4 example suppliers populated. (inferred: an empty state would show if no suppliers exist.)
