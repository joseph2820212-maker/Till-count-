# 44 Import from TillCalc (node 26:957)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Import from TillCalc" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "TillCalc product import" — Roboto Bold 16, `#1a2540`.
- Info card "Till family transfer" (background `#e3e9f3`, border `#ddd3be`, radius 12, height 94):
  - Title: "Till family transfer" — Roboto Bold 15, `#1a2540`.
  - Body: "Import product identity, barcodes, category, supplier, pack size and prices." — Roboto Medium 12, `#5b6476`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "Choose Till family file" (Roboto Bold 15, `#1a2540`), subtitle "Select a file exported from TillCalc" (Roboto Medium 12, `#5b6476`), trailing chevron.
- Success/positive notice card "TillCount stays independent" (background `#ddede5`, border `#ddd3be`, radius 12):
  - Title: "TillCount stays independent" — Roboto Bold 15, `#1a2540`.
  - Body: "The apps do not read each other's private storage directly." — Roboto Medium 12, `#5b6476`.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Choose file" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 40 "Import Centre".
- "Choose Till family file" row → opens native file picker for a TillCalc export file.
- "Choose file" primary button → same action as the row above; on file selection likely proceeds to screen 41 "CSV field mapping" or directly to screen 42 "Import review".

## Empty/error/notice states
- "TillCount stays independent" card is a reassurance/privacy notice, not an error.
