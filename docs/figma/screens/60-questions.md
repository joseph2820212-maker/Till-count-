# 60 Questions (node 28:1382)

## Header
- Title: "Questions"
- Start slot: back arrow (24x24, white) — inferred: navigates back to Help
- End slot: empty (44x44 reserved)
- No subtitle
- Header bg `#1a2540`, height 78px, title Roboto Bold 20/24 white

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px, gap 12px.

- Section label: "Common questions" — Roboto Bold 16/20, `#1a2540`
- FAQ card (highlighted/first card, bg `#e3e9f3` `--tillcount-color-status-info-bg`, border `#ddd3be`, radius 12px, padding 14/12):
  - Q: "Does TillCount need internet?" (Roboto Bold 15/19, `#1a2540`)
  - A: "No. Counting and saved operational data work locally on the device." (Roboto Medium 12/16, `#5b6476`)
- FAQ card (standard bg `#fffdf8`):
  - Q: "Is the quantity always live stock?"
  - A: "No. It is the last counted quantity unless you complete another count."
- FAQ card:
  - Q: "What happens to skipped products?"
  - A: "Their previous quantity remains unchanged; they are never silently set to zero."
- FAQ card:
  - Q: "Can I count without a barcode?"
  - A: "Yes. Manual products can be counted by list or search."
- FAQ card:
  - Q: "Can I use cases and loose units?"
  - A: "Yes, when a product has pack/case quantity configured."

Note: the first FAQ card uses the info-blue background (`#e3e9f3`) while the rest use the plain card background (`#fffdf8`) — this may be a highlight/featured-question treatment or simply the first item's visual state in this mock; treat as a highlighted-Q&A card type distinct from the plain FAQ cards below it.

## Interactive elements (inferred)
- Back arrow → Help screen
- Cards are static informational content (not shown as tappable/chevron rows), likely non-interactive text blocks

## Empty/error/notice states
None shown.
