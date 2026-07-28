import { AppState } from 'react-native';
import { create } from 'zustand';
import { storage, matchKey } from './storage';
import {
  FORMATIONS,
  BENCH_Y,
  mirrorSlots,
  type TeamSize,
} from '../lib/formations';
import {
  clamp,
  makeId,
  type Card,
  type Ghost,
  type MatchState,
  type PassArrow,
  type Player,
  type QueuedSub,
} from '../lib/types';

const TICK_MS = 250;
const SAVE_EVERY_S = 5;
const MAX_DELTA_S = 2;

function emptyMatch(teamId: string, size: TeamSize): MatchState {
  return {
    teamId,
    size,
    roster: [],
    minutes: {},
    score: { us: 0, them: 0 },
    goals: [],
    stats: {},
    cards: {},
    scratched: [],
    queue: [],
    formationIdx: 0,
    halfLen: 25,
    remaining: 25 * 60,
    opponent: { on: false, formationIdx: 0, pos: null },
    arrows: [],
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

  load: (teamId: string, size: TeamSize) => Promise<void>;
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

  bumpScore: (team: 'us' | 'them', delta: number) => void;
  recordGoal: (scorerId: string | null, assistId: string | null) => void;
  removeGoal: (goalId: string) => void;
  resetScore: () => void;
  resetStats: () => void;
  resetMinutes: () => void;

  movePlayer: (id: string, x: number, y: number) => void;
  setFormation: (idx: number) => void;
  applyFormation: () => void;
  resetPositions: () => void;

  swap: (outId: string, inId: string) => void;
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
  clearGhosts: () => void;

  // Opponent shadow team
  toggleOpponent: () => void;
  setOpponentFormation: (idx: number) => void;
  moveOpponent: (index: number, x: number, y: number) => void;
  resetOpponent: () => void;
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

    load: async (teamId, size) => {
      stop();
      const saved = await storage.read<MatchState>(matchKey(teamId));
      const base = saved ?? emptyMatch(teamId, size);
      // Team size can change on the team record after a match was saved.
      const match: MatchState = {
        ...emptyMatch(teamId, size),
        ...base,
        teamId,
        size,
        formationIdx: clamp(
          base.formationIdx ?? 0,
          0,
          FORMATIONS[size].length - 1
        ),
        // The tactics board starts clean each session.
        arrows: [],
        ghosts: [],
        holder: null,
      };
      // Backfill minute entries and home spots for older saved players.
      match.roster = match.roster.map((p) => ({
        ...p,
        homeX: p.homeX ?? p.x,
        homeY: p.homeY ?? p.y,
      }));
      match.roster.forEach((p) => {
        if (match.minutes[p.id] == null) match.minutes[p.id] = 0;
      });
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
          const slots = FORMATIONS[m.size][m.formationIdx].slots;
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
        return {
          ...m,
          roster: benchLayout(m.roster.filter((p) => p.id !== id)),
          minutes,
          stats,
          cards,
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
      patch((m) => ({
        ...m,
        scratched: m.scratched.includes(id)
          ? m.scratched.filter((s) => s !== id)
          : [...m.scratched, id],
      }));
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

    bumpScore: (team, delta) => {
      patch((m) => ({
        ...m,
        score: { ...m.score, [team]: Math.max(0, m.score[team] + delta) },
      }));
    },

    recordGoal: (scorerId, assistId) => {
      patch((m) => {
        const stats = { ...m.stats };
        if (scorerId) {
          const s = stats[scorerId] ?? { g: 0, a: 0 };
          stats[scorerId] = { g: s.g + 1, a: s.a };
        }
        if (assistId && assistId !== scorerId) {
          const a = stats[assistId] ?? { g: 0, a: 0 };
          stats[assistId] = { g: a.g, a: a.a + 1 };
        }
        const goal = { id: makeId('goal'), scorerId, assistId };
        return {
          ...m,
          score: { ...m.score, us: m.score.us + 1 },
          goals: [...m.goals, goal],
          stats,
        };
      });
    },

    removeGoal: (goalId) => {
      patch((m) => {
        const goal = m.goals.find((g) => g.id === goalId);
        if (!goal) return m;
        const stats = { ...m.stats };
        if (goal.scorerId && stats[goal.scorerId]) {
          const s = stats[goal.scorerId];
          stats[goal.scorerId] = { g: Math.max(0, s.g - 1), a: s.a };
        }
        if (goal.assistId && goal.assistId !== goal.scorerId && stats[goal.assistId]) {
          const a = stats[goal.assistId];
          stats[goal.assistId] = { g: a.g, a: Math.max(0, a.a - 1) };
        }
        return {
          ...m,
          score: { ...m.score, us: Math.max(0, m.score.us - 1) },
          goals: m.goals.filter((g) => g.id !== goalId),
          stats,
        };
      });
    },

    resetScore: () => {
      // A new game: clear the score, the goal log, and this game's bookings.
      patch((m) => ({ ...m, score: { us: 0, them: 0 }, goals: [], cards: {} }));
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

    movePlayer: (id, x, y) => {
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) => (p.id === id ? { ...p, x, y } : p)),
      }));
    },

    setFormation: (idx) => {
      patch((m) => ({
        ...m,
        formationIdx: clamp(idx, 0, FORMATIONS[m.size].length - 1),
      }));
      get().applyFormation();
    },

    applyFormation: () => {
      // Picking a formation defines the home layout: on-field players take the
      // slots in order and those become their Reset positions.
      patch((m) => {
        const slots = FORMATIONS[m.size][m.formationIdx].slots;
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

    /** Put every on-field player back on their home spot (pre-drag). */
    resetPositions: () => {
      patch((m) => ({
        ...m,
        roster: m.roster.map((p) =>
          p.onField
            ? { ...p, x: p.homeX ?? p.x, y: p.homeY ?? p.y }
            : p
        ),
      }));
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
        if (onFieldCount >= m.size) return m;
        const slots = FORMATIONS[m.size][m.formationIdx].slots;
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
        if (onFieldCount >= m.size) return m;
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

      if (m.holder === null) {
        patch((cur) => ({ ...cur, holder: id }), false);
        return;
      }
      if (m.holder === id) {
        patch((cur) => ({ ...cur, holder: null }), false);
        return;
      }
      const from = m.roster.find((p) => p.id === m.holder);
      if (!from) {
        patch((cur) => ({ ...cur, holder: id }), false);
        return;
      }
      const arrow: PassArrow = {
        id: makeId('a'),
        n: m.arrows.length + 1,
        from: { x: from.x, y: from.y },
        to: { x: player.x, y: player.y },
      };
      patch(
        (cur) => ({ ...cur, arrows: [...cur.arrows, arrow], holder: id }),
        false
      );
    },

    /** Wipe arrows, trails and possession. Positions are left alone. */
    clearBoard: () => {
      patch((m) => ({ ...m, arrows: [], ghosts: [], holder: null }), false);
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
            ? mirrorSlots(m.size, m.opponent.formationIdx)
            : m.opponent.pos;
        return { ...m, opponent: { ...m.opponent, on, pos } };
      });
    },

    setOpponentFormation: (idx) => {
      patch((m) => {
        const formationIdx = clamp(idx, 0, FORMATIONS[m.size].length - 1);
        return {
          ...m,
          opponent: {
            ...m.opponent,
            formationIdx,
            pos: mirrorSlots(m.size, formationIdx),
          },
        };
      });
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
          pos: mirrorSlots(m.size, m.opponent.formationIdx),
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
