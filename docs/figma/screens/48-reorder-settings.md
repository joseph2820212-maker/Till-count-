# 48 Reorder settings (node 26:1141)

## Header
- Component: Screen Header / Back (navy bar)
- Start slot: Back chevron "<" icon, white — inferred: back to More (screen 46)
- Title: "Reorder settings" — Roboto Bold 20/24, white, centered
- End slot: empty
- Header bg #1a2540, height 78px

## Bottom navigation
- None

## Body (stack, 16px padding, 12px gap)
- Toggle row (card 72px tall, same style as screen 47):
  - "Show reorder suggestions" / "Calculate target minus counted quantity" — switch **ON**
  - "Group by supplier" / "Default reorder view" — switch **ON**
- Section label: "Products without target" (medium 12px, #5b6476)
- Text input field (card, 50px): value "Show as needs setup" (medium 16px, #1a2540) — inferred: tappable, opens a picker for how untargeted products are handled
- Notice card "No forecasting" (bg #e3e9f3 info-bg, border #ddd3be, radius 12px, h 82px):
  - Title: "No forecasting" (bold 15px, #1a2540)
  - Body: "TillCount does not predict demand or future sales." (medium 12px, #5b6476)
- Primary button (bg #1a2540, h 50px, radius 12px): "Save settings" (bold 15px, white) — inferred: saves and returns to screen 46

## Colors
- App bg #f7f3e8, card #fffdf8, border #ddd3be, info notice bg #e3e9f3, text primary #1a2540, text secondary #5b6476

## Empty/error/notice states
- Informational (non-error) notice: "No forecasting — TillCount does not predict demand or future sales." (blue/info style, not a warning)
