# State 01: Camera permission denied (node 30:1497)

Source: Figma file `lAEpXQNqnPehtBMB7K6oWd`, page "00 Cover", section "TillCount / Visible Build" → "Required States" (17:5... actually 30:1494) → "State row" (30:1496) → `State / Camera permission denied` (30:1497).

## Type
Documentation spec card (not a full 390×844 screen mockup). Represents a **danger/alert card** — in the real app this should be implemented as a modal dialog / inline banner shown when camera access is denied, blocking barcode scanning.

## Layout
Card container `State / Camera permission denied` (30:1497): flex column, gap 10px, width 410px.

1. **State Card** (30:1498) — "State Card / Camera permission denied"
   - Background: `--tillcount-color-status-danger-bg` `#fbe3de`
   - Border: 1px solid `--tillcount-color-status-danger` `#b14d38`
   - Corner radius: `--tillcount-radius-lg` = 16px
   - Padding: 18px, internal gap 10px, width 410px
   - **Title** (text, node 30:1499): `"Camera permission denied"`
     - Style: Type/Section Title — Roboto Bold 16px / line-height 20 / letter-spacing 0
     - Color: `--tillcount-color-text-primary` `#1a2540`
   - **Body text** (text, node 30:1500): `"Camera access is off. Show Open Settings and Type code instead so counting never dead-ends."`
     - Style: Type/Body Small — Roboto Medium 12px / line-height 16 / letter-spacing 0
     - Color: `--tillcount-color-text-secondary` `#5b6476`

2. **Actions row** (30:1501) — flex row, gap 8px, height 44px
   - **Button "Open Settings"** (30:1502/30:1503) — primary-style action
     - Size 120×44, corner radius `--tillcount-radius-md` = 12px
     - Background: `--tillcount-color-action-primary` `#1a2540` (navy)
     - Label text: `"Open Settings"` — Type/Button (Roboto Bold 15px/18, letter-spacing 0), color `--tillcount-color-text-on-navy` `#ffffff`
   - **Button "Type code"** (30:1504/30:1505) — destructive/accent-red action (fallback path)
     - Size 132×44, corner radius 12px
     - Background: `--tillcount-color-status-danger` `#b14d38` (red)
     - Label text: `"Type code"` — Type/Button, white `#ffffff`

## Icons
None (no icon glyphs present in this card; only text and two action buttons).

## Notes
- This is a compact "state card" used across the whole "Required States & Sheets" documentation section (see COMPONENTS.md for the full family), width 410px — wider than the 390px app screen; treat the 410px as documentation-canvas width only, not the implementation width.
- Two actions imply a modal/alert with two exits: "Open Settings" (deep-links to OS settings) and "Type code" (manual barcode entry fallback).
