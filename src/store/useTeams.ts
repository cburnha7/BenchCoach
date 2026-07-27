import { create } from 'zustand';
import { storage, TEAMS_KEY, matchKey } from './storage';
import {
  DEFAULT_COLOR,
  makeId,
  type Team,
  type TeamSize,
} from '../lib/types';

type TeamsState = {
  teams: Team[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
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
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const saved = await storage.read<Team[]>(TEAMS_KEY);
    set({ teams: saved ?? [], hydrated: true });
  },

  addTeam: async ({ name, size, color }) => {
    const team: Team = {
      id: makeId(),
      name: name.trim() || 'New Team',
      sport: 'soccer',
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
