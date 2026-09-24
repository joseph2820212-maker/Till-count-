# 46 More (node 26:1018)

## Header
- Component: Screen Header / Main (navy bar, no back arrow)
- Start slot: empty (44x44, no icon)
- Title (center): "More" — Roboto Bold 20/24, color white (#ffffff), centered
- End slot: Overflow icon (⋯ three-dot horizontal menu icon), 24x24, white — inferred: opens an overflow menu (no destination specified in design)
- No subtitle
- Header bg: #1a2540 (--tillcount-color-action-primary), height 78px

## Bottom navigation
- Tabs: Home, Count, Products, Reorder, More
- Active tab: **More** (text color white #ffffff, active indicator bar bg #e8842d — --tillcount-color-action-accent, 3px height, 28px wide pill)
- Inactive tabs (Home, Count, Products, Reorder): text/icon color #c7cfde (--tillcount-color-nav-inactive-dark), indicator bar transparent
- Nav bar bg: #1a2540, height 72px

## Body (top to bottom, stack, 16px padding, 12px gap between rows)
- Section label: "Settings & data" — Roboto Bold 16/20, color #1a2540
- List row (card, bg #fffdf8, border 1px #ddd3be, radius 12px, height 68px, chevron ">" icon 20x20 gray at end):
  - "Count settings" (bold 15px, #1a2540) / "Blind count, scan behaviour, case + loose" (medium 12px, #5b6476) — inferred → screen 47 Count settings
  - "Reorder settings" / "Defaults and suggested quantities" — inferred → screen 48 Reorder settings
  - "Units & formats" / "Units, numbers and dates" — inferred → screen 49 Units & formats
  - "Language" / "English" — inferred → screen 51 Language
  - "Data & backup" / "Import, export, encrypted backup" — inferred → screen 52 Data & backup
  - "Help & questions" / "Guides and FAQ" — inferred → help/FAQ screen (not in this batch)
  - "About TillCount" / "Version, privacy and legal" — inferred → about screen (not in this batch)

Note: "Currency" (screen 50) is not listed directly on this More screen; it is likely reached via Units & formats or Data & backup subflow — inferred.

## Colors used
- App background: #f7f3e8 (--tillcount-color-bg-app)
- Card surface: #fffdf8 (--tillcount-color-surface-card)
- Border default: #ddd3be
- Text primary: #1a2540, text secondary: #5b6476
- Header/nav navy: #1a2540
- Accent (active tab indicator): #e8842d

## Empty/error/notice states
None on this screen.
