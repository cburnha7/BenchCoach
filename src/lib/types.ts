import type { TeamSize } from './formations';

export type { TeamSize };

/** A team as it appears on the home screen. */
export type Team = {
  id: string;
  name: string;
  sport: 'soccer';
  size: TeamSize;
  color: string;
  /** Local file URI for the team photo, if set. */
  photoUri?: string;
};

/**
 * A player. `x`/`y` live in field coordinate space (600 x 840).
 * Bench players sit on the BENCH_Y row.
 */
export type Player = {
  id: string;
  name: string;
  onField: boolean;
  x: number;
  y: number;
  /** Jersey number, stored as a string so "07" survives. */
  jersey?: string;
  emoji?: string;
};

/** A substitution waiting to be executed. */
export type QueuedSub = {
  out: string;
  in: string;
};

/** Opponent shadow team, drawn mirrored on the far half. */
export type OpponentState = {
  on: boolean;
  formationIdx: number;
  pos: { x: number; y: number }[] | null;
};

/** A numbered pass between two points on the pitch. */
export type PassArrow = {
  id: string;
  n: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

/**
 * A movement trail. `carry` means the player took the ball with them, which
 * draws in the carry colour rather than the plain run colour.
 */
export type Ghost = {
  id: string;
  label: string;
  origin: { x: number; y: number };
  to: { x: number; y: number };
  carry: boolean;
  opponent: boolean;
};

/**
 * Everything about one team's current match.
 * `minutes` accumulates seconds per player while the clock runs.
 */
/** Per-player season tally. `g` goals, `a` assists. */
export type PlayerStat = { g: number; a: number };

/**
 * One goal by our team in the current game. Kept as a log (not just a count)
 * so a goal can be removed by name and its season stats backed out with it.
 * `scorerId`/`assistId` are null when the goal was added without attribution.
 */
export type GoalEvent = {
  id: string;
  scorerId: string | null;
  assistId: string | null;
};

export type MatchState = {
  teamId: string;
  size: TeamSize;
  roster: Player[];
  minutes: Record<string, number>;
  /** Current game score. `us` is this team, `them` the opponent. */
  score: { us: number; them: number };
  /** Our goals this game, in order scored. Length tracks `score.us`. */
  goals: GoalEvent[];
  /** Season goal/assist tallies per player id, cleared with a season reset. */
  stats: Record<string, PlayerStat>;
  scratched: string[];
  queue: QueuedSub[];
  formationIdx: number;
  /** Half length in minutes. */
  halfLen: number;
  /** Seconds left on the current half. */
  remaining: number;
  opponent: OpponentState;
  /** Tactics layer. Cleared with the board, not persisted between sessions. */
  arrows: PassArrow[];
  ghosts: Ghost[];
  /** Player currently on the ball, or null. */
  holder: string | null;
};

export const TEAM_COLORS = [
  '#e23b46',
  '#f0872e',
  '#e6b332',
  '#2fa35a',
  '#17a2a2',
  '#2f6bd6',
  '#1f3a6e',
  '#7a4fd0',
  '#d6469b',
  '#64748b',
] as const;

export const DEFAULT_COLOR = TEAM_COLORS[0];

export const TEAM_SIZES: TeamSize[] = [7, 9, 11];

export const formatSize = (size: TeamSize) => `${size}v${size}`;

/** Seconds -> "m:ss". */
export function formatClock(seconds: number): string {
  const t = Math.max(0, Math.floor(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Short, sortable, collision-resistant id. Mirrors the original scheme. */
export function makeId(prefix = 't'): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.floor(Math.random() * 46656).toString(36)
  );
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Up to two initials: first+last if multi-word, else the first two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * What a player's badge shows, in priority order: an emoji if set, otherwise a
 * jersey number, otherwise their initials. Used on the board disc and in the
 * roster list so the two never disagree.
 */
export function badgeLabel(p: Pick<Player, 'emoji' | 'jersey' | 'name'>): string {
  return p.emoji ?? p.jersey ?? initials(p.name);
}
