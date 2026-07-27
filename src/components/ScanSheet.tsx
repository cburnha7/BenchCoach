import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseRoster } from '../lib/rosterParse';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImport: (names: string[]) => void;
};

type Stage = 'idle' | 'working' | 'results' | 'empty' | 'error';

/**
 * Photograph a printed roster and import the names.
 *
 * Recognition runs entirely on the device through ML Kit — no upload, no API
 * key, works without signal on a field somewhere. That matters beyond privacy:
 * the original web version called a hosted model directly and could only ever
 * have worked inside a preview sandbox.
 *
 * OCR on a phone photo of a printed page is good but not perfect, so results
 * are always editable before anything is imported. The coach is the last step,
 * not the machine.
 */
export function ScanSheet({ visible, onClose, onImport }: Props) {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('idle');
  const [names, setNames] = useState<string[]>([]);
  const [error, setError] = useState('');

  const reset = () => {
    setStage('idle');
    setNames([]);
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const run = async (from: 'camera' | 'library') => {
    try {
      const perm =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError(
          from === 'camera'
            ? 'Camera access is off for Bench Coach. You can turn it on in Settings.'
            : 'Photo access is off for Bench Coach. You can turn it on in Settings.'
        );
        setStage('error');
        return;
      }

      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        // No crop step — OCR needs the whole page, not a square.
        allowsEditing: false,
        quality: 1,
      };
      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled || !result.assets[0]) return;

      setStage('working');
      const recognised = await TextRecognition.recognize(result.assets[0].uri);
      const found = parseRoster(recognised.text ?? '');

      if (found.length === 0) {
        setStage('empty');
        return;
      }
      setNames(found);
      setStage('results');
    } catch (e) {
      setError(
        'Something went wrong reading that image. Try a straighter, better-lit photo.'
      );
      setStage('error');
    }
  };

  const edit = (i: number, value: string) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  };

  const remove = (i: number) => {
    setNames((prev) => prev.filter((_, idx) => idx !== i));
  };

  const confirm = () => {
    const keep = names.map((n) => n.trim()).filter(Boolean);
    onImport(keep);
    close();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>Scan a roster</Text>
            <Text style={styles.sub}>
              Reads names off a photo. Stays on your phone.
            </Text>
          </View>
          <Pressable onPress={close} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {stage === 'idle' && (
          <View style={styles.pad}>
            <Pressable style={styles.primary} onPress={() => run('camera')}>
              <Text style={styles.primaryText}>Take a photo</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => run('library')}>
              <Text style={styles.secondaryText}>Choose from library</Text>
            </Pressable>
            <Text style={styles.tip}>
              Works best on a printed list, shot straight on in good light.
              Handwriting is hit and miss.
            </Text>
          </View>
        )}

        {stage === 'working' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.live} />
            <Text style={styles.working}>Reading the roster…</Text>
          </View>
        )}

        {(stage === 'empty' || stage === 'error') && (
          <View style={styles.pad}>
            <Text style={styles.problem}>
              {stage === 'empty'
                ? 'No names found in that image.'
                : error}
            </Text>
            <Text style={styles.tip}>
              {stage === 'empty'
                ? 'Try again with a straighter, better-lit photo — or close this and add players by hand.'
                : ''}
            </Text>
            <Pressable style={styles.primary} onPress={reset}>
              <Text style={styles.primaryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {stage === 'results' && (
          <>
            <Text style={styles.count}>
              {names.length} name{names.length === 1 ? '' : 's'} found · edit
              anything that came out wrong
            </Text>
            <ScrollView
              contentContainerStyle={[
                styles.list,
                { paddingBottom: insets.bottom + 96 },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              {names.map((n, i) => (
                <View key={i} style={styles.row}>
                  <TextInput
                    value={n}
                    onChangeText={(v) => edit(i, v)}
                    style={styles.input}
                    maxLength={28}
                    autoCorrect={false}
                  />
                  <Pressable
                    style={styles.remove}
                    onPress={() => remove(i)}
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable style={styles.secondaryInline} onPress={reset}>
                <Text style={styles.secondaryText}>Rescan</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryInline, names.length === 0 && styles.off]}
                onPress={confirm}
                disabled={names.length === 0}
              >
                <Text style={styles.primaryText}>
                  Add {names.length} player{names.length === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    paddingBottom: 8,
  },
  headerMain: { flex: 1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 3 },
  close: { color: theme.textDim, fontSize: 20, padding: 4 },
  pad: { padding: 18, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  working: { color: theme.textDim, fontSize: 15, fontWeight: '600' },
  primary: {
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
  },
  primaryInline: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
  },
  primaryText: { color: theme.onAccent, fontWeight: '800', fontSize: 16 },
  off: { opacity: 0.4 },
  secondary: {
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  secondaryInline: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  secondaryText: { color: theme.text, fontWeight: '700', fontSize: 15 },
  tip: { color: theme.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
  problem: { color: theme.text, fontSize: 16, fontWeight: '600' },
  count: {
    color: theme.textDim,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  list: { paddingHorizontal: 18, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: theme.control,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
  },
  remove: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: theme.textDim, fontSize: 15, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: theme.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
  },
});
