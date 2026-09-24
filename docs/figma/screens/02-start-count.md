# 02 Start Count (node 17:184)

## Header — `Screen Header / Back` (node 17:21)
- Background `#1a2540`, height 78px, pt20/pb14/px14.
- Start slot: 44×44 **Back** chevron icon (‹), white, 24×24 — back arrow present.
- Title (center): "Start count" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (this is a pushed/back-stack screen, not a tab root).

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "What are you counting?" — Bold 16/20, `#1a2540`.
- **Helper text**: "Choose the scope first. You can narrow it on the next screen." — Medium 12/16, `#5b6476`, width 358px.
- **Radio row list** ("Scope Row"), each 358×72px, radius 12px, padding 16/12, gap 12px between text block and radio control:
  1. **Selected** ("Scope Row / Selected"): bg `#fffdf8`, border 2px `#1a2540` (highlighted/selected state), title "Everything" (Bold 15/19 `#1a2540`), subtitle "Count every active product" (Medium 12/16 `#5b6476`), radio control on right = filled navy circle with orange center dot (selected radio, 22×22).
  2. **Default**: bg `#fffdf8`, border 1px `#ddd3be`, title "Category" / subtitle "Drinks, grocery, tobacco…", radio = empty outline circle (22×22, unselected).
  3. **Default**: title "Supplier" / subtitle "Count products from one supplier", unselected radio.
  4. **Default**: title "Location" / subtitle "Front shop, stockroom, fridge…", unselected radio.
  5. **Default**: title "Selected products" / subtitle "Pick only the products you want", unselected radio.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Continue".

## Interactive elements → inferred destinations
- Radio rows (Everything / Category / Supplier / Location / Selected products) → single-select scope chooser; selecting one updates the selected state (inferred client-side state).
- "Category" row → Choose category screen (21:283).
- "Supplier" row → Choose supplier screen (21:327).
- "Location" row → Choose Scope screen (17:230, "Choose location").
- "Selected products" row → Select products screen (21:371).
- "Continue" button → proceeds to Scan & Count (17:270) using the chosen scope (or to a scope-specific sub-screen first, per row above).
- Back chevron → returns to Home (17:112).

## Empty/error/notice states
- None; default state has "Everything" pre-selected.
