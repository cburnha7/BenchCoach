import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanSheet } from './ScanSheet';
import { useMatch } from '../store/useMatch';
import { formatClock, type Player } from '../lib/types';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  color: string;
  onEditBadge: (playerId: string) => void;
};

/**
 * The squad: add players, see live minutes, set a player's number or icon.
 * Team-level settings (photo, colour, size) live on the team edit screen —
 * this sheet is only ever about players.
 */
export function RosterSheet({
  visible,
  onClose,
  teamName,
  color,
  onEditBadge,
}: Props) {
  const insets = useSafeAreaInsets();
  const match = useMatch((s) => s.match);
  // Subscribing to tickCount keeps the minutes column live while the clock runs.
  useMatch((s) => s.tickCount);
  const addPlayer = useMatch((s) => s.addPlayer);
  const removePlayer = useMatch((s) => s.removePlayer);
  const toggleScratch = useMatch((s) => s.toggleScratch);
  const sendToBench = useMatch((s) => s.sendToBench);
  const bringOn = useMatch((s) => s.bringOn);

  const [name, setName] = useState('');
  const [scanning, setScanning] = useState(false);

  if (!match) return null;

  const submit = () => {
    if (!name.trim()) return;
    addPlayer(name);
    setName('');
  };

  const onField = match.roster.filter((p) => p.onField).length;

  // Least minutes first: the question this screen answers is who needs a run.
  const sorted = [...match.roster].sort(
    (a, b) => (match.minutes[a.id] ?? 0) - (match.minutes[b.id] ?? 0)
  );

  const renderItem = ({ item }: { item: Player }) => {
    const scratched = match.scratched.includes(item.id);
    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => onEditBadge(item.id)}
          style={[
            styles.badge,
            {
              backgroundColor: item.onField ? color : theme.surfaceAlt,
              opacity: scratched ? 0.4 : 1,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {item.jersey ?? item.emoji ?? item.name.slice(0, 1).toUpperCase()}
          </Text>
        </Pressable>

        <View style={styles.rowMain}>
          <Text style={[styles.name, scratched && styles.dim]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.status}>
            {scratched ? 'Scratched' : item.onField ? 'On field' : 'Bench'}
          </Text>
        </View>

        <Text style={[styles.mins, scratched && styles.dim]}>
          {formatClock(match.minutes[item.id] ?? 0)}
        </Text>

        <Pressable
          style={[styles.actionBtn, item.onField && styles.actionOn]}
          onPress={() => (item.onField ? sendToBench(item.id) : bringOn(item.id))}
          hitSlop={6}
        >
          <Text style={styles.actionText}>{item.onField ? 'Bench' : 'On'}</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => toggleScratch(item.id)}
          hitSlop={6}
        >
          <Text style={styles.actionText}>{scratched ? 'Undo' : 'Scratch'}</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onLongPress={() => removePlayer(item.id)}
          delayLongPress={500}
          hitSlop={6}
        >
          <Text style={[styles.actionText, styles.danger]}>Del</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={[styles.accent, { backgroundColor: color }]} />
          <View style={styles.headerInner}>
            <Text style={styles.title}>{teamName}</Text>
            <Text style={styles.headerSub}>
              {match.roster.length} players · {onField} on field
            </Text>
          </View>
        </View>

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

        <FlatList
          data={sorted}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 60 },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No players yet</Text>
              <Text style={styles.emptyBody}>
                Add them above. The first {match.size} go straight onto the
                field.
              </Text>
            </View>
          }
          ListHeaderComponent={
            match.roster.length > 0 ? (
              <Text style={styles.listCap}>
                Fewest minutes first · tap a badge to set a number
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', paddingTop: 18, paddingBottom: 4 },
  accent: { width: 5, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  headerInner: { flex: 1, paddingLeft: 14, paddingRight: 18 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { color: theme.textDim, fontSize: 13, marginTop: 4, fontWeight: '500' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginHorizontal: 16,
    marginTop: 14,
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
  list: { paddingHorizontal: 16 },
  listCap: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
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
  rowMain: { flex: 1 },
  name: { color: theme.text, fontSize: 16, fontWeight: '600' },
  status: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  dim: { opacity: 0.5 },
  mins: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'right',
  },
  actionBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
  },
  actionOn: { backgroundColor: theme.controlBorder },
  actionText: { color: theme.text, fontSize: 11.5, fontWeight: '700' },
  danger: { color: theme.danger },
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
