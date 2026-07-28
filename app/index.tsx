import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DraggableTeamList } from '../src/components/DraggableTeamList';
import { TeamEditSheet } from '../src/components/TeamEditSheet';
import { useTeams } from '../src/store/useTeams';
import {
  DEFAULT_COLOR,
  TEAM_COLORS,
  TEAM_SIZES,
  formatSize,
  type Team,
  type TeamSize,
} from '../src/lib/types';
import { theme, radius, mix } from '../src/lib/theme';

const MAX_TEAMS = 5;
const GAP = 14;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const teams = useTeams((s) => s.teams);
  const hydrated = useTeams((s) => s.hydrated);
  const hydrate = useTeams((s) => s.hydrate);
  const addTeam = useTeams((s) => s.addTeam);
  const reorder = useTeams((s) => s.reorder);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState<TeamSize>(9);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  // Measured height of the list area, so cards can fill it.
  const [listH, setListH] = useState(0);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // No card taller than a third of the list; past three teams they share the
  // space evenly (1/4 for four, 1/5 for five).
  const rows = Math.min(Math.max(teams.length, 1), MAX_TEAMS);
  const cardH =
    listH > 0
      ? Math.min(listH / 3, (listH - GAP * (rows - 1)) / rows)
      : 180;
  const atMax = teams.length >= MAX_TEAMS;

  const create = async () => {
    const id = await addTeam({ name, size, color });
    setCreating(false);
    setName('');
    setSize(9);
    setColor(DEFAULT_COLOR);
    router.push(`/team/${id}`);
  };

  const renderTeam = (item: Team) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { height: cardH, borderColor: item.color },
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        editing ? setEditId(item.id) : router.push(`/team/${item.id}`)
      }
    >
      {item.photoUri ? (
        <Image
          source={{ uri: item.photoUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[mix(item.color, 0.15), mix(item.color, 0.5)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Slight fade at the bottom so the name reads; the photo stays the star. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.cardInner}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta}>{formatSize(item.size)} · Soccer</Text>
      </View>

      {editing && (
        <View style={styles.editPill}>
          <Text style={styles.editPillText}>Edit</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: 'Bench Coach',
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0e1320',
          headerTitleStyle: { color: '#0e1320', fontWeight: '800' },
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

      <View
        style={styles.listArea}
        onLayout={(e) => setListH(e.nativeEvent.layout.height)}
      >
        {teams.length === 0 ? (
          hydrated ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Add your first team</Text>
              <Text style={styles.emptyBody}>
                Track lineups, minutes and subs from the sideline. Everything
                stays on this device.
              </Text>
            </View>
          ) : null
        ) : (
          <DraggableTeamList
            teams={teams}
            editing={editing}
            onReorder={reorder}
            renderItem={renderTeam}
            cardHeight={cardH}
            gap={GAP}
            paddingTop={12}
            paddingBottom={12}
          />
        )}
      </View>

      {!atMax && (
        <Pressable
          style={[styles.addTeam, { marginBottom: insets.bottom + 12 }]}
          onPress={() => setCreating(true)}
        >
          <Text style={styles.addTeamText}>Add team</Text>
        </Pressable>
      )}

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
  screen: { flex: 1, backgroundColor: '#ffffff' },
  listArea: { flex: 1 },
  // Header Edit button, dark on the white screen.
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  editBtnOn: { paddingHorizontal: 14, backgroundColor: '#0e1320' },
  editPressed: { opacity: 0.6 },
  editBtnText: { color: '#0e1320', fontSize: 16, fontWeight: '600' },
  editBtnTextOn: { color: '#ffffff', fontWeight: '700' },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 4,
    backgroundColor: '#dfe3ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.22,
    elevation: 6,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cardInner: { flex: 1, justifyContent: 'flex-end', padding: 18 },
  cardName: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  editPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  editPillText: { color: '#0e1320', fontWeight: '800', fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, alignItems: 'center' },
  emptyTitle: { color: '#0e1320', fontSize: 20, fontWeight: '800' },
  emptyBody: {
    color: '#5b6472',
    fontSize: 14.5,
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
    shadowOpacity: 0.3,
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
