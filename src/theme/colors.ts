/**
 * colors.ts — the exact TillCount palette (handoff §6, Figma variables
 * `--tillcount-color-*`). The Till-family donor token names are kept as aliases so
 * the retained shared components keep compiling; new code uses the `tc` names.
 */
export const tc = {
  navy: '#1A2540',          // action-primary: headers, primary buttons, bottom nav
  navyRaised: '#2A3856',
  warm: '#F7F3E8',          // bg-app
  card: '#FFFDF8',          // surface-card
  inputMuted: '#F0EDE4',    // surface-muted: steppers, progress track
  rule: '#EBE7DE',          // border-subtle: legal doc cards, dividers
  border: '#DDD3BE',        // border-default
  textPrimary: '#1A2540',
  textMuted: '#5B6476',     // text-secondary
  textFaint: '#8A8E9F',
  accent: '#E8842D',        // action-accent: active tab mark, progress, LOW badge
  success: '#4D8B6E',
  danger: '#B14D38',
  softBlue: '#E3E9F3',      // status-info-bg
  softGreen: '#DDEDE5',     // status-success-bg
  softRed: '#FBE3DE',       // status-danger-bg
  navInactive: '#C7CFDE',
  onNavy: '#FFFFFF',
  overlay: 'rgba(26,37,64,0.5)',
} as const;

export const colors = {
  primaryBlue: tc.navy,
  deepBlue: tc.navy,
  headerBlue: tc.navy,
  background: tc.warm,
  card: tc.card,
  inputMuted: tc.inputMuted,
  rule2: tc.rule,
  cardWhite: tc.card,
  textDark: tc.textPrimary,
  textMuted: tc.textMuted,
  textFaint: tc.textFaint,
  textLight: tc.card,
  successGreen: tc.success,
  dangerRed: tc.danger,
  warningYellow: tc.accent,
  softBlue: tc.softBlue,
  softGreen: tc.softGreen,
  softRed: tc.softRed,
  border: tc.border,
  disabledBg: tc.border,
  disabledText: tc.textFaint,
  overlayDark: tc.overlay,
  tabBarActive: tc.onNavy,
  tabBarInactive: tc.navInactive,
  dangerRedLight: tc.softRed,
  successGreenLight: tc.softGreen,
  warningOrange: tc.accent,
  navyRaised: tc.navyRaised,
};
