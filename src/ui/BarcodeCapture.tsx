/**
 * BarcodeCapture — "Scan or type" for product forms (Add product, Add barcode). One camera
 * read (or a typed code) is handed back through onCapture. Camera denied never dead-ends:
 * the typed-code field is always there, and Open Settings is offered (state 01).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { AppButton } from '../components/AppButton';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { SCANNER_BARCODE_TYPES, isAcceptableBarcode, symbologyOf } from '../domain/barcode';
import { TextField } from './fields';
import { StateCard } from './kit';

export const BarcodeCapture: React.FC<{ visible: boolean; onClose: () => void; onCapture: (code: string, symbology: string) => void }> = ({ visible, onClose, onCapture }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [torch, setTorch] = useState(false);
  const done = useRef(false);
  useEffect(() => { if (visible) { done.current = false; setCode(''); } }, [visible]);

  const granted = !!permission?.granted && Platform.OS !== 'web';
  const denied = !!permission && !permission.granted && !permission.canAskAgain;
  const onScanned = (r: BarcodeScanningResult) => {
    if (done.current) return;
    done.current = true;
    onCapture(r.data, symbologyOf(r.type));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.root, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={[s.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity style={s.slot} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} testID="capture-close">
            <Ionicons name="close" size={24} color={tc.onNavy} />
          </TouchableOpacity>
          <Text style={s.title}>{t('capture.title')}</Text>
          {granted ? (
            <TouchableOpacity style={s.slot} onPress={() => setTorch(x => !x)} accessibilityRole="switch" accessibilityState={{ checked: torch }} accessibilityLabel={t('scan.torch')}>
              <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={tc.onNavy} />
            </TouchableOpacity>
          ) : <View style={s.slot} />}
        </View>
        <View style={s.body}>
          <View style={s.camera}>
            {granted ? (
              <>
                <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} barcodeScannerSettings={{ barcodeTypes: [...SCANNER_BARCODE_TYPES] }} onBarcodeScanned={visible ? onScanned : undefined} testID="capture-camera" />
                <View pointerEvents="none" style={s.frame} />
              </>
            ) : (
              <View style={s.idle}>
                <Ionicons name="camera-outline" size={44} color={tc.navy} />
                <Text style={s.idleText}>{t('permission.body')}</Text>
                {!denied ? <AppButton label={t('permission.allow')} onPress={() => { void requestPermission(); }} testID="capture-allow" /> : null}
              </View>
            )}
          </View>
          {denied ? (
            <StateCard tone="danger" title={t('states.cameraDenied.title')} body={t('states.cameraDenied.body')} actions={[{ label: t('states.cameraDenied.openSettings'), onPress: () => { void Linking.openSettings().catch(() => undefined); } }]} />
          ) : null}
          <TextField label={t('fields.barcode')} value={code} onChangeText={setCode} keyboardType="number-pad" ltr placeholder="5000112637922" testID="capture-code" onSubmitEditing={() => { if (isAcceptableBarcode(code)) onCapture(code.trim(), 'unknown'); }} />
          <AppButton label={t('capture.useCode')} onPress={() => onCapture(code.trim(), 'unknown')} disabled={!isAcceptableBarcode(code)} testID="capture-use" />
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tc.warm },
  header: { backgroundColor: tc.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  slot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...tcType.screenTitle, color: tc.onNavy, flex: 1, textAlign: 'center' },
  body: { padding: 16, gap: 12 },
  camera: { height: 260, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: tc.navy, backgroundColor: tc.softBlue, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 244, height: 110, borderRadius: 12, borderWidth: 2, borderColor: tc.accent },
  idle: { alignItems: 'center', gap: 10, padding: 16, alignSelf: 'stretch' },
  idleText: { ...tcType.bodySmall, color: tc.textMuted, textAlign: 'center' },
});
