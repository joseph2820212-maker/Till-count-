# 45 Family export (node 26:983)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Family export" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Share Till products" — Roboto Bold 16, `#1a2540`.
- Info card (background `#e3e9f3`, border `#ddd3be`, radius 12, height 92):
  - Title: "632 products ready" — Roboto Bold 15, `#1a2540`.
  - Body: "Exports product identity only; count sessions and history stay in TillCount." — Roboto Medium 12, `#5b6476`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "TillCalc" (Roboto Bold 15, `#1a2540`), subtitle "Pricing and cost fields supported" (Roboto Medium 12, `#5b6476`), trailing chevron — destination app choice.
- List row: title "TillLabel", subtitle "Product name, barcode and selling price", trailing chevron — destination app choice.
- List row: title "TillExpiry", subtitle "Product identity and pack details", trailing chevron — destination app choice.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Create transfer file" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to previous (More/settings) screen.
- "TillCalc" / "TillLabel" / "TillExpiry" rows → each selects (likely as a radio-style selection, though visually rendered as plain list rows/chevrons) the target Till-family app for the export, determining which fields are included.
- "Create transfer file" → generates the family-transfer file for the selected destination app and opens the native share sheet.

## Empty/error/notice states
- Info card communicates scope of export as an informational notice (no count history exported, product identity only) — not an error state.
