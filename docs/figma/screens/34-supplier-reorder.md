# 34 Supplier reorder (node 24:867)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Supplier reorder" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Booker" (supplier name) — Roboto Bold 16, `#1a2540`.
- Summary/info card (background `#e3e9f3`, border `#ddd3be`, radius 12, height 74):
  - Title: "14 items need ordering" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "4 out of stock · 10 low stock" — Roboto Medium 12, `#5b6476`.
- Order row card "Coca-Cola Zero 500ml" (card `#fffdf8`, danger border `#b14d38`, radius 12, height 80, row layout):
  - Left copy stack: title "Coca-Cola Zero 500ml" (Roboto Bold 15, `#1a2540`); subtitle "Count 0 · Target 24" (Roboto Medium 12, `#5b6476`); status badge text "OUT OF STOCK" (Roboto Medium 10, danger `#b14d38`).
  - Right "Qty" pill (background danger-bg `#fbe3de`, radius 8, 82px wide): label "ORDER" (Roboto Medium 10, `#5b6476`) over value "24" (Roboto ExtraBold 22, `#1a2540`).
- Order row card "Walkers Ready Salted" (same style, danger border):
  - Copy: title "Walkers Ready Salted"; subtitle "Count 0 · Target 18"; badge "OUT OF STOCK" (danger).
  - Qty pill (danger-bg): "ORDER" / "18".
- Order row card "Sugar 1kg" (card `#fffdf8`, default border `#ddd3be`, no danger outline):
  - Copy: title "Sugar 1kg"; subtitle "Count 3 · Target 12"; badge "LOW" (Roboto Medium 10, warning `#e8842d`).
  - Qty pill (background info-bg `#e3e9f3`, not danger): "ORDER" / "9".
- Primary button (navy `#1a2540`, radius 12, height 50): text "Share Booker list" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to Suppliers list.
- Each order row → navigates to screen 35 "Edit reorder target" for that product.
- "Share Booker list" → navigates to/generates screen 38 "Reorder PDF preview" (or opens native share sheet) for this supplier's list.

## Empty/error/notice states
- Danger-outlined rows + red "OUT OF STOCK" badges indicate an error/critical state for two products.
- Warning "LOW" badge (orange) indicates a low-stock (non-critical) state for one product.
- Qty pill background color reflects severity: danger-bg (pink) for out-of-stock rows, info-bg (blue) for low-stock row.
