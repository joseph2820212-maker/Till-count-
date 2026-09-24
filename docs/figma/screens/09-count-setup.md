# 09 Count setup (node 21:251)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Count setup" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "How do you want to count?" — Bold 16/20, `#1a2540`.
- **Selectable card** "Scan mode" (appears selected/highlighted): 358×70px, bg `#e3e9f3` (info-bg, used here as the selected-state fill), border `#ddd3be`, radius 12, padding 14/12, gap 5.
  - Title: "Scan mode" — Bold 15/19 `#1a2540`.
  - Body: "Camera stays open. Repeated scans add one." — Medium 12/16 `#5b6476`.
- **Selectable card** "List mode" (unselected): 358×70px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding 14/12, gap 5.
  - Title: "List mode" — Bold 15/19 `#1a2540`.
  - Body: "Move through products in a list and type quantities." — Medium 12/16 `#5b6476`.
- **Toggle row** "Blind count": 358×72px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding pl14/pr12/py12, gap 10.
  - Title: "Blind count" — Bold 15/19 `#1a2540`.
  - Subtitle: "Hide the previous quantity until the count is entered" — Medium 12/16 `#5b6476`.
  - Switch control: 46×26px, ON state (navy track, white knob right-aligned).
- **Toggle row** "Case + loose": same styling, ON state.
  - Title: "Case + loose" — Bold 15/19 `#1a2540`.
  - Subtitle: "Allow cases/packs plus loose units on the same product" — Medium 12/16 `#5b6476`.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Continue".

## Interactive elements → inferred destinations
- "Scan mode" / "List mode" cards → single-select count method; selecting toggles the highlighted state.
- "Blind count" toggle → on/off switch controlling whether previous quantity is shown while counting.
- "Case + loose" toggle → on/off switch enabling case+loose unit entry (feeds the "2 cases × 24 + 7 loose" pattern seen on Scan & Count, 17:270).
- "Continue" → proceeds to Scan & Count (17:270) with chosen settings applied.
- Back chevron → returns to Start Count / Choose Scope flow.

## Empty/error/notice states
- None; both toggles default to ON, "Scan mode" pre-selected.
