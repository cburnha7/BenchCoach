// The one place sport-specific behaviour is assembled. Everything else —
// the store, the field, the pickers — reads through these helpers keyed off a
// team's `sport`, so adding a sport is adding an entry here plus its geometry.

import {
  FORMATIONS as SOCCER_FORMATIONS,
  positionLabels as soccerLabels,
  mirrorSlots as soccerMirror,
  type Formation,
  type Slot,
} from './formations';
import {
  BASKETBALL_FORMATIONS,
  basketballLabels,
  basketballMirror,
} from './basketball';
import type { Sport } from './types';

export type SportConfig = {
  key: Sport;
  /** Shown in the sport dropdown and on team cards. */
  label: string;
  emoji: string;
  /** Team sizes offered for this sport, in the order they appear. */
  sizes: number[];
  /** Which surface `Pitch` draws — a soccer field or a basketball court. */
  surface: 'field' | 'court';
  /** The emoji dropped at the end of a shot line. */
  ballEmoji: string;
  formations: Record<number, Formation[]>;
  labelsFor: (size: number, idx: number, mirror?: boolean) => string[];
  mirrorSlots: (size: number, idx: number) => Slot[];
};

export const SPORTS: Record<Sport, SportConfig> = {
  soccer: {
    key: 'soccer',
    label: 'Soccer',
    emoji: '⚽',
    sizes: [7, 9, 11],
    surface: 'field',
    ballEmoji: '⚽',
    formations: SOCCER_FORMATIONS,
    labelsFor: soccerLabels,
    mirrorSlots: soccerMirror,
  },
  basketball: {
    key: 'basketball',
    label: 'Basketball',
    emoji: '🏀',
    sizes: [5],
    surface: 'court',
    ballEmoji: '🏀',
    formations: BASKETBALL_FORMATIONS,
    labelsFor: basketballLabels,
    mirrorSlots: basketballMirror,
  },
};

/** Dropdown order. */
export const SPORT_LIST: SportConfig[] = [SPORTS.soccer, SPORTS.basketball];

export const sportConfig = (s: Sport) => SPORTS[s];
export const sizesFor = (s: Sport) => SPORTS[s].sizes;

/** A sensible starting size when a team of this sport is created. */
export const defaultSize = (s: Sport) => (s === 'basketball' ? 5 : 9);

export const formationsFor = (s: Sport, size: number): Formation[] =>
  SPORTS[s].formations[size] ?? [];

export const labelsFor = (
  s: Sport,
  size: number,
  idx: number,
  mirror = false
): string[] => SPORTS[s].labelsFor(size, idx, mirror);

export const mirrorSlotsFor = (s: Sport, size: number, idx: number): Slot[] =>
  SPORTS[s].mirrorSlots(size, idx);
