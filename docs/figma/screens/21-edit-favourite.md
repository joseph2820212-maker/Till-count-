# 21 Edit favourite (node 22:572)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → back to Favourite counts, discarding unsaved changes)
- Title (center): "Edit favourite" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (stack/edit screen).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Favourite count" — Roboto Bold 16/20, `#1a2540`.
- **Text input** "Name": label "Name" (Medium 12/16 `#5b6476`), input box 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, value "Weekly cigarettes" (Medium 16/20, `#1a2540`).
- **Text input** "Scope": label "Scope", value "Category". (inferred picker: Category / Location / Everything)
- **Text input** "Category": label "Category", value "Tobacco". (inferred picker, shown conditionally when Scope = Category)
- **Text input** "Count mode": label "Count mode", value "Scan". (inferred picker: Scan / Manual entry, etc.)
- **Card** "Products included" (info): bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 76px, gap 5px.
  - Title: "Products included" — Bold 15/19, `#1a2540`.
  - Subtitle: "42 active products" — Medium 12/16, `#5b6476`.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Save favourite".
- **Secondary/outline button** (danger-leaning action styled as outline): full-width 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text. Text: "Delete favourite".

## Interactive elements → inferred destinations
- Back arrow → Favourite counts list (unsaved changes discarded).
- Name input → text keyboard edit.
- Scope / Category / Count mode inputs → open picker/selection screens or bottom sheets.
- "Products included" card → tappable to preview the resolved product list. (inferred)
- Save favourite → persists changes, returns to Favourite counts list.
- Delete favourite → confirmation dialog, then removes the favourite and returns to the list.

## Empty/error/notice states
- None shown; form pre-filled with an existing favourite's data (edit mode).
