# 05 Review (node 17:308)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Review count" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Before you finish" — Bold 16/20, `#1a2540`.
- **Banner/notice (danger/warning)**: 358×78px, bg `#fbe3de` (status-danger-bg), border 1px `#b14d38` (status-danger), radius 12px, shadow, padding 14/12, gap 5.
  - Title: "6 products not counted" — Bold 15/19 `#1a2540`.
  - Body: "Review them now. Skipped items keep their previous quantity." — Medium 12/16 `#5b6476`.
- **List rows — "Missing" items** (3 shown), each: bg `#fffdf8`, border `#ddd3be`, radius 12px, height 76px, padding pl14/pr10/py12, gap 10, row layout with copy block (245px) + action button (75×44).
  1. Name "Pepsi Max 500ml" (Bold 15/19 `#1a2540`), meta "Previous 8 · not counted" (Medium 12/16 `#5b6476`); button "Count" (navy `#1a2540` bg, radius 8, white Bold 15/18 text).
  2. Name "Semi-skimmed milk 2L", meta "Previous 4 · not counted"; button "Count".
  3. Name "Walkers Cheese & Onion", meta "Previous 6 · not counted"; button "Count".
- **Banner/notice (info)**: 358×70px, bg `#e3e9f3` (status-info-bg), border 1px `#ddd3be`, radius 12px, shadow, padding 14/12, gap 5.
  - Title: "What happens to skipped items?" — Bold 15/19 `#1a2540`.
  - Body: "Their old count remains unchanged. Nothing is silently set to zero." — Medium 12/16 `#5b6476`.
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, text "Back to count" — Bold 15/18 `#1a2540`.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, text "Finish count" — Bold 15/18 white.

## Interactive elements → inferred destinations
- Each "Count" button → jumps back into Scan & Count (17:270) or a quick-count modal pre-focused on that specific product (inferred).
- "Back to count" → returns to Scan & Count screen to keep scanning.
- "Finish count" → proceeds to Results screen (17:348), finalizing the count with skipped items keeping prior quantities.
- Back chevron → returns to Scan & Count screen.

## Empty/error/notice states
- Danger banner: "6 products not counted" — warns of incomplete count before finishing.
- Info banner: explains skip behavior (not an error, a clarifying notice).
- This entire screen functionally IS a pre-completion warning/review state.
