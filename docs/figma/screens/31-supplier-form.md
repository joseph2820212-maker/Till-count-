# 31 Supplier form (node 24:778)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white "Back" SVG) — tappable.
- Title (center): "Supplier form" — Roboto Bold 20/24, white (`#ffffff` via `--tillcount-color-text-on-navy`).
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None (form screen, no bottom nav visible in frame).

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Text input with label + value: label "Supplier name" (Roboto Medium 12, `#5b6476`), input box (card `#fffdf8`, border `#ddd3be`, radius 12) containing value "Booker" (Roboto Medium 16, `#1a2540`).
- Text input with label + value: label "Reference", input box containing placeholder/value text "Optional account/reference" (same styling as above).
- Info card "Products" (background `#e3e9f3` status-info-bg, border `#ddd3be`, radius 12):
  - Title: "Products" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "124 products linked to this supplier" — Roboto Medium 12, `#5b6476`.
- Primary button (full width, navy `#1a2540`, radius 12, height 50): text "Save supplier" — Roboto Bold 15, white.
- Secondary/outline button (card `#fffdf8`, border `#ddd3be`, radius 12, height 50): text "Archive supplier" — Roboto Bold 15, `#1a2540`.

## Interactive elements (inferred)
- Back arrow → returns to Suppliers list screen.
- "Supplier name" / "Reference" inputs → open keyboard for text editing.
- "Products" card → navigates to filtered product list scoped to this supplier (124 products).
- "Save supplier" → persists form and returns to Suppliers list.
- "Archive supplier" → triggers confirmation dialog, then archives/hides the supplier (danger-adjacent action, though styled as secondary here).

## Empty/error/notice states
- None shown on this screen (values are pre-filled example data, no error or empty state present).
