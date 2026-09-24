# 03 Choose Scope (node 17:230)

Note: this screen instance is titled "Choose location" and represents the Location scope sub-flow (same underlying "Screen / Choose Scope" component as reused for category/supplier pickers).

## Header — `Screen Header / Back` (node 17:21 instance)
- Background `#1a2540`, height 78px.
- Start slot: 44×44 **Back** chevron icon, white — back arrow present.
- Title: "Choose location" — Bold 20/24, white.
- End slot: empty 44×44.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Section title**: "Location count" — Bold 16/20, `#1a2540`.
- **Helper text**: "Count one physical area. Products can appear in more than one location over time." — Medium 12/16, `#5b6476`, width 358px.
- **Radio row list**, each 358×72px, radius 12px, padding 16/12:
  1. **Selected**: border 2px `#1a2540`, title "Front shop" (Bold 15/19 `#1a2540`), subtitle "213 products" (Medium 12/16 `#5b6476`), filled navy/orange-dot radio (22×22).
  2. **Default**: border 1px `#ddd3be`, title "Stockroom", subtitle "96 products", unselected outline radio.
  3. **Default**: title "Fridge", subtitle "42 products", unselected radio.
  4. **Default**: title "Freezer", subtitle "18 products", unselected radio.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, white Bold 15/18 text: "Start count".

## Interactive elements → inferred destinations
- Radio rows (Front shop / Stockroom / Fridge / Freezer) → single-select location; updates selection state.
- "Start count" button → begins the count for the selected location, navigating to Scan & Count (17:270).
- Back chevron → returns to Start Count screen (17:184).

## Empty/error/notice states
- None; "Front shop" is pre-selected by default.
