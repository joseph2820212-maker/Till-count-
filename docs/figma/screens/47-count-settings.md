# 47 Count settings (node 26:1100)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, 24x24, white — inferred: navigates back to More (screen 46)
- Title (center): "Count settings" — Roboto Bold 20/24, white, centered
- End slot: empty (44x44, no icon)
- Header bg: #1a2540, height 78px

## Bottom navigation
- None (this is a settings sub-screen pushed above the tab bar)

## Body (stack, 16px padding, 12px gap)
- Toggle row (card, bg #fffdf8, border 1px #ddd3be, radius 12px, height 72px, title bold 15px #1a2540 + subtitle medium 12px #5b6476 + switch control right-aligned, 46x26):
  - "Blind count" / "Hide the previous quantity until entry" — switch **ON** (thumb right, track dark navy)
  - "Repeated scan +1" / "Each repeated scan increases quantity by one" — switch **ON**
  - "Case + loose" / "Show case/pack and loose quantity entry" — switch **ON**
  - "Haptic scan feedback" / "One short vibration after a barcode read" — switch **ON**
- Section label (small, medium 12px, #5b6476): "Default count mode"
- Text input field (card, bg #fffdf8, border 1px #ddd3be, radius 12px, height 50px): value "Scan" (medium 16px, #1a2540) — inferred: tappable, opens a picker/dropdown for count mode (e.g., Scan / Manual)
- Primary button (bg #1a2540, radius 12px, height 50px, full width): "Save settings" (bold 15px, white) — inferred: saves settings and navigates back to screen 46

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, text primary #1a2540, text secondary #5b6476, button bg #1a2540, button text white

## Empty/error/notice states
None shown. All four toggles default to ON in the design.
