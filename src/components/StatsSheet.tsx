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
import { badgeLabel } from '../lib/types';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  color: string;
};

/**
 * Season goals and assists per player. Totals accumulate across games until a
 * manual reset — there's no game-history model yet, so "the season" is however
 * long it's been since the last reset.
 */
export function StatsSheet({ visible, onClose, color }: Props) {
  const insets = useSafeAreaInsets();
  const match = useMatch((s) => s.match);
  const resetStats = useMatch((s) => s.resetStats);

  if (!match) return null;

  const isHoops = match.sport === 'basketball';
  // Basketball ranks on points; soccer on goals. `primary` is whichever the
  // first stat column shows.
  const rows = match.roster
    .map((p) => {
      const st = match.stats[p.id];
      const g = st?.g ?? 0;
      const a = st?.a ?? 0;
      const pts = st?.pts ?? 0;
      return { p, g, a, pts, primary: isHoops ? pts : g };
    })
    .sort(
      (x, y) =>
        y.primary - x.primary || y.a - x.a || x.p.name.localeCompare(y.p.name)
    );

  const totalPrimary = rows.reduce((n, r) => n + r.primary, 0);
  const totalA = rows.reduce((n, r) => n + r.a, 0);
  const primaryLabel = isHoops ? 'PTS' : 'G';
  const primaryWord = isHoops ? 'point' : 'goal';

  const confirmReset = () => {
    Alert.alert(
      'Reset season stats?',
      `Clears every player’s ${primaryWord}s and assists. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetStats() },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>Season stats</Text>
            <Text style={styles.sub}>
              {totalPrimary} {primaryWord}
              {totalPrimary === 1 ? '' : 's'} · {totalA} assist
              {totalA === 1 ? '' : 's'}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.colHead}>
          <Text style={[styles.colName, styles.colLabel]}>Player</Text>
          <Text style={[styles.colStat, styles.colLabel]}>{primaryLabel}</Text>
          <Text style={[styles.colStat, styles.colLabel]}>A</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
          {rows.map(({ p, a, primary }) => (
            <View key={p.id} style={styles.row}>
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{badgeLabel(p)}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.colStat, styles.stat, primary === 0 && styles.dim]}>
                {primary}
              </Text>
              <Text style={[styles.colStat, styles.stat, a === 0 && styles.dim]}>
                {a}
              </Text>
            </View>
          ))}
          {rows.length === 0 && (
            <Text style={styles.empty}>No players yet.</Text>
          )}
        </ScrollView>

        <Pressable
          style={[styles.reset, { bottom: insets.bottom + 12 }]}
          onPress={confirmReset}
        >
          <Text style={styles.resetText}>Reset season stats</Text>
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
    paddingBottom: 8,
  },
  headerMain: { flex: 1 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 3, fontWeight: '500' },
  close: { color: theme.text, fontSize: 16, fontWeight: '700' },
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  colLabel: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  colName: { flex: 1 },
  colStat: { width: 44, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
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
  stat: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dim: { color: theme.textDim, opacity: 0.5 },
  empty: { color: theme.textDim, textAlign: 'center', paddingTop: 40, fontSize: 15 },
  reset: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  resetText: { color: theme.danger, fontWeight: '700', fontSize: 15 },
});
