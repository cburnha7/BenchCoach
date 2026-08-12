import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTeams } from '../store/useTeams';
import { SPORTS, SPORT_LIST } from '../lib/sports';
import { radius, theme } from '../lib/theme';

/**
 * The home-screen title, doubled as the app-wide sport switch. Tapping it drops
 * a short menu; picking a sport filters the team list and sets what new teams
 * become. Lives in the (white) header, so its resting state is dark ink.
 */
export function SportToggle() {
  const sport = useTeams((s) => s.sport);
  const setSport = useTeams((s) => s.setSport);
  const [open, setOpen] = useState(false);
  const cur = SPORTS[sport];

  const choose = (next: typeof cur.key) => {
    void Haptics.selectionAsync();
    void setSport(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.title} hitSlop={10} onPress={() => setOpen(true)}>
        <Text style={styles.emoji}>{cur.emoji}</Text>
        <Text style={styles.name}>{cur.label}</Text>
        <Text style={styles.caret}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          {SPORT_LIST.map((s) => {
            const on = s.key === sport;
            return (
              <Pressable
                key={s.key}
                style={[styles.row, on && styles.rowOn]}
                onPress={() => choose(s.key)}
              >
                <Text style={styles.rowEmoji}>{s.emoji}</Text>
                <Text style={[styles.rowText, on && styles.rowTextOn]}>
                  {s.label}
                </Text>
                {on && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 18, marginRight: 7 },
  name: { color: '#0e1320', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  caret: { color: '#5b6472', fontSize: 16, fontWeight: '700', marginLeft: 5, marginTop: -2 },

  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  sheet: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: 240,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  rowOn: { backgroundColor: theme.control },
  rowEmoji: { fontSize: 22, marginRight: 12 },
  rowText: { flex: 1, color: theme.text, fontSize: 17, fontWeight: '700' },
  rowTextOn: { color: theme.text },
  check: { color: theme.live, fontSize: 17, fontWeight: '800' },
});
