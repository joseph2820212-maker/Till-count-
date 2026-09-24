# 13 List count (node 21:414)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "List count" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Front shop · list mode" — Bold 16/20, `#1a2540`.
- **Subtitle**: "147 of 213 counted" — Medium 12/16, `#5b6476`.
- **Product Count Row list** (same component as Scan & Count), each 358×88px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding 12, gap 8, row layout (copy 184px + "−" stepper 44×44 + quantity display 50×44 + "+" stepper 44×44):
  1. Name "Coca-Cola Original 500ml" (Bold 15/19 `#1a2540`), meta "5000112637922 · Each" (Medium 12/16 `#5b6476`); quantity **12** (ExtraBold 22/27 `#1a2540`); steppers "−"/"+" on `#f0ede4` bg, radius 8.
  2. Name "Pepsi Max 500ml", meta "5000100000011 · Each"; quantity **8**.
  3. Name "Fanta Orange 500ml", meta "5000112000032 · Each"; quantity **4**.
  4. Name "Walkers Ready Salted", meta "SKU CR-004 · Pack"; quantity **6**.
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text: "Pause count".
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Review count".

## Interactive elements → inferred destinations
- Each "−"/"+" stepper → decrements/increments that product's counted quantity directly in the list (no scanning required — this is the "List mode" counting flow set up in Count setup, 21:251).
- Product rows likely scroll as a full list of the scope's ~213 products (only 4 shown here as a sample/viewport).
- "Pause count" → suspends the count, returning to Count tab (21:187) with it marked Active/resumable.
- "Review count" → proceeds to Review screen (17:308).
- Back chevron → returns to prior screen (Count setup or Count tab).

## Empty/error/notice states
- None; shows a normally populated in-progress list-mode count.
