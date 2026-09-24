# 26 Barcodes (node 23:705)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Product detail)
- Title (center): "Barcodes" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Coca-Cola Original 500ml" (product name as title) — Roboto Bold 16/20, `#1a2540`.
- **List row** ×3 (barcodes), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "5000112637922" / "Single · one unit"
  - "5000112637000" / "Case · 24 units"
  - "5000112637999" / "Pack · 6 units"
- **Card** "Barcode roles" (info/notice): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 82px, gap 5px.
  - Title: "Barcode roles" — Bold 15/19, `#1a2540`.
  - Body: "Single, pack and case codes can all point to the same product." — Medium 12/16, `#5b6476`.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Add barcode". (inferred → Add barcode screen, node 23:740)

## Interactive elements → inferred destinations
- Back arrow → Product detail screen.
- Barcode list rows → tap to edit or delete that barcode entry (edit-barcode screen or inline actions). (inferred)
- "Barcode roles" card → informational only, not tappable.
- "Add barcode" button → Add barcode screen (node 23:740).

## Empty/error/notice states
- "Barcode roles" card functions as an inline educational notice explaining multi-role barcodes; no error/empty state shown since 3 barcodes are populated.
