# 39 CSV preview (node 25:917)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "CSV preview" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Reorder.csv" (filename) — Roboto Bold 16, `#1a2540`.
- Info card "4 rows" (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "4 rows" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "Columns: Product · Supplier · Count · Target · Order" — Roboto Medium 12, `#5b6476`.
- Table rows (CSV row mock, card `#fffdf8`, subtle border `#ebe7de`, height 46, no radius shown as separate list style), each a single pipe-delimited text line, Roboto Medium 12, `#5b6476`:
  - "Coke Zero | Booker | 0 | 24 | 24"
  - "Walkers | Booker | 0 | 18 | 18"
  - "Milk 2L | Dairy | 2 | 10 | 8"
  - "Sugar 1kg | Booker | 3 | 12 | 9"
- Primary button (navy `#1a2540`, radius 12, height 50): text "Export CSV" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 36 "Export Centre".
- "Export CSV" → generates the file and opens native OS share/save sheet.
- Individual CSV rows are likely non-interactive (read-only preview).

## Empty/error/notice states
- None; sample data shown for all 4 rows. Note this reflects the same underlying reorder data as screens 34 and 38 (Coke Zero, Walkers, Milk 2L, Sugar 1kg) but formatted as raw CSV columns including a "Dairy" supplier value distinct from "Booker".
