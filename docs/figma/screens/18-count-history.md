# 18 Count history (node 22:447)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white).
- Title (center): "Count history" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (this screen is reached from within a stack, not a top-level tab; no bottom nav bar shown).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Completed counts" — Roboto Bold 16/20, `#1a2540`.
- **List row** ×5, each: bg `#fffdf8`, border `#ddd3be`, radius 12px, height 68px, padding pl14/pr12/py12, gap 10px, chevron icon 20×20 on the right.
  - Title Bold 15/19 `#1a2540`, subtitle Medium 12/16 `#5b6476`:
    1. "Front shop · Today" / "421 products · 1,946 units"
    2. "Drinks · 17 Sep" / "84 products · 412 units"
    3. "Full shop · 10 Sep" / "632 products · 3,112 units"
    4. "Fridge · 9 Sep" / "42 products · 118 units"
    5. "Stockroom · 1 Sep" / "96 products · 804 units"

## Interactive elements → inferred destinations
- Back arrow → previous screen (likely More/settings menu).
- Each list row (tap) → History detail screen (node 22:489) for that specific completed count.

## Empty/error/notice states
- None shown; list is populated with 5 example completed counts. (inferred: an empty state, e.g. "No completed counts yet", would likely appear if no counts exist, but is not depicted here.)
