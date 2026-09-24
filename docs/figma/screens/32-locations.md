# 32 Locations (node 24:804)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Locations" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Locations" — Roboto Bold 16, `#1a2540`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "Front shop" (Roboto Bold 15, `#1a2540`), subtitle "213 products" (Roboto Medium 12, `#5b6476`), trailing chevron icon (20x20, gray).
- List row: title "Stockroom", subtitle "96 products", trailing chevron.
- List row: title "Fridge", subtitle "42 products", trailing chevron.
- List row: title "Freezer", subtitle "18 products", trailing chevron.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Add location" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to previous settings/more screen.
- Each list row → navigates to screen 33 "Location form" pre-filled with that location's data.
- "Add location" → navigates to screen 33 "Location form" in create mode (blank fields).

## Empty/error/notice states
- None shown; all four locations have populated product counts.
