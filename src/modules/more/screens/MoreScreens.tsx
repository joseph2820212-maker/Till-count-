/**
 * 46 More (26:1018) · 47 Count settings (26:1100) · 48 Reorder settings (26:1141) ·
 * 49 Units & formats (26:1173) · 50 Currency (27:1168) · 51 Language (27:1213)
 */
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { Card, Helper, ListRow, Screen, SectionTitle, ToggleRow } from '../../../ui/kit';
import { SelectField } from '../../../ui/fields';
import { OverflowMenu } from '../../../ui/overlays';
import { tc } from '../../../theme/colors';
import { useAppState } from '../../../state/store';
import { updateSettings } from '../../../state/actions';
import i18n, { changeLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from '../../../i18n';
import { SYMBOL_MAP, setCurrencyOption, useCurrencyCode } from '../../../utils/currency';
import { setNumberFormatOverride } from '../../../utils/locale';
import { setDateFormat, unitLabel } from '../../../utils/format';
import { COUNT_UNITS, type AppSettings, type CountMode, type DateFormat, type NumberFormat, type VolumeUnit, type WeekStart, type WeightUnit, type WithoutTarget } from '../../../domain/types';
import { useNav } from '../../../navigation/nav';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = { en: 'English', ar: 'العربية', tr: 'Türkçe', fr: 'Français', es: 'Español', de: 'Deutsch' };

// ─── 46 More (tab root) ──────────────────────────────────────────────────────

export const MoreScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const lang = (i18n.language || 'en') as AppLanguage;
  return (
    <Screen title={t('screens.More')} tabRoot testID="screen-More" action={{ icon: 'ellipsis-horizontal', label: t('common.moreOptions'), onPress: () => setMenu(true) }}>
      <SectionTitle>{t('more.title')}</SectionTitle>
      <ListRow title={t('screens.CountSettings')} subtitle={t('more.countSettingsBody')} onPress={() => nav.navigate('CountSettings')} testID="more-count-settings" />
      <ListRow title={t('screens.ReorderSettings')} subtitle={t('more.reorderSettingsBody')} onPress={() => nav.navigate('ReorderSettings')} testID="more-reorder-settings" />
      <ListRow title={t('screens.UnitsFormats')} subtitle={t('more.unitsBody')} onPress={() => nav.navigate('UnitsFormats')} testID="more-units" />
      <ListRow title={t('screens.Language')} subtitle={LANGUAGE_LABELS[lang] ?? 'English'} onPress={() => nav.navigate('Language')} testID="more-language" />
      <ListRow title={t('screens.DataBackup')} subtitle={t('more.dataBody')} onPress={() => nav.navigate('DataBackup')} testID="more-data" />
      <ListRow title={t('more.help')} subtitle={t('more.helpBody')} onPress={() => nav.navigate('Help')} testID="more-help" />
      <ListRow title={t('screens.About')} subtitle={t('more.aboutBody')} onPress={() => nav.navigate('About')} testID="more-about" />
      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          { label: t('screens.Pro'), icon: 'star-outline', onPress: () => nav.navigate('Pro') },
          { label: t('screens.Currency'), icon: 'cash-outline', onPress: () => nav.navigate('Currency') },
          { label: t('screens.CountHistory'), icon: 'time-outline', onPress: () => nav.navigate('CountHistory') },
          { label: t('screens.FavouriteCounts'), icon: 'star-half-outline', onPress: () => nav.navigate('FavouriteCounts') },
          { label: t('screens.Categories'), icon: 'pricetags-outline', onPress: () => nav.navigate('Categories') },
          { label: t('screens.Suppliers'), icon: 'car-outline', onPress: () => nav.navigate('Suppliers') },
          { label: t('screens.Locations'), icon: 'location-outline', onPress: () => nav.navigate('Locations') },
        ]}
      />
    </Screen>
  );
};

/** Settings screens edit a local draft and save with one button (Figma "Save settings"). */
function useDraft() {
  const settings = useAppState(s => s.settings);
  const [draft, setDraft] = useState<AppSettings>(settings);
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setDraft(d => ({ ...d, [k]: v }));
  return { draft, set };
}

// ─── 47 Count settings ───────────────────────────────────────────────────────

export const CountSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { draft, set } = useDraft();
  const save = async () => { await updateSettings(draft); nav.goBack(); };
  return (
    <Screen title={t('screens.CountSettings')} onBack={() => nav.goBack()} testID="screen-CountSettings" footer={<AppButton label={t('settings.save')} onPress={save} testID="settings-save" />}>
      <ToggleRow title={t('setup.blindTitle')} subtitle={t('settings.blindBody')} value={draft.blindCount} onChange={v => set('blindCount', v)} testID="set-blind" />
      <ToggleRow title={t('settings.repeatTitle')} subtitle={t('settings.repeatBody')} value={draft.repeatedScanAddsOne} onChange={v => set('repeatedScanAddsOne', v)} testID="set-repeat" />
      <ToggleRow title={t('setup.caseLooseTitle')} subtitle={t('settings.caseLooseBody')} value={draft.caseLooseEnabled} onChange={v => set('caseLooseEnabled', v)} testID="set-case-loose" />
      <ToggleRow title={t('settings.hapticTitle')} subtitle={t('settings.hapticBody')} value={draft.haptics} onChange={v => set('haptics', v)} testID="set-haptic" />
      <SelectField<CountMode> label={t('settings.defaultMode')} value={draft.defaultCountMode} onChange={v => set('defaultCountMode', v)} options={[{ value: 'scan', label: t('settings.modeScan') }, { value: 'list', label: t('settings.modeList') }]} testID="set-mode" />
    </Screen>
  );
};

// ─── 48 Reorder settings ─────────────────────────────────────────────────────

export const ReorderSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { draft, set } = useDraft();
  const save = async () => { await updateSettings(draft); nav.goBack(); };
  return (
    <Screen title={t('screens.ReorderSettings')} onBack={() => nav.goBack()} testID="screen-ReorderSettings" footer={<AppButton label={t('settings.save')} onPress={save} testID="settings-save" />}>
      <ToggleRow title={t('settings.suggestTitle')} subtitle={t('settings.suggestBody')} value={draft.reorderShowSuggestions} onChange={v => set('reorderShowSuggestions', v)} testID="set-suggest" />
      <ToggleRow title={t('settings.groupTitle')} subtitle={t('settings.groupBody')} value={draft.reorderGroupBySupplier} onChange={v => set('reorderGroupBySupplier', v)} testID="set-group" />
      <SelectField<WithoutTarget> label={t('settings.withoutTarget')} value={draft.productsWithoutTarget} onChange={v => set('productsWithoutTarget', v)} options={[{ value: 'needsSetup', label: t('settings.withoutTargetSetup') }, { value: 'hide', label: t('settings.withoutTargetHide') }]} testID="set-without-target" />
      <Card tone="info" title={t('settings.noForecastTitle')} body={t('settings.noForecastBody')} />
    </Screen>
  );
};

// ─── 49 Units & formats ──────────────────────────────────────────────────────

export const UnitsFormatsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const { draft, set } = useDraft();
  const save = async () => {
    await updateSettings(draft);
    setNumberFormatOverride(draft.numberFormat);
    setDateFormat(draft.dateFormat);
    nav.goBack();
  };
  return (
    <Screen title={t('screens.UnitsFormats')} onBack={() => nav.goBack()} testID="screen-UnitsFormats" footer={<AppButton label={t('settings.saveFormats')} onPress={save} testID="settings-save" />}>
      <SelectField label={t('settings.defaultUnit')} value={draft.defaultCountUnit} onChange={v => set('defaultCountUnit', v)} options={COUNT_UNITS.map(u => ({ value: u, label: unitLabel(u) }))} testID="set-unit" />
      <SelectField<WeightUnit> label={t('settings.weight')} value={draft.weightUnit} onChange={v => set('weightUnit', v)} options={[{ value: 'kg', label: 'kg / g' }, { value: 'g', label: 'g / kg' }]} testID="set-weight" />
      <SelectField<VolumeUnit> label={t('settings.volume')} value={draft.volumeUnit} onChange={v => set('volumeUnit', v)} options={[{ value: 'l', label: 'L / ml' }, { value: 'ml', label: 'ml / L' }]} testID="set-volume" />
      <SelectField<NumberFormat> label={t('settings.numberFormat')} value={draft.numberFormat} onChange={v => set('numberFormat', v)} options={[{ value: 'auto', label: t('settings.followLanguage') }, { value: 'comma-dot', label: '1,234.56' }, { value: 'dot-comma', label: '1.234,56' }, { value: 'space-comma', label: '1 234,56' }]} testID="set-number" />
      <SelectField<DateFormat> label={t('settings.dateFormat')} value={draft.dateFormat} onChange={v => set('dateFormat', v)} options={[{ value: 'dmy', label: '24 Sep 2026' }, { value: 'mdy', label: 'Sep 24, 2026' }, { value: 'ymd', label: '2026-09-24' }]} testID="set-date" />
      <SelectField<WeekStart> label={t('settings.weekStarts')} value={draft.weekStart} onChange={v => set('weekStart', v)} options={[{ value: 'monday', label: t('settings.day.monday') }, { value: 'sunday', label: t('settings.day.sunday') }, { value: 'saturday', label: t('settings.day.saturday') }]} testID="set-week" />
      <ListRow title={t('screens.Currency')} subtitle={useCurrencyCode()} onPress={() => nav.navigate('Currency')} testID="units-currency" />
    </Screen>
  );
};

// ─── 50 Currency ─────────────────────────────────────────────────────────────

export const CurrencyScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const code = useCurrencyCode();
  return (
    <Screen title={t('screens.Currency')} onBack={() => nav.goBack()} testID="screen-Currency">
      <SectionTitle>{t('screens.Currency')}</SectionTitle>
      {Object.keys(SYMBOL_MAP).map(option => {
        const parts = option.split(' ');
        const c = parts[parts.length - 1];
        const selected = c === code;
        return (
          <ListRow
            key={option}
            title={`${c} · ${SYMBOL_MAP[option]}`}
            subtitle={selected ? t('common.selected') : t(`currencyNames.${c}`, { defaultValue: c })}
            selected={selected}
            onPress={() => { void setCurrencyOption(option).then(() => nav.goBack()); }}
            testID={`currency-${c}`}
          />
        );
      })}
      <Card tone="info" title={t('currency.noteTitle')} body={t('currency.noteBody')} />
    </Screen>
  );
};

// ─── 51 Language ─────────────────────────────────────────────────────────────

export const LanguageScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const current = (i18n.language || 'en') as AppLanguage;
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const pick = async (lang: AppLanguage) => {
    if (lang === current || busy) return;
    setBusy(true); setNotice('');
    try {
      const r = await changeLanguage(lang);
      if (r.rolledBack) setNotice(t('language.rolledBack', { lang: LANGUAGE_LABELS[lang] }));
    } catch { setNotice(t('language.failed')); } finally { setBusy(false); }
  };
  return (
    <Screen title={t('screens.Language')} onBack={() => nav.goBack()} testID="screen-Language">
      <SectionTitle>{t('screens.Language')}</SectionTitle>
      {busy ? <View style={{ alignItems: 'center' }}><ActivityIndicator color={tc.navy} /></View> : null}
      {notice ? <Card tone="danger" body={notice} /> : null}
      {SUPPORTED_LANGUAGES.map(lang => (
        <ListRow
          key={lang}
          title={LANGUAGE_LABELS[lang]}
          subtitle={lang === current ? t('common.selected') : t(`language.name.${lang}`)}
          selected={lang === current}
          onPress={() => { void pick(lang); }}
          testID={`language-${lang}`}
        />
      ))}
      <Helper>{t('language.reviewNote')}</Helper>
    </Screen>
  );
};
