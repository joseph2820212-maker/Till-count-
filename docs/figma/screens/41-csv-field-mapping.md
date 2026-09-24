# 41 CSV field mapping (node 25:974)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "CSV field mapping" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Match columns" — Roboto Bold 16, `#1a2540`.
- Helper text: "Tell TillCount what each CSV column means." — Roboto Medium 12, `#5b6476`.
- Mapping row (card `#fffdf8`, border `#ddd3be`, radius 12, height 60, row layout, 3-part: source label, arrow, target dropdown-style value):
  - "Description" (Roboto Medium 14, `#1a2540`) → "→" (faint `#8a8e9f`) → "Product name" (Roboto Medium 14, accent orange `#e8842d`).
  - "EAN" → "→" → "Barcode" (accent orange).
  - "Department" → "→" → "Category" (accent orange).
  - "Supplier" → "→" → "Supplier" (accent orange).
  - "Case Qty" → "→" → "Units per case" (accent orange).
- Primary button (navy `#1a2540`, radius 12, height 50): text "Review rows" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 40 "Import Centre".
- Each mapping row → tapping opens a dropdown/picker to reassign which TillCount field the CSV column ("Description", "EAN", "Department", "Supplier", "Case Qty") maps to; the orange right-hand value is the currently selected target field.
- "Review rows" → navigates to screen 42 "Import review".

## Empty/error/notice states
- None shown; all 5 columns have already been auto-mapped to a target field (orange text implies a filled/confirmed mapping state vs. an unmapped placeholder state).
