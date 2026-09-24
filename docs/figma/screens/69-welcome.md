# 69 Welcome (node 29:1546)

## Header
- Title: "Welcome"
- Start slot: back arrow (24x24 white) — inferred: back navigation (may be disabled/hidden in real onboarding flow since this is likely the first screen)
- End slot: empty
- Header bg `#1a2540`, height 78px

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px, content centered horizontally, gap 12px.

- Hero/logo block (card, bg `#e3e9f3`, radius 16px, centered content, padding 20/28):
  - App name: "TillCount" — Roboto ExtraBold 28/34, `#1a2540`
  - Tagline: "Stocktake & Reorder" — Roboto Bold 16/20, `#1a2540`
  - Slogan (accent color): "Scan. Count. Reorder. Done." — Roboto Medium 14/18, `#e8842d` (`--tillcount-color-action-accent`, orange)
- Body paragraph (centered, Roboto Medium 14/18, `#5b6476`): "Fast offline stock counting for small shops. No EPOS connection required."
- Primary button: "Get started" (bg `#1a2540`, white text, 50px height, radius 12px, full width)
- Secondary button: "Try sample products" (bg `#fffdf8`, border `#ddd3be`, `#1a2540` text, 50px height, radius 12px)

## Interactive elements (inferred destinations)
- Back arrow → likely hidden/no-op on true first-run welcome; if present, would go to a splash/prior onboarding step
- "Get started" button → screen 70 How it works (next onboarding step)
- "Try sample products" button → seeds the app with sample product data and jumps into the main app (Products/Home), skipping manual list-building

## Empty/error/notice states
None shown.
