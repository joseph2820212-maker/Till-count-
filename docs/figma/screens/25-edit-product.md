# 25 Edit product (node 23:668)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Product detail, discarding unsaved changes)
- Title (center): "Edit product" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/edit form screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Text input** "Product name": label "Product name" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, value "Coca-Cola Original 500ml" (Medium 16/20, `#1a2540`).
- **Text input** "SKU": label "SKU", value "COKE500".
- **Text input** "Category": label "Category", value "Drinks".
- **Text input** "Supplier": label "Supplier", value "Booker".
- **Text input** "Reorder level": label "Reorder level", value "6".
- **Text input** "Target stock": label "Target stock", value "24".
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save changes".

## Interactive elements → inferred destinations
- Back arrow → Product detail screen (unsaved changes discarded).
- Product name / SKU inputs → text keyboard.
- Category input → category picker.
- Supplier input → supplier picker.
- Reorder level / Target stock inputs → numeric keyboard.
- "Save changes" button → persists edits, returns to Product detail screen (node 23:578).

## Empty/error/notice states
- None shown; form pre-filled with the existing product's data (edit mode).
