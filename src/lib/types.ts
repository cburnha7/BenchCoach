import type { TeamSize } from './formations';

export type { TeamSize };

/** The sports Bench Coach supports. Everything sport-specific keys off this. */
export type Sport = 'soccer' | 'basketball' | 'lacrosse';

/** Basketball only: which alignment a team is shown in. */
export type Side = 'offense' | 'defense';

/** A team as it appears on the home screen. */
export type Team = {
  id: string;
  name: string;
  sport: Sport;
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
  /**
   * The spot Reset returns them to — where they were placed (formation slot or
   * the slot of whoever they subbed on for), before any dragging. Dragging
   * moves x/y but never home.
   */
  homeX?: number;
  homeY?: number;
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
  /** Index of the opponent holding the ball, or null. */
  holder?: number | null;
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
  /** Sampled points the finger travelled through, for a curved trail. */
  points?: { x: number; y: number }[];
  carry: boolean;
  opponent: boolean;
};

/** A freehand line drawn on empty space (highlighting space, lanes, etc.). */
export type FreeDraw = {
  id: string;
  points: { x: number; y: number }[];
};

/**
 * Everything about one team's current match.
 * `minutes` accumulates seconds per player while the clock runs.
 */
/**
 * Per-player season tally. `g` scores made (soccer goals / basketball baskets),
 * `a` assists, `pts` points (soccer: 1 per goal; basketball: 1/2/3 per basket).
 */
export type PlayerStat = { g: number; a: number; pts: number };

/** A booking (soccer). `red` means sent off — benched for good. */
export type Card = 'yellow' | 'red';

/** Fouls to foul out (basketball). */
export const FOUL_OUT = 5;

/** Lacrosse penalty lengths offered, in seconds (0:30 technical, 1/2/3 personal). */
export const LAX_PENALTY_OPTIONS = [30, 60, 120, 180];
/** A penalty this long or longer counts as a personal foul. */
export const LAX_PERSONAL_SECONDS = 60;
/** Foul out after this many personals, or this many total penalty seconds. */
export const LAX_FOUL_OUT_PERSONALS = 3;
export const LAX_FOUL_OUT_SECONDS = 300;

/** Total penalty time (seconds) a player has served. */
export const penaltyTotal = (secs: number[] = []) =>
  secs.reduce((a, b) => a + b, 0);
/** How many of a player's penalties are personal fouls (1 min or longer). */
export const personalCount = (secs: number[] = []) =>
  secs.filter((s) => s >= LAX_PERSONAL_SECONDS).length;
/** Whether a lacrosse player has fouled out (3 personals or 5:00 total). */
export const isFouledOutLax = (secs: number[] = []) =>
  personalCount(secs) >= LAX_FOUL_OUT_PERSONALS ||
  penaltyTotal(secs) >= LAX_FOUL_OUT_SECONDS;

/**
 * One goal by our team in the current game. Kept as a log (not just a count)
 * so a goal can be removed by name and its season stats backed out with it.
 * `scorerId`/`assistId` are null when the goal was added without attribution.
 */
export type GoalEvent = {
  id: string;
  scorerId: string | null;
  assistId: string | null;
  /** Points this score was worth. Soccer is always 1; basketball 1/2/3. */
  points: number;
};

export type MatchState = {
  teamId: string;
  /** The team's sport, so the store can look up the right geometry. */
  sport: Sport;
  size: TeamSize;
  roster: Player[];
  minutes: Record<string, number>;
  /** Current game score. `us` is this team, `them` the opponent. */
  score: { us: number; them: number };
  /** Our goals this game, in order scored. Length tracks `score.us`. */
  goals: GoalEvent[];
  /** Season goal/assist tallies per player id, cleared with a season reset. */
  stats: Record<string, PlayerStat>;
  /** Bookings this game by player id (soccer). A red also forces the player off. */
  cards: Record<string, Card>;
  /** Fouls this game by player id (basketball). At FOUL_OUT the player is out. */
  fouls: Record<string, number>;
  /** Penalties this game by player id (lacrosse), each a length in seconds. */
  penalties: Record<string, number[]>;
  scratched: string[];
  queue: QueuedSub[];
  formationIdx: number;
  /** Basketball only: whole court (transition), or a single-hoop half court. */
  courtMode: 'full' | 'half';
  /** Basketball only: show our offense or our defense. */
  side: Side;
  /** Half length in minutes. */
  halfLen: number;
  /** Seconds left on the current half. */
  remaining: number;
  opponent: OpponentState;
  /** Tactics layer. Cleared with the board, not persisted between sessions. */
  arrows: PassArrow[];
  ghosts: Ghost[];
  /** Freehand lines drawn on the pitch. */
  drawings: FreeDraw[];
  /**
   * Shot-on-goal markers from double-tapping a goal: a line from `from` to the
   * goal at (x, y), capped with a burst.
   */
  shots: {
    id: string;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
  }[];
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
