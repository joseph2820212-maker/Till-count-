/**
 * fields.tsx — Figma "Input Field" (20:266): label above (12 Medium, muted), 50dp box,
 * radius 12, 1dp border. TextField types; SelectField opens an OptionSheet; SearchField
 * has the ⌕ glyph. Numeric / barcode / SKU values stay LTR in Arabic.
 */
import React, { useState } from 'react';
import { I18nManager, StyleSheet, TouchableOpacity, View, type KeyboardTypeOptions } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { AppTextInput } from '../components/AppTextInput';
import { normalizeArabicNumerals } from '../utils/locale';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { OptionSheet, type Option } from './overlays';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Numbers, barcodes, SKUs: forced LTR and Western digits. */
  ltr?: boolean;
  secure?: boolean;
  error?: string;
  hint?: string;
  maxLength?: number;
  autoFocus?: boolean;
  testID?: string;
  onSubmitEditing?: () => void;
  right?: React.ReactNode;
  multiline?: boolean;
  /** Read-only value (shown, not editable). */
  editable?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default', ltr, secure, error, hint, maxLength, autoFocus, testID, onSubmitEditing, right, multiline, editable = true,
}) => {
  const numeric = keyboardType === 'decimal-pad' || keyboardType === 'number-pad' || keyboardType === 'numeric';
  const forceLtr = ltr || numeric;
  return (
    <View style={s.wrap}>
      <Text style={s.label} numberOfLines={2}>{label}</Text>
      <View style={[s.box, multiline && s.boxMulti, !!error && s.boxError, !editable && s.boxReadOnly]}>
        <AppTextInput
          style={[s.input, multiline && s.inputMulti, forceLtr && I18nManager.isRTL ? s.ltrInput : null]}
          value={value}
          onChangeText={v => onChangeText(numeric ? normalizeArabicNumerals(v) : v)}
          placeholder={placeholder}
          placeholderTextColor={tc.textFaint}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCapitalize={secure || forceLtr ? 'none' : 'sentences'}
          autoCorrect={!secure && !forceLtr}
          maxLength={maxLength}
          autoFocus={autoFocus}
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          testID={testID}
          multiline={multiline}
          editable={editable}
        />
        {right}
      </View>
      {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
};

export function SelectField<T extends string>({ label, value, options, onChange, placeholder, testID, sheetTitle }: {
  label: string; value: T | undefined; options: Option<T>[]; onChange: (v: T) => void; placeholder?: string; testID?: string; sheetTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <View style={s.wrap}>
      <Text style={s.label} numberOfLines={2}>{label}</Text>
      <TouchableOpacity style={s.box} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${current?.label ?? placeholder ?? ''}`} testID={testID}>
        <Text style={[s.value, !current && s.placeholder]} numberOfLines={1}>{current?.label ?? placeholder ?? ''}</Text>
        <Ionicons name="chevron-down" size={18} color={tc.textFaint} />
      </TouchableOpacity>
      <OptionSheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? label} options={options} value={value} onSelect={onChange} />
    </View>
  );
}

/** A field-shaped button (e.g. "Barcode — Scan or type" opening the scanner). */
export const ActionField: React.FC<{ label: string; value?: string; placeholder: string; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name']; testID?: string; ltr?: boolean }> = ({ label, value, placeholder, onPress, icon = 'barcode-outline', testID, ltr }) => (
  <View style={s.wrap}>
    <Text style={s.label}>{label}</Text>
    <TouchableOpacity style={s.box} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value || placeholder}`} testID={testID}>
      <Text style={[s.value, !value && s.placeholder, ltr && !!value && s.ltrText]} numberOfLines={1}>{value || placeholder}</Text>
      <Ionicons name={icon} size={20} color={tc.navy} />
    </TouchableOpacity>
  </View>
);

export const SearchField: React.FC<{ value: string; onChangeText: (v: string) => void; placeholder: string; testID?: string }> = ({ value, onChangeText, placeholder, testID }) => (
  <View style={[s.box, s.search]}>
    <Text style={s.searchGlyph} accessibilityElementsHidden importantForAccessibility="no">⌕</Text>
    <AppTextInput
      style={s.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tc.textMuted}
      returnKeyType="search"
      autoCorrect={false}
      accessibilityLabel={placeholder}
      testID={testID}
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="clear" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close-circle" size={18} color={tc.textFaint} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const s = StyleSheet.create({
  wrap: { gap: 5 },
  label: { ...tcType.bodySmall, color: tc.textMuted },
  box: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderRadius: 12, paddingHorizontal: 14 },
  boxMulti: { alignItems: 'flex-start', paddingVertical: 10, minHeight: 96 },
  boxError: { borderColor: tc.danger },
  boxReadOnly: { backgroundColor: tc.inputMuted },
  /** Inputs align to the reading start (Android aligns by the typed text otherwise). */
  input: { flex: 1, ...tcType.input, color: tc.textPrimary, paddingVertical: 12, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  inputMulti: { textAlignVertical: 'top', paddingVertical: 0 },
  /** Numbers / codes read left to right but still start at the RTL edge. */
  ltrInput: { writingDirection: 'ltr', textAlign: 'right' },
  ltrText: { writingDirection: 'ltr' },
  value: { flex: 1, ...tcType.input, color: tc.textPrimary },
  placeholder: { color: tc.textFaint },
  error: { ...tcType.bodySmall, color: tc.danger },
  hint: { ...tcType.bodySmall, color: tc.textFaint },
  search: { gap: 8 },
  searchGlyph: { fontSize: 18, color: tc.textFaint },
});
