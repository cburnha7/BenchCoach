// The one place sport-specific behaviour is assembled. The store, the field and
// the pickers read through these helpers keyed off a team's `sport` and (for
// basketball) the per-match court mode + flip.

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
  bballOffense,
  bballOffenseSlots,
  bballOffenseLabels,
  bballDefense,
  bballDefenseSlots,
  bballDefenseLabels,
  bballHoops,
  bballDims,
  type CourtMode,
} from './basketball';
import type { Sport } from './types';

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
};

export const SPORT_LIST: SportConfig[] = [SPORTS.soccer, SPORTS.basketball];
export const sportConfig = (s: Sport) => SPORTS[s];
export const sizesFor = (s: Sport) => SPORTS[s].sizes;
export const defaultSize = (s: Sport) => (s === 'basketball' ? 5 : 9);

const isHoops = (s: Sport) => s === 'basketball';

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
  return { w: FIELD_W, h: FIELD_H, fit: 'stretch' as const, surface: 'field' as const };
}

// --- our formation (offense) ---

export function offenseFormations(s: Sport, size: number, mode: CourtMode): Formation[] {
  return isHoops(s) ? bballOffense(size, mode) : SOCCER_FORMATIONS[size] ?? [];
}

export function offenseSlots(
  s: Sport,
  size: number,
  mode: CourtMode,
  idx: number,
  flip: boolean
): Slot[] {
  if (isHoops(s)) return bballOffenseSlots(size, mode, idx, flip);
  return SOCCER_FORMATIONS[size]?.[idx]?.slots ?? [];
}

export function offenseLabels(
  s: Sport,
  size: number,
  mode: CourtMode,
  idx: number
): string[] {
  return isHoops(s) ? bballOffenseLabels(size, mode, idx) : soccerLabels(size, idx);
}

// --- opponent (defense / mirror) ---

export function defenseFormations(s: Sport, size: number, mode: CourtMode): Formation[] {
  return isHoops(s) ? bballDefense(size, mode) : SOCCER_FORMATIONS[size] ?? [];
}

export function defenseSlots(
  s: Sport,
  size: number,
  mode: CourtMode,
  idx: number,
  flip: boolean
): Slot[] {
  if (isHoops(s)) return bballDefenseSlots(size, mode, idx, flip);
  return soccerMirror(size, idx);
}

export function defenseLabels(
  s: Sport,
  size: number,
  mode: CourtMode,
  idx: number
): string[] {
  return isHoops(s) ? bballDefenseLabels(size, mode, idx) : soccerLabels(size, idx, true);
}

/** Tappable goals/rims for shot markers, in the active orientation. */
export function hoopsFor(s: Sport, mode: CourtMode, flip: boolean): Slot[] {
  if (isHoops(s)) return bballHoops(mode, flip);
  return [
    { x: 300, y: 30 },
    { x: 300, y: 742 },
  ];
}
