# 15 Unknown barcode (node 22:370)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Unknown barcode" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Barcode not found" — Bold 16/20, `#1a2540`.
- **Notice/info card**: 358×76px, bg `#e3e9f3` (info-bg), border `#ddd3be`, radius 12, padding 14/12, gap 5.
  - Title (barcode value): "5000112999999" — Bold 15/19 `#1a2540`.
  - Body: "This barcode is not in your product list." — Medium 12/16 `#5b6476`.
- **Body text**: "You can add the product now without leaving this count." — Medium 14/18, `#5b6476`, width 358px.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Add it".
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text: "Scan another".
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text: "Type a code".

## Interactive elements → inferred destinations
- "Add it" → opens a quick-add-product form (name, category, price, etc.) pre-filled with the scanned barcode "5000112999999", then returns to the count in progress.
- "Scan another" → dismisses this screen and returns to the camera scanner (Scan & Count, 17:270) to try a different barcode.
- "Type a code" → opens manual barcode/text entry (likely the same flow reached from "Type code instead" on Scan & Count).
- Back chevron → returns to Scan & Count without adding the product.

## Empty/error/notice states
- This entire screen IS the error/notice state: it represents an unrecognized-barcode error surfaced during scanning, with recovery actions (add product, rescan, manual entry) rather than a dead end.
