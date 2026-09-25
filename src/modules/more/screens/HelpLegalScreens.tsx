/**
 * 59 Help (28:1328) · 60 Questions (28:1382) · 61 About TillCount (28:1409) · 62 Privacy policy (28:1466) ·
 * 63 Terms (28:1491) · 64 Data storage (29:1399) · 65 Disclaimer (29:1424) · 66 Licences (29:1449)
 */
import React, { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../components/AppButton';
import { Card, Helper, ListRow, Screen, SectionTitle } from '../../../ui/kit';
import { tc } from '../../../theme/colors';
import { tcType } from '../../../theme/typography';
import { APP_NAME, APP_VERSION, COMPANY_DETAILS, EFFECTIVE_DATE, EMAILS, PUBLISHER } from '../../../appMeta';
import { useNav } from '../../../navigation/nav';
import { OSS_COUNT, OSS_PACKAGES } from '../content/openSourceLicenses';
import { OSS_LICENSE_TEXTS } from '../content/openSourceLicenseTexts';
import { dot } from '../../../utils/format';
import { localDate } from '../../../utils/locale';

/** Interpolation values shared by legal, help and support strings. */
export function legalVars(t: (k: string) => string): Record<string, string> {
  return {
    app: APP_NAME,
    publisher: PUBLISHER,
    supportEmail: EMAILS.support,
    privacyEmail: EMAILS.privacy,
    legalEmail: EMAILS.legal,
    securityEmail: EMAILS.security,
    companyNumber: COMPANY_DETAILS.registrationNumber,
    registeredOffice: COMPANY_DETAILS.registeredOffice,
    jurisdiction: COMPANY_DETAILS.governingJurisdiction,
    vatStatus: t('legal.vatNotRegistered'),
    date: localDate(`${EFFECTIVE_DATE}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

/**
 * Support email body: app version, platform and OS only. Never the catalogue, counts,
 * backups or passwords (handoff §16).
 */
export function supportMailUrl(t: (k: string, o?: Record<string, unknown>) => string): string {
  const subject = encodeURIComponent(t('support.subject', { app: APP_NAME }));
  const body = encodeURIComponent(t('support.body', { app: APP_NAME, version: APP_VERSION, platform: Platform.OS, os: String(Platform.Version) }));
  return `mailto:${EMAILS.support}?subject=${subject}&body=${body}`;
}

// ─── 59 Help ─────────────────────────────────────────────────────────────────

const HELP_TOPICS = ['start', 'scan', 'caseLoose', 'reorder', 'import', 'backup', 'support'] as const;

export const HelpScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [open, setOpen] = useState<string | null>(null);
  const vars = legalVars(t);
  return (
    <Screen title={t('screens.Help')} onBack={() => nav.goBack()} testID="screen-Help" footer={<AppButton label={t('screens.Questions')} variant="secondary" onPress={() => nav.navigate('Questions')} testID="help-questions" />}>
      <SectionTitle>{t('help.title')}</SectionTitle>
      {HELP_TOPICS.map(k => (
        <View key={k} style={{ gap: 8 }}>
          <ListRow title={t(`help.${k}.title`)} subtitle={t(`help.${k}.body`)} onPress={() => setOpen(open === k ? null : k)} testID={`help-${k}`} />
          {open === k ? (
            <Card tone="info" testID={`help-article-${k}`}>
              {[1, 2, 3].map(i => {
                const text = t(`help.${k}.a${i}`, { ...vars, defaultValue: '' });
                return text ? <Text key={i} style={s.article}>{text}</Text> : null;
              })}
              {k === 'support' ? <AppButton label={t('support.email', { email: EMAILS.support })} onPress={() => { void Linking.openURL(supportMailUrl(t)).catch(() => undefined); }} testID="help-email" /> : null}
            </Card>
          ) : null}
        </View>
      ))}
    </Screen>
  );
};

// ─── 60 Questions ────────────────────────────────────────────────────────────

const FAQ = ['internet', 'live', 'skipped', 'noBarcode', 'caseLoose', 'value', 'reorder', 'backup', 'transfer'] as const;

export const QuestionsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  return (
    <Screen title={t('screens.Questions')} onBack={() => nav.goBack()} testID="screen-Questions">
      <SectionTitle>{t('faq.title')}</SectionTitle>
      {FAQ.map((k, i) => <Card key={k} tone={i === 0 ? 'info' : 'default'} title={t(`faq.${k}.q`)} body={t(`faq.${k}.a`)} testID={`faq-${k}`} />)}
    </Screen>
  );
};

// ─── 61 About ────────────────────────────────────────────────────────────────

export const AboutScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [support, setSupport] = useState(false);
  return (
    <Screen title={t('screens.About')} onBack={() => nav.goBack()} testID="screen-About">
      <SectionTitle>{APP_NAME}</SectionTitle>
      <Card tone="info" title={t('about.tagline')} body={t('about.body')} />
      <ListRow title={t('about.version')} subtitle={APP_VERSION} chevron={false} testID="about-version" />
      <ListRow title={t('about.support')} subtitle={t('about.supportBody')} onPress={() => setSupport(x => !x)} testID="about-support" />
      {support ? (
        <Card tone="info" title={t('support.title')} body={t('support.guidance', legalVars(t))} testID="about-support-card">
          <AppButton label={t('support.email', { email: EMAILS.support })} onPress={() => { void Linking.openURL(supportMailUrl(t)).catch(() => undefined); }} testID="about-email" />
        </Card>
      ) : null}
      <ListRow title={t('screens.Privacy')} subtitle={t('about.privacyBody')} onPress={() => nav.navigate('Privacy')} testID="about-privacy" />
      <ListRow title={t('screens.Terms')} subtitle={t('about.termsBody')} onPress={() => nav.navigate('Terms')} testID="about-terms" />
      <ListRow title={t('about.dataStorage')} subtitle={t('about.dataStorageBody')} onPress={() => nav.navigate('DataStorage')} testID="about-data-storage" />
      <ListRow title={t('screens.Disclaimer')} subtitle={t('about.disclaimerBody')} onPress={() => nav.navigate('Disclaimer')} testID="about-disclaimer" />
      <ListRow title={t('about.licences')} subtitle={t('about.licencesBody')} onPress={() => nav.navigate('Licences')} testID="about-licences" />
      <Helper>{t('legal.companyNote', legalVars(t))}</Helper>
    </Screen>
  );
};

// ─── 62–65 Legal documents ───────────────────────────────────────────────────

export type LegalDocId = 'privacy' | 'terms' | 'dataStorage' | 'disclaimer';
export const LEGAL_SECTIONS: Record<LegalDocId, number> = { privacy: 10, terms: 11, dataStorage: 6, disclaimer: 6 };
const LEGAL_ROUTE: Record<LegalDocId, 'Privacy' | 'Terms' | 'DataStorage' | 'Disclaimer'> = { privacy: 'Privacy', terms: 'Terms', dataStorage: 'DataStorage', disclaimer: 'Disclaimer' };

const LegalDoc: React.FC<{ id: LegalDocId }> = ({ id }) => {
  const { t } = useTranslation();
  const nav = useNav();
  const vars = legalVars(t);
  return (
    <Screen title={t(`screens.${LEGAL_ROUTE[id]}`)} onBack={() => nav.goBack()} testID={`screen-${LEGAL_ROUTE[id]}`}>
      <SectionTitle>{t(`legal.${id}.heading`)}</SectionTitle>
      <Text style={s.updated}>{t('legal.lastUpdated', vars)}</Text>
      {Array.from({ length: LEGAL_SECTIONS[id] }, (_, i) => i + 1).map(n => (
        <View key={n} style={s.doc} testID={`legal-${id}-${n}`}>
          <Text style={s.docHeading} accessibilityRole="header">{t(`legal.${id}.h${n}`, vars)}</Text>
          <Text style={s.docBody}>{t(`legal.${id}.p${n}`, vars)}</Text>
        </View>
      ))}
      <Helper>{t('legal.companyNote', vars)}</Helper>
    </Screen>
  );
};

export const PrivacyScreen: React.FC = () => <LegalDoc id="privacy" />;
export const TermsScreen: React.FC = () => <LegalDoc id="terms" />;
export const DataStorageScreen: React.FC = () => <LegalDoc id="dataStorage" />;
export const DisclaimerScreen: React.FC = () => <LegalDoc id="disclaimer" />;

// ─── 66 Licences ─────────────────────────────────────────────────────────────

const FEATURED = [
  { name: 'React Native', pkg: 'react-native' },
  { name: 'Expo', pkg: 'expo' },
  { name: 'React Navigation', pkg: '@react-navigation/native' },
  { name: 'i18next', pkg: 'i18next' },
];

export const LicencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const byName = useMemo(() => new Map(OSS_PACKAGES.map(p => [p.name, p])), []);
  const textFor = (pkg: string) => { const p = byName.get(pkg); return p && p.textIndex >= 0 ? OSS_LICENSE_TEXTS[p.textIndex] : ''; };
  return (
    <Screen title={t('screens.Licences')} onBack={() => nav.goBack()} testID="screen-Licences">
      <SectionTitle>{t('licences.title')}</SectionTitle>
      <Helper size="body">{t('licences.intro', { count: OSS_COUNT })}</Helper>
      {FEATURED.map(f => {
        const p = byName.get(f.pkg);
        return (
          <View key={f.pkg} style={{ gap: 8 }}>
            <ListRow title={f.name} subtitle={t('licences.licence', { licence: p?.license ?? 'MIT', version: p?.version ?? '' })} onPress={() => setOpen(open === f.pkg ? null : f.pkg)} testID={`licence-${f.pkg}`} />
            {open === f.pkg ? <Card><Text style={s.licence}>{textFor(f.pkg)}</Text></Card> : null}
          </View>
        );
      })}
      <ListRow title={t('licences.other')} subtitle={t('licences.otherBody', { count: OSS_COUNT })} onPress={() => setAll(x => !x)} testID="licence-all" />
      {all ? OSS_PACKAGES.map(p => (
        <ListRow key={p.name} title={p.name} subtitle={`${p.version}${dot()}${p.license}`} onPress={() => setOpen(open === p.name ? null : p.name)} chevron={p.textIndex >= 0} />
      )) : null}
      {all && open && !FEATURED.some(f => f.pkg === open) ? <Card><Text style={s.licence}>{textFor(open)}</Text></Card> : null}
    </Screen>
  );
};

const s = StyleSheet.create({
  article: { ...tcType.bodySmall, color: tc.textPrimary },
  updated: { ...tcType.micro, color: tc.textFaint },
  doc: { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.rule, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  docHeading: { ...tcType.cardTitle, color: tc.textPrimary },
  docBody: { ...tcType.bodySmall, color: tc.textMuted },
  licence: { ...tcType.micro, color: tc.textMuted, writingDirection: 'ltr' },
});
