# 24 Add product (node 23:631)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Products list, discarding unsaved input)
- Title (center): "Add product" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/form screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Text input** "Product name": label "Product name" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px; value empty (placeholder state, no text shown).
- **Text input** "Barcode": label "Barcode", placeholder/value "Scan or type" — Medium 16/20, `#1a2540`.
- **Text input** "Category": label "Category", placeholder/value "Choose category".
- **Text input** "Supplier": label "Supplier", placeholder/value "Optional".
- **Text input** "Location": label "Location", value "Front shop" (pre-filled default).
- **Text input** "Count unit": label "Count unit", value "Each" (pre-filled default).
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save product". (inferred → creates the product and returns to Products list or Product detail)

## Interactive elements → inferred destinations
- Back arrow → Products list.
- Product name input → text keyboard.
- Barcode input → tapping likely launches the camera/scanner (per "Scan or type" placeholder) or accepts manual typed entry.
- Category input → category picker (Categories list, node 23:769).
- Supplier input → supplier picker (Suppliers list, node 24:740).
- Location input → location picker.
- Count unit input → unit picker (Each, Case, Kg, etc.).
- "Save product" button → saves new product, navigates to Product detail or back to Products list.

## Empty/error/notice states
- Blank/placeholder-style state: "Product name" field is empty; other fields show placeholder guidance text ("Scan or type", "Choose category", "Optional") rather than actual data, since this is a fresh entry form.
