/**
 * ScreenHeader — Till-family navy header (donor ScreenHeader, TillCount Figma
 * "Screen Header / Main" 17:12 and "Screen Header / Back" 17:21): centred title,
 * symmetric 44dp side slots, 24dp icons. The back chevron mirrors in Arabic.
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar, I18nManager } from 'react-native';
import { Text } from '../ui/Text';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { HeaderTopBleed } from './HeaderTopBleed';

export interface HeaderAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  label: string;
  testID?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** End-slot action. The overflow "⋯" is `{ icon: 'ellipsis-horizontal', … }`. */
  action?: HeaderAction;
}

/** Touch slot ≥ 44 dp (plus hitSlop). */
export const SLOT = 44;
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, onBack, action }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View testID="screen-header" style={[s.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <HeaderTopBleed color={tc.navy} />
      <StatusBar barStyle="light-content" backgroundColor={tc.navy} />
      <View style={s.slot} testID="screen-header-start">
        {onBack ? (
          <TouchableOpacity style={s.slot} onPress={onBack} activeOpacity={0.7} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={t('common.back')} testID="header-back">
            <Ionicons name="chevron-back" size={24} color={tc.onNavy} style={I18nManager.isRTL ? s.mirror : undefined} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={s.center}>
        <Text style={s.title} numberOfLines={2} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={s.slot} testID="screen-header-end">
        {action ? (
          <TouchableOpacity style={s.slot} onPress={action.onPress} activeOpacity={0.7} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={action.label} testID={action.testID ?? 'header-action'}>
            <Ionicons name={action.icon} size={24} color={tc.onNavy} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { backgroundColor: tc.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, gap: 8, minHeight: 78 },
  slot: { width: SLOT, height: SLOT, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: SLOT },
  title: { ...tcType.screenTitle, color: tc.onNavy, textAlign: 'center' },
  subtitle: { ...tcType.bodySmall, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  mirror: { transform: [{ scaleX: -1 }] },
});
