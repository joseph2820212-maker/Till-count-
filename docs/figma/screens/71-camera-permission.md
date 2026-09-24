# 71 Camera permission (node 30:1473)

## Header
- Title: "Camera access"
- Start slot: back arrow (24x24 white) — inferred: back to How it works
- End slot: empty
- Header bg `#1a2540`, height 78px

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px (top 32px), items centered, gap 14px.

- Illustration/icon block: camera icon, 64x64, navy line-art style (`camera permission icon` SVG) — centered
- Heading (centered): "Scan barcodes with your camera" — Roboto Bold 16/20, `#1a2540`
- Body paragraph (centered, Roboto Medium 14/18, `#5b6476`): "TillCount uses camera access only when you open the barcode scanner. You can still type codes or use list mode without it."
- Notice/state card ("Your choice"), bg `#e3e9f3`, border `#ddd3be`, radius 16px, padding 18px, width slightly wider than body content (410px vs 358px elsewhere — appears to bleed slightly beyond the standard content width):
  - Title: "Your choice" (Roboto Bold 16/20, `#1a2540`)
  - Body: "Denying camera access does not block manual counting or product entry." (Roboto Medium 12/16, `#5b6476`)
- Primary button: "Allow camera" (bg `#1a2540`, white text, 50px height, radius 12px)
- Secondary button: "Type codes instead" (bg `#fffdf8`, border `#ddd3be`, `#1a2540` text, 50px height, radius 12px)

## Interactive elements (inferred destinations)
- Back arrow → How it works screen
- "Allow camera" button → triggers native OS camera-permission prompt; on grant, proceeds into the main app (e.g., Home/Products) with scanner enabled
- "Type codes instead" button → proceeds into the main app without requesting camera permission, defaulting to manual barcode entry / list mode

## Empty/error/notice states
- "Your choice" card acts as a reassurance/notice banner explaining that declining camera access is non-blocking — not an error state, but a permission-rationale notice.
