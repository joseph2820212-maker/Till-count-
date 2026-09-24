/**
 * 69 Welcome (29:1546) · 70 How it works (29:1566) · 71 Camera permission (30:1473).
 * The camera is never required: "Type codes instead" finishes onboarding without asking.
 */
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/Text';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { AppButton } from '../../components/AppButton';
import { AppAlert } from '../../components/AppAlert';
import { Card, Helper, Screen, SectionTitle, StateCard } from '../../ui/kit';
import { tc } from '../../theme/colors';
import { tcType } from '../../theme/typography';
import { completeOnboarding, markCameraExplained } from '../../state/actions';
import { useNav } from '../../navigation/nav';
import { loadSampleData } from './sampleData';

export const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [busy, setBusy] = useState(false);
  const trySample = async () => {
    setBusy(true);
    try { await loadSampleData(); await completeOnboarding(); }
    catch { AppAlert.error(t('onboarding.sampleFailed')); }
    finally { setBusy(false); }
  };
  return (
    <Screen
      title={t('screens.Welcome')}
      testID="screen-Welcome"
      footer={(
        <>
          <AppButton label={t('onboarding.getStarted')} onPress={() => nav.navigate('HowItWorks')} testID="welcome-start" />
          <AppButton label={t('onboarding.trySample')} variant="secondary" onPress={trySample} loading={busy} testID="welcome-sample" />
        </>
      )}
    >
      <View style={s.hero} accessible accessibilityRole="header" accessibilityLabel={`TillCount. ${t('onboarding.tagline')}. ${t('onboarding.slogan')}`}>
        <Text style={s.appName}>TillCount</Text>
        <Text style={s.tagline}>{t('onboarding.tagline')}</Text>
        <Text style={s.slogan}>{t('onboarding.slogan')}</Text>
      </View>
      <Helper size="body" center>{t('onboarding.intro')}</Helper>
      <Helper center>{t('onboarding.sampleNote')}</Helper>
    </Screen>
  );
};

export const HowItWorksScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  return (
    <Screen title={t('screens.HowItWorks')} onBack={() => nav.goBack()} testID="screen-HowItWorks" footer={<AppButton label={t('common.continue')} onPress={() => nav.navigate('CameraPermission')} testID="how-continue" />}>
      <SectionTitle>{t('onboarding.steps')}</SectionTitle>
      <Card title={t('onboarding.step1Title')} body={t('onboarding.step1Body')} />
      <Card title={t('onboarding.step2Title')} body={t('onboarding.step2Body')} />
      <Card title={t('onboarding.step3Title')} body={t('onboarding.step3Body')} />
      <Card tone="success" title={t('onboarding.offlineTitle')} body={t('onboarding.offlineBody')} />
    </Screen>
  );
};

export const CameraPermissionScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNav();
  const [permission, requestPermission] = useCameraPermissions();
  const [asking, setAsking] = useState(false);
  const denied = !!permission && !permission.granted && !permission.canAskAgain;
  const finish = () => { void completeOnboarding(); };
  const allow = async () => {
    setAsking(true);
    try {
      await markCameraExplained();
      const r = await requestPermission();
      if (r.granted) finish();
    } finally { setAsking(false); }
  };
  return (
    <Screen
      title={t('screens.CameraPermission')}
      onBack={() => nav.goBack()}
      testID="screen-CameraPermission"
      footer={(
        <>
          {!denied ? <AppButton label={t('permission.allow')} onPress={allow} loading={asking} testID="camera-allow" /> : null}
          <AppButton label={t('permission.typeInstead')} variant="secondary" onPress={finish} testID="camera-type-instead" />
        </>
      )}
    >
      <View style={s.center}>
        <Ionicons name="camera-outline" size={64} color={tc.navy} />
        <Text style={s.camTitle}>{t('permission.title')}</Text>
        <Helper size="body" center>{t('permission.body')}</Helper>
      </View>
      <Card tone="info" title={t('permission.choiceTitle')} body={t('permission.choiceBody')} style={s.choice} />
      {denied ? (
        <StateCard
          tone="danger"
          title={t('states.cameraDenied.title')}
          body={t('states.cameraDenied.body')}
          testID="state-camera-denied"
          actions={[
            { label: t('states.cameraDenied.openSettings'), onPress: () => { void Linking.openSettings().catch(() => undefined); } },
            { label: t('states.cameraDenied.typeCode'), variant: 'danger', onPress: finish },
          ]}
        />
      ) : null}
    </Screen>
  );
};

const s = StyleSheet.create({
  hero: { backgroundColor: tc.softBlue, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 28, alignItems: 'center', gap: 6 },
  appName: { ...tcType.hero, color: tc.textPrimary, fontFamily: undefined },
  tagline: { ...tcType.sectionTitle, color: tc.textPrimary },
  slogan: { ...tcType.body, color: tc.accent },
  center: { alignItems: 'center', gap: 14, paddingTop: 16 },
  camTitle: { ...tcType.sectionTitle, color: tc.textPrimary, textAlign: 'center' },
  choice: { borderRadius: 16, padding: 18 },
});
