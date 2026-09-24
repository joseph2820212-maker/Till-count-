# 36 Export Centre (node 25:829)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Export Centre" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Export data" — Roboto Bold 16, `#1a2540`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "Count report PDF" (Roboto Bold 15, `#1a2540`), subtitle "Completed count with quantities and value" (Roboto Medium 12, `#5b6476`), trailing chevron (20x20).
- List row: title "Reorder PDF", subtitle "Shareable buying list", trailing chevron.
- List row: title "Reorder CSV", subtitle "Excel / Sheets compatible", trailing chevron.
- List row: title "Products CSV", subtitle "Product catalogue export", trailing chevron.
- Info/notice card "Privacy" (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "Privacy" — Roboto Bold 15, `#1a2540`.
  - Body: "Files are created on this device and shared only when you choose." — Roboto Medium 12, `#5b6476`.

## Interactive elements (inferred)
- Back arrow → returns to previous (More/settings) screen.
- "Count report PDF" row → navigates to screen 37 "Count PDF preview".
- "Reorder PDF" row → navigates to screen 38 "Reorder PDF preview".
- "Reorder CSV" row → navigates to screen 39 "CSV preview" (reorder variant).
- "Products CSV" row → navigates to a CSV preview of the product catalogue (variant of screen 39).

## Empty/error/notice states
- "Privacy" card is an informational/reassurance banner, not an error state.
