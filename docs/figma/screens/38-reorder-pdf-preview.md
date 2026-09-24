# 38 Reorder PDF preview (node 25:892)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Reorder PDF preview" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (centered column, 16px padding, 12px gap, background `#f7f3e8`)
- PDF page mock (card `#fffdf8`, border `#ddd3be`, radius 8, 330px wide, 470px tall, padded 22/24):
  - "TillCount" — Roboto Bold 16, `#1a2540` (masthead).
  - "Reorder list · Booker" — Roboto Bold 15, `#1a2540` (title, supplier-scoped).
  - "Generated 24 Sep 2026" — Roboto Medium 10, faint `#8a8e9f`.
  - "14 items to order" — Roboto Medium 12, `#5b6476`.
  - (blank spacer line)
  - Dot-leader line items (Roboto Medium 12, `#5b6476`):
    - "Coca-Cola Zero ........ 24"
    - "Walkers Ready Salted .. 18"
    - "Sugar 1kg .............. 9"
    - "Milk 2L ................ 8"
  - (blank spacer line)
  - "Created from last counts" — Roboto Medium 12, `#5b6476` (footnote).
- Primary button (navy `#1a2540`, radius 12, height 50, full width): text "Share PDF" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 36 "Export Centre" (or screen 34 "Supplier reorder" if entered via "Share Booker list").
- "Share PDF" → opens native OS share sheet to send the generated PDF file.

## Empty/error/notice states
- None; populated preview with sample reorder data matching screen 34's supplier reorder figures.
