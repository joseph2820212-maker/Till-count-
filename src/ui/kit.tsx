/**
 * kit.tsx — TillCount building blocks, one per Figma component (docs/figma/COMPONENTS.md):
 * Screen scaffold, section title/label, cards (default/info/success/danger), List Row,
 * Metric Card, Scope Row, Toggle Row, Product Count Row, progress bar, filter chips,
 * the Required-States card and the 44dp keypad. Screens compose these; they do not
 * restyle them.
 */
import React, { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  BackHandler, View, TouchableOpacity, StyleSheet, I18nManager, ScrollView, type StyleProp, type ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { ScreenHeader, type HeaderAction } from '../components/ScreenHeader';
import { AppSwitch } from '../components/AppSwitch';
import { AppKeyboardScrollView } from '../components/AppKeyboardScrollView';
import { AppButton } from '../components/AppButton';

export const GUTTER = 16;
export const GAP = 12;

// ─── Screen scaffold ─────────────────────────────────────────────────────────

interface ScreenProps {
  title: string;
  onBack?: () => void;
  action?: HeaderAction;
  children?: React.ReactNode;
  /** Actions: directly under the content on scrolling screens (Figma), pinned under lists. */
  footer?: React.ReactNode;
  /** Forms scroll inside the keyboard-aware container. */
  keyboard?: boolean;
  /** Render children without a ScrollView (virtualised lists supply their own). */
  noScroll?: boolean;
  /** Tab roots sit above the tab bar, so they need no bottom inset. */
  tabRoot?: boolean;
  testID?: string;
}

export const Screen: React.FC<ScreenProps> = ({ title, onBack, action, children, footer, keyboard, noScroll, tabRoot, testID }) => {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  // The Android back button runs the same code as the header back arrow (pause the count,
  // close the import session…), not a bare pop that would skip it.
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const hasBack = !!onBack;
  useEffect(() => {
    if (!hasBack || !focused) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onBackRef.current?.(); return true; });
    return () => sub.remove();
  }, [hasBack, focused]);
  const bottomPad = tabRoot ? GUTTER : Math.max(insets.bottom, 12) + 4;
  const content = (
    <View style={s.body}>
      {children}
      {footer ? <View style={s.inlineFooter}>{footer}</View> : null}
    </View>
  );
  return (
    <View style={s.root} testID={testID}>
      <ScreenHeader title={title} onBack={onBack} action={action} />
      {noScroll ? (
        <View style={[s.flex, s.noScrollBody]}>{children}</View>
      ) : keyboard ? (
        <AppKeyboardScrollView style={s.flex} contentContainerStyle={[s.scrollContent, { paddingBottom: bottomPad }]}>{content}</AppKeyboardScrollView>
      ) : (
        <ScrollView style={s.flex} contentContainerStyle={[s.scrollContent, { paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled">{content}</ScrollView>
      )}
      {footer && noScroll ? <View style={[s.footer, { paddingBottom: bottomPad }]}>{footer}</View> : null}
    </View>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode; testID?: string }> = ({ children, testID }) => (
  <Text style={s.sectionTitle} accessibilityRole="header" testID={testID}>{children}</Text>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={s.sectionLabel} accessibilityRole="header">{children}</Text>
);

export const Helper: React.FC<{ children: React.ReactNode; size?: 'small' | 'body'; center?: boolean }> = ({ children, size = 'small', center }) => (
  <Text style={[size === 'small' ? s.helperSmall : s.helperBody, center && s.center]}>{children}</Text>
);

/** Body Small text (12 Medium, muted) for use inside cards. */
export const BodyText: React.FC<{ children: React.ReactNode; numberOfLines?: number; testID?: string }> = ({ children, numberOfLines, testID }) => (
  <Text style={s.cardBody} numberOfLines={numberOfLines} testID={testID}>{children}</Text>
);

// ─── Cards ───────────────────────────────────────────────────────────────────

export type Tone = 'default' | 'info' | 'success' | 'danger';
const TONE: Record<Tone, ViewStyle> = {
  default: { backgroundColor: tc.card, borderColor: tc.border },
  info: { backgroundColor: tc.softBlue, borderColor: tc.border },
  success: { backgroundColor: tc.softGreen, borderColor: tc.border },
  danger: { backgroundColor: tc.softRed, borderColor: tc.danger },
};

interface CardProps {
  title?: string;
  body?: string;
  tone?: Tone;
  /** Success / danger cards with the strong semantic border (Figma hero and banner cards). */
  strongBorder?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({ title, body, tone = 'default', strongBorder, onPress, children, style, testID, accessibilityLabel }) => {
  const border = strongBorder && tone === 'success' ? { borderColor: tc.success } : null;
  const inner = (
    <>
      {title ? <Text style={s.cardTitle}>{title}</Text> : null}
      {body ? <Text style={s.cardBody}>{body}</Text> : null}
      {children}
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={[s.card, TONE[tone], border, style]} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? [title, body].filter(Boolean).join(', ')} testID={testID}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[s.card, TONE[tone], border, style]} testID={testID}>{inner}</View>;
};

// ─── List Row (20:260) ───────────────────────────────────────────────────────

interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
  tone?: 'default' | 'danger';
  selected?: boolean;
  testID?: string;
  accessibilityHint?: string;
}

export const Chevron: React.FC<{ color?: string }> = ({ color = tc.textFaint }) => (
  <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={color} />
);

export const ListRow: React.FC<ListRowProps> = ({ title, subtitle, onPress, right, chevron = true, tone = 'default', selected, testID, accessibilityHint }) => {
  const content = (
    <>
      <View style={s.rowCopy}>
        <Text style={[s.cardTitle, tone === 'danger' && { color: tc.danger }]} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={s.cardBody} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron && onPress ? <Chevron /> : null}
    </>
  );
  return onPress ? (
    <TouchableOpacity style={[s.listRow, selected && s.listRowOn]} onPress={onPress} activeOpacity={0.85} accessibilityRole={selected === undefined ? 'button' : 'radio'} accessibilityState={selected === undefined ? undefined : { selected }} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} accessibilityHint={accessibilityHint} testID={testID}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={s.listRow} testID={testID} accessible accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>{content}</View>
  );
};

// ─── Metric Card (17:28) ─────────────────────────────────────────────────────

export const MetricCard: React.FC<{ label: string; value: string; helper?: string; onPress?: () => void; testID?: string }> = ({ label, value, helper, onPress, testID }) => {
  const inner = (
    <>
      <Text style={s.metricLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {helper ? <Text style={s.metricHelper} numberOfLines={1}>{helper}</Text> : null}
    </>
  );
  return onPress ? (
    <TouchableOpacity style={s.metric} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${label}: ${value} ${helper ?? ''}`} testID={testID}>{inner}</TouchableOpacity>
  ) : (
    <View style={s.metric} accessible accessibilityLabel={`${label}: ${value} ${helper ?? ''}`} testID={testID}>{inner}</View>
  );
};

export const MetricRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <View style={s.metricRow}>{children}</View>;

// ─── Scope Row (17:33 / 17:40) ───────────────────────────────────────────────

export const Radio: React.FC<{ selected: boolean }> = ({ selected }) => (
  <View style={[s.radio, selected && s.radioOn]}>{selected ? <View style={s.radioDot} /> : null}</View>
);

export const ScopeRow: React.FC<{ title: string; subtitle?: string; selected: boolean; onPress: () => void; testID?: string }> = ({ title, subtitle, selected, onPress, testID }) => (
  <TouchableOpacity style={[s.scopeRow, selected && s.scopeRowOn]} onPress={onPress} activeOpacity={0.85} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} testID={testID}>
    <View style={s.rowCopy}>
      <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={s.cardBody} numberOfLines={2}>{subtitle}</Text> : null}
    </View>
    <Radio selected={selected} />
  </TouchableOpacity>
);

export const CheckRow: React.FC<{ title: string; subtitle?: string; checked: boolean; onPress: () => void; testID?: string }> = ({ title, subtitle, checked, onPress, testID }) => (
  <TouchableOpacity style={s.checkRow} onPress={onPress} activeOpacity={0.85} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} testID={testID}>
    <View style={s.rowCopy}>
      <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={s.cardBody} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
    <View style={[s.checkbox, checked && s.checkboxOn]}>{checked ? <Ionicons name="checkmark" size={16} color={tc.onNavy} /> : null}</View>
  </TouchableOpacity>
);

/** Selectable option card (Count setup "Scan mode" / "List mode"): info fill when selected. */
export const OptionCard: React.FC<{ title: string; body: string; selected: boolean; onPress: () => void; testID?: string }> = ({ title, body, selected, onPress, testID }) => (
  <TouchableOpacity style={[s.card, selected ? TONE.info : TONE.default, selected && s.optionOn]} onPress={onPress} activeOpacity={0.85} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${title}, ${body}`} testID={testID}>
    <Text style={s.cardTitle}>{title}</Text>
    <Text style={s.cardBody}>{body}</Text>
  </TouchableOpacity>
);

// ─── Toggle Row (20:270) ─────────────────────────────────────────────────────

export const ToggleRow: React.FC<{ title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }> = ({ title, subtitle, value, onChange, testID }) => (
  <View style={s.listRow} testID={testID}>
    <View style={s.rowCopy}>
      <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={s.cardBody} numberOfLines={3}>{subtitle}</Text> : null}
    </View>
    <AppSwitch value={value} onValueChange={onChange} accessibilityLabel={title} />
  </View>
);

// ─── Product Count Row (17:46) ───────────────────────────────────────────────

interface CountRowProps {
  name: string;
  meta: string;
  quantity: string;
  counted: boolean;
  onMinus: () => void;
  onPlus: () => void;
  onQuantityPress: () => void;
  testID?: string;
  labels: { minus: string; plus: string; quantity: string };
}

export const ProductCountRow: React.FC<CountRowProps> = ({ name, meta, quantity, counted, onMinus, onPlus, onQuantityPress, testID, labels }) => (
  <View style={s.countRow} testID={testID}>
    <View style={s.rowCopy}>
      <Text style={s.cardTitle} numberOfLines={2}>{name}</Text>
      <Text style={s.cardBody} numberOfLines={2}>{meta}</Text>
    </View>
    <TouchableOpacity style={s.stepper} onPress={onMinus} accessibilityRole="button" accessibilityLabel={labels.minus} testID={testID ? `${testID}-minus` : undefined}>
      <Text style={s.stepperText}>−</Text>
    </TouchableOpacity>
    <TouchableOpacity style={s.qtyBox} onPress={onQuantityPress} accessibilityRole="button" accessibilityLabel={labels.quantity} testID={testID ? `${testID}-qty` : undefined}>
      <Text style={[s.qtyText, !counted && s.qtyEmpty]} numberOfLines={1} adjustsFontSizeToFit>{quantity}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={s.stepper} onPress={onPlus} accessibilityRole="button" accessibilityLabel={labels.plus} testID={testID ? `${testID}-plus` : undefined}>
      <Text style={s.stepperText}>+</Text>
    </TouchableOpacity>
  </View>
);

// ─── Progress, chips, badges ─────────────────────────────────────────────────

export const ProgressBar: React.FC<{ percent: number; testID?: string }> = ({ percent, testID }) => {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={s.track} testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: p }}>
      <View style={[s.fill, { width: `${p}%` }]} />
    </View>
  );
};

export const Chip: React.FC<{ label: string; active: boolean; onPress: () => void; testID?: string }> = ({ label, active, onPress, testID }) => (
  <TouchableOpacity style={[s.chip, active && s.chipOn]} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} testID={testID}>
    <Text style={[s.chipText, active && s.chipTextOn]} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

/** One row of chips; scrolls sideways when they do not fit (Figma keeps chips on one line). */
export const ChipRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} keyboardShouldPersistTaps="handled">{children}</ScrollView>
);

// ─── Required-States card (docs/figma/states) ────────────────────────────────

export interface StateAction { label: string; onPress: () => void; variant?: 'primary' | 'danger'; testID?: string }

export const StateCard: React.FC<{ title: string; body: string; tone: 'info' | 'success' | 'danger'; actions?: StateAction[]; testID?: string }> = ({ title, body, tone, actions = [], testID }) => (
  <View style={[s.stateCard, tone === 'danger' ? s.stateDanger : tone === 'success' ? s.stateSuccess : s.stateInfo]} testID={testID} accessibilityRole="summary">
    <Text style={s.sectionTitle}>{title}</Text>
    <Text style={s.cardBody}>{body}</Text>
    {actions.length ? (
      <View style={s.stateActions}>
        {actions.map(a => <AppButton key={a.label} label={a.label} onPress={a.onPress} variant={a.variant ?? 'primary'} compact testID={a.testID} />)}
      </View>
    ) : null}
  </View>
);

// ─── Keypad (Quick quantity 21:471) ──────────────────────────────────────────

export const Keypad: React.FC<{ onKey: (k: string) => void; onClear: () => void; onDone: () => void; labels: { clear: string; done: string; decimal: string }; allowDecimal: boolean }> = ({ onKey, onClear, onDone, labels, allowDecimal }) => {
  const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];
  const key = (label: string, onPress: () => void, primary = false, a11y?: string) => (
    <TouchableOpacity key={label} style={[s.key, primary && s.keyPrimary]} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={a11y ?? label} testID={`key-${label}`}>
      <Text style={[s.keyText, primary && s.keyTextPrimary]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={s.keypad}>
      {rows.map(r => <View key={r.join('')} style={s.keyRow}>{r.map(d => key(d, () => onKey(d)))}</View>)}
      <View style={s.keyRow}>
        {key(labels.clear, onClear)}
        {key('0', () => onKey('0'))}
        {key(labels.done, onDone, true)}
      </View>
      {allowDecimal ? <View style={s.keyRow}>{key('.', () => onKey('.'), false, labels.decimal)}</View> : null}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const shadow = { shadowColor: tc.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tc.warm },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  body: { padding: GUTTER, gap: GAP },
  noScrollBody: { paddingHorizontal: GUTTER, paddingTop: GUTTER, gap: GAP },
  inlineFooter: { gap: GAP, marginTop: 4 },
  footer: { paddingHorizontal: GUTTER, paddingTop: GAP, gap: GAP, backgroundColor: tc.warm },
  sectionTitle: { ...tcType.sectionTitle, color: tc.textPrimary },
  sectionLabel: { ...tcType.sectionLabel, color: tc.textMuted },
  helperSmall: { ...tcType.bodySmall, color: tc.textMuted },
  helperBody: { ...tcType.body, color: tc.textMuted },
  center: { textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 5, ...shadow },
  optionOn: { borderColor: tc.navy },
  cardTitle: { ...tcType.cardTitle, color: tc.textPrimary },
  cardBody: { ...tcType.bodySmall, color: tc.textMuted },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  listRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingStart: 14, paddingEnd: 12, paddingVertical: 12 },
  listRowOn: { borderWidth: 2, borderColor: tc.navy, paddingStart: 13, paddingEnd: 11, paddingVertical: 11 },
  metricRow: { flexDirection: 'row', gap: 16 },
  metric: { flex: 1, minHeight: 94, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 4, ...shadow },
  metricLabel: { ...tcType.cardLabel, color: tc.textMuted },
  metricValue: { ...tcType.cardValue, color: tc.textPrimary },
  metricHelper: { ...tcType.micro, color: tc.textFaint },
  scopeRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  scopeRowOn: { borderWidth: 2, borderColor: tc.navy, paddingHorizontal: 15, paddingVertical: 11 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: tc.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: tc.navy, backgroundColor: tc.navy },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tc.accent },
  checkRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: tc.border, alignItems: 'center', justifyContent: 'center', backgroundColor: tc.card },
  checkboxOn: { backgroundColor: tc.navy, borderColor: tc.navy },
  countRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, padding: 12 },
  stepper: { width: 44, height: 44, borderRadius: 8, backgroundColor: tc.inputMuted, alignItems: 'center', justifyContent: 'center' },
  stepperText: { ...tcType.button, color: tc.textPrimary },
  qtyBox: { minWidth: 50, height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  qtyText: { ...tcType.cardValue, color: tc.textPrimary, writingDirection: 'ltr' },
  qtyEmpty: { color: tc.textFaint },
  track: { height: 5, borderRadius: 999, backgroundColor: tc.inputMuted, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 999, backgroundColor: tc.accent },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: tc.border, backgroundColor: tc.card, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: tc.navy, borderColor: tc.navy },
  chipText: { ...tcType.cardLabel, color: tc.textPrimary },
  chipTextOn: { color: tc.onNavy },
  stateCard: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  stateInfo: { backgroundColor: tc.softBlue, borderColor: tc.border },
  stateSuccess: { backgroundColor: tc.softGreen, borderColor: tc.success },
  stateDanger: { backgroundColor: tc.softRed, borderColor: tc.danger },
  stateActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keypad: { gap: 8 },
  /** Number pads read 1-2-3 left to right in every language (UI_RULES #7). */
  keyRow: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', gap: 8 },
  key: { flex: 1, height: 54, borderRadius: 12, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, alignItems: 'center', justifyContent: 'center' },
  keyPrimary: { backgroundColor: tc.navy, borderColor: tc.navy },
  keyText: { ...tcType.button, color: tc.textPrimary },
  keyTextPrimary: { color: tc.onNavy },
});
