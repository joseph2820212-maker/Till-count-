# 14 Quick quantity (node 21:471)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Quick quantity" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Coca-Cola Original 500ml" — Bold 16/20, `#1a2540` (product name being entered).
- **Notice/info card** "Current entry": 358×70px, bg `#e3e9f3` (info-bg), border `#ddd3be`, radius 12, padding 14/12, gap 5.
  - Title: "Current entry" — Bold 15/19 `#1a2540`.
  - Label: "Quantity" — Medium 12/16 `#5b6476`.
- **Hero number display**: "36" — ExtraBold 28/34, centered, `#1a2540`, full width 358px (the value being typed on the keypad).
- **Numeric keypad** (4 rows × 3 keys, gap 8px, keys 114×54px each, radius 12px, bg `#fffdf8`, border `#ddd3be`, Bold 15/18 `#1a2540` labels except Done):
  - Row 1: "1", "2", "3"
  - Row 2: "4", "5", "6"
  - Row 3: "7", "8", "9"
  - Row 4: "Clear", "0", "Done" — "Done" key styled distinctly: bg `#1a2540` (navy), white Bold 15/18 text, same 114×54 sizing.

## Interactive elements → inferred destinations
- Digit keys (0–9) → append digit to the "Current entry" quantity value shown in the hero number display.
- "Clear" key → clears the current entry back to empty/0.
- "Done" key → confirms the entered quantity for "Coca-Cola Original 500ml" and returns to the calling screen (Scan & Count 17:270 or List count 21:414) with the quantity applied.
- Back chevron → cancels/returns without saving (inferred).

## Empty/error/notice states
- None; shows an in-progress numeric entry (value "36" already typed).
