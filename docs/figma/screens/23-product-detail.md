# 23 Product detail (node 23:578)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Products list)
- Title (center): "Product detail" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/detail screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Coca-Cola Original 500ml" (product name as title) — Roboto Bold 16/20, `#1a2540`.
- **Card** "14 counted" (success/status card): bg `#ddede5` (status-success-bg), border `#ddd3be`, radius 12px, padding 14/12, height 72px, gap 5px.
  - Title: "14 counted" — Bold 15/19, `#1a2540`.
  - Subtitle: "Last counted today · Front shop" — Medium 12/16, `#5b6476`.
- **List row** ×6, each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Barcodes" / "Single 5000112637922 · Case 5000112637000"
  - "Category" / "Drinks"
  - "Supplier" / "Booker"
  - "Location" / "Front shop"
  - "Reorder" / "Low at 6 · Target 24"
  - "Pack / case" / "24 units per case"
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Edit product". (inferred → Edit product screen, node 23:668)

## Interactive elements → inferred destinations
- Back arrow → Products list.
- "14 counted" status card → likely non-interactive (informational summary), or opens count history filtered to this product. (inferred)
- "Barcodes" row → Barcodes screen (node 23:705).
- "Category" row → Category detail/picker.
- "Supplier" row → Supplier detail/picker.
- "Location" row → Location picker.
- "Reorder" row → Reorder settings for this product.
- "Pack / case" row → pack/case configuration.
- "Edit product" button → Edit product screen (node 23:668).

## Empty/error/notice states
- None shown; all fields populated with example data for a single product.
