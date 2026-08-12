import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useTeams } from '../store/useTeams';
import {
  TEAM_COLORS,
  TEAM_SIZES,
  formatSize,
  type TeamSize,
} from '../lib/types';
import { theme, radius, rgba, mix } from '../lib/theme';

type Props = {
  /** Team id to edit, or null when closed. */
  teamId: string | null;
  onClose: () => void;
};

/** Where team photos are copied so they survive app relaunches. */
const PHOTO_DIR = FileSystem.documentDirectory + 'teamPhotos/';

/**
 * Copy a picked image into the app's document directory and return that path.
 * The image picker hands back a temporary file iOS purges between launches;
 * persisting it here is what stops the team card going grey next time.
 */
async function persistPhoto(uri: string, teamId: string): Promise<string> {
  try {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  } catch {
    // Directory already exists — fine.
  }
  const dest = `${PHOTO_DIR}${teamId}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

/** Delete a photo we previously copied (ignore anything else / failures). */
async function deleteLocalPhoto(uri?: string) {
  if (!uri || !uri.startsWith(PHOTO_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Non-fatal.
  }
}

/**
 * Everything that belongs to the team rather than to a player: the photo that
 * backs its card, its name, colour and size.
 */
export function TeamEditSheet({ teamId, onClose }: Props) {
  const team = useTeams((s) => s.teams.find((t) => t.id === teamId));
  const updateTeam = useTeams((s) => s.updateTeam);
  const deleteTeam = useTeams((s) => s.deleteTeam);

  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(team?.name ?? '');
    setConfirmDelete(false);
  }, [teamId, team?.name]);

  if (!teamId || !team) return null;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      // Matches the team card's shape, so what you crop is what you get.
      aspect: [16, 9],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const previous = team.photoUri;
    const saved = await persistPhoto(result.assets[0].uri, teamId);
    await updateTeam(teamId, { photoUri: saved });
    void deleteLocalPhoto(previous);
  };

  const removePhoto = () => {
    const previous = team.photoUri;
    void updateTeam(teamId, { photoUri: undefined });
    void deleteLocalPhoto(previous);
  };

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== team.name) void updateTeam(teamId, { name: trimmed });
    onClose();
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={commit}
    >
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Photo preview, exactly as it will look on the team card. */}
          <Pressable style={styles.photo} onPress={pickPhoto}>
            {team.photoUri ? (
              <Image
                source={{ uri: team.photoUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            ) : null}
            <LinearGradient
              colors={
                team.photoUri
                  ? [rgba(team.color, 0.82), rgba(mix(team.color, 0.78), 0.94)]
                  : [mix(team.color, 0.42), mix(team.color, 0.8)]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.edge, { backgroundColor: team.color }]} />
            <View style={styles.photoInner}>
              <Text style={styles.photoName} numberOfLines={1}>
                {name || team.name}
              </Text>
              <View style={styles.photoBtn}>
                <Text style={styles.photoBtnText}>
                  {team.photoUri ? 'Change photo' : 'Add team photo'}
                </Text>
              </View>
            </View>
          </Pressable>

          {team.photoUri && (
            <Pressable style={styles.removePhoto} onPress={removePhoto}>
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Team name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={28}
            autoCorrect={false}
            placeholder="Team name"
            placeholderTextColor={theme.textDim}
          />

          <Text style={styles.label}>Players on the field</Text>
          <View style={styles.sizeRow}>
            {TEAM_SIZES.map((s) => (
              <Pressable
                key={s}
                style={[styles.sizeBtn, team.size === s && styles.sizeOn]}
                onPress={() => void updateTeam(teamId, { size: s as TeamSize })}
              >
                <Text
                  style={[styles.sizeText, team.size === s && styles.sizeTextOn]}
                >
                  {formatSize(s)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.note}>
            Changing size reloads the formation list for that format.
          </Text>

          <Text style={styles.label}>Team color</Text>
          <View style={styles.colorRow}>
            {TEAM_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => void updateTeam(teamId, { color: c })}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  team.color === c && styles.swatchOn,
                ]}
              />
            ))}
          </View>

          <Pressable
            style={[styles.delete, confirmDelete && styles.deleteArmed]}
            onPress={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              void deleteTeam(teamId);
              onClose();
            }}
          >
            <Text style={styles.deleteText}>
              {confirmDelete ? 'Tap again to delete this team' : 'Delete team'}
            </Text>
          </Pressable>
        </ScrollView>

        <Pressable style={styles.done} onPress={commit}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 16, paddingBottom: 110 },
  photo: {
    height: 132,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'flex-end',
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  photoInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    paddingLeft: 18,
  },
  photoName: {
    flex: 1,
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  photoBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photoBtnText: { color: theme.text, fontWeight: '700', fontSize: 12.5 },
  removePhoto: { alignSelf: 'center', paddingVertical: 12 },
  removePhotoText: { color: theme.textDim, fontSize: 13, fontWeight: '600' },
  label: {
    color: theme.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 9,
  },
  input: {
    backgroundColor: theme.control,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.text,
    fontSize: 16,
  },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
  },
  sizeOn: { backgroundColor: theme.text, borderColor: theme.text },
  sizeText: { color: theme.text, fontWeight: '700', fontSize: 15 },
  sizeTextOn: { color: theme.bg },
  note: { color: theme.textDim, fontSize: 12, marginTop: 8 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: theme.text },
  delete: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  deleteArmed: { backgroundColor: theme.danger, borderColor: theme.danger },
  deleteText: { color: theme.danger, fontWeight: '700', fontSize: 15 },
  done: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
    shadowColor: theme.live,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  doneText: { color: theme.onAccent, fontWeight: '800', fontSize: 16 },
});
