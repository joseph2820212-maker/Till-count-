/**
 * overlays.tsx — the Required-States dialog (a StateCard over a dimmed backdrop), the
 * header overflow "⋯" menu and the option picker used by select fields.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { PickerSheet } from '../components/PickerSheet';
import { StateCard, type StateAction } from './kit';

export const StateDialog: React.FC<{
  visible: boolean;
  title: string;
  body: string;
  tone: 'info' | 'success' | 'danger';
  actions: StateAction[];
  onDismiss: () => void;
  testID?: string;
}> = ({ visible, title, body, tone, actions, onDismiss, testID }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
    <Pressable style={s.backdrop} onPress={onDismiss} accessibilityRole="button" accessibilityLabel={title}>
      <Pressable style={s.dialog} onPress={() => undefined}>
        <StateCard title={title} body={body} tone={tone} actions={actions} testID={testID} />
      </Pressable>
    </Pressable>
  </Modal>
);

export interface MenuItem { label: string; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name']; testID?: string }

export const OverflowMenu: React.FC<{ visible: boolean; onClose: () => void; title?: string; items: MenuItem[] }> = ({ visible, onClose, title, items }) => (
  <PickerSheet visible={visible} onClose={onClose} title={title}>
    {items.map(item => (
      <TouchableOpacity
        key={item.label}
        style={s.menuRow}
        onPress={() => { onClose(); setTimeout(item.onPress, 250); }}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        testID={item.testID}
      >
        {item.icon ? <Ionicons name={item.icon} size={20} color={tc.navy} /> : null}
        <Text style={s.menuText} numberOfLines={2}>{item.label}</Text>
      </TouchableOpacity>
    ))}
  </PickerSheet>
);

export interface Option<T extends string> { value: T; label: string; subtitle?: string }

export function OptionSheet<T extends string>({ visible, onClose, title, options, value, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: Option<T>[]; value: T | undefined; onSelect: (v: T) => void;
}) {
  const { t } = useTranslation();
  return (
    <PickerSheet visible={visible} onClose={onClose} title={title}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={s.optionRow}
            onPress={() => { onSelect(o.value); onClose(); }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.subtitle ? `${o.label}, ${o.subtitle}` : o.label}
            testID={`option-${o.value}`}
          >
            <View style={s.optionCopy}>
              <Text style={[s.menuText, active && s.optionActive]} numberOfLines={2}>{o.label}</Text>
              {o.subtitle ? <Text style={s.optionSub} numberOfLines={1}>{o.subtitle}</Text> : null}
            </View>
            {active ? <Ionicons name="checkmark" size={20} color={tc.navy} accessibilityLabel={t('common.selected')} /> : null}
          </TouchableOpacity>
        );
      })}
    </PickerSheet>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: tc.overlay, justifyContent: 'center', padding: 16 },
  dialog: { alignSelf: 'stretch' },
  menuRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: tc.rule },
  menuText: { ...tcType.cardTitle, fontWeight: '600', color: tc.textPrimary, flexShrink: 1 },
  optionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: tc.rule },
  optionCopy: { flex: 1, gap: 2 },
  optionActive: { fontWeight: '800' },
  optionSub: { ...tcType.bodySmall, color: tc.textMuted },
});
