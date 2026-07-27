import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanSheet } from './ScanSheet';
import { BadgeSheet } from './BadgeSheet';
import { StatsSheet } from './StatsSheet';
import { useMatch } from '../store/useMatch';
import { badgeLabel, formatClock, type Card, type Player } from '../lib/types';
import { theme, radius, mix } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  color: string;
};

// How far a row must travel before the swipe commits, and how far it can go.
const SWIPE_TRIGGER = 76;
const SWIPE_MAX = 128;

/**
 * The squad. Field players sit on top (highlighted), bench below, scratched
 * players last (dimmed) — each group ordered by minutes played, most first.
 * The list is read-only until you tap Edit; the only per-row gesture is a
 * swipe: left to scratch, right to restore.
 */
export function RosterSheet({ visible, onClose, teamName, color }: Props) {
  const insets = useSafeAreaInsets();
  const match = useMatch((s) => s.match);
  // Subscribing to tickCount keeps the minutes live while the clock runs.
  useMatch((s) => s.tickCount);
  const addPlayer = useMatch((s) => s.addPlayer);
  const removePlayer = useMatch((s) => s.removePlayer);
  const toggleScratch = useMatch((s) => s.toggleScratch);
  const clearCard = useMatch((s) => s.clearCard);
  const resetMinutes = useMatch((s) => s.resetMinutes);

  const confirmResetMinutes = () => {
    Alert.alert(
      'Reset playing time?',
      'Sets every player’s minutes back to 0 for a new game.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetMinutes() },
      ]
    );
  };

  const [name, setName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [editing, setEditing] = useState(false);
  // Badge editing renders inside this sheet's modal — a modal presented from
  // the app screen behind this one is silently dropped by iOS.
  const [badgeFor, setBadgeFor] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  if (!match) return null;

  const submit = () => {
    if (!name.trim()) return;
    addPlayer(name);
    setName('');
  };

  const scratchedSet = new Set(match.scratched);
  const mins = (p: Player) => match.minutes[p.id] ?? 0;
  const byMinutesDesc = (a: Player, b: Player) => mins(b) - mins(a);

  // Sent off (red) or scratched players sink to the bottom "out" group.
  const isOut = (p: Player) =>
    scratchedSet.has(p.id) || match.cards[p.id] === 'red';

  const field = match.roster
    .filter((p) => p.onField && !isOut(p))
    .sort(byMinutesDesc);
  const bench = match.roster
    .filter((p) => !p.onField && !isOut(p))
    .sort(byMinutesDesc);
  const out = match.roster.filter(isOut).sort(byMinutesDesc);
  const data = [...field, ...bench, ...out];

  // Ids that start a new group, so we can nudge a little air above them.
  const firstBenchId = bench[0]?.id;
  const firstOutId = out[0]?.id;

  const renderItem = ({ item }: { item: Player }) => {
    const isScratched = scratchedSet.has(item.id);
    const topGap =
      (item.id === firstBenchId && field.length > 0) ||
      (item.id === firstOutId && field.length + bench.length > 0);
    return (
      <RosterRow
        player={item}
        minutes={mins(item)}
        color={color}
        onField={item.onField && !isOut(item)}
        scratched={isScratched}
        card={match.cards[item.id]}
        editing={editing}
        topGap={topGap}
        onEditBadge={setBadgeFor}
        onRemove={removePlayer}
        onToggleScratch={toggleScratch}
        onClearCard={clearCard}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* RNGH needs its own root inside a Modal for the swipe to register. */}
      <GestureHandlerRootView style={styles.sheet}>
        <View style={styles.header}>
          <View style={[styles.accent, { backgroundColor: color }]} />
          <View style={styles.headerInner}>
            <Text style={styles.title} numberOfLines={1}>
              {teamName}
            </Text>
            <Text style={styles.headerSub}>
              {match.roster.length} players · {field.length} on field
            </Text>
          </View>
          <Pressable
            onPress={() => setStatsOpen(true)}
            hitSlop={10}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>Stats</Text>
          </Pressable>
          <Pressable
            onPress={() => setEditing((e) => !e)}
            hitSlop={10}
            style={[styles.editBtn, styles.editBtnGap, editing && styles.editBtnOn]}
          >
            <Text style={[styles.editText, editing && styles.editTextOn]}>
              {editing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
          <Pressable
            onPress={confirmResetMinutes}
            hitSlop={10}
            style={[styles.resetBtn, styles.editBtnGap]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {editing && (
          <>
            <Pressable style={styles.scanBtn} onPress={() => setScanning(true)}>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanText}>Scan a roster photo</Text>
            </Pressable>

            <View style={styles.addRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Add a player"
                placeholderTextColor={theme.textDim}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={submit}
                autoCorrect={false}
              />
              <Pressable
                style={[styles.addBtn, !name.trim() && styles.addBtnOff]}
                onPress={submit}
              >
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            </View>
          </>
        )}

        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 84 },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No players yet</Text>
              <Text style={styles.emptyBody}>
                Tap Edit, then add them. The first {match.size} go straight onto
                the field.
              </Text>
            </View>
          }
          ListHeaderComponent={
            match.roster.length > 0 ? (
              <Text style={styles.listCap}>
                {editing
                  ? 'Tap a badge to set a number or emoji · 🗑 removes'
                  : 'Swipe left to scratch · right to restore'}
              </Text>
            ) : null
          }
        />

        <Pressable
          style={[styles.done, { bottom: insets.bottom + 12 }]}
          onPress={onClose}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>

        <ScanSheet
          visible={scanning}
          onClose={() => setScanning(false)}
          onImport={(found) => found.forEach((n) => addPlayer(n))}
        />

        <BadgeSheet playerId={badgeFor} onClose={() => setBadgeFor(null)} />

        <StatsSheet
          visible={statsOpen}
          onClose={() => setStatsOpen(false)}
          color={color}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

type RowProps = {
  player: Player;
  minutes: number;
  color: string;
  onField: boolean;
  scratched: boolean;
  card?: Card;
  editing: boolean;
  topGap: boolean;
  onEditBadge: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleScratch: (id: string) => void;
  onClearCard: (id: string) => void;
};

function RosterRow({
  player,
  minutes,
  color,
  onField,
  scratched,
  card,
  editing,
  topGap,
  onEditBadge,
  onRemove,
  onToggleScratch,
  onClearCard,
}: RowProps) {
  const tx = useSharedValue(0);
  const red = card === 'red';
  const dim = scratched || red;

  const commitSwipe = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleScratch(player.id);
  };

  const pan = Gesture.Pan()
    .enabled(!editing)
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onChange((e) => {
      const next = tx.value + e.changeX;
      // Only the meaningful direction moves: a scratched row swipes right to
      // restore, an active row swipes left to scratch.
      tx.value = scratched
        ? Math.min(SWIPE_MAX, Math.max(0, next))
        : Math.max(-SWIPE_MAX, Math.min(0, next));
    })
    .onEnd(() => {
      if (Math.abs(tx.value) >= SWIPE_TRIGGER) runOnJS(commitSwipe)();
      tx.value = withTiming(0, { duration: 190 });
    });

  const fgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(tx.value) / SWIPE_TRIGGER),
  }));

  return (
    <View style={[styles.rowWrap, topGap && styles.rowGap]}>
      {/* Action revealed under the row as it slides. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rowHint,
          {
            alignItems: scratched ? 'flex-start' : 'flex-end',
            backgroundColor: scratched
              ? mix(theme.live, 0.5)
              : mix(theme.danger, 0.5),
          },
          hintStyle,
        ]}
      >
        <Text style={styles.hintText}>{scratched ? 'Restore' : 'Scratch'}</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.rowFg,
            onField && { backgroundColor: mix(color, 0.86) },
            fgStyle,
          ]}
        >
          {onField && (
            <View style={[styles.accentBar, { backgroundColor: color }]} />
          )}
          <View style={styles.badgeWrap}>
            <Pressable
              onPress={editing ? () => onEditBadge(player.id) : undefined}
              disabled={!editing}
              hitSlop={6}
              style={[
                styles.badge,
                {
                  backgroundColor: onField ? color : theme.surfaceAlt,
                  opacity: dim ? 0.4 : 1,
                },
              ]}
            >
              <Text style={styles.badgeText}>{badgeLabel(player)}</Text>
            </Pressable>
            {/* Edit-mode affordance: tapping the icon opens number/emoji. */}
            {editing && (
              <View style={styles.badgePlus} pointerEvents="none">
                <Text style={styles.badgePlusText}>+</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.name,
              scratched && styles.scratchName,
              red && styles.dimText,
            ]}
            numberOfLines={1}
          >
            {player.name}
          </Text>

          {/* Booking chip; tap to clear it while editing. */}
          {card && (
            <Pressable
              disabled={!editing}
              onPress={editing ? () => onClearCard(player.id) : undefined}
              hitSlop={8}
              style={[
                styles.cardChip,
                { backgroundColor: card === 'red' ? theme.danger : theme.ball },
              ]}
            >
              {editing && <Text style={styles.cardChipX}>×</Text>}
            </Pressable>
          )}

          {editing ? (
            <Pressable
              style={styles.del}
              onPress={() => onRemove(player.id)}
              hitSlop={8}
            >
              <Text style={styles.delText}>🗑</Text>
            </Pressable>
          ) : (
            <Text style={[styles.mins, dim && styles.dim]}>
              {formatClock(minutes)}
            </Text>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 6,
    paddingRight: 16,
  },
  accent: { width: 5, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  headerInner: { flex: 1, paddingLeft: 14, paddingRight: 12 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { color: theme.textDim, fontSize: 13, marginTop: 4, fontWeight: '500' },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  editBtnGap: { marginLeft: 8 },
  editBtnOn: { backgroundColor: theme.text, borderColor: theme.text },
  editText: { color: theme.text, fontWeight: '700', fontSize: 14 },
  // The most prominent control in the header: a solid fill against the outline
  // Stats/Edit pills, since a coach resets playing time every game.
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: theme.queued,
  },
  resetText: { color: theme.bg, fontWeight: '800', fontSize: 14 },
  editTextOn: { color: theme.bg },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  scanIcon: { fontSize: 17 },
  scanText: { color: theme.text, fontWeight: '700', fontSize: 15 },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  input: {
    flex: 1,
    backgroundColor: theme.control,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
  },
  addBtn: {
    paddingHorizontal: 22,
    justifyContent: 'center',
    backgroundColor: theme.live,
    borderRadius: radius.md,
  },
  addBtnOff: { backgroundColor: theme.control },
  addText: { color: theme.onAccent, fontWeight: '800', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingTop: 6 },
  listCap: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rowWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rowGap: { marginTop: 14 },
  rowHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: theme.onAccent,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rowFg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  badgeWrap: { width: 36, height: 36 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.onAccent, fontWeight: '800', fontSize: 15 },
  badgePlus: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: theme.live,
    borderWidth: 1.5,
    borderColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePlusText: {
    color: theme.onAccent,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  name: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' },
  scratchName: {
    color: theme.textDim,
    textDecorationLine: 'line-through',
  },
  dimText: { color: theme.textDim },
  dim: { opacity: 0.5 },
  cardChip: {
    width: 15,
    height: 20,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  cardChipX: { color: '#000', fontSize: 13, fontWeight: '900', lineHeight: 14 },
  mins: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    textAlign: 'right',
  },
  del: { paddingHorizontal: 6, paddingVertical: 2 },
  delText: { fontSize: 18 },
  empty: { paddingTop: 50, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
  emptyBody: {
    color: theme.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  done: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 10,
  },
  doneText: { color: theme.text, fontWeight: '700', fontSize: 16 },
});
