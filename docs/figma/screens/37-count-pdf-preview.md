# 37 Count PDF preview (node 25:868)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Count PDF preview" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (centered column, 16px padding, 12px gap, background `#f7f3e8`)
- PDF page mock (card `#fffdf8`, border `#ddd3be`, radius 8, 330px wide, 470px tall, padded 22/24):
  - "TillCount" — Roboto Bold 16, `#1a2540` (document masthead/logo text).
  - "Count report · Front shop" — Roboto Bold 15, `#1a2540` (report title/subtitle line).
  - "Generated 24 Sep 2026" — Roboto Medium 10, faint `#8a8e9f`.
  - "421 products · 1,946 units" — Roboto Medium 12, `#5b6476`.
  - "Low stock 18 · Out of stock 7" — Roboto Medium 12, `#5b6476`.
  - "Stock cost value £4,716.28" — Roboto Medium 12, `#5b6476`.
  - (blank spacer line)
  - Table-like line-item rows (Roboto Medium 12, `#5b6476`), dot-leader style:
    - "Coca-Cola 500ml ........ 14"
    - "Milk 2L ................ 3"
    - "Walkers Cheese ......... 6"
- Primary button (navy `#1a2540`, radius 12, height 50, full width): text "Share PDF" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 36 "Export Centre".
- "Share PDF" → opens native OS share sheet to send the generated PDF file.

## Empty/error/notice states
- None; this is a populated preview with sample count data.
