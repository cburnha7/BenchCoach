import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { badgeLabel } from '../lib/types';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  /** On-field player being subbed off, or null when closed. */
  outId: string | null;
  onClose: () => void;
  color: string;
};

/**
 * Tap an on-field player to sub them off. This sheet is just the bench, least
 * playing time first, minus anyone already in a queued sub. Tapping a name
 * queues the swap — it isn't made until the Subs button on the field is hit.
 */
export function SubSheet({ outId, onClose, color }: Props) {
  const match = useMatch((s) => s.match);
  const queueSub = useMatch((s) => s.queueSub);
  const giveCard = useMatch((s) => s.giveCard);
  const clearCard = useMatch((s) => s.clearCard);

  if (!match || !outId) return null;
  const out = match.roster.find((p) => p.id === outId);
  if (!out) return null;

  const outCard = match.cards[outId];

  // Anyone already tied to a queued sub, or sent off, is off the table.
  const queued = new Set(match.queue.flatMap((q) => [q.in, q.out]));

  const bench = match.roster
    .filter(
      (p) =>
        !p.onField &&
        !match.scratched.includes(p.id) &&
        match.cards[p.id] !== 'red' &&
        !queued.has(p.id)
    )
    .sort((a, b) => (match.minutes[a.id] ?? 0) - (match.minutes[b.id] ?? 0));

  const pick = (inId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    queueSub(outId, inId);
    onClose();
  };

  const toggleYellow = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (outCard === 'yellow') clearCard(outId);
    else giveCard(outId, 'yellow');
  };

  const sendOff = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    giveCard(outId, 'red');
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        {/* Player coming off, up top. */}
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badgeLabel(out)}</Text>
          </View>
          <View style={styles.headMain}>
            <Text style={styles.title} numberOfLines={1}>
              {out.name}
            </Text>
            <Text style={styles.sub}>comes off · tap who comes on</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {/* Bookings for the tapped player. */}
        <View style={styles.cardRow}>
          <Pressable
            style={[styles.cardBtn, outCard === 'yellow' && styles.cardBtnOn]}
            onPress={toggleYellow}
          >
            <View style={[styles.swatch, { backgroundColor: theme.ball }]} />
            <Text style={styles.cardText}>
              {outCard === 'yellow' ? 'Yellow ✓' : 'Yellow'}
            </Text>
          </Pressable>
          <Pressable style={styles.cardBtn} onPress={sendOff}>
            <View style={[styles.swatch, { backgroundColor: theme.danger }]} />
            <Text style={styles.cardText}>Red — off for good</Text>
          </Pressable>
        </View>

        {bench.length === 0 ? (
          <Text style={styles.empty}>Nobody available on the bench.</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {bench.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => pick(p.id)}>
                <View style={[styles.badgeSm, { backgroundColor: color }]}>
                  <Text style={styles.badgeSmText}>{badgeLabel(p)}</Text>
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    ...glass,
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: 18,
    maxHeight: '78%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.onAccent, fontWeight: '800', fontSize: 16 },
  headMain: { flex: 1 },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  close: { color: theme.textDim, fontSize: 18, paddingHorizontal: 4 },
  cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  cardBtnOn: { borderColor: theme.ball },
  swatch: { width: 12, height: 16, borderRadius: 2 },
  cardText: { color: theme.text, fontWeight: '700', fontSize: 13.5 },
  empty: { color: theme.textDim, textAlign: 'center', paddingVertical: 26, fontSize: 15 },
  scroll: { maxHeight: 380 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  badgeSm: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSmText: { color: theme.onAccent, fontWeight: '800', fontSize: 14 },
  name: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' },
});
