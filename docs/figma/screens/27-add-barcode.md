# 27 Add barcode (node 23:740)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Barcodes list, discarding unsaved input)
- Title (center): "Add barcode" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/form screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "New barcode" — Roboto Bold 16/20, `#1a2540`.
- **Text input** "Barcode": label "Barcode" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, placeholder/value "Scan or type" (Medium 16/20, `#1a2540`).
- **Text input** "Role": label "Role", value "Single". (inferred picker: Single / Pack / Case)
- **Text input** "Units in pack/case": label "Units in pack/case", value "1".
- **Card** "Duplicate protection" (info/notice): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 82px, gap 5px.
  - Title: "Duplicate protection" — Bold 15/19, `#1a2540`.
  - Body: "Equivalent UPC/EAN codes are normalised before saving." — Medium 12/16, `#5b6476`.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save barcode".

## Interactive elements → inferred destinations
- Back arrow → Barcodes list (unsaved input discarded).
- Barcode input → tapping likely launches the camera/scanner or accepts manual typed entry.
- Role input → picker (Single / Pack / Case).
- Units in pack/case input → numeric keyboard; likely disabled/irrelevant when Role = Single.
- "Duplicate protection" card → informational only, not tappable.
- "Save barcode" button → saves the new barcode against the product, returns to Barcodes list (node 23:705).

## Empty/error/notice states
- "Duplicate protection" card is an inline notice explaining UPC/EAN normalisation; presumably a validation error would surface here if a duplicate barcode is entered, though not depicted in this static screen.
