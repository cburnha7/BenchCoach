import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { badgeLabel, FOUL_OUT } from '../lib/types';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  /** On-field player being subbed off, or null. */
  outId: string | null;
  /** An open spot on the pitch to bring a player straight onto, or null. */
  slot: { x: number; y: number } | null;
  onClose: () => void;
  color: string;
};

/**
 * Two ways in: tap an on-field player to sub them off (queues a swap), or tap
 * an open spot to bring someone straight on. Either way this is just the bench,
 * least playing time first, minus anyone scratched, sent off, or already in a
 * queued sub. Cards are only offered when subbing a specific player off.
 */
export function SubSheet({ outId, slot, onClose, color }: Props) {
  const match = useMatch((s) => s.match);
  const queueSub = useMatch((s) => s.queueSub);
  const bringOnAt = useMatch((s) => s.bringOnAt);
  const giveCard = useMatch((s) => s.giveCard);
  const clearCard = useMatch((s) => s.clearCard);
  const addFoul = useMatch((s) => s.addFoul);
  const removeFoul = useMatch((s) => s.removeFoul);

  if (!match) return null;
  const isHoops = match.sport === 'basketball';
  const out = outId ? match.roster.find((p) => p.id === outId) : null;
  const bringingOn = !out && !!slot;
  if (!out && !bringingOn) return null;

  const outCard = out ? match.cards[out.id] : undefined;
  const outFouls = out ? match.fouls[out.id] ?? 0 : 0;

  // Anyone scratched, sent off, fouled out, or already queued is off the table.
  const queued = new Set(match.queue.flatMap((q) => [q.in, q.out]));
  const bench = match.roster
    .filter(
      (p) =>
        !p.onField &&
        !match.scratched.includes(p.id) &&
        match.cards[p.id] !== 'red' &&
        (match.fouls[p.id] ?? 0) < FOUL_OUT &&
        !queued.has(p.id)
    )
    .sort((a, b) => (match.minutes[a.id] ?? 0) - (match.minutes[b.id] ?? 0));

  const pick = (inId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (bringingOn && slot) bringOnAt(inId, slot.x, slot.y);
    else if (out) queueSub(out.id, inId);
    onClose();
  };

  const toggleYellow = () => {
    if (!out) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (outCard === 'yellow') clearCard(out.id);
    else giveCard(out.id, 'yellow');
  };

  const sendOff = () => {
    if (!out) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    giveCard(out.id, 'red');
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <View style={styles.head}>
          {out ? (
            <>
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{badgeLabel(out)}</Text>
              </View>
              <View style={styles.headMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {out.name}
                </Text>
                <Text style={styles.sub}>comes off · tap who comes on</Text>
              </View>
            </>
          ) : (
            <View style={styles.headMain}>
              <Text style={styles.title}>Bring on</Text>
              <Text style={styles.sub}>Tap who takes the open spot</Text>
            </View>
          )}
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {/* Fouls (basketball) or bookings (soccer), when subbing a player off. */}
        {out && isHoops && (
          <View style={styles.cardRow}>
            <Pressable
              style={styles.cardBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                removeFoul(out.id);
              }}
              disabled={outFouls === 0}
            >
              <Text style={[styles.cardText, styles.foulStep]}>−</Text>
            </Pressable>
            <View style={styles.foulCount}>
              <Text style={styles.foulCountText}>
                {outFouls} {outFouls === 1 ? 'foul' : 'fouls'}
                {outFouls >= FOUL_OUT ? ' · fouled out' : ''}
              </Text>
            </View>
            <Pressable
              style={styles.cardBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                addFoul(out.id);
              }}
            >
              <Text style={styles.cardText}>+ Foul</Text>
            </Pressable>
          </View>
        )}
        {out && !isHoops && (
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
              <Text style={styles.cardText}>Red</Text>
            </Pressable>
          </View>
        )}

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
  foulStep: { fontSize: 20, lineHeight: 22 },
  foulCount: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foulCountText: { color: theme.text, fontWeight: '700', fontSize: 14 },
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
