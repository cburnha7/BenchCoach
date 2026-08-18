import { create } from 'zustand';
import { storage, TEAMS_KEY, SPORT_KEY, matchKey } from './storage';
import {
  DEFAULT_COLOR,
  makeId,
  type Sport,
  type Team,
  type TeamSize,
} from '../lib/types';
import { isSportEnabled } from '../lib/sports';

type TeamsState = {
  teams: Team[];
  /** The app-wide sport mode. Filters the home list; new teams inherit it. */
  sport: Sport;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSport: (sport: Sport) => Promise<void>;
  addTeam: (input: {
    name: string;
    size: TeamSize;
    color?: string;
  }) => Promise<string>;
  updateTeam: (id: string, patch: Partial<Omit<Team, 'id'>>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  reorder: (from: number, to: number) => Promise<void>;
};

export const useTeams = create<TeamsState>((set, get) => ({
  teams: [],
  sport: 'soccer',
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const [saved, sport] = await Promise.all([
      storage.read<Team[]>(TEAMS_KEY),
      storage.read<Sport>(SPORT_KEY),
    ]);
    // Fall back to soccer if the saved sport is parked (e.g. lacrosse).
    const active = sport && isSportEnabled(sport) ? sport : 'soccer';
    set({ teams: saved ?? [], sport: active, hydrated: true });
  },

  setSport: async (sport) => {
    set({ sport });
    await storage.write(SPORT_KEY, sport);
  },

  addTeam: async ({ name, size, color }) => {
    const team: Team = {
      id: makeId(),
      name: name.trim() || 'New Team',
      sport: get().sport,
      size,
      color: color ?? DEFAULT_COLOR,
    };
    const teams = [...get().teams, team];
    set({ teams });
    await storage.write(TEAMS_KEY, teams);
    return team.id;
  },

  updateTeam: async (id, patch) => {
    const teams = get().teams.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ teams });
    await storage.write(TEAMS_KEY, teams);
  },

  deleteTeam: async (id) => {
    const teams = get().teams.filter((t) => t.id !== id);
    set({ teams });
    await storage.write(TEAMS_KEY, teams);
    await storage.remove(matchKey(id));
  },

  reorder: async (from, to) => {
    const teams = [...get().teams];
    const [moved] = teams.splice(from, 1);
    if (!moved) return;
    teams.splice(to, 0, moved);
    set({ teams });
    await storage.write(TEAMS_KEY, teams);
  },
}));

export const selectTeam = (id: string) => (s: TeamsState) =>
  s.teams.find((t) => t.id === id);
