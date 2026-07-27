import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMatch } from '../store/useMatch';
import { firstName } from '../lib/types';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  color: string;
};

/**
 * This game's goals, newest first, so one can be removed by name. Removing a
 * goal also backs its scorer/assist out of the season stats (handled in the
 * store), keeping the tallies honest.
 */
export function GoalLogSheet({ visible, onClose, color }: Props) {
  const match = useMatch((s) => s.match);
  const removeGoal = useMatch((s) => s.removeGoal);

  if (!match) return null;

  const nameOf = (id: string | null) => {
    if (!id) return null;
    const p = match.roster.find((r) => r.id === id);
    return p ? firstName(p.name) : 'Unknown';
  };

  // Newest first: the last goal scored is the one most likely being corrected.
  const goals = [...match.goals].reverse();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>Remove a goal</Text>
        <Text style={styles.sub}>Us · {match.score.us} this game</Text>

        {goals.length === 0 ? (
          <Text style={styles.empty}>No goals to remove yet.</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {goals.map((g, i) => {
              const scorer = nameOf(g.scorerId);
              const assist = nameOf(g.assistId);
              return (
                <View key={g.id} style={styles.row}>
                  <View style={[styles.num, { backgroundColor: color }]}>
                    <Text style={styles.numText}>{goals.length - i}</Text>
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.scorer} numberOfLines={1}>
                      {scorer ?? 'Unattributed'}
                    </Text>
                    {assist ? (
                      <Text style={styles.assist} numberOfLines={1}>
                        assist · {assist}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.remove}
                    onPress={() => removeGoal(g.id)}
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Pressable style={styles.done} onPress={onClose}>
          <Text style={styles.doneText}>Done</Text>
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
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2, marginBottom: 12 },
  empty: { color: theme.textDim, fontSize: 15, paddingVertical: 24, textAlign: 'center' },
  scroll: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: theme.onAccent, fontWeight: '800', fontSize: 13 },
  rowMain: { flex: 1 },
  scorer: { color: theme.text, fontSize: 16, fontWeight: '600' },
  assist: { color: theme.textDim, fontSize: 12.5, marginTop: 2 },
  remove: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  removeText: { color: theme.danger, fontWeight: '700', fontSize: 13 },
  done: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  doneText: { color: theme.text, fontWeight: '700', fontSize: 15 },
});
