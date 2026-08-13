// Basketball geometry, drawn to true proportions at 10 px/ft.
//
// Two layouts share this file:
//  - FULL court: 500 x 940 (50 x 94 ft), vertical, a hoop at each end. We attack
//    the top by default; `flip` swaps to the bottom.
//  - HALF court: 470 x 500 (47 x 50 ft), rotated so the single hoop sits on the
//    RIGHT (baseline right, half-court line left). `flip` puts the hoop on the
//    left. Used for set plays and half-court offense/defense.
//
// Coordinates here are authored in the canonical orientation (attack top / hoop
// right); `flip` is applied by the accessor functions so stored player
// positions are always the real on-screen coordinates.

import type { Formation, Slot } from './formations';

export const COURT_W = 500;
export const COURT_H = 940;
export const HALF_W = 470;
export const HALF_H = 500;

export type CourtMode = 'full' | 'half';

// ----------------------------- full court -----------------------------------

const FULL_OFFENSE: Record<number, Formation[]> = {
  5: [
    {
      name: 'Man',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 250, y: 520 },
        { x: 110, y: 380 },
        { x: 390, y: 380 },
        { x: 180, y: 210 },
        { x: 320, y: 210 },
      ],
    },
    {
      name: 'Spread',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 250, y: 540 },
        { x: 95, y: 380 },
        { x: 405, y: 380 },
        { x: 165, y: 235 },
        { x: 250, y: 150 },
      ],
    },
    {
      name: '1-3-1',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 250, y: 545 },
        { x: 100, y: 375 },
        { x: 400, y: 375 },
        { x: 250, y: 320 },
        { x: 250, y: 165 },
      ],
    },
    {
      name: 'Hi-Lo',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 250, y: 520 },
        { x: 115, y: 390 },
        { x: 385, y: 390 },
        { x: 250, y: 290 },
        { x: 250, y: 155 },
      ],
    },
  ],
};

// ----------------------------- half court -----------------------------------

const HALF_OFFENSE: Record<number, Formation[]> = {
  5: [
    {
      name: 'Man',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 115, y: 250 },
        { x: 210, y: 110 },
        { x: 210, y: 390 },
        { x: 330, y: 185 },
        { x: 330, y: 315 },
      ],
    },
    {
      name: 'Spread',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 100, y: 250 },
        { x: 200, y: 110 },
        { x: 200, y: 390 },
        { x: 300, y: 250 },
        { x: 390, y: 250 },
      ],
    },
    {
      name: 'Horns',
      labels: ['PG', 'PF', 'C', 'SG', 'SF'],
      slots: [
        { x: 130, y: 250 },
        { x: 290, y: 185 },
        { x: 290, y: 315 },
        { x: 420, y: 95 },
        { x: 420, y: 405 },
      ],
    },
    {
      name: '1-3-1',
      labels: ['PG', 'SG', 'PF', 'SF', 'C'],
      slots: [
        { x: 95, y: 250 },
        { x: 225, y: 110 },
        { x: 225, y: 250 },
        { x: 225, y: 390 },
        { x: 370, y: 250 },
      ],
    },
  ],
};

const HALF_DEFENSE: Record<number, Formation[]> = {
  5: [
    {
      name: 'Man',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 200, y: 250 },
        { x: 285, y: 140 },
        { x: 285, y: 360 },
        { x: 365, y: 200 },
        { x: 365, y: 300 },
      ],
    },
    {
      name: '2-3 Zone',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 250, y: 180 },
        { x: 250, y: 320 },
        { x: 400, y: 110 },
        { x: 415, y: 250 },
        { x: 400, y: 390 },
      ],
    },
    {
      name: '3-2 Zone',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 240, y: 250 },
        { x: 285, y: 140 },
        { x: 285, y: 360 },
        { x: 390, y: 190 },
        { x: 390, y: 310 },
      ],
    },
  ],
};

// ----------------------------- accessors ------------------------------------

const mapSlots = (slots: Slot[], mode: CourtMode, flip: boolean): Slot[] =>
  slots.map((s) =>
    mode === 'half'
      ? { x: flip ? HALF_W - s.x : s.x, y: s.y }
      : { x: s.x, y: flip ? COURT_H - s.y : s.y }
  );

const offenseList = (size: number, mode: CourtMode) =>
  (mode === 'half' ? HALF_OFFENSE : FULL_OFFENSE)[size] ?? [];

/** Our formations for this mode (names shown in the picker). */
export const bballOffense = offenseList;

export function bballOffenseSlots(
  size: number,
  mode: CourtMode,
  idx: number,
  flip: boolean
): Slot[] {
  const f = offenseList(size, mode)[idx];
  return f ? mapSlots(f.slots, mode, flip) : [];
}

export function bballOffenseLabels(
  size: number,
  mode: CourtMode,
  idx: number
): string[] {
  return offenseList(size, mode)[idx]?.labels ?? [];
}

/** Opponent formations for the picker: half-court has real defensive sets;
 *  full-court reuses the offensive shapes (they're mirrored to defend). */
export function bballDefense(size: number, mode: CourtMode): Formation[] {
  return (mode === 'half' ? HALF_DEFENSE : FULL_OFFENSE)[size] ?? [];
}

export function bballDefenseSlots(
  size: number,
  mode: CourtMode,
  idx: number,
  flip: boolean
): Slot[] {
  if (mode === 'half') {
    const f = HALF_DEFENSE[size]?.[idx];
    return f ? mapSlots(f.slots, mode, flip) : [];
  }
  // Full court: the opponent defends the far hoop — reflect our shape across
  // the centre line (and flip inverts which end).
  const f = FULL_OFFENSE[size]?.[idx];
  if (!f) return [];
  return f.slots.map((s) => ({ x: s.x, y: flip ? s.y : COURT_H - s.y }));
}

export function bballDefenseLabels(
  size: number,
  mode: CourtMode,
  idx: number
): string[] {
  return bballDefense(size, mode)[idx]?.labels ?? [];
}

/** The tappable rim(s) for shot markers, in the current orientation. */
export function bballHoops(mode: CourtMode, flip: boolean): Slot[] {
  if (mode === 'half') return [{ x: flip ? HALF_W - 412 : 412, y: 250 }];
  return [
    { x: 250, y: 58 },
    { x: 250, y: 882 },
  ];
}

export const bballDims = (mode: CourtMode) =>
  mode === 'half'
    ? { w: HALF_W, h: HALF_H }
    : { w: COURT_W, h: COURT_H };
