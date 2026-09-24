# 19 History detail (node 22:489)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Count history list)
- Title (center): "History detail" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (detail/stack screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Front shop · 24 Sep" — Roboto Bold 16/20, `#1a2540`.
- **Stats row** (2 metric cards side by side, gap 16px):
  - Metric card "Products": 171×82px, bg `#fffdf8`, border `#ddd3be`, radius 12px, padding 14/12, gap 4px. Label "Products" Medium 12/16 `#5b6476`; value "421" ExtraBold 22/27 `#1a2540`.
  - Metric card "Units": same styling. Label "Units"; value "1,946".
- **Card** "Attention at completion": bg `#fffdf8`, border `#ddd3be`, radius 12px, padding 14/12, height 76px, gap 5px.
  - Title: "Attention at completion" — Bold 15/19, `#1a2540`.
  - Subtitle: "7 out of stock · 18 low stock" — Medium 12/16, `#5b6476`.
- **Card** "Stock cost value" (info/highlighted): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 76px, gap 5px.
  - Title: "Stock cost value" — Bold 15/19, `#1a2540`.
  - Subtitle: "£4,716.28 · based on entered costs" — Medium 12/16, `#5b6476`.
- **List row** ×3 (products counted in this session), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12px, chevron 20×20:
  - "Coca-Cola Original 500ml" / "14 units"
  - "Milk 2L" / "3 units"
  - "Walkers Cheese & Onion" / "6 units"
- **Secondary/outline button**: full-width 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text. Text: "Share report". (inferred → opens native share sheet / exports report as PDF or CSV)

## Interactive elements → inferred destinations
- Back arrow → Count history list.
- "Attention at completion" card → filtered list of out-of-stock/low-stock items from this count. (inferred)
- Product list rows → individual product detail for that count entry. (inferred)
- Share report → native OS share sheet with a report file/summary.

## Empty/error/notice states
- None shown; all sections populated with example data.
