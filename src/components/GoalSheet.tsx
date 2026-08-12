import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMatch } from '../store/useMatch';
import { badgeLabel, type Player } from '../lib/types';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  color: string;
};

/**
 * Credit a goal. Tap the scorer, double-tap the assist. Both toggle, so a
 * mistap is one tap to undo. "Just add" records the goal with no attribution
 * for the times nobody's sure who got the last touch.
 */
export function GoalSheet({ visible, onClose, color }: Props) {
  const match = useMatch((s) => s.match);
  const recordGoal = useMatch((s) => s.recordGoal);

  const [scorer, setScorer] = useState<string | null>(null);
  const [assist, setAssist] = useState<string | null>(null);
  // Points for this basket (basketball only); soccer always scores 1.
  const [points, setPoints] = useState(2);
  // Remembers the last tap so a quick second tap on the same player reads as a
  // double-tap (assist) and rolls back the scorer that the first tap set.
  const last = useRef<{ id: string | null; t: number; prev: string | null }>({
    id: null,
    t: 0,
    prev: null,
  });

  useEffect(() => {
    if (visible) {
      setScorer(null);
      setAssist(null);
      setPoints(2);
      last.current = { id: null, t: 0, prev: null };
    }
  }, [visible]);

  if (!match) return null;

  const isHoops = match.sport === 'basketball';
  const players = match.roster.filter(
    (p) => p.onField && !match.scratched.includes(p.id)
  );

  const onTap = (id: string) => {
    const now = Date.now();
    const l = last.current;
    const isDouble = l.id === id && now - l.t < 300;
    if (isDouble) {
      setAssist((a) => (a === id ? null : id));
      setScorer((s) => (s === id ? l.prev ?? null : s));
      last.current = { id: null, t: 0, prev: null };
    } else {
      last.current = { id, t: now, prev: scorer };
      setScorer((s) => (s === id ? null : id));
      setAssist((a) => (a === id ? null : a));
    }
  };

  const submit = () => {
    if (!scorer) return;
    recordGoal(scorer, assist, isHoops ? points : 1);
    onClose();
  };

  const justAdd = () => {
    recordGoal(null, null, isHoops ? points : 1);
    onClose();
  };

  const chip = (p: Player) => {
    const isScorer = scorer === p.id;
    const isAssist = assist === p.id;
    return (
      <Pressable
        key={p.id}
        onPress={() => onTap(p.id)}
        style={[
          styles.row,
          isScorer && { borderColor: theme.live, backgroundColor: theme.surfaceAlt },
          isAssist && { borderColor: theme.ball, backgroundColor: theme.surfaceAlt },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{badgeLabel(p)}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {p.name}
        </Text>
        {isScorer && (
          <Text style={[styles.tag, { color: theme.live }]}>
            {isHoops ? 'SCORE' : 'GOAL'}
          </Text>
        )}
        {isAssist && <Text style={[styles.tag, { color: theme.ball }]}>ASSIST</Text>}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>Who scored?</Text>
        <Text style={styles.sub}>Tap the scorer · double-tap the assist</Text>

        {isHoops && (
          <View style={styles.pointsRow}>
            {[1, 2, 3].map((n) => (
              <Pressable
                key={n}
                style={[styles.pointBtn, points === n && styles.pointBtnOn]}
                onPress={() => setPoints(n)}
              >
                <Text style={[styles.pointText, points === n && styles.pointTextOn]}>
                  {n === 1 ? 'FT' : `${n} PT`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {players.length === 0 ? (
          <Text style={styles.empty}>No players on the field.</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {players.map(chip)}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.ghost} onPress={justAdd}>
            <Text style={styles.ghostText}>Just add</Text>
          </Pressable>
          <Pressable
            style={[styles.primary, !scorer && styles.primaryOff]}
            onPress={submit}
            disabled={!scorer}
          >
            <Text style={styles.primaryText}>
              {isHoops ? 'Add basket' : 'Add goal'}
            </Text>
          </Pressable>
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
    maxHeight: '82%',
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2, marginBottom: 14 },
  pointsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pointBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  pointBtnOn: { backgroundColor: theme.live, borderColor: theme.live },
  pointText: { color: theme.text, fontWeight: '800', fontSize: 15 },
  pointTextOn: { color: theme.onAccent },
  empty: { color: theme.textDim, fontSize: 15, paddingVertical: 24, textAlign: 'center' },
  scroll: { maxHeight: 400 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.onAccent, fontWeight: '800', fontSize: 14 },
  name: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' },
  tag: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ghost: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  ghostText: { color: theme.text, fontWeight: '700', fontSize: 15 },
  primary: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
  },
  primaryOff: { opacity: 0.4 },
  primaryText: { color: theme.onAccent, fontWeight: '800', fontSize: 16 },
});
