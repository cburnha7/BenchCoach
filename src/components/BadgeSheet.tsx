import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMatch } from '../store/useMatch';
import { theme, radius, glass } from '../lib/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/** Small, legible at disc size, and readable in bright sun. */
const EMOJI = [
  '⚡', '🔥', '🚀', '🎯', '🧱', '🗝️', '🦅', '🐺',
  '🦁', '🐝', '⭐', '💪', '🧊', '🌊', '🏹', '🛡️',
];

type Props = {
  playerId: string | null;
  onClose: () => void;
};

export function BadgeSheet({ playerId, onClose }: Props) {
  const match = useMatch((s) => s.match);
  const setJersey = useMatch((s) => s.setJersey);
  const setEmoji = useMatch((s) => s.setEmoji);

  const player = match?.roster.find((p) => p.id === playerId);
  const [tab, setTab] = useState<'number' | 'emoji'>('number');
  const [buf, setBuf] = useState('');

  useEffect(() => {
    if (player) {
      setBuf(player.jersey ?? '');
      setTab(player.emoji && !player.jersey ? 'emoji' : 'number');
    }
  }, [playerId, player]);

  if (!match || !player) return null;

  const press = (k: string) => {
    setBuf((b) => (b.length >= 2 ? k : b + k));
  };

  const commit = () => {
    setJersey(player.id, buf === '' ? undefined : buf);
    onClose();
  };

  const pickEmoji = (e: string) => {
    setEmoji(player.id, e);
    onClose();
  };

  const clear = () => {
    setJersey(player.id, undefined);
    setEmoji(player.id, undefined);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={commit} />
      <View style={styles.card}>
        <Text style={styles.title}>{player.name}</Text>
        <Text style={styles.sub}>Shown on the player's disc</Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'number' && styles.tabOn]}
            onPress={() => setTab('number')}
          >
            <Text style={[styles.tabText, tab === 'number' && styles.tabTextOn]}>
              Number
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'emoji' && styles.tabOn]}
            onPress={() => setTab('emoji')}
          >
            <Text style={[styles.tabText, tab === 'emoji' && styles.tabTextOn]}>
              Icon
            </Text>
          </Pressable>
        </View>

        {tab === 'number' ? (
          <>
            <View style={styles.preview}>
              <Text style={styles.previewText}>{buf === '' ? '—' : buf}</Text>
            </View>
            <View style={styles.pad}>
              {KEYS.map((k) => (
                <Pressable key={k} style={styles.key} onPress={() => press(k)}>
                  <Text style={styles.keyText}>{k}</Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.key}
                onPress={() => setBuf((b) => b.slice(0, -1))}
              >
                <Text style={styles.keyText}>⌫</Text>
              </Pressable>
              <Pressable style={[styles.key, styles.keyGo]} onPress={commit}>
                <Text style={styles.keyGoText}>Save</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ScrollView style={styles.emojiScroll}>
            <View style={styles.emojiGrid}>
              {EMOJI.map((e) => (
                <Pressable
                  key={e}
                  style={[styles.emojiBtn, player.emoji === e && styles.emojiOn]}
                  onPress={() => pickEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        <Pressable style={styles.clear} onPress={clear}>
          <Text style={styles.clearText}>Clear badge (show initials)</Text>
        </Pressable>
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
    maxHeight: '80%',
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2, marginBottom: 14 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: theme.text },
  tabText: { color: theme.textDim, fontWeight: '700', fontSize: 14 },
  tabTextOn: { color: theme.bg },
  preview: {
    height: 66,
    borderRadius: radius.md,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewText: {
    color: theme.text,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '22.5%',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    alignItems: 'center',
  },
  keyText: { color: theme.text, fontSize: 20, fontWeight: '700' },
  keyGo: { backgroundColor: theme.live },
  keyGoText: { color: theme.onAccent, fontSize: 16, fontWeight: '800' },
  emojiScroll: { maxHeight: 240 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: '22.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOn: { borderColor: theme.live },
  emojiText: { fontSize: 26 },
  clear: {
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    alignItems: 'center',
  },
  clearText: { color: theme.text, fontWeight: '600', fontSize: 14 },
});
