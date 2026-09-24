# 04 Scan & Count (node 17:270)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron (24×24, white) — back arrow present.
- Title: "Front shop count" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Progress block**:
  - Text row: "147 of 213 counted" (left) ... "69%" (right) — Medium 12/16, `#5b6476`, single text node spanning 358px width.
  - Progress bar: track 358×5px bg `#f0ede4` radius full; fill 247px bg `#e8842d` radius full.
- **Camera viewport / Scanner card**: 358×226px, bg `#e3e9f3` (status-info-bg), border 1px `#1a2540`, radius 16px, centered content, gap 10px.
  - Scanner icon (44×44, barcode/viewfinder glyph).
  - Text: "Scan the next barcode" — Bold 16/20, `#1a2540`.
  - Text: "Hold the code inside the frame · torch available" — Medium 12/16, `#5b6476`.
  - Viewfinder frame: 244×66px, border 2px `#e8842d`, radius 12px (empty box, camera crosshair target). (torch control implied by copy, not a distinct visible icon element in this node)
- **Product Count Row** card: 358×88px, bg `#fffdf8`, border `#ddd3be`, radius 12px, padding 12px, gap 8px, row layout.
  - Product copy (184px): name "Coca-Cola Original 500ml" — Bold 15/19 `#1a2540`; meta "5000112637922 · Each" — Medium 12/16 `#5b6476`.
  - Stepper control "−": 44×44 square, bg `#f0ede4`, radius 8px, centered "−" Bold 15.
  - Quantity display: "12" — ExtraBold 22/27 `#1a2540`, centered in 50×44 box.
  - Stepper control "+": 44×44 square, bg `#f0ede4`, radius 8px, centered "+" Bold 15.
- **Card** "Case loose": bg `#fffdf8`, border `#ddd3be`, radius 12px, height 64px, shadow.
  - Title: "2 cases × 24 + 7 loose" — Bold 15/19 `#1a2540`.
  - Subtitle: "55 units total" — Medium 12/16 `#5b6476`.
- **Secondary button**: 358×50px, bg `#fffdf8`, border 1px `#ddd3be`, radius 12px, text "Type code instead" — Bold 15/18 `#1a2540`.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, text "Finish count" — Bold 15/18 white.

## Interactive elements → inferred destinations
- Scanner viewport → activates camera scanning; a successful scan populates/updates the Product Count Row below (inferred).
- Torch mention ("torch available") → likely a tappable torch icon overlay on the camera view in the live app (not rendered as separate element in this static export).
- "−" / "+" steppers → decrement/increment quantity for the currently scanned product.
- "Case loose" card → opens a case/loose quantity entry modal (inferred; matches Quick quantity screen 21:471 pattern).
- "Type code instead" → opens manual barcode entry (Unknown barcode screen 22:370, or a text-entry variant).
- "Finish count" → navigates to Review screen (17:308).
- Back chevron → returns to prior scope-selection screen.

## Empty/error/notice states
- None explicit; this shows the in-progress scanning state with an already-counted product row.
