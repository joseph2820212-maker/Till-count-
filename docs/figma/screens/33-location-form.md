# 33 Location form (node 24:842)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Location form" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Text input with label + value: label "Location name" (Roboto Medium 12, `#5b6476`), input box (card `#fffdf8`, border `#ddd3be`, radius 12) with value "Front shop" (Roboto Medium 16, `#1a2540`).
- Info card "Products" (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "Products" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "213 products are assigned here" — Roboto Medium 12, `#5b6476`.
- Notice card "Counting note" (card `#fffdf8`, border `#ddd3be`, radius 12):
  - Title: "Counting note" — Roboto Bold 15, `#1a2540`.
  - Body: "A product may be moved to another location without changing its history." — Roboto Medium 12, `#5b6476`.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Save location" — Roboto Bold 15, white.
- Secondary/outline button (card `#fffdf8`, border `#ddd3be`, radius 12, height 50): text "Archive location" — Roboto Bold 15, `#1a2540`.

## Interactive elements (inferred)
- Back arrow → returns to Locations list (screen 32) without saving.
- "Location name" input → opens keyboard for text editing.
- "Products" card → navigates to filtered product list scoped to this location.
- "Save location" → persists name and returns to Locations list.
- "Archive location" → confirmation dialog then archives the location.

## Empty/error/notice states
- "Counting note" card is itself an informational/notice banner explaining that moving a product between locations preserves count history.
