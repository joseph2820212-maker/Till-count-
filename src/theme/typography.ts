/**
 * typography.ts — responsive font-size tokens (the single source of truth)
 *
 * All sizes scale gently with screen width via fs(base, min, max).
 * Never hard-code font sizes in screens — use these tokens.
 *
 * Target base sizes (390dp): 10, 11, 12, 14, 15, 16, 18, 20, 22, 28
 * Permitted exceptions:      24 (PIN title), 48 (calculator keypad)
 *
 * Token          base   min   max   Use
 * ──────────────────────────────────────────────────────────────────
 * screenTitle     20     18    22   blue header title
 * sectionTitle    16     14    18   SUMMARY / DISTRIBUTION / FOLDERS
 * sectionLabel    12     10    14   uppercase section labels
 * cardTitle       15     13    17   card / row titles
 * cardLabel       12     11    14   labels inside cards
 * cardValue       22     18    26   card amount
 * moneyValue      28     24    34   big main amount
 * moneySmall      18     16    22   compact amount
 * body            14     12    16   normal text
 * bodySm          12     10    14   hints / helper text
 * micro           10      9    11   badges / tiny captions
 * buttonText      15     14    16   action buttons
 * inputText       16     14    18   input text
 * tabLabel        11     10    12   tab labels
 */

import { fs } from './responsive';
import { colors } from './colors';
import { numberFontFamily } from './numberFont';

export const numHero  = { fontSize: fs(15, 13, 17), fontWeight: '800' as const, fontFamily: numberFontFamily('800') };
export const numBody  = { fontSize: fs(14, 12, 16), fontWeight: '700' as const, fontFamily: numberFontFamily('700') };
export const numLabel = { fontSize: fs(11, 10, 13), fontWeight: '600' as const, fontFamily: numberFontFamily('600') };

export const numColors = {
  neutral:  colors.primaryBlue,
  positive: colors.successGreen,
  expense:  colors.warningYellow,
  negative: colors.dangerRed,
  net:      colors.primaryBlue,
};

export const typography = {
  // ── Navigation / screen headers ──────────────────────────────────────────
  screenTitle:  { fontSize: fs(20, 18, 22), fontWeight: '700' as const },

  // ── Section & card headers ───────────────────────────────────────────────
  sectionTitle: { fontSize: fs(16, 14, 18), fontWeight: '700' as const },
  sectionLabel: { fontSize: fs(12, 10, 14), fontWeight: '800' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  // ── Card content ─────────────────────────────────────────────────────────
  cardLabel:    { fontSize: fs(12, 11, 14), fontWeight: '500' as const },
  cardTitle:    { fontSize: fs(15, 13, 17), fontWeight: '700' as const },
  cardValue:    { fontSize: fs(22, 18, 26), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },

  // ── Money / number highlights ─────────────────────────────────────────────
  moneyValue:   { fontSize: fs(28, 24, 34), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },
  moneySmall:   { fontSize: fs(18, 16, 22), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },

  // ── Amount input fields ──────────────────────────────────────────────────
  amountInput:  { fontSize: fs(28, 24, 34), fontWeight: '700' as const, fontFamily: numberFontFamily('700') },
  amountPrefix: { fontSize: fs(20, 16, 24), fontWeight: '400' as const, fontFamily: numberFontFamily('400') },

  // ── PIN / numeric keypad ──────────────────────────────────────────────────
  pinKey:   { fontSize: fs(28, 24, 32), fontWeight: '400' as const },
  pinTitle: { fontSize: fs(24, 20, 28), fontWeight: '800' as const }, // 24 = approved exception
  pinDot:   { fontSize: fs(28, 24, 34), fontWeight: '700' as const },

  // ── Body text ─────────────────────────────────────────────────────────────
  body:    { fontSize: fs(14, 12, 16), fontWeight: '500' as const },
  bodyMd:  { fontSize: fs(14, 12, 16), fontWeight: '500' as const },
  bodySm:  { fontSize: fs(12, 10, 14), fontWeight: '500' as const },
  micro:   { fontSize: fs(10, 9, 11),  fontWeight: '500' as const },

  // ── Interactive elements ──────────────────────────────────────────────────
  buttonText: { fontSize: fs(15, 14, 16), fontWeight: '700' as const },
  inputText:  { fontSize: fs(16, 14, 18), fontWeight: '500' as const },
  tabLabel:   { fontSize: fs(11, 10, 12), fontWeight: '600' as const },

  // ── Backward-compatible aliases (existing screens import these) ───────────
  headerMain:   { fontSize: fs(20, 18, 22), fontWeight: '800' as const },
  headerSub:    { fontSize: fs(16, 14, 18), fontWeight: '700' as const },
  amountLg:     { fontSize: fs(22, 18, 26), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },
  amountMd:     { fontSize: fs(18, 16, 22), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },
};

/**
 * TillCount Figma type styles (docs/figma/COMPONENTS.md). Roboto on Android is the
 * platform default face, so no fontFamily is set for text; figures keep the donor's
 * IBM Plex Sans Arabic tabular face via numberFontFamily (handoff §15).
 */
export const tcType = {
  screenTitle:  { fontSize: fs(20, 18, 22), lineHeight: fs(24, 22, 26), fontWeight: '700' as const },
  sectionTitle: { fontSize: fs(16, 14, 18), lineHeight: fs(20, 18, 22), fontWeight: '700' as const },
  sectionLabel: { fontSize: fs(12, 11, 13), lineHeight: fs(16, 14, 17), fontWeight: '800' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  cardTitle:    { fontSize: fs(15, 13, 17), lineHeight: fs(19, 17, 21), fontWeight: '700' as const },
  cardLabel:    { fontSize: fs(12, 11, 13), lineHeight: fs(16, 14, 17), fontWeight: '500' as const },
  cardValue:    { fontSize: fs(22, 18, 26), lineHeight: fs(27, 23, 31), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },
  hero:         { fontSize: fs(28, 24, 32), lineHeight: fs(34, 30, 38), fontWeight: '800' as const, fontFamily: numberFontFamily('800') },
  body:         { fontSize: fs(14, 12, 16), lineHeight: fs(18, 16, 20), fontWeight: '500' as const },
  bodySmall:    { fontSize: fs(12, 11, 13), lineHeight: fs(16, 14, 17), fontWeight: '500' as const },
  button:       { fontSize: fs(15, 14, 16), lineHeight: fs(18, 17, 19), fontWeight: '700' as const },
  micro:        { fontSize: fs(10, 9, 11), lineHeight: fs(13, 12, 14), fontWeight: '500' as const },
  input:        { fontSize: fs(16, 14, 18), lineHeight: fs(20, 18, 22), fontWeight: '500' as const },
};
