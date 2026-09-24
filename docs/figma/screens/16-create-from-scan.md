# 16 Create from scan (node 22:392)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (chevron-left, 24×24, white) — inferred → navigates back to the previous scan/barcode screen.
- Title (center): "Create from scan" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (modal/stack screen, no bottom nav bar).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "New product" — Roboto Bold 16/20, `#1a2540`.
- **Card** "Barcode already captured": bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 76px, gap 5px.
  - Title: "Barcode already captured" — Bold 15/19, `#1a2540`.
  - Subtitle (sample barcode value): "5000112999999" — Medium 12/16, `#5b6476`.
- **Text input** "Product name": label "Product name" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, value text "New product" (Medium 16/20, `#1a2540`).
- **Text input** "Quantity now": label "Quantity now", value "12".
- **Text input** "Category": label "Category", value "Uncategorised".
- **Text input** "Count unit": label "Count unit", value "Each".
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save & continue count". (inferred → creates the product from the scanned barcode and resumes/continues the active count)

## Interactive elements → inferred destinations
- Back arrow → previous screen (barcode scan / product lookup).
- Product name / Quantity now / Category / Count unit inputs → editable fields, tappable to open keyboard or picker (Category likely opens a category picker).
- "Save & continue count" button → saves the new product with the captured barcode and returns to the active scan-and-count flow.

## Empty/error/notice states
- None shown; all fields pre-filled with example/default values ("New product", "12", "Uncategorised", "Each").
