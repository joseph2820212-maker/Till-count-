# 07 Reorder (node 17:386)

## Header — `Screen Header / Main`
- Bg `#1a2540`, height 78px. Start slot: empty 44×44 (no back arrow — tab root screen).
- Title: "Reorder" — Bold 20/24, white.
- End slot: 44×44, Overflow (⋯) icon, white, 24×24.

## Bottom navigation
- 5-tab bar, active tab **Reorder** (white label + icon, orange 3px pill indicator); others (Home, Count, Products, More) inactive (`#c7cfde`).

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Notice/summary card**: 358×66px, bg `#e3e9f3` (info), border `#ddd3be`, radius 12, shadow.
  - Title: "25 items need attention" — Bold 15/19 `#1a2540`.
  - Body: "7 out of stock · 18 low stock" — Medium 12/16 `#5b6476`.
- **Filter chips row** (segmented pill filters), gap 8, height 44px each:
  - "All 25" — active/selected chip: bg `#1a2540`, radius full, white Medium 12/16 text, width 72px.
  - "Booker 14" — inactive chip: bg `#fffdf8`, border `#ddd3be`, radius full, `#1a2540` text, width 90px.
  - "Bestway 7" — inactive chip: same style, width 90px.
- **Section label**: "OUT OF STOCK" — ExtraBold 12/16, letter-spacing 0.5, `#5b6476`.
- **List rows (danger/order cards)**, each 358×80px, bg `#fffdf8`, border 1px `#b14d38` (danger), radius 12px, padding pl12/pr10/py10, gap 10, row layout (copy 244px + order-qty box 82×56):
  1. "Coca-Cola Zero 500ml" (Bold 15/19 `#1a2540`), meta "Count 0 · Target 24" (Medium 12/16 `#5b6476`), status badge "OUT OF STOCK" (Medium 10/13, `#b14d38`). Order box: bg `#fbe3de` (danger-bg), radius 8, label "ORDER" (Medium 10/13 `#5b6476`) over value "24" (ExtraBold 22/27 `#1a2540`).
  2. "Walkers Ready Salted", meta "Count 0 · Target 18", badge "OUT OF STOCK", order value "18" (same danger-bg order box).
- **Section label**: "LOW" — ExtraBold 12/16, letter-spacing 0.5, `#5b6476`.
- **List rows (default/order cards)**, 358×80px, bg `#fffdf8`, border `#ddd3be` (default, not danger), same layout:
  1. "Semi-skimmed milk 2L", meta "Count 2 · Target 10", status badge "LOW" (Medium 10/13, `#e8842d` warning color). Order box: bg `#e3e9f3` (info-bg), radius 8, "ORDER" label, value "8".
  2. "Granulated sugar 1kg", meta "Count 3 · Target 12", badge "LOW", order box value "9".
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Share reorder list".

## Interactive elements → inferred destinations
- Filter chips (All 25 / Booker 14 / Bestway 7) → filter the reorder list by supplier (single-select segmented control).
- Order item rows → tap opens item detail / lets the user edit order quantity (inferred).
- "Share reorder list" → opens a share/export sheet for the supplier order (e.g. to send to Booker/Bestway).
- Overflow menu → additional reorder actions (settings, export options).
- Bottom nav tabs → navigate to Home, Count, Products, More.

## Empty/error/notice states
- Danger-bordered rows for out-of-stock items visually flag urgency (red border/badge/order-box).
- No explicit empty-list state shown (list is fully populated).
