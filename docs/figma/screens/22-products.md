# 22 Products (node 23:507)

## Header — `Screen Header / Main` (node 17:12)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: empty 44×44 (no back arrow — top-level tab screen).
- Title (center): "Products" — Roboto Bold 20/24, white.
- End slot: 44×44, icon = "Overflow" (three-dot / kebab menu), 24×24, white.

## Bottom navigation
- `Bottom Navigation / Products` bar, bg `#1a2540`, height 72px, 5 tabs (78px wide each), icon 20×20 + label (Roboto Medium 10/13) + 3px pill indicator (28px, radius full).
- Tabs: Home (inactive, `#c7cfde`), Count (inactive), **Products** (active — icon/label white, indicator pill `#e8842d`), Reorder (inactive), More (inactive).
- Active tab: **Products**.

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Search field**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, gap 8px, padding 14px horizontal. Search glyph (⌕) `#8a8e9f` + placeholder text "Search products, barcode or SKU" — Medium 16/20, `#5b6476`.
- **Card** "632 products" (info, summary): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 64px, gap 5px.
  - Title: "632 products" — Bold 15/19, `#1a2540`.
  - Subtitle: "5 categories · 4 suppliers" — Medium 12/16, `#5b6476`.
- **List row** ×4 (products), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Coca-Cola Original 500ml" / "Drinks · £1.49 · 14 counted"
  - "Pepsi Max 500ml" / "Drinks · £1.39 · 8 counted"
  - "Semi-skimmed milk 2L" / "Chilled · £1.85 · 3 counted"
  - "Walkers Cheese & Onion" / "Snacks · £1.25 · 6 counted"
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Add product". (inferred → Add product screen, node 23:631)

## Interactive elements → inferred destinations
- Overflow (⋯) icon → overflow menu (e.g. sort, import/export, manage categories/suppliers).
- Search field → filters the product list live; tapping likely opens a barcode/SKU-aware search.
- "632 products" summary card → tappable to open Categories or Suppliers list. (inferred)
- Product list rows → Product detail screen (node 23:578) for that product.
- "Add product" button → Add product screen (node 23:631).
- Bottom nav tabs → Home, Count, Reorder, More sections.

## Empty/error/notice states
- None shown; list populated with 4 example products (of 632 total, scrollable).
