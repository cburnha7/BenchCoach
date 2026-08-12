import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMatch } from '../store/useMatch';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * The opponent's basket. They aren't attributed to players, so this is just a
 * points chooser — 1 (free throw), 2, or 3 — that bumps the Them score. Only
 * used for basketball; soccer's "+" adds a single goal directly.
 */
export function ThemScoreSheet({ visible, onClose }: Props) {
  const bumpScore = useMatch((s) => s.bumpScore);

  const add = (n: number) => {
    bumpScore('them', n);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>Their basket</Text>
        <View style={styles.row}>
          {[
            { n: 1, label: 'FT' },
            { n: 2, label: '2 PT' },
            { n: 3, label: '3 PT' },
          ].map(({ n, label }) => (
            <Pressable key={n} style={styles.btn} onPress={() => add(n)}>
              <Text style={styles.btnText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  card: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 28,
    ...glass,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: 18,
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  btnText: { color: theme.text, fontWeight: '800', fontSize: 18 },
});
