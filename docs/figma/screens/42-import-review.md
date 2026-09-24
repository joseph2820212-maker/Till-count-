# 42 Import review (node 25:1009)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Import review" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Review 126 rows" — Roboto Bold 16, `#1a2540`.
- Info card (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "118 ready · 8 need attention" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "Nothing imports until you confirm." — Roboto Medium 12, `#5b6476`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "Coca-Cola Original 500ml" (Roboto Bold 15, `#1a2540`), subtitle "✓ Ready · barcode 5000112637922" (Roboto Medium 12, `#5b6476`, checkmark prefix implies success/ready status), trailing chevron.
- List row: title "Unknown product row 18", subtitle "! Missing product name" (exclamation prefix implies warning/error status needing attention), trailing chevron.
- List row: title "Milk 2L", subtitle "✓ Ready · category Chilled", trailing chevron.
- List row: title "Sugar 1kg", subtitle "✓ Ready · supplier Booker", trailing chevron.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Import 118 ready rows" — Roboto Bold 15, white.
- Secondary/outline button (card `#fffdf8`, border `#ddd3be`, radius 12, height 50): text "Fix 8 rows" — Roboto Bold 15, `#1a2540`.

## Interactive elements (inferred)
- Back arrow → returns to screen 41 "CSV field mapping".
- Each row → opens row detail/edit view for that product's import data (especially to fix problem rows like "Unknown product row 18").
- "Import 118 ready rows" → commits only the valid ("Ready") rows, skipping the 8 flagged ones; likely navigates to screen 43 "Import complete".
- "Fix 8 rows" → filters/navigates to a list of just the 8 rows needing attention for correction.

## Empty/error/notice states
- Warning row state: "Unknown product row 18" with "! Missing product name" — a per-row validation error requiring user action before that row can import.
- Info card explicitly states nothing is committed yet ("Nothing imports until you confirm"), acting as a pre-commit safety notice.
