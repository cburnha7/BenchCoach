import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin typed wrapper over AsyncStorage.
 *
 * Deliberately kept behind this interface: when game history lands and the
 * data becomes relational (games -> appearances -> minutes), the intent is to
 * swap the implementation for expo-sqlite without touching the stores.
 */
export const storage = {
  async read<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  async write<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage failures are non-fatal; the in-memory state stays authoritative
      // for the rest of the session.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const TEAMS_KEY = 'bc_teams_v1';
export const matchKey = (teamId: string) => `bc_match_v1_${teamId}`;
