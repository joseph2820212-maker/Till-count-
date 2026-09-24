# 01 Home (node 17:112)

## Header — `Screen Header / Main` (node 17:12)
- Background: `#1a2540` (navy, `--tillcount-color-action-primary`). Height 78px, pt 20 / pb 14 / px 14.
- Start slot: empty 44×44 (no back arrow — this is a top-level tab screen).
- Title (center, text "TillCount"): Roboto Bold 20/24, color white (`--tillcount-color-text-on-navy`).
- End slot: 44×44, icon = "Overflow" (three-dot / kebab menu icon), 24×24, white.

## Bottom navigation
- `Bottom Navigation / Home` bar, bg `#1a2540`, height 72px, 5 tabs, each 78px wide, icon 20×20 + label (Roboto Medium 10/13) + 3px pill indicator (28px wide, radius full) below label.
- Tabs in order: **Home** (active — icon+label white `#ffffff`, indicator pill `#e8842d`), **Count** (inactive — label/icon `#c7cfde`, no indicator), **Products** (inactive), **Reorder** (inactive), **More** (inactive).
- Active tab: **Home**.

## Body (top → bottom, stacked, 16px padding, 12px gaps) — bg `#f7f3e8`
- **Primary button** ("Button / Primary"): full-width (358px) × 50px, bg `#1a2540`, radius 12px, centered white Bold 15/18 label. Text: "Start count". (inferred → navigates to Start Count screen, node 17:184)
- **Card** "Continue" (progress card): bg `#fffdf8`, border `#ddd3be`, radius 12px, shadow 0px 2px 8px rgba(26,37,64,0.08), padding 14/12, height 76px, gap 5px.
  - Title text: "Continue count" — Bold 15/19, `#1a2540`.
  - Subtitle text: "Front shop · 147 of 213 counted" — Medium 12/16, `#5b6476`.
  - Progress bar: track 330×5px, bg `#f0ede4`, radius full; fill 228px wide (≈69%), bg `#e8842d`, radius full.
  - (inferred → tapping resumes the in-progress count, likely to Scan & Count screen)
- **Section label**: text "TODAY" — Roboto ExtraBold 12/16, letter-spacing 0.5px, color `#5b6476`.
- **Metrics** — two rows of 2 metric cards, each 171×94px, gap 16px (row) / 10px (rows), bg `#fffdf8`, border `#ddd3be`, radius 12px, padding 14/12, drop shadow rgba(26,37,64,0.08) 0/2/4.
  - Row 1: Metric Card "Low stock" value **18**, helper "items"; Metric Card "Out of stock" value **7**, helper "items".
  - Row 2: Metric Card "Not counted" value **49**, helper "items"; Metric Card "Last count" value **Tue**, helper "full count".
  - Label text style: Medium 12/16 `#5b6476`. Value: ExtraBold 22/27 `#1a2540`. Helper: Medium 10/13 `#8a8e9f`.
  - (inferred: tapping "Low stock"/"Out of stock"/"Not counted" filters the product list by that status; "Last count" opens count history)
- **Card** "Reorder": bg `#fffdf8`, border `#ddd3be`, radius 12px, shadow, height 64px, padding 14/12, gap 5px.
  - Title: "Reorder list" — Bold 15/19 `#1a2540`.
  - Subtitle: "25 items need attention" — Medium 12/16 `#5b6476`.
  - (inferred → navigates to Reorder screen, node 17:386)
- **Card** "Recent": same card styling, height 64px.
  - Title: "Recently counted" — Bold 15/19 `#1a2540`.
  - Subtitle: "Coca-Cola 500ml · 14   ·   Milk 2L · 3" — Medium 12/16 `#5b6476`.
  - (inferred → navigates to a recent-counts/history list)

## Interactive elements → inferred destinations
- Start count button → Start Count screen (17:184).
- Continue count card → resumes active count (Scan & Count, 17:270).
- Metric cards → filtered product lists.
- Reorder card → Reorder screen (17:386).
- Recently counted card → count history/detail.
- Overflow (⋯) icon in header → overflow menu (settings, export, etc.).
- Bottom nav tabs → Count, Products, Reorder, More sections.

## Empty/error/notice states
- None shown on this screen; all data states are populated with example values.
