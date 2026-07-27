import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StadiumBackdrop } from '../src/components/StadiumBackdrop';
import { useTeams } from '../src/store/useTeams';
import {
  DEFAULT_COLOR,
  TEAM_COLORS,
  TEAM_SIZES,
  formatSize,
  type Team,
  type TeamSize,
} from '../src/lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamEditSheet } from '../src/components/TeamEditSheet';
import { theme, radius, rgba, mix } from '../src/lib/theme';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const teams = useTeams((s) => s.teams);
  const hydrated = useTeams((s) => s.hydrated);
  const hydrate = useTeams((s) => s.hydrate);
  const addTeam = useTeams((s) => s.addTeam);
  const updateTeam = useTeams((s) => s.updateTeam);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState<TeamSize>(9);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const create = async () => {
    const id = await addTeam({ name, size, color });
    setCreating(false);
    setName('');
    setSize(9);
    setColor(DEFAULT_COLOR);
    router.push(`/team/${id}`);
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <Pressable
      style={({ pressed }) => [styles.teamCard, pressed && styles.teamPressed]}
      onPress={() =>
        editing ? setEditId(item.id) : router.push(`/team/${item.id}`)
      }
    >
      {item.photoUri && (
        <Image
          source={{ uri: item.photoUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      )}

      {/*
        The card carries the team's colour, mixed toward the base rather than
        laid over it at low alpha — alpha-over-dark desaturates and everything
        ends up looking grey. Over a photo we still need alpha, so the photo
        shows through; without one the fill is fully opaque.
      */}
      <LinearGradient
        colors={
          item.photoUri
            ? [rgba(item.color, 0.82), rgba(mix(item.color, 0.78), 0.94)]
            : [mix(item.color, 0.42), mix(item.color, 0.8)]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Full-height colour edge: reads instantly, survives any photo. */}
      <View style={[styles.edge, { backgroundColor: item.color }]} />

      <View style={styles.teamInner}>
        <View style={styles.teamMain}>
          <Text style={styles.teamName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.teamMeta}>{formatSize(item.size)}</Text>
            <Text style={styles.metaSep}>·</Text>
            <Text style={styles.teamMeta}>Soccer</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.editPill}>
            <Text style={styles.editPillText}>Edit</Text>
          </View>
        ) : (
          <View style={styles.go}>
            <Text style={styles.goText}>›</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <StadiumBackdrop />

      {/*
        Edit lives in the navigation header rather than a row of its own: the
        header was already showing the app name, so a second bar underneath it
        was a duplicate title and a wasted 44pt of screen.
      */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => setEditing((e) => !e)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.editBtn,
                editing && styles.editBtnOn,
                pressed && styles.editPressed,
              ]}
            >
              <Text style={[styles.editBtnText, editing && styles.editBtnTextOn]}>
                {editing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        renderItem={renderTeam}
        contentContainerStyle={[
          styles.list,
          // Transparent header means content starts at the top of the screen,
          // so the first card has to clear it manually.
          { paddingTop: insets.top + 52 },
        ]}
        ListEmptyComponent={
          hydrated ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Add your first team</Text>
              <Text style={styles.emptyBody}>
                Track lineups, minutes and subs from the sideline. Everything
                stays on this device.
              </Text>
            </View>
          ) : null
        }
      />

      <Pressable
        style={[styles.addTeam, { marginBottom: insets.bottom + 12 }]}
        onPress={() => setCreating(true)}
      >
        <Text style={styles.addTeamText}>Add team</Text>
      </Pressable>

      <Modal
        visible={creating}
        transparent
        animationType="fade"
        onRequestClose={() => setCreating(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCreating(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>New team</Text>
          <Text style={styles.modalSub}>Saved on this device</Text>

          <Text style={styles.label}>Team name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. U11 Girls"
            placeholderTextColor={theme.textDim}
            style={styles.input}
            maxLength={28}
            autoCorrect={false}
          />

          <Text style={styles.label}>Players on the field</Text>
          <View style={styles.sizeRow}>
            {TEAM_SIZES.map((s) => (
              <Pressable
                key={s}
                style={[styles.sizeBtn, size === s && styles.sizeOn]}
                onPress={() => setSize(s)}
              >
                <Text style={[styles.sizeText, size === s && styles.sizeTextOn]}>
                  {formatSize(s)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Team color</Text>
          <View style={styles.colorRow}>
            {TEAM_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchOn,
                ]}
              />
            ))}
          </View>

          <Pressable style={styles.create} onPress={create}>
            <Text style={styles.createText}>Create team</Text>
          </Pressable>
        </View>
      </Modal>

      <TeamEditSheet teamId={editId} onClose={() => setEditId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
  },
  editBtnOn: { backgroundColor: theme.text, borderColor: theme.text },
  editPressed: { opacity: 0.75 },
  editBtnText: { color: theme.text, fontSize: 14, fontWeight: '700' },
  editBtnTextOn: { color: theme.bg },
  editPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: theme.text,
  },
  editPillText: { color: theme.bg, fontWeight: '800', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 11 },
  teamCard: {
    height: 88,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 7,
  },
  teamPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  teamInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 14,
  },
  teamMain: { flex: 1 },
  teamName: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  metaSep: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  go: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
    marginTop: -2,
    marginLeft: 2,
  },
  teamMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600' },
  empty: { paddingTop: 60, paddingHorizontal: 30, alignItems: 'center' },
  emptyTitle: { color: theme.text, fontSize: 19, fontWeight: '700' },
  emptyBody: {
    color: theme.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  addTeam: {
    marginHorizontal: 16,
    paddingVertical: 19,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
    shadowColor: theme.live,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  addTeamText: { color: theme.onAccent, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  modal: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: '11%',
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: { color: theme.text, fontSize: 22, fontWeight: '800' },
  modalSub: { color: theme.textDim, fontSize: 13, marginTop: 3 },
  label: {
    color: theme.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 9,
  },
  input: {
    backgroundColor: theme.control,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.text,
    fontSize: 16,
  },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    alignItems: 'center',
  },
  sizeOn: { backgroundColor: theme.text },
  sizeText: { color: theme.text, fontWeight: '700' },
  sizeTextOn: { color: theme.bg },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: theme.text },
  create: {
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: theme.live,
    alignItems: 'center',
  },
  createText: { color: theme.onAccent, fontSize: 16, fontWeight: '700' },
});
