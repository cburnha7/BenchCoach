// The one place sport-specific behaviour is assembled. The store, the field and
// the pickers read through these helpers keyed off a team's `sport` and (for
// basketball) the per-match court mode + side.

import {
  FORMATIONS as SOCCER_FORMATIONS,
  positionLabels as soccerLabels,
  mirrorSlots as soccerMirror,
  FIELD_W,
  FIELD_H,
  type Formation,
  type Slot,
} from './formations';
import {
  bballOurList,
  bballOurSlots,
  bballOurLabels,
  bballOppList,
  bballOppSlots,
  bballOppLabels,
  bballHoops,
  bballDims,
  type CourtMode,
} from './basketball';
import {
  laxOurList,
  laxOurSlots,
  laxOurLabels,
  laxOppList,
  laxOppSlots,
  laxOppLabels,
  laxHoops,
  laxDims,
} from './lacrosse';
import type { Side, Sport } from './types';

export type { CourtMode };

export type SportConfig = {
  key: Sport;
  label: string;
  emoji: string;
  sizes: number[];
  ballEmoji: string;
};

export const SPORTS: Record<Sport, SportConfig> = {
  soccer: { key: 'soccer', label: 'Soccer', emoji: '⚽', sizes: [7, 9, 11], ballEmoji: '⚽' },
  basketball: { key: 'basketball', label: 'Basketball', emoji: '🏀', sizes: [5], ballEmoji: '🏀' },
  lacrosse: { key: 'lacrosse', label: 'Lacrosse', emoji: '🥍', sizes: [6, 7, 10], ballEmoji: '🥍' },
};

// Sports offered in the picker. Lacrosse is built (all its code stays in the
// repo) but parked for now — add SPORTS.lacrosse back here to re-enable it.
export const SPORT_LIST: SportConfig[] = [SPORTS.soccer, SPORTS.basketball];

/** Whether a sport is currently selectable (in the picker). */
export const isSportEnabled = (s: Sport) => SPORT_LIST.some((x) => x.key === s);

export const sportConfig = (s: Sport) => SPORTS[s];
export const sizesFor = (s: Sport) => SPORTS[s].sizes;
export const defaultSize = (s: Sport) =>
  s === 'basketball' ? 5 : s === 'lacrosse' ? 10 : 9;

const isHoops = (s: Sport) => s === 'basketball';
const isLax = (s: Sport) => s === 'lacrosse';

/** The coordinate space and how it fills the screen, for the active layout. */
export function layoutFor(s: Sport, mode: CourtMode) {
  if (isHoops(s)) {
    const { w, h } = bballDims(mode);
    return {
      w,
      h,
      fit: 'contain' as const,
      surface: (mode === 'half' ? 'court-half' : 'court-full') as
        | 'court-half'
        | 'court-full',
    };
  }
  if (isLax(s)) {
    const { w, h } = laxDims(mode);
    return {
      w,
      h,
      // True proportions, letterboxed and centred (like the basketball court).
      fit: 'contain' as const,
      surface: (mode === 'half' ? 'lax-half' : 'lacrosse') as 'lax-half' | 'lacrosse',
    };
  }
  return { w: FIELD_W, h: FIELD_H, fit: 'stretch' as const, surface: 'field' as const };
}

// --- our team (offense or defense) ---

export function ourFormations(s: Sport, size: number, mode: CourtMode, side: Side): Formation[] {
  if (isHoops(s)) return bballOurList(size, mode, side);
  if (isLax(s)) return laxOurList(size, mode, side);
  return SOCCER_FORMATIONS[size] ?? [];
}

export function ourSlots(
  s: Sport,
  size: number,
  mode: CourtMode,
  side: Side,
  idx: number
): Slot[] {
  if (isHoops(s)) return bballOurSlots(size, mode, side, idx);
  if (isLax(s)) return laxOurSlots(size, mode, side, idx);
  return SOCCER_FORMATIONS[size]?.[idx]?.slots ?? [];
}

export function ourLabels(
  s: Sport,
  size: number,
  mode: CourtMode,
  side: Side,
  idx: number
): string[] {
  if (isHoops(s)) return bballOurLabels(size, mode, side, idx);
  if (isLax(s)) return laxOurLabels(size, mode, side, idx);
  return soccerLabels(size, idx);
}

// --- opponent (the opposite role / mirror) ---

export function oppFormations(s: Sport, size: number, mode: CourtMode, side: Side): Formation[] {
  if (isHoops(s)) return bballOppList(size, mode, side);
  if (isLax(s)) return laxOppList(size, mode, side);
  return SOCCER_FORMATIONS[size] ?? [];
}

export function oppSlots(
  s: Sport,
  size: number,
  mode: CourtMode,
  side: Side,
  idx: number
): Slot[] {
  if (isHoops(s)) return bballOppSlots(size, mode, side, idx);
  if (isLax(s)) return laxOppSlots(size, mode, side, idx);
  return soccerMirror(size, idx);
}

export function oppLabels(
  s: Sport,
  size: number,
  mode: CourtMode,
  side: Side,
  idx: number
): string[] {
  if (isHoops(s)) return bballOppLabels(size, mode, side, idx);
  if (isLax(s)) return laxOppLabels(size, mode, side, idx);
  return soccerLabels(size, idx, true);
}

/** Tappable goals/rims for shot markers. */
export function hoopsFor(s: Sport, mode: CourtMode): Slot[] {
  if (isHoops(s)) return bballHoops(mode);
  if (isLax(s)) return laxHoops(mode);
  return [
    { x: 300, y: 30 },
    { x: 300, y: 742 },
  ];
}
