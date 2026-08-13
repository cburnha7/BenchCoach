import { AppState } from 'react-native';
import { create } from 'zustand';
import { storage, matchKey } from './storage';
import { BENCH_Y, type TeamSize } from '../lib/formations';
import { COURT_W, COURT_H, bballDims } from '../lib/basketball';
import { LAX_COORD_V } from '../lib/lacrosse';
import {
  ourFormations,
  ourSlots,
  oppFormations,
  oppSlots,
  type CourtMode,
} from '../lib/sports';
import {
  clamp,
  makeId,
  FOUL_OUT,
  isFouledOutLax,
  type Card,
  type FreeDraw,
  type Ghost,
  type MatchState,
  type PassArrow,
  type Player,
  type QueuedSub,
  type Side,
  type Sport,
} from '../lib/types';

/** The slots of our current formation (offense or defense), for the mode. */
const slotsOf = (m: MatchState) =>
  ourSlots(m.sport, m.size, m.courtMode, m.side, m.formationIdx);
/** How many formations our side offers for this mode/size. */
const formCount = (m: MatchState) =>
  ourFormations(m.sport, m.size, m.courtMode, m.side).length;
/** Opponent slots (the opposite role) for the active layout. */
const oppSlotsOf = (m: MatchState, idx: number) =>
  oppSlots(m.sport, m.size, m.courtMode, m.side, idx);
/** How many formations the opponent has for the active layout. */
const oppCount = (m: MatchState) =>
  oppFormations(m.sport, m.size, m.courtMode, m.side).length;
/** Put on-field players onto `slots` in order, re-homing them there. */
const placeOnSlots = (roster: Player[], slots: { x: number; y: number }[]) => {
  let i = 0;
  return roster.map((p) => {
    if (!p.onField) return p;
    const s = slots[i];
    i += 1;
    return s ? { ...p, x: s.x, y: s.y, homeX: s.x, homeY: s.y } : p;
  });
};

/** Which way an opponent (defender) retreats when it's hidden under one of our
 *  players: toward its own end. Full court / soccer that's the top; half court
 *  it's toward the hoop it defends (our offense) or the backcourt (our defense). */
const oppEndDir = (m: MatchState) => {
  if (m.sport === 'basketball' && m.courtMode === 'half') {
    return m.side === 'offense' ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
  }
  return { dx: 0, dy: -1 };
};

/**
 * Keep opponent markers from hiding under our players: any that overlaps an
 * on-field player is stepped toward its own end until it's clear (or it reaches
 * the boundary). `roster` lets callers pass a freshly re-laid lineup.
 */
const bumpOpponent = (
  m: MatchState,
  oppSlots: { x: number; y: number }[],
  roster: Player[] = m.roster
) => {
  const ours = roster.filter((p) => p.onField);
  if (!ours.length || !oppSlots.length) return oppSlots;
  const { w, h } = m.sport === 'basketball' ? bballDims(m.courtMode) : { w: 600, h: 840 };
  const dir = oppEndDir(m);
  const CLEAR = 46 * 46; // squared centre distance that still counts as covered
  const STEP = 10;
  const PAD = 18;
  const covered = (x: number, y: number) =>
    ours.some((o) => (o.x - x) ** 2 + (o.y - y) ** 2 < CLEAR);
  return oppSlots.map((s) => {
    let x = s.x;
    let y = s.y;
    let guard = 40;
    while (guard-- > 0 && covered(x, y)) {
      const nx = x + dir.dx * STEP;
      const ny = y + dir.dy * STEP;
      if (nx < PAD || nx > w - PAD || ny < PAD || ny > h - PAD) break;
      x = nx;
      y = ny;
    }
    return { x, y };
  });
};

const TICK_MS = 250;
const SAVE_EVERY_S = 5;
const MAX_DELTA_S = 2;

function emptyMatch(teamId: string, size: TeamSize, sport: Sport): MatchState {
  return {
    teamId,
    sport,
    size,
    roster: [],
    minutes: {},
    score: { us: 0, them: 0 },
    goals: [],
    stats: {},
    cards: {},
    fouls: {},
    penalties: {},
    scratched: [],
    queue: [],
    formationIdx: 0,
    courtMode: 'full',
    side: 'offense',
    coordV: LAX_COORD_V,
    halfLen: 25,
    remaining: 25 * 60,
    opponent: { on: false, formationIdx: 0, pos: null, holder: null },
    arrows: [],
    drawings: [],
    shots: [],
    ghosts: [],
    holder: null,
  };
}

/** Evenly space bench players along the bench row below the pitch. */
function benchLayout(roster: Player[]): Player[] {
  const bench = roster.filter((p) => !p.onField);
  const gap = 64;
  const totalW = Math.max(0, (bench.length - 1) * gap);
  const startX = 300 - totalW / 2;
  let i = 0;
  return roster.map((p) => {
    if (p.onField) return p;
    const next = { ...p, x: startX + i * gap, y: BENCH_Y };
    i += 1;
    return next;
  });
}

type MatchStore = {
  match: MatchState | null;
  running: boolean;
  /** Bumped on every tick so subscribed components re-render cheaply. */
  tickCount: number;

  load: (teamId: string, size: TeamSize, sport: Sport) => Promise<void>;
  unload: () => void;
  save: () => Promise<void>;

  startClock: () => void;
  stopClock: () => void;
  resetClock: () => void;
  setHalfLen: (minutes: number) => void;

  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  setJersey: (id: string, jersey: string | undefined) => void;
  setEmoji: (id: string, emoji: string | undefined) => void;
  toggleScratch: (id: string) => void;
  giveCard: (id: string, card: Card) => void;
  clearCard: (id: string) => void;
  addFoul: (id: string) => void;
  removeFoul: (id: string) => void;
  addPenalty: (id: string, seconds: number) => void;
  removePenalty: (id: string) => void;

  bumpScore: (team: 'us' | 'them', delta: number) => void;
  recordGoal: (
    scorerId: string | null,
    assistId: string | null,
    points?: number
  ) => void;
  removeGoal: (goalId: string) => void;
  resetScore: () => void;
  resetStats: () => void;
  resetMinutes: () => void;
  resetCards: () => void;

  movePlayer: (id: string, x: number, y: number) => void;
  setFormation: (idx: number) => void;
  applyFormation: () => void;
  resetPositions: () => void;
  setCourtMode: (mode: CourtMode) => void;
  setSide: (side: Side) => void;

  swap: (outId: string, inId: string) => void;
  swapPositions: (aId: string, bId: string) => void;
  sendToBench: (id: string) => void;
  bringOn: (id: string) => void;
  bringOnAt: (id: string, x: number, y: number) => void;
  queueSub: (outId: string, inId: string) => void;
  dropQueued: (index: number) => void;
  runQueued: (index: number) => void;
  runAllQueued: () => void;

  // Tactics layer
  tapForBall: (id: string) => void;
  clearBoard: () => void;
  addGhost: (
    label: string,
    origin: { x: number; y: number },
    to: { x: number; y: number },
    carry: boolean,
    opponent: boolean,
    points?: { x: number; y: number }[]
  ) => void;
  addDrawing: (points: { x: number; y: number }[]) => void;
  toggleShot: (x: number, y: number) => void;
  clearGhosts: () => void;

  // Opponent shadow team
  toggleOpponent: () => void;
  setOpponentFormation: (idx: number) => void;
  moveOpponent: (index: number, x: number, y: number) => void;
  resetOpponent: () => void;
  tapOpponentBall: (index: number) => void;
};

let timer: ReturnType<typeof setInterval> | null = null;
let lastTs = 0;
let saveAccum = 0;

export const useMatch = create<MatchStore>((set, get) => {
  /** Mutate the match immutably and persist. */
  const patch = (fn: (m: MatchState) => MatchState, persist = true) => {
    const current = get().match;
    if (!current) return;
    const next = fn(current);
    set({ match: next });
    if (persist) void storage.write(matchKey(next.teamId), next);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    set({ running: false });
  };

  return {
    match: null,
    running: false,
    tickCount: 0,

    load: async (teamId, size, sport) => {
      stop();
      const saved = await storage.read<MatchState>(matchKey(teamId));
      const base = saved ?? emptyMatch(teamId, size, sport);
      // Team size / sport can change on the team record after a match was saved.
      const match: MatchState = {
        ...emptyMatch(teamId, size, sport),
        ...base,
        teamId,
        sport,
        size,
        formationIdx: clamp(
          base.formationIdx ?? 0,
          0,
          Math.max(
            0,
            ourFormations(sport, size, base.courtMode ?? 'full', base.side ?? 'offense').length - 1
          )
        ),
        // The tactics board starts clean each session.
        arrows: [],
        ghosts: [],
        drawings: [],
        shots: [],
        holder: null,
      };
      // Backfill minute entries and home spots for older saved players.
      match.roster = match.roster.map((p) => ({
        ...p,
        homeX: p.homeX ?? p.x,
        homeY: p.homeY ?? p.y,
      }));
      // Ball possession is a per-session tactics state, not persisted.
      match.opponent = { ...match.opponent, holder: null };
      match.roster.forEach((p) => {
        if (match.minutes[p.id] == null) match.minutes[p.id] = 0;
      });

      // The basketball court moved from the 600x840 pitch space to a true-scale
      // 500x940 court. A match saved by an older build would have on-field
      // players off the new floor — snap them onto the current formation and
      // re-mirror the opponents so nothing loads off-court.
      if (sport === 'basketball') {
        const slots = slotsOf(match);
        const stale = match.roster.some(
          (p) => p.onField && (p.x > COURT_W || p.y > COURT_H)
        );
        if (stale && slots.length) {
          match.roster = placeOnSlots(match.roster, slots);
          if (match.opponent.pos) {
            match.opponent = {
              ...match.opponent,
              pos: oppSlotsOf(match, match.opponent.formationIdx),
            };
          }
        }
      }

      // Lacrosse geometry changed to true 600x1100 scale; re-lay older matches
      // onto the current formation.
      if (sport === 'lacrosse' && (base.coordV ?? 0) < LAX_COORD_V) {
        const slots = slotsOf(match);
        if (slots.length) {
          match.roster = placeOnSlots(match.roster, slots);
          if (match.opponent.pos) {
            match.opponent = {
              ...match.opponent,
              pos: oppSlotsOf(match, match.opponent.formationIdx),
            };
          }
        }
      }
      match.coordV = LAX_COORD_V;

      set({ match, running: false, tickCount: 0 });
    },

    unload: () => {
      // Flush the exact current state before dropping it from memory, so the
      // lineup is safe even if the last mutation's write hadn't landed yet.
      const m = get().match;
      if (m) void storage.write(matchKey(m.teamId), m);
      stop();
      set({ match: null });
    },

    save: async () => {
      const m = get().match;
      if (m) await storage.write(matchKey(m.teamId), m);
    },

    startClock: () => {
      const m = get().match;
      if (!m || get().running || m.remaining <= 0) return;
      lastTs = Date.now();
      saveAccum = 0;
      set({ running: true });
      timer = setInterval(() => {
        const state = get();
        const cur = state.match;
        if (!cur) return;
        const now = Date.now();
        let delta = (now - lastTs) / 1000;
        lastTs = now;
        if (delta < 0) delta = 0;
        if (delta > MAX_DELTA_S) delta = MAX_DELTA_S;

        const minutes = { ...cur.minutes };
        cur.roster.forEach((p) => {
          if (p.onField && !cur.scratched.includes(p.id)) {
            minutes[p.id] = (minutes[p.id] ?? 0) + delta;
          }
        });
        const remaining = Math.max(0, cur.remaining - delta);
        const next: MatchState = { ...cur, minutes, remaining };
        set({ match: next, tickCount: state.tickCount + 1 });

        saveAccum += delta;
        if (saveAccum >= SAVE_EVERY_S) {
          saveAccum = 0;
          void storage.write(matchKey(next.teamId), next);
        }
        if (remaining <= 0) {
          stop();
          void storage.write(matchKey(next.teamId), next);
        }
      }, TICK_MS);
    },

    stopClock: () => {
      stop();
      void get().save();
    },

    resetClock: () => {
      stop();
      patch((m) => ({ ...m, remaining: m.halfLen * 60 }));
    },

    setHalfLen: (minutes) => {
      if (get().running) return;
      patch((m) => {
        const halfLen = clamp(minutes, 5, 45);
        return { ...m, halfLen, remaining: halfLen * 60 };
      });
    },

    addPlayer: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      patch((m) => {
        const onField = m.roster.filter((p) => p.onField);
        const goOn = onField.length < m.size;
        // Starters drop straight into the next open formation slot rather than
        // stacking at centre — loading a roster fills the shape in order.
        let x = 300;
        let y = BENCH_Y;
        if (goOn) {
          const slots = slotsOf(m);
          const taken = onField.map((p) => `${p.x},${p.y}`);
          const free =
            slots.find((s) => !taken.includes(`${s.x},${s.y}`)) ??
            ({ x: 300, y: 400 } as const);
          x = free.x;
          y = free.y;
        }
        const player: Player = {
          id: makeId('p'),
          name: trimmed,
          onField: goOn,
          x,
          y,
          homeX: x,
          homeY: y,
        };
        const roster = benchLayout([...m.roster, player]);
        return {
          ...m,
          roster,
          minutes: { ...m.minutes, [player.id]: m.minutes[player.id] ?? 0 },
        };
      });
    },

    removePlayer: (id) => {
      patch((m) => {
        const minutes = { ...m.minutes };
        delete minutes[id];
        const stats = { ...m.stats };
        delete stats[id];
        const cards = { ...m.cards };
        delete cards[id];
        const fouls = { ...m.fouls };
        delete fouls[id];
        const penalties = { ...m.penalties };
        delete penalties[id];
        return {
          ...m,
          roster: benchLayout(m.roster.filter((p) => p.id !== id)),
          minutes,
          stats,
          cards,
          fouls,
          penalties,
          scratched: m.scratched.filter((s) => s !== id),
          queue: m.queue.filter((q) => q.out !== id && q.in !== id),
        };
      });
    },

    renamePlayer: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
      }));
    },

    setJersey: (id, jersey) => {
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) =>
          p.id === id ? { ...p, jersey: jersey || undefined } : p
        ),
      }));
    },

    setEmoji: (id, emoji) => {
      // Emoji and jersey coexist: the emoji wins on the badge, the number is
      // kept as the fallback for when the emoji is later cleared, and it still
      // identifies the player elsewhere. Priority lives in `badgeLabel`.
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) =>
          p.id === id ? { ...p, emoji: emoji || undefined } : p
        ),
      }));
    },

    toggleScratch: (id) => {
      patch((m) => {
        if (m.scratched.includes(id)) {
          // Un-scratch: available again; they sit on the bench.
          return { ...m, scratched: m.scratched.filter((s) => s !== id) };
        }
        // Scratch: mark them and vacate their spot if they were on the field,
        // leaving an open (fillable) slot.
        const player = m.roster.find((p) => p.id === id);
        const scratched = [...m.scratched, id];
        if (!player?.onField) return { ...m, scratched };
        return {
          ...m,
          scratched,
          holder: m.holder === id ? null : m.holder,
          roster: benchLayout(
            m.roster.map((p) => (p.id === id ? { ...p, onField: false } : p))
          ),
          queue: m.queue.filter((q) => q.out !== id && q.in !== id),
        };
      });
    },

    giveCard: (id, card) => {
      patch((m) => {
        const cards = { ...m.cards, [id]: card };
        if (card !== 'red') return { ...m, cards };
        // Red: off for good. Bench them and drop any queued sub they're in.
        return {
          ...m,
          cards,
          roster: benchLayout(
            m.roster.map((p) => (p.id === id ? { ...p, onField: false } : p))
          ),
          queue: m.queue.filter((q) => q.out !== id && q.in !== id),
        };
      });
    },

    clearCard: (id) => {
      patch((m) => {
        const cards = { ...m.cards };
        delete cards[id];
        return { ...m, cards };
      });
    },

    /** Add a foul (basketball). Fouling out benches the player for good. */
    addFoul: (id) => {
      patch((m) => {
        const n = (m.fouls[id] ?? 0) + 1;
        const fouls = { ...m.fouls, [id]: n };
        if (n < FOUL_OUT) return { ...m, fouls };
        // Fouled out: off for good, like a red — bench and drop any queued sub.
        return {
          ...m,
          fouls,
          holder: m.holder === id ? null : m.holder,
          roster: benchLayout(
            m.roster.map((p) => (p.id === id ? { ...p, onField: false } : p))
          ),
          queue: m.queue.filter((q) => q.out !== id && q.in !== id),
        };
      });
    },

    removeFoul: (id) => {
      patch((m) => {
        const n = Math.max(0, (m.fouls[id] ?? 0) - 1);
        const fouls = { ...m.fouls };
        if (n === 0) delete fouls[id];
        else fouls[id] = n;
        return { ...m, fouls };
      });
    },

    /** Give a lacrosse penalty of `seconds`. Fouling out benches the player. */
    addPenalty: (id, seconds) => {
      patch((m) => {
        const list = [...(m.penalties[id] ?? []), seconds];
        const penalties = { ...m.penalties, [id]: list };
        if (!isFouledOutLax(list)) return { ...m, penalties };
        return {
          ...m,
          penalties,
          holder: m.holder === id ? null : m.holder,
          roster: benchLayout(
            m.roster.map((p) => (p.id === id ? { ...p, onField: false } : p))
          ),
          queue: m.queue.filter((q) => q.out !== id && q.in !== id),
        };
      });
    },

    removePenalty: (id) => {
      patch((m) => {
        const list = (m.penalties[id] ?? []).slice(0, -1);
        const penalties = { ...m.penalties };
        if (list.length === 0) delete penalties[id];
        else penalties[id] = list;
        return { ...m, penalties };
      });
    },

    bumpScore: (team, delta) => {
      patch((m) => ({
        ...m,
        score: { ...m.score, [team]: Math.max(0, m.score[team] + delta) },
      }));
    },

    recordGoal: (scorerId, assistId, points = 1) => {
      patch((m) => {
        const stats = { ...m.stats };
        if (scorerId) {
          const s = stats[scorerId] ?? { g: 0, a: 0, pts: 0 };
          stats[scorerId] = { g: s.g + 1, a: s.a, pts: (s.pts ?? 0) + points };
        }
        if (assistId && assistId !== scorerId) {
          const a = stats[assistId] ?? { g: 0, a: 0, pts: 0 };
          stats[assistId] = { g: a.g, a: a.a + 1, pts: a.pts ?? 0 };
        }
        const goal = { id: makeId('goal'), scorerId, assistId, points };
        return {
          ...m,
          score: { ...m.score, us: m.score.us + points },
          goals: [...m.goals, goal],
          stats,
        };
      });
    },

    removeGoal: (goalId) => {
      patch((m) => {
        const goal = m.goals.find((g) => g.id === goalId);
        if (!goal) return m;
        const points = goal.points ?? 1;
        const stats = { ...m.stats };
        if (goal.scorerId && stats[goal.scorerId]) {
          const s = stats[goal.scorerId];
          stats[goal.scorerId] = {
            g: Math.max(0, s.g - 1),
            a: s.a,
            pts: Math.max(0, (s.pts ?? 0) - points),
          };
        }
        if (goal.assistId && goal.assistId !== goal.scorerId && stats[goal.assistId]) {
          const a = stats[goal.assistId];
          stats[goal.assistId] = { g: a.g, a: Math.max(0, a.a - 1), pts: a.pts ?? 0 };
        }
        return {
          ...m,
          score: { ...m.score, us: Math.max(0, m.score.us - points) },
          goals: m.goals.filter((g) => g.id !== goalId),
          stats,
        };
      });
    },

    resetScore: () => {
      // A new game: clear the score, the goal log, and this game's bookings/fouls.
      patch((m) => ({
        ...m,
        score: { us: 0, them: 0 },
        goals: [],
        cards: {},
        fouls: {},
        penalties: {},
      }));
    },

    resetStats: () => {
      patch((m) => ({ ...m, stats: {} }));
    },

    resetMinutes: () => {
      patch((m) => ({
        ...m,
        minutes: Object.fromEntries(m.roster.map((p) => [p.id, 0])),
      }));
    },

    resetCards: () => {
      patch((m) => ({ ...m, cards: {} }));
    },

    movePlayer: (id, x, y) => {
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) => (p.id === id ? { ...p, x, y } : p)),
      }));
    },

    setFormation: (idx) => {
      patch((m) => ({
        ...m,
        formationIdx: clamp(idx, 0, Math.max(0, formCount(m) - 1)),
      }));
      get().applyFormation();
    },

    applyFormation: () => {
      // Picking a formation defines the home layout: on-field players take the
      // slots in order and those become their Reset positions.
      patch((m) => {
        const slots = slotsOf(m);
        let i = 0;
        const roster = m.roster.map((p) => {
          if (!p.onField) return p;
          const slot = slots[i];
          i += 1;
          return slot
            ? { ...p, x: slot.x, y: slot.y, homeX: slot.x, homeY: slot.y }
            : p;
        });
        return { ...m, roster };
      });
    },

    /**
     * Put every on-field player back on their home spot (pre-drag). Safety:
     * if two would land on the same spot, the extra is moved to a free
     * formation slot (and that becomes its home) so nobody ever stacks.
     */
    resetPositions: () => {
      patch((m) => {
        const slots = slotsOf(m);
        const CLOSE = 24 * 24; // squared distance that counts as "same spot"
        const placed: { x: number; y: number }[] = [];
        const near = (x: number, y: number) =>
          placed.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 < CLOSE);

        const roster = m.roster.map((p) => {
          if (!p.onField) return p;
          const hx = p.homeX ?? p.x;
          const hy = p.homeY ?? p.y;
          if (!near(hx, hy)) {
            placed.push({ x: hx, y: hy });
            return { ...p, x: hx, y: hy };
          }
          // Collision — relocate to a free formation slot and re-home there.
          const free = slots.find((s) => !near(s.x, s.y));
          if (free) {
            placed.push({ x: free.x, y: free.y });
            return { ...p, x: free.x, y: free.y, homeX: free.x, homeY: free.y };
          }
          // No slot free (shouldn't happen) — nudge sideways so it's visible.
          const nx = hx + 55;
          placed.push({ x: nx, y: hy });
          return { ...p, x: nx, y: hy, homeX: nx, homeY: hy };
        });
        return { ...m, roster };
      });
    },

    /**
     * Switch between full and half court (basketball). The coordinate space
     * changes, so on-field players are re-laid onto the mode's formation and
     * the opponents re-derived; the board is wiped.
     */
    setCourtMode: (mode) => {
      patch((m) => {
        if (mode === m.courtMode) return m;
        const next = { ...m, courtMode: mode };
        next.formationIdx = clamp(m.formationIdx, 0, Math.max(0, formCount(next) - 1));
        const oppIdx = clamp(m.opponent.formationIdx, 0, Math.max(0, oppCount(next) - 1));
        const roster = benchLayout(placeOnSlots(m.roster, slotsOf(next)));
        return {
          ...next,
          roster,
          opponent: {
            ...m.opponent,
            formationIdx: oppIdx,
            pos: m.opponent.pos ? bumpOpponent(next, oppSlotsOf(next, oppIdx), roster) : m.opponent.pos,
            holder: null,
          },
          arrows: [],
          ghosts: [],
          drawings: [],
          shots: [],
          holder: null,
        };
      });
    },

    /** Show our offense or our defense; the opponent takes the opposite role. */
    setSide: (side) => {
      patch((m) => {
        if (side === m.side) return m;
        const next = { ...m, side };
        next.formationIdx = clamp(m.formationIdx, 0, Math.max(0, formCount(next) - 1));
        const oppIdx = clamp(m.opponent.formationIdx, 0, Math.max(0, oppCount(next) - 1));
        const roster = placeOnSlots(m.roster, slotsOf(next));
        return {
          ...next,
          roster,
          opponent: {
            ...m.opponent,
            formationIdx: oppIdx,
            pos: m.opponent.pos ? bumpOpponent(next, oppSlotsOf(next, oppIdx), roster) : m.opponent.pos,
            holder: null,
          },
          arrows: [],
          ghosts: [],
          drawings: [],
          shots: [],
          holder: null,
        };
      });
    },

    swap: (outId, inId) => {
      patch((m) => {
        const out = m.roster.find((p) => p.id === outId);
        const incoming = m.roster.find((p) => p.id === inId);
        if (!out || !incoming) return m;
        // The incoming player takes the outgoing player's home spot (where they
        // started, before any dragging) — both their live and home position.
        const hx = out.homeX ?? out.x;
        const hy = out.homeY ?? out.y;
        const roster = m.roster.map((p) => {
          if (p.id === outId) return { ...p, onField: false };
          if (p.id === inId)
            return { ...p, x: hx, y: hy, homeX: hx, homeY: hy, onField: true };
          return p;
        });
        return { ...m, roster: benchLayout(roster) };
      });
    },

    /**
     * Two on-field players trade places — both their live position and their
     * home spot — so Reset sends them to the swapped spots. Uses home (the
     * pre-drag position), so a player dragged onto another lands cleanly.
     */
    swapPositions: (aId, bId) => {
      patch((m) => {
        const a = m.roster.find((p) => p.id === aId);
        const b = m.roster.find((p) => p.id === bId);
        if (!a || !b) return m;
        const ah = { x: a.homeX ?? a.x, y: a.homeY ?? a.y };
        const bh = { x: b.homeX ?? b.x, y: b.homeY ?? b.y };
        return {
          ...m,
          roster: m.roster.map((p) => {
            if (p.id === aId)
              return { ...p, x: bh.x, y: bh.y, homeX: bh.x, homeY: bh.y };
            if (p.id === bId)
              return { ...p, x: ah.x, y: ah.y, homeX: ah.x, homeY: ah.y };
            return p;
          }),
        };
      });
    },

    sendToBench: (id) => {
      patch((m) => ({
        ...m,
        roster: benchLayout(
          m.roster.map((p) => (p.id === id ? { ...p, onField: false } : p))
        ),
      }));
    },

    bringOn: (id) => {
      patch((m) => {
        const onFieldCount = m.roster.filter((p) => p.onField).length;
        if (onFieldCount >= fieldCap(m)) return m;
        const slots = slotsOf(m);
        const taken = m.roster
          .filter((p) => p.onField)
          .map((p) => `${p.x},${p.y}`);
        const free =
          slots.find((s) => !taken.includes(`${s.x},${s.y}`)) ??
          ({ x: 300, y: 400 } as const);
        return {
          ...m,
          roster: benchLayout(
            m.roster.map((p) =>
              p.id === id
                ? { ...p, onField: true, x: free.x, y: free.y, homeX: free.x, homeY: free.y }
                : p
            )
          ),
        };
      });
    },

    /** Bring a bench player straight onto a specific open spot on the pitch. */
    bringOnAt: (id, x, y) => {
      patch((m) => {
        const onFieldCount = m.roster.filter((p) => p.onField).length;
        if (onFieldCount >= fieldCap(m)) return m;
        return {
          ...m,
          roster: benchLayout(
            m.roster.map((p) =>
              p.id === id
                ? { ...p, onField: true, x, y, homeX: x, homeY: y }
                : p
            )
          ),
        };
      });
    },

    queueSub: (outId, inId) => {
      patch((m) => {
        const exists = m.queue.some(
          (q) => q.out === outId || q.in === inId || q.out === inId || q.in === outId
        );
        if (exists) return m;
        const entry: QueuedSub = { out: outId, in: inId };
        return { ...m, queue: [...m.queue, entry] };
      });
    },

    dropQueued: (index) => {
      patch((m) => ({
        ...m,
        queue: m.queue.filter((_, i) => i !== index),
      }));
    },

    runQueued: (index) => {
      const m = get().match;
      if (!m) return;
      const q = m.queue[index];
      if (!q) return;
      const out = m.roster.find((p) => p.id === q.out);
      const incoming = m.roster.find((p) => p.id === q.in);
      const valid =
        out &&
        incoming &&
        out.onField &&
        !incoming.onField &&
        !m.scratched.includes(q.out) &&
        !m.scratched.includes(q.in);

      get().dropQueued(index);
      if (valid) get().swap(q.out, q.in);
    },

    runAllQueued: () => {
      const m = get().match;
      if (!m) return;
      // Run from the front repeatedly; each run mutates the queue.
      let guard = m.queue.length;
      while (get().match!.queue.length > 0 && guard-- > 0) {
        get().runQueued(0);
      }
    },

    // ---------------- tactics layer ----------------

    /**
     * Tap a player on the field. First tap gives them the ball; each later tap
     * on a different player draws a numbered pass arrow and moves the ball.
     * Tapping the holder again drops the ball.
     */
    tapForBall: (id) => {
      const m = get().match;
      if (!m) return;
      const player = m.roster.find((p) => p.id === id);
      if (!player || !player.onField) return;

      // Only one ball on the board — taking it clears any opponent holder.
      const takeBall = (cur: MatchState) => ({
        ...cur,
        holder: id,
        opponent: { ...cur.opponent, holder: null },
      });

      if (m.holder === null) {
        patch(takeBall, false);
        return;
      }
      if (m.holder === id) {
        patch((cur) => ({ ...cur, holder: null }), false);
        return;
      }
      const from = m.roster.find((p) => p.id === m.holder);
      if (!from) {
        patch(takeBall, false);
        return;
      }
      const arrow: PassArrow = {
        id: makeId('a'),
        n: m.arrows.length + 1,
        from: { x: from.x, y: from.y },
        to: { x: player.x, y: player.y },
      };
      patch(
        (cur) => ({
          ...cur,
          arrows: [...cur.arrows, arrow],
          holder: id,
          opponent: { ...cur.opponent, holder: null },
        }),
        false
      );
    },

    /** Wipe arrows, trails, drawings and possession. Positions are left alone. */
    clearBoard: () => {
      patch(
        (m) => ({
          ...m,
          arrows: [],
          ghosts: [],
          drawings: [],
          shots: [],
          holder: null,
          opponent: { ...m.opponent, holder: null },
        }),
        false
      );
    },

    addDrawing: (points) => {
      const draw: FreeDraw = { id: makeId('d'), points };
      patch((m) => ({ ...m, drawings: [...m.drawings, draw] }), false);
    },

    /** Toggle a shot-on-goal marker at (x, y); a second tap nearby clears it. */
    toggleShot: (x, y) => {
      patch((m) => {
        const near = m.shots.find(
          (s) => (s.x - x) ** 2 + (s.y - y) ** 2 < 60 * 60
        );
        if (near) {
          return { ...m, shots: m.shots.filter((s) => s.id !== near.id) };
        }
        // Line origin: the ball holder if there is one, else out from the goal.
        const holder = m.holder
          ? m.roster.find((p) => p.id === m.holder && p.onField)
          : null;
        // Centre and mid-line differ by surface (soccer 600x840, court 500x940).
        const isHoops = m.sport === 'basketball';
        const cx = isHoops ? 250 : 300;
        const mid = isHoops ? 470 : 400;
        const off = isHoops ? 170 : 150;
        const fromX = holder ? holder.x : cx;
        const fromY = holder ? holder.y : y < mid ? y + off : y - off;
        return {
          ...m,
          shots: [...m.shots, { id: makeId('shot'), x, y, fromX, fromY }],
        };
      }, false);
    },

    addGhost: (label, origin, to, carry, opponent, points) => {
      const ghost: Ghost = {
        id: makeId('g'),
        label,
        origin,
        to,
        points,
        carry,
        opponent,
      };
      patch((m) => ({ ...m, ghosts: [...m.ghosts, ghost] }), false);
    },

    clearGhosts: () => {
      patch((m) => ({ ...m, ghosts: [] }), false);
    },

    // ---------------- opponent shadow team ----------------

    toggleOpponent: () => {
      patch((m) => {
        const on = !m.opponent.on;
        const pos =
          on && (!m.opponent.pos || m.opponent.pos.length !== m.size)
            ? bumpOpponent(m, oppSlotsOf(m, m.opponent.formationIdx))
            : m.opponent.pos;
        return { ...m, opponent: { ...m.opponent, on, pos, holder: null } };
      });
    },

    setOpponentFormation: (idx) => {
      patch((m) => {
        const formationIdx = clamp(idx, 0, Math.max(0, oppCount(m) - 1));
        return {
          ...m,
          opponent: {
            ...m.opponent,
            formationIdx,
            pos: bumpOpponent(m, oppSlotsOf(m, formationIdx)),
            holder: null,
          },
        };
      });
    },

    /** Toggle which opponent has the ball; taking it clears our player's ball. */
    tapOpponentBall: (index) => {
      patch((m) => {
        const next = m.opponent.holder === index ? null : index;
        return {
          ...m,
          // Only one ball on the board — clear ours when an opponent takes it.
          holder: next === null ? m.holder : null,
          opponent: { ...m.opponent, holder: next },
        };
      }, false);
    },

    moveOpponent: (index, x, y) => {
      patch((m) => {
        if (!m.opponent.pos) return m;
        const pos = m.opponent.pos.map((p, i) => (i === index ? { x, y } : p));
        return { ...m, opponent: { ...m.opponent, pos } };
      });
    },

    resetOpponent: () => {
      patch((m) => ({
        ...m,
        opponent: {
          ...m.opponent,
          pos: bumpOpponent(m, oppSlotsOf(m, m.opponent.formationIdx)),
        },
      }));
    },
  };
});

// Flush the current match to disk whenever the app leaves the foreground, so
// the lineup survives being closed even if a per-mutation write was mid-flight.
AppState.addEventListener('change', (state) => {
  if (state !== 'active') void useMatch.getState().save();
});

export const onFieldCount = (m: MatchState) =>
  m.roster.filter((p) => p.onField).length;

/** How many red cards this game — each one drops the effective team size. */
export const redCardCount = (m: MatchState) =>
  m.roster.filter((p) => m.cards[p.id] === 'red').length;

/** How many players have fouled out (basketball fouls or lacrosse penalties). */
export const fouledOutCount = (m: MatchState) =>
  m.roster.filter(
    (p) => (m.fouls[p.id] ?? 0) >= FOUL_OUT || isFouledOutLax(m.penalties[p.id])
  ).length;

/** Effective on-field cap: team size minus anyone sent off or fouled out. */
export const fieldCap = (m: MatchState) =>
  m.size - redCardCount(m) - fouledOutCount(m);
