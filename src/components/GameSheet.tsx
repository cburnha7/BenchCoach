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
import {
  FOUL_OUT,
  formatClock,
  penaltyTotal,
  personalCount,
  isFouledOutLax,
} from '../lib/types';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  color: string;
};

/**
 * Game overview as a box score: the two sides and the score up top, then the
 * goals and cards listed one per line beneath each side. We only attribute our
 * own goals, so the Them column shows its goals as plain markers. One Reset
 * starts a fresh game — score, goals, cards and minutes all cleared.
 */
export function GameSheet({ visible, onClose, teamName, color }: Props) {
  const insets = useSafeAreaInsets();
  const match = useMatch((s) => s.match);
  const resetScore = useMatch((s) => s.resetScore);
  const resetMinutes = useMatch((s) => s.resetMinutes);

  if (!match) return null;

  const isHoops = match.sport === 'basketball';
  const isLax = match.sport === 'lacrosse';
  const scoreIcon = isHoops ? '🏀' : isLax ? '🥍' : '⚽';
  const ptLabel = (n: number) => (n === 1 ? 'FT' : `${n} PT`);

  const name = (id: string | null) => {
    if (!id) return null;
    return match.roster.find((r) => r.id === id)?.name ?? 'Unknown';
  };

  // A basket's supporting line: its point value (hoops) and/or the assist.
  const scoreMeta = (g: (typeof match.goals)[number]) => {
    const assist = name(g.assistId);
    const parts = [
      isHoops ? ptLabel(g.points ?? 1) : null,
      assist ? `assist · ${assist}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  };

  // Our events, one line each: scores (with points/assist) then bookings.
  const usLines = [
    ...match.goals.map((g) => ({
      key: g.id,
      icon: scoreIcon,
      text: name(g.scorerId) ?? (isHoops ? 'Basket' : 'Goal'),
      meta: scoreMeta(g),
    })),
    ...(isHoops
      ? match.roster
          .filter((p) => (match.fouls[p.id] ?? 0) > 0)
          .map((p) => {
            const n = match.fouls[p.id] ?? 0;
            return {
              key: `foul-${p.id}`,
              icon: n >= FOUL_OUT ? '🚫' : '⚠️',
              text: p.name,
              meta: `${n} foul${n === 1 ? '' : 's'}${n >= FOUL_OUT ? ' · out' : ''}` as string | null,
            };
          })
      : isLax
        ? match.roster
            .filter((p) => (match.penalties[p.id]?.length ?? 0) > 0)
            .map((p) => {
              const pens = match.penalties[p.id] ?? [];
              const out = isFouledOutLax(pens);
              return {
                key: `pen-${p.id}`,
                icon: out ? '🚫' : '🚩',
                text: p.name,
                meta: `${formatClock(penaltyTotal(pens))} · ${personalCount(pens)} personal${
                  personalCount(pens) === 1 ? '' : 's'
                }${out ? ' · out' : ''}` as string | null,
              };
            })
        : match.roster
            .filter((p) => match.cards[p.id])
            .map((p) => ({
              key: `card-${p.id}`,
              icon: match.cards[p.id] === 'red' ? '🟥' : '🟨',
              text: p.name,
              meta: null as string | null,
            }))),
  ];

  // Them scores aren't attributed. Soccer lists a marker per goal; basketball
  // scores in 2s/3s, so a per-point list would be nonsense — show a total.
  const themLines = isHoops
    ? match.score.them > 0
      ? [{ key: 'them', icon: scoreIcon, text: `${match.score.them} points` }]
      : []
    : Array.from({ length: match.score.them }, (_, i) => ({
        key: `them-${i}`,
        icon: scoreIcon,
        text: 'Goal',
      }));

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
        <View style={styles.topBar}>
          <Text style={styles.heading}>Game</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        {/* Score line, box-score style. */}
        <View style={styles.scoreRow}>
          <Text style={styles.teamName} numberOfLines={1}>
            Them
          </Text>
          <Text style={styles.scoreNum}>{match.score.them}</Text>
          <Text style={styles.dash}>–</Text>
          <Text style={[styles.scoreNum, { color }]}>{match.score.us}</Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
            {teamName}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
          <View style={styles.columns}>
            <View style={styles.col}>
              {themLines.length === 0 ? (
                <Text style={styles.none}>—</Text>
              ) : (
                themLines.map((l) => (
                  <View key={l.key} style={styles.line}>
                    <Text style={styles.lineIcon}>{l.icon}</Text>
                    <Text style={styles.lineText} numberOfLines={1}>
                      {l.text}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.colDivider} />

            <View style={styles.col}>
              {usLines.length === 0 ? (
                <Text style={styles.none}>—</Text>
              ) : (
                usLines.map((l) => (
                  <View key={l.key} style={styles.line}>
                    <Text style={styles.lineIcon}>{l.icon}</Text>
                    <View style={styles.lineMain}>
                      <Text style={styles.lineText} numberOfLines={1}>
                        {l.text}
                      </Text>
                      {l.meta ? (
                        <Text style={styles.lineMeta} numberOfLines={1}>
                          {l.meta}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  heading: { color: theme.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  close: { color: theme.text, fontSize: 16, fontWeight: '700' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  teamName: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  teamNameRight: { textAlign: 'left' },
  scoreNum: {
    color: theme.text,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dash: { color: theme.textDim, fontSize: 26, fontWeight: '700' },
  columns: { flexDirection: 'row', paddingTop: 14 },
  col: { flex: 1, paddingHorizontal: 16, gap: 12 },
  colDivider: { width: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  none: { color: theme.textDim, fontSize: 15 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineIcon: { fontSize: 15 },
  lineMain: { flex: 1 },
  lineText: { color: theme.text, fontSize: 15.5, fontWeight: '600' },
  lineMeta: { color: theme.textDim, fontSize: 12, marginTop: 1 },
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
