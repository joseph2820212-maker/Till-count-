# TillCount — Figma Components & Design Tokens

Source: Figma file `lAEpXQNqnPehtBMB7K6oWd`, page "00 Cover", frame `TillCount / Visible Build` (17:2), sub-section `TillCount / Components` (17:5), plus variables collected from `17:112`, `17:5`, `17:6` and `30:1494`.

## Design tokens

### Color variables (`--tillcount-color-*`)

| Token | Hex | Usage seen in components |
|---|---|---|
| `--tillcount-color-bg-app` | `#f7f3e8` | App/canvas background |
| `--tillcount-color-surface-card` | `#fffdf8` | Card/row/input background |
| `--tillcount-color-surface-muted` | `#f0ede4` | Stepper +/− control backgrounds |
| `--tillcount-color-border-default` | `#ddd3be` | Default 1px card/row/input borders |
| `--tillcount-color-text-primary` | `#1a2540` | Primary text, titles, values |
| `--tillcount-color-text-secondary` | `#5b6476` | Secondary/subtitle/body text |
| `--tillcount-color-text-faint` | `#8a8e9f` | Helper/micro text (e.g. Metric Card "items") |
| `--tillcount-color-text-on-navy` | `#ffffff` | Text/icons on navy surfaces (headers, buttons, nav) |
| `--tillcount-color-action-primary` | `#1a2540` | Primary buttons, screen headers, bottom nav background |
| `--tillcount-color-action-accent` | `#e8842d` | Active bottom-nav indicator pill (orange) |
| `--tillcount-color-nav-inactive-dark` | `#c7cfde` | Inactive bottom-nav icon/label color |
| `--tillcount-color-status-danger` | `#b14d38` | Danger card border, destructive button fill |
| `--tillcount-color-status-danger-bg` | `#fbe3de` | Danger card background |
| `--tillcount-color-status-info-bg` | `#e3e9f3` | Neutral/info state-card background |
| `--tillcount-color-status-success` | `#4d8b6e` | Success card border |
| `--tillcount-color-status-success-bg` | `#ddede5` | Success card background |

### Radius tokens (`--tillcount-radius-*`)

| Token | px |
|---|---|
| `--tillcount-radius-sm` | 8 |
| `--tillcount-radius-md` | 12 |
| `--tillcount-radius-lg` | 16 |
| `--tillcount-radius-full` | 999 |

### Type styles

| Style | Family | Style/Weight | Size | Line height | Letter spacing |
|---|---|---|---|---|---|
| Type/Screen Title | Roboto | Bold / 700 | 20 | 24 | 0 |
| Type/Section Title | Roboto | Bold / 700 | 16 | 20 | 0 |
| Type/Section Label | Roboto | ExtraBold / 800 | 12 | 16 | 0.5 |
| Type/Card Title | Roboto | Bold / 700 | 15 | 19 | 0 |
| Type/Card Label | Roboto | Medium / 500 | 12 | 16 | 0 |
| Type/Card Value | Roboto | ExtraBold / 800 | 22 | 27 | 0 |
| Type/Body Small | Roboto | Medium / 500 | 12 | 16 | 0 |
| Type/Button | Roboto | Bold / 700 | 15 | 18 | 0 |
| Type/Micro | Roboto | Medium / 500 | 10 | 13 | 0 |
| Type/Input | Roboto | Medium / 500 | 16 | 20 | 0 |

All text layers additionally carry `fontVariationSettings: "wdth" 100` (Roboto variable-font width axis at 100%).

### Elevation / shadow

| Token | Definition |
|---|---|
| Elevation/Card | `drop-shadow(0px 2px 4px rgba(26,37,64,0.08))` — i.e. `DROP_SHADOW` color `#1A254014` (8% opacity of `#1A2540`), offset (0, 2), blur radius 8, spread 0. Used on Metric Card. |

---

## Components

All components live under the `TillCount / Components` frame (node `17:5`, 846×1134, background `--tillcount-color-surface-card` `#fffdf8`, border 1px `--tillcount-color-border-default`, radius `--tillcount-radius-lg` 16px, padding 24px, gap 18px between rows).

### 1. Button / Primary — node `17:7`
- **Description (Figma):** "TillCount primary full-width action"
- Size: 358×50, corner radius `--tillcount-radius-md` (12px)
- Background: `--tillcount-color-action-primary` `#1a2540`
- Label (node `17:8`): centered, Type/Button (Bold 15/18), color `--tillcount-color-text-on-navy` `#ffffff`
- Example content: `"Start count"`

### 2. Button / Secondary — node `17:9`
- **Description (Figma):** "TillCount secondary full-width action"
- Size: 358×50, corner radius 12px
- Background: `--tillcount-color-surface-card` `#fffdf8`; border 1px `--tillcount-color-border-default` `#ddd3be`
- Label (node `17:10`): centered, Type/Button, color `--tillcount-color-text-primary` `#1a2540`
- Example content: `"Cancel"`

### 3. Screen Header / Main — node `17:12`
- **Description (Figma):** "Till family navy ScreenHeader with 44dp symmetric side slots"
- Size: 390×78, background `--tillcount-color-action-primary` `#1a2540`, padding top 20/bottom 14/sides 14, gap 8
- **Start slot** (`17:13`): 44×44, empty
- **Center** (`17:14`): 258×44, flex column centered
  - Title (`17:15`): Type/Screen Title (Bold 20/24), color white, text-centered. Example: `"TillCount"`
- **End slot** (`17:16`): 44×44, contains **Overflow icon** (`17:17`, 24×24 SVG, "…" kebab menu icon)

### 4. Screen Header / Back — node `17:21`
- **Description (Figma):** same as Main: "Till family navy ScreenHeader with 44dp symmetric side slots"
- Size: 390×78, same background/padding/gap as Main
- **Start slot** (`17:22`): 44×44 containing **Back icon** (`17:23`, 24×24 SVG, chevron "<")
- **Center** (`17:25`): 258×44 — Title (`17:26`): Type/Screen Title, white, centered. Example: `"Start count"`
- **End slot** (`17:27`): 44×44, empty (symmetric placeholder, keeps title centered)

### 5. Metric Card — node `17:28`
- Size: 171×94, background `--tillcount-color-surface-card` `#fffdf8`, border 1px `--tillcount-color-border-default`, radius `--tillcount-radius-md` (12px), padding 14px/12px, shadow Elevation/Card
- **Label** (`17:29`): Type/Card Label (Medium 12/16), color `--tillcount-color-text-secondary`. Example: `"Low stock"`
- **Value** (`17:30`): Type/Card Value (ExtraBold 22/27), color `--tillcount-color-text-primary`. Example: `"18"`
- **Helper** (`17:31`): Type/Micro (Medium 10/13), color `--tillcount-color-text-faint`. Example: `"items"`

### 6. Scope Row / Selected — node `17:33`
- Size: 358×72, background `--tillcount-color-surface-card`, border **2px** `--tillcount-color-action-primary` `#1a2540` (thicker "selected" border), radius 12px, padding 16px/12px, gap 12
- **Copy** (`17:34`): title (`17:35`) Type/Card Title (Bold 15/19) `#1a2540`; subtitle (`17:36`) Type/Body Small `#5b6476`. Example: title `"Everything"`, subtitle `"Count every active product"`
- **Selection icon** (`17:37`): 22×22 SVG — filled/selected radio (navy circle with orange center dot)

### 7. Scope Row / Default — node `17:40`
- Size: 358×72, background `--tillcount-color-surface-card`, border **1px** `--tillcount-color-border-default` (unselected), radius 12px, padding 16px/12px, gap 12
- **Copy** (`17:41`): title (`17:42`), subtitle (`17:43`), same type styles as Selected. Example: title `"Front shop"`, subtitle `"213 products"`
- **Selection icon** (`17:44`): 22×22 SVG — empty/outline radio (unselected)

### 8. Product Count Row — node `17:46`
- Size: 358×88, background `--tillcount-color-surface-card`, border 1px `--tillcount-color-border-default`, radius 12px, padding 12px, gap 8
- **Product copy** (`17:47`): 184×58 — name (`17:48`) Type/Card Title (Bold 15/19) `#1a2540`; meta (`17:49`) Type/Body Small `#5b6476`. Example: name `"Coca-Cola Original 500ml"`, meta `"5000112637922 · Each"`
- **Control −** (`17:50`): 44×44, background `--tillcount-color-surface-muted` `#f0ede4`, radius `--tillcount-radius-sm` (8px), centered "−" glyph, Type/Button (Bold 15/18) `#1a2540`
- **Quantity** (`17:52`): 50×44, value (`17:53`) Type/Card Value (ExtraBold 22/27) `#1a2540`. Example: `"12"`
- **Control +** (`17:54`): 44×44, same styling as Control −, centered "+" glyph

### 9–13. Bottom Navigation (5 tabs: Home, Count, Products, Reorder, More)
Common structure across all 5 variants — size 390×72, background `--tillcount-color-action-primary` `#1a2540`, flex row, padding-y 7px. Each of the 5 tabs is 78px wide, flex column centered, gap 2, containing:
- Icon (20×20 SVG, tab-specific glyph, has an "active"/"inactive" SVG asset variant)
- Label (Type/Micro, Medium 10/13)
- 3px-tall indicator pill (radius `--tillcount-radius-full` 999, width 28px)

Active tab: label color `--tillcount-color-text-on-navy` `#ffffff`; indicator pill filled `--tillcount-color-action-accent` `#e8842d`. Inactive tabs: label color `--tillcount-color-nav-inactive-dark` `#c7cfde`; indicator pill transparent/empty.

| Variant | Node | Active tab |
|---|---|---|
| Bottom Navigation / Home | `17:57` | Home |
| Bottom Navigation / Reorder | `17:83` | Reorder |
| Bottom Navigation / Count | `20:182` | Count |
| Bottom Navigation / Products | `20:208` | Products |
| Bottom Navigation / More | `20:234` | More |

Tab labels (always all 5, regardless of variant): `"Home"`, `"Count"`, `"Products"`, `"Reorder"`, `"More"`.

### 14. List Row — node `20:260`
- **Description (Figma):** "Generic tappable row for Products, History, More and settings lists."
- Size: 358×68, background `--tillcount-color-surface-card`, border 1px `--tillcount-color-border-default`, radius 12px, padding left 14/right 12/vertical 12, gap 10
- **Copy** (`20:261`): title (`20:262`) Type/Card Title (Bold 15/19) `#1a2540`; subtitle (`20:263`) Type/Body Small `#5b6476`. Example: title `"Row title"`, subtitle `"Optional supporting text"`
- **Chevron** (`20:264`): 20×20 SVG, right-facing chevron affordance icon

### 15. Input Field — node `20:266`
- **Description (Figma):** "TillCount full-width labelled form input."
- Size: 358×76, flex column, gap 5
- **Label** (`20:267`): Type/Body Small (Medium 12/16), color `--tillcount-color-text-secondary`. Example: `"Product name"`
- **Input box** (`20:268`): 358×50, background `--tillcount-color-surface-card`, border 1px `--tillcount-color-border-default`, radius 12px, padding-x 14px
  - Value (`20:269`): Type/Input (Medium 16/20), color `--tillcount-color-text-primary`. Example: `"Coca-Cola Original 500ml"`

### 16. Toggle Row — node `20:270`
- **Description (Figma):** "Settings row with title, support text and on/off state."
- Size: 358×72, background `--tillcount-color-surface-card`, border 1px `--tillcount-color-border-default`, radius 12px, padding left 14/right 12/vertical 12, gap 10
- **Copy** (`20:271`): title (`20:272`) Type/Card Title (Bold 15/19) `#1a2540`; subtitle (`20:273`) Type/Body Small `#5b6476`. Example: title `"Blind count"`, subtitle `"Hide previous quantity while counting"`
- **Switch** (`20:274`): 46×26 SVG asset, on/off toggle control (shown "on"/filled in the default example)

---

## Component index (node ids, quick reference)

| Component | Node |
|---|---|
| TillCount / Components (root) | 17:5 |
| Component Row / Buttons | 17:6 |
| Button / Primary | 17:7 |
| Button / Secondary | 17:9 |
| Component Row / Headers | 17:11 |
| Screen Header / Main | 17:12 |
| Screen Header / Back | 17:21 |
| Metric Card | 17:28 |
| Component Row / Scopes | 17:32 |
| Scope Row / Selected | 17:33 |
| Scope Row / Default | 17:40 |
| Product Count Row | 17:46 |
| Component Row / Nav | 17:56 |
| Bottom Navigation / Home | 17:57 |
| Bottom Navigation / Reorder | 17:83 |
| Bottom Navigation / Count | 20:182 |
| Bottom Navigation / Products | 20:208 |
| Bottom Navigation / More | 20:234 |
| List Row | 20:260 |
| Input Field | 20:266 |
| Toggle Row | 20:270 |

## Required States & Sheets section (12 states)

Container: "Required States" frame, node `30:1494` (label `30:1495`: `"REQUIRED STATES & SHEETS"`, Type/Section Label). Detailed per-state specs are in `docs/figma/states/01-…` through `12-…`. Quick index:

| # | Name | Node (State container) | Card semantic color |
|---|---|---|---|
| 1 | Camera permission denied | 30:1497 | danger (`#fbe3de` / `#b14d38`) |
| 2 | Free limit reached | 30:1506 | info/neutral (`#e3e9f3` / `#ddd3be`) |
| 3 | Products empty | 30:1516 | info/neutral |
| 4 | Count history empty | 30:1525 | info/neutral |
| 5 | Reorder empty | 30:1533 | success (`#ddede5` / `#4d8b6e`) |
| 6 | Search no results | 30:1540 | info/neutral |
| 7 | Delete product confirmation | 30:1548 | danger |
| 8 | Discard current count confirmation | 30:1557 | danger |
| 9 | Wrong backup password | 30:1567 | danger |
| 10 | Import problem | 30:1576 | danger |
| 11 | Export problem | 30:1584 | danger |
| 12 | Restore confirmation | 30:1591 | info/neutral |

## Not found / not applicable

- No component tokens for typography families other than Roboto were found (single font family throughout).
- No dark-mode / alternate-theme variable set was found — only one light color palette.
- The 12 "Required States" nodes are compact **documentation spec cards** (410×154, title + body + action buttons on a tan/cream canvas), not full 390×844 screen mockups with chrome (status bar, header, bottom nav). Treat their button/text/color specs as authoritative, but their exact on-canvas layout (e.g. as a bottom sheet vs. modal vs. inline banner) is an implementation decision guided by each state's `## Type` note in its file.
