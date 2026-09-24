# 17 Count paused (node 22:425)

## Header — `Screen Header / Back` (node 17:21)
- Background: `#1a2540` (navy). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: 44×44, back arrow icon (24×24, white). (inferred → navigates back to the previous count screen, resuming without an explicit action)
- Title (center): "Count paused" — Roboto Bold 20/24, white.
- End slot: empty 44×44 (no icon).

## Bottom navigation
- None (modal/stack screen, no bottom nav bar).

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Section label**: "Count paused" — Roboto Bold 16/20, `#1a2540`.
- **Card** "Front shop": bg `#e3e9f3` (status-info-bg), border `#ddd3be`, radius 12px, padding 14/12, height 76px, gap 5px.
  - Title: "Front shop" — Bold 15/19, `#1a2540`.
  - Subtitle: "147 of 213 counted · 69% complete" — Medium 12/16, `#5b6476`.
- **Body text** (notice, not in a card): "Your progress is saved on this phone. You can close TillCount and resume later." — Roboto Medium 14/18, `#5b6476`, width 358px.
- **Primary button**: full-width 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text. Text: "Resume count". (inferred → returns to the active scan-and-count flow for "Front shop")
- **Secondary/outline button**: full-width 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text. Text: "Review progress". (inferred → opens a summary/review screen of counted items so far)
- **Secondary/outline button** (same styling): Text: "Discard count". (inferred → prompts a confirm dialog and, if confirmed, deletes the in-progress count)

## Interactive elements → inferred destinations
- Back arrow → previous screen.
- Front shop progress card → likely non-interactive (informational), or could also resume the count.
- Resume count → returns to active count (scan & count) screen.
- Review progress → progress review/summary screen.
- Discard count → confirmation dialog, then deletes the paused count and returns to Home/Count tab.

## Empty/error/notice states
- Informational notice text about local save/resume behavior is shown as plain body copy (not a distinct banner component).
