/**
 * AppButton — Figma "Button / Primary" (17:7) and "Button / Secondary" (17:9):
 * full width, 50dp, radius 12. `danger` is the red state-card action; `compact` is the
 * 44dp state-card button. Long translations shrink to 75 % instead of wrapping.
 */
import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Text } from '../ui/Text';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityHint?: string;
}

export const AppButton: React.FC<Props> = ({
  label, onPress, variant = 'primary', disabled = false, loading = false, compact = false, style, textStyle, testID, accessibilityHint,
}) => {
  const isDisabled = disabled || loading;
  const onDark = variant === 'primary' || variant === 'danger';
  return (
    <TouchableOpacity
      style={[s.base, compact && s.compact, s[variant], isDisabled && s.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
    >
      {loading
        ? <ActivityIndicator color={onDark ? tc.onNavy : tc.navy} size="small" />
        : (
          <Text
            style={[s.text, onDark ? s.textOnDark : s.textOnLight, isDisabled && s.textDisabled, textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {label}
          </Text>
        )}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  base: { minHeight: 50, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  compact: { minHeight: 44, paddingHorizontal: 14, alignSelf: 'auto', flexGrow: 1, flexBasis: 0 },
  primary: { backgroundColor: tc.navy },
  secondary: { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border },
  danger: { backgroundColor: tc.danger },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: tc.border, borderColor: tc.border },
  text: { ...tcType.button, textAlign: 'center' },
  textOnDark: { color: tc.onNavy },
  textOnLight: { color: tc.textPrimary },
  textDisabled: { color: tc.textFaint },
});
