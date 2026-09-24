# 08 Count (node 21:187)

## Header — `Screen Header / Main`
- Bg `#1a2540`, height 78px. Start slot: empty 44×44 (no back arrow — tab root screen).
- Title: "Count" — Bold 20/24, white.
- End slot: 44×44, Overflow (⋯) icon, white.

## Bottom navigation
- 5-tab bar, active tab **Count** (white label/icon + orange pill indicator); Home/Products/Reorder/More inactive `#c7cfde`.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Count stock" — Bold 16/20, `#1a2540`.
- **Notice/info card** "Start a new count": 358×70px, bg `#e3e9f3`, border `#ddd3be`, radius 12, padding 14/12, gap 5.
  - Title: "Start a new count" — Bold 15/19 `#1a2540`.
  - Body: "Everything, category, supplier, location or selected products" — Medium 12/16 `#5b6476`.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Start count".
- **Section label**: "ACTIVE" — ExtraBold 12/16, letter-spacing 0.5, `#5b6476`.
- **Card** "Front shop" (active count): bg `#fffdf8`, border `#ddd3be`, radius 12, height 70px, padding 14/12, gap 5.
  - Title: "Front shop" — Bold 15/19 `#1a2540`.
  - Subtitle: "147 of 213 counted · started today 10:02" — Medium 12/16 `#5b6476`.
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, `#1a2540` Bold 15/18 text: "Resume count".
- **Section label**: "FAVOURITES" — ExtraBold 12/16, letter-spacing 0.5, `#5b6476`.
- **List rows** (tappable, chevron-right), each 358×68px, bg `#fffdf8`, border `#ddd3be`, radius 12, padding pl14/pr12/py12, gap 10, chevron icon 20×20 on right:
  1. Title "Weekly cigarettes" (Bold 15/19 `#1a2540`), subtitle "42 products" (Medium 12/16 `#5b6476`).
  2. Title "Daily fridge", subtitle "28 products".

## Interactive elements → inferred destinations
- "Start count" button → Start Count screen (17:184) or Count setup (21:251).
- "Front shop" active-count card / "Resume count" button → resumes into Scan & Count (17:270).
- Favourites list rows ("Weekly cigarettes", "Daily fridge") → opens that saved custom count list (Select products / List count screen, e.g. 21:414).
- Overflow menu → count settings.
- Bottom nav tabs → Home, Products, Reorder, More.

## Empty/error/notice states
- None; all sections populated with example data.
