# 40 Import Centre (node 25:942)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Import Centre" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Import products" — Roboto Bold 16, `#1a2540`.
- Info card "CSV file" (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "CSV file" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "Import products from a supplier or spreadsheet." — Roboto Medium 12, `#5b6476`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "Choose CSV file" (Roboto Bold 15, `#1a2540`), subtitle "Name, barcode, category, supplier and quantities" (Roboto Medium 12, `#5b6476`), trailing chevron.
- List row: title "Import from TillCalc", subtitle "Use Till family product transfer", trailing chevron.
- Success/positive notice card "Nothing is overwritten silently" (background `#ddede5`, border `#ddd3be`, radius 12):
  - Title: "Nothing is overwritten silently" — Roboto Bold 15, `#1a2540`.
  - Body: "You review mapping and rows before import." — Roboto Medium 12, `#5b6476`.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Choose file" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to previous (More/settings) screen.
- "Choose CSV file" row → opens native file picker, then navigates to screen 41 "CSV field mapping".
- "Import from TillCalc" row → navigates to screen 44 "Import from TillCalc".
- "Choose file" primary button → same action as "Choose CSV file" row (opens file picker → screen 41).

## Empty/error/notice states
- "Nothing is overwritten silently" card is a reassurance/notice banner, not an error.
