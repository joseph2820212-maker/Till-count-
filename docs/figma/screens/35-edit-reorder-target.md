# 35 Edit reorder target (node 24:908)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Edit reorder target" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Semi-skimmed milk 2L" (product name) — Roboto Bold 16, `#1a2540`.
- Info card "Last counted" (background `#e3e9f3`, border `#ddd3be`, radius 12):
  - Title: "Last counted" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "2 units · today 10:42" — Roboto Medium 12, `#5b6476`.
- Text input with label + value: label "Low-stock level" (Roboto Medium 12, `#5b6476`), input box (card `#fffdf8`, border `#ddd3be`, radius 12) value "4" (Roboto Medium 16, `#1a2540`).
- Text input with label + value: label "Target stock", input box value "10" (same styling).
- Success/positive card "Suggested order" (background `#ddede5` status-success-bg, border `#ddd3be`, radius 12):
  - Title: "Suggested order" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "8 units" — Roboto Medium 12, `#5b6476`.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Save reorder levels" — Roboto Bold 15, white.
- Secondary/outline button (card `#fffdf8`, border `#ddd3be`, radius 12, height 50): text "Remove from reorder alerts" — Roboto Bold 15, `#1a2540`.

## Interactive elements (inferred)
- Back arrow → returns to screen 34 "Supplier reorder" without saving.
- "Low-stock level" / "Target stock" inputs → numeric keyboard editing; changing "Target stock" likely recalculates "Suggested order" (Target − Last counted = Suggested, 10 − 2 = 8, matches shown value).
- "Save reorder levels" → persists thresholds and returns to previous screen.
- "Remove from reorder alerts" → confirmation, then excludes this product from reorder tracking entirely.

## Empty/error/notice states
- None; all fields pre-filled with example values, no error state shown.
