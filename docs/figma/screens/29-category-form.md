# 29 Category form (node 24:718)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Categories list, discarding unsaved changes)
- Title (center): "Category form" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/edit form screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Text input** "Category name": label "Category name" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, value "Drinks" (Medium 16/20, `#1a2540`).
- **Card** "Products" (info/notice): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 74px, gap 5px.
  - Title: "Products" — Bold 15/19, `#1a2540`.
  - Subtitle: "84 active products currently use this category" — Medium 12/16, `#5b6476`.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save category".
- **Secondary/outline button** (destructive-leaning action styled as outline): full-width 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text. Text: "Archive category".

## Interactive elements → inferred destinations
- Back arrow → Categories list (unsaved changes discarded).
- Category name input → text keyboard.
- "Products" card → tappable to preview/filter the product list by this category. (inferred)
- "Save category" button → persists the category name, returns to Categories list.
- "Archive category" button → confirmation dialog, then archives/removes the category (likely blocked or requires reassignment if products are still assigned, given the "84 active products" notice).

## Empty/error/notice states
- "Products" card acts as an inline notice warning how many products are tied to this category, relevant context before archiving. This screen doubles as both add and edit form; shown here pre-filled in edit mode for "Drinks".
