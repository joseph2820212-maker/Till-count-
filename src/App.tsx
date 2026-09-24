/**
 * App — start-up order matters:
 *  1. finish / roll back an interrupted restore (restore journal)
 *  2. language (and RTL) + currency
 *  3. load the store: finishes / rolls back an interrupted transaction, runs migrations
 *     and reads every record fail-closed
 * Operational data is never rendered from a half-restored or half-written state.
 */
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppAlertOverlay } from './components/AppAlertOverlay';
import { AppButton } from './components/AppButton';
import { installGlobalErrorLogger } from './utils/errorLog';
import { AppNavigator } from './navigation/AppNavigator';
import { BillingProvider } from './modules/billing/BillingProvider';
import { tc } from './theme/colors';
import { tcType } from './theme/typography';
import { initializeLanguage } from './i18n';
import { initCurrency } from './utils/currency';
import { setNumberFormatOverride } from './utils/locale';
import { setDateFormat } from './utils/format';
import { getState, loadStore, useAppState } from './state/store';
import { recoverInterruptedRestore } from './modules/backup/backupFile';
import { pruneExports } from './modules/data/files';

installGlobalErrorLogger();

const fontMap = { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold };

/** Fonts failed: plain system text, English (i18n may not be ready). */
function FontFailureScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.center}>
      <Text style={s.title}>TillCount could not start</Text>
      <Text style={s.body}>Required display fonts failed to load.</Text>
      <AppButton label="Retry" onPress={onRetry} />
    </View>
  );
}

/** Stored data could not be read: fail closed, never overwrite it. */
function StorageErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const error = useAppState(st => st.error);
  return (
    <View style={s.center} testID="storage-error">
      <Text style={s.title}>{error?.kind === 'future' ? t('startup.futureTitle') : t('startup.corruptTitle')}</Text>
      <Text style={s.body}>{error?.kind === 'future' ? t('startup.futureBody') : t('startup.corruptBody')}</Text>
      <AppButton label={t('startup.retry')} onPress={onRetry} />
    </View>
  );
}

function Bootstrap({ onRetry }: { onRetry: () => void }) {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [booted, setBooted] = useState(false);
  const status = useAppState(st => st.status);

  useEffect(() => {
    if (!fontsLoaded || fontError) return;
    let cancelled = false;
    (async () => {
      try { await recoverInterruptedRestore(); } catch { /* the store load below still fails closed */ }
      await initializeLanguage();
      await initCurrency();
      await loadStore();
      const settings = getState().settings;
      setNumberFormatOverride(settings.numberFormat);
      setDateFormat(settings.dateFormat);
      void pruneExports();
      if (!cancelled) setBooted(true);
    })();
    return () => { cancelled = true; };
  }, [fontsLoaded, fontError]);

  if (fontError) return <FontFailureScreen onRetry={onRetry} />;
  if (!fontsLoaded || !booted) return <View style={s.splash} />;
  if (status === 'error') return <StorageErrorScreen onRetry={onRetry} />;

  return (
    <BillingProvider>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
      <AppAlertOverlay />
    </BillingProvider>
  );
}

export default function App() {
  const [retryKey, retry] = useReducer((n: number) => n + 1, 0);
  const handleRetry = useCallback(() => { retry(); }, []);
  return (
    <GestureHandlerRootView style={s.flex}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <Bootstrap key={retryKey} onRetry={handleRetry} />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  splash: { flex: 1, backgroundColor: tc.warm },
  center: { flex: 1, backgroundColor: tc.warm, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { ...tcType.sectionTitle, color: tc.textPrimary, textAlign: 'center' },
  body: { ...tcType.body, color: tc.textMuted, textAlign: 'center' },
});
