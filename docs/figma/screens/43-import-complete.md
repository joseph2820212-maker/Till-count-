# 43 Import complete (node 26:928)

## Header
- Screen Header / Back component, navy background `#1a2540`.
- Start slot: back-arrow chevron icon (24x24, white SVG) — tappable.
- Title (center): "Import complete" — Roboto Bold 20/24, white.
- End slot: empty (44x44 placeholder, no icon).
- No subtitle.

## Bottom navigation
- None.

## Body (top to bottom, stacked, 16px padding, 12px gap, background `#f7f3e8`)
- Section label: "Import complete" — Roboto Bold 16, `#1a2540`.
- Success/positive card (background `#ddede5` status-success-bg, border `#ddd3be`, radius 12):
  - Title: "118 products added" — Roboto Bold 15, `#1a2540`.
  - Subtitle: "8 rows were skipped because they still need attention." — Roboto Medium 12, `#5b6476`.
- List row (card `#fffdf8`, border `#ddd3be`, radius 12, height 68): title "View imported products" (Roboto Bold 15, `#1a2540`), subtitle "Open the product list" (Roboto Medium 12, `#5b6476`), trailing chevron.
- List row: title "Skipped rows", subtitle "Review 8 rows", trailing chevron.
- Primary button (navy `#1a2540`, radius 12, height 50): text "Done" — Roboto Bold 15, white.

## Interactive elements (inferred)
- Back arrow → returns to screen 42 "Import review" (though the import has already committed, so this is likely disabled or redirects to Done).
- "View imported products" row → navigates to the product list, filtered/scrolled to newly imported items.
- "Skipped rows" row → navigates back into a filtered view of the 8 rows still needing attention (similar to screen 42 filtered by "need attention").
- "Done" → dismisses the import flow and returns to the previous top-level screen (e.g. Import Centre or Products).

## Empty/error/notice states
- Success banner communicates partial success (118 succeeded) alongside a soft warning that 8 rows were skipped — a combined success/attention-needed notice rather than a pure success or pure error state.
