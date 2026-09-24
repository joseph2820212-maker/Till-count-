# 68 Restore purchase (node 29:1526)

## Header
- Title: "Restore purchase"
- Start slot: back arrow (24x24 white) — inferred: back to TillCount Pro
- End slot: empty
- Header bg `#1a2540`, height 78px

## Bottom navigation
None

## Body
Screen bg `#f7f3e8`, padding 16px, gap 12px.

- Section label: "Restore TillCount Pro" — Roboto Bold 16/20, `#1a2540`
- Info/notice card (bg `#e3e9f3`, border `#ddd3be`, radius 12px):
  - Title: "Already bought Pro?" (Roboto Bold 15/19, `#1a2540`)
  - Body: "Use the same Apple ID or Google account that made the original purchase." (Roboto Medium 12/16, `#5b6476`)
- Plain paragraph text (Roboto Medium 14/18, `#5b6476`): "Restoring does not delete or replace your local TillCount data."
- Primary button: "Restore purchase" (bg `#1a2540`, white text, 50px height, radius 12px)
- Secondary button: label defaults to "Cancel" (component default; bg `#fffdf8`, border `#ddd3be`, `#1a2540` text) — no explicit label override was provided in the design context, so the visible label is "Cancel"

## Interactive elements (inferred destinations)
- Back arrow → TillCount Pro screen
- "Restore purchase" button → triggers native store restore-purchases flow; on success likely returns to TillCount Pro or Settings with Pro unlocked
- "Cancel" button → dismiss/back to TillCount Pro screen

## Empty/error/notice states
None shown explicitly, though a failed-restore state (e.g., "No purchase found") is a likely but unshown app state — inferred, not present in this design.
