import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatch } from '../store/useMatch';
import { firstName } from '../lib/types';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  color: string;
};

/**
 * Game overview: the score, this game's goals and assists, the bookings, and a
 * single Reset that starts a fresh game — clearing the score, goals, cards and
 * every player's minutes in one go.
 */
export function GameSheet({ visible, onClose, color }: Props) {
  const insets = useSafeAreaInsets();
  const match = useMatch((s) => s.match);
  const resetScore = useMatch((s) => s.resetScore);
  const resetMinutes = useMatch((s) => s.resetMinutes);

  if (!match) return null;

  const nameOf = (id: string | null) => {
    if (!id) return null;
    const p = match.roster.find((r) => r.id === id);
    return p ? firstName(p.name) : 'Unknown';
  };

  const goals = [...match.goals].reverse();
  const carded = match.roster.filter((p) => match.cards[p.id]);

  const confirmReset = () => {
    Alert.alert(
      'Start a new game?',
      'Clears the score, goals, cards and every player’s minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetScore();
            resetMinutes();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>Game</Text>
            <Text style={styles.scoreLine}>
              Them {match.score.them}
              <Text style={styles.dash}> – </Text>
              <Text style={{ color }}>{match.score.us}</Text> Us
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
          <Text style={styles.section}>Goals</Text>
          {goals.length === 0 ? (
            <Text style={styles.empty}>No goals yet.</Text>
          ) : (
            goals.map((g, i) => {
              const scorer = nameOf(g.scorerId);
              const assist = nameOf(g.assistId);
              return (
                <View key={g.id} style={styles.row}>
                  <View style={[styles.num, { backgroundColor: color }]}>
                    <Text style={styles.numText}>{goals.length - i}</Text>
                  </View>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {scorer ?? 'Unattributed'}
                  </Text>
                  {assist ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      assist · {assist}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}

          <Text style={[styles.section, styles.sectionGap]}>Cards</Text>
          {carded.length === 0 ? (
            <Text style={styles.empty}>No cards.</Text>
          ) : (
            carded.map((p) => (
              <View key={p.id} style={styles.row}>
                <View
                  style={[
                    styles.cardSwatch,
                    {
                      backgroundColor:
                        match.cards[p.id] === 'red' ? theme.danger : theme.ball,
                    },
                  ]}
                />
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.rowMeta}>
                  {match.cards[p.id] === 'red' ? 'sent off' : 'booked'}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <Pressable
          style={[styles.reset, { bottom: insets.bottom + 12 }]}
          onPress={confirmReset}
        >
          <Text style={styles.resetText}>Reset game</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerMain: { flex: 1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  scoreLine: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  dash: { color: theme.textDim },
  close: { color: theme.text, fontSize: 16, fontWeight: '700' },
  section: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  sectionGap: { marginTop: 20 },
  empty: { color: theme.textDim, fontSize: 14, paddingHorizontal: 18, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  num: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: theme.onAccent, fontWeight: '800', fontSize: 12 },
  cardSwatch: { width: 16, height: 22, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)' },
  rowName: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: theme.textDim, fontSize: 13 },
  reset: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.queued,
    alignItems: 'center',
  },
  resetText: { color: theme.bg, fontWeight: '800', fontSize: 16 },
});
