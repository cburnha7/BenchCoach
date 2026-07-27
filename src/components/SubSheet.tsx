import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { formatClock, firstName } from '../lib/types';
import { theme, radius, glass } from '../lib/theme';

type Props = {
  /** Player the sheet is about, or null when closed. */
  outId: string | null;
  onClose: () => void;
  /** Hand off to the badge editor for this player. */
  onEditBadge: (playerId: string) => void;
};

export function SubSheet({ outId, onClose, onEditBadge }: Props) {
  const match = useMatch((s) => s.match);
  const swap = useMatch((s) => s.swap);
  const queueSub = useMatch((s) => s.queueSub);
  const toggleScratch = useMatch((s) => s.toggleScratch);
  const sendToBench = useMatch((s) => s.sendToBench);
  const bringOn = useMatch((s) => s.bringOn);

  if (!match || !outId) return null;
  const out = match.roster.find((p) => p.id === outId);
  if (!out) return null;

  const bench = match.roster.filter(
    (p) => !p.onField && !match.scratched.includes(p.id)
  );

  const doSwap = (inId: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    swap(outId, inId);
    onClose();
  };

  const doQueue = (inId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    queueSub(outId, inId);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{out.name}</Text>
            <Text style={styles.sub}>
              {out.onField ? 'On field' : 'On bench'} ·{' '}
              {formatClock(match.minutes[out.id] ?? 0)}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {out.onField ? (
          <>
            <Text style={styles.section}>Sub on for {firstName(out.name)}</Text>
            <ScrollView style={styles.scroll}>
              {bench.length === 0 && (
                <Text style={styles.empty}>Nobody available on the bench.</Text>
              )}
              {bench.map((p) => (
                <View key={p.id} style={styles.benchRow}>
                  <View style={styles.benchMain}>
                    <Text style={styles.benchName}>{p.name}</Text>
                    <Text style={styles.benchMins}>
                      {formatClock(match.minutes[p.id] ?? 0)}
                    </Text>
                  </View>
                  <Pressable style={styles.queueBtn} onPress={() => doQueue(p.id)}>
                    <Text style={styles.queueText}>Queue</Text>
                  </Pressable>
                  <Pressable style={styles.nowBtn} onPress={() => doSwap(p.id)}>
                    <Text style={styles.nowText}>Now</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.secondary}
              onPress={() => {
                sendToBench(outId);
                onClose();
              }}
            >
              <Text style={styles.secondaryText}>Send to bench</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.empty}>
              {firstName(out.name)} is on the bench.
            </Text>
            <Pressable
              style={styles.primary}
              onPress={() => {
                bringOn(outId);
                onClose();
              }}
            >
              <Text style={styles.primaryText}>Bring on now</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.secondary} onPress={() => onEditBadge(outId)}>
          <Text style={styles.secondaryText}>Number or icon</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => {
            toggleScratch(outId);
            onClose();
          }}
        >
          <Text style={styles.secondaryText}>
            {match.scratched.includes(outId)
              ? 'Un-scratch (minutes resume)'
              : 'Scratch (stop counting minutes)'}
          </Text>
        </Pressable>
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
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: 18,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  close: { color: theme.textDim, fontSize: 18, paddingHorizontal: 4 },
  section: {
    color: theme.textDim,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scroll: { maxHeight: 260 },
  benchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  benchMain: { flex: 1 },
  benchName: { color: theme.text, fontSize: 16, fontWeight: '600' },
  benchMins: {
    color: theme.textDim,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  queueBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
  },
  queueText: { color: theme.queued, fontWeight: '700', fontSize: 13 },
  nowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: theme.live,
  },
  nowText: { color: theme.onAccent, fontWeight: '700', fontSize: 13 },
  primary: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: theme.live,
    alignItems: 'center',
  },
  primaryText: { color: theme.onAccent, fontWeight: '700', fontSize: 15 },
  secondary: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  secondaryText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  empty: { color: theme.textDim, textAlign: 'center', paddingVertical: 20 },
});
