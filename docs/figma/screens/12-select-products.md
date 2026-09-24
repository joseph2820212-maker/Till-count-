# 12 Select products (node 21:371)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Select products" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Selected products" — Bold 16/20, `#1a2540`.
- **Helper text**: "Search or tick the products for this count." — Medium 12/16, `#5b6476` (implies a search field exists elsewhere/above the list in the live app, though no distinct search input element is present in this exported node).
- **Checkbox row list**, each 358×64px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding 12/10, gap 10, row layout (copy 292px + checkbox 24×24):
  1. **Checked**: name "Coca-Cola Original 500ml" (Bold 15/19 `#1a2540`), meta "Drinks · Front shop" (Medium 12/16 `#5b6476`); checkbox = filled navy square (`#1a2540` bg + border), radius 8, white "✓" mark.
  2. **Checked**: name "Pepsi Max 500ml", meta "Drinks · Front shop"; checkbox filled/checked.
  3. **Unchecked**: name "Milk 2L", meta "Chilled · Fridge"; checkbox = empty outline square, border `#ddd3be`, radius 8.
  4. **Checked**: name "Walkers Cheese & Onion", meta "Snacks · Front shop"; checkbox filled/checked.
  5. **Unchecked**: name "Sugar 1kg", meta "Grocery · Stockroom"; checkbox empty outline.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Count 3 products" (dynamic count of checked items).

## Interactive elements → inferred destinations
- Each row / checkbox → toggles that product's inclusion in the custom count selection (multi-select).
- Helper text implies a search affordance to filter the product list (search field not visually present as separate element in this exported frame — likely scrolls above or is a modal/sticky search bar in the live implementation).
- "Count N products" button → proceeds to Scan & Count (17:270) or Count setup (21:251) scoped to only the checked products; button label updates dynamically with selection count.
- Back chevron → returns to Start Count screen (17:184).

## Empty/error/notice states
- None explicit; if zero products are selected, the primary button label/count would presumably read "Count 0 products" (inferred edge case, not shown).
