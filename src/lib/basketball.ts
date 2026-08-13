// Basketball geometry, drawn to true proportions at 10 px/ft.
//
//  - FULL court (500x940): vertical, used for TRANSITION. We defend the bottom
//    and attack the top. One offensive shape (get the ball up: point guard back,
//    centre rim-running, the other three filling the lanes at half court) and a
//    get-back defensive shape.
//  - HALF court (470x500): the hoop is on the RIGHT (baseline right, half-court
//    line left). This is where set offense and defense live, so it carries the
//    real formations.
//
// A team is shown as either its offense or its defense (the Off/Def toggle);
// the opponent shadow, when on, takes the opposite role.

import type { Formation, Slot } from './formations';
import type { Side } from './types';

export const COURT_W = 500;
export const COURT_H = 940;
export const HALF_W = 470;
export const HALF_H = 500;

export type CourtMode = 'full' | 'half';

// ------------------------------ full court ----------------------------------

const FULL_OFFENSE: Record<number, Formation[]> = {
  5: [
    {
      // Transition: PG back in our half, C rim-running to the attacking hoop,
      // the other three filling the lanes across half court.
      name: 'Transition',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 250, y: 700 },
        { x: 90, y: 470 },
        { x: 410, y: 470 },
        { x: 250, y: 470 },
        { x: 250, y: 120 },
      ],
    },
  ],
};

const FULL_DEFENSE: Record<number, Formation[]> = {
  5: [
    {
      name: 'Get Back',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 250, y: 800 },
        { x: 150, y: 715 },
        { x: 350, y: 715 },
        { x: 160, y: 575 },
        { x: 340, y: 575 },
      ],
    },
  ],
};

// ------------------------------ half court ----------------------------------

const HALF_OFFENSE: Record<number, Formation[]> = {
  5: [
    {
      name: 'Man',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 95, y: 250 },
        { x: 205, y: 120 },
        { x: 205, y: 380 },
        { x: 385, y: 200 },
        { x: 385, y: 300 },
      ],
    },
    {
      name: 'Spread',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 90, y: 250 },
        { x: 200, y: 110 },
        { x: 200, y: 390 },
        { x: 415, y: 75 },
        { x: 415, y: 425 },
      ],
    },
    {
      name: 'Horns',
      labels: ['PG', 'PF', 'C', 'SG', 'SF'],
      slots: [
        { x: 110, y: 250 },
        { x: 285, y: 195 },
        { x: 285, y: 305 },
        { x: 420, y: 75 },
        { x: 420, y: 425 },
      ],
    },
    {
      name: '1-3-1',
      labels: ['PG', 'SG', 'PF', 'SF', 'C'],
      slots: [
        { x: 90, y: 250 },
        { x: 215, y: 110 },
        { x: 275, y: 250 },
        { x: 215, y: 390 },
        { x: 400, y: 250 },
      ],
    },
    {
      name: '4 Out',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 95, y: 250 },
        { x: 205, y: 115 },
        { x: 205, y: 385 },
        { x: 415, y: 90 },
        { x: 390, y: 295 },
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
        { x: 285, y: 130 },
        { x: 285, y: 370 },
        { x: 370, y: 200 },
        { x: 370, y: 300 },
      ],
    },
    {
      name: '2-3 Zone',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 250, y: 175 },
        { x: 250, y: 325 },
        { x: 395, y: 105 },
        { x: 415, y: 250 },
        { x: 395, y: 395 },
      ],
    },
    {
      name: '3-2 Zone',
      labels: ['D', 'D', 'D', 'D', 'D'],
      slots: [
        { x: 235, y: 250 },
        { x: 285, y: 130 },
        { x: 285, y: 370 },
        { x: 395, y: 190 },
        { x: 395, y: 310 },
      ],
    },
  ],
};

// ------------------------------ accessors -----------------------------------

const ourList = (size: number, mode: CourtMode, side: Side): Formation[] => {
  const table =
    mode === 'full'
      ? side === 'offense'
        ? FULL_OFFENSE
        : FULL_DEFENSE
      : side === 'offense'
        ? HALF_OFFENSE
        : HALF_DEFENSE;
  return table[size] ?? [];
};

export const bballOurList = ourList;

export const bballOurSlots = (size: number, mode: CourtMode, side: Side, idx: number): Slot[] =>
  ourList(size, mode, side)[idx]?.slots ?? [];

export const bballOurLabels = (size: number, mode: CourtMode, side: Side, idx: number): string[] =>
  ourList(size, mode, side)[idx]?.labels ?? [];

/** The opponent takes the opposite role. In half court that's simply the other
 *  side's shape; in full court it's our shape reflected to the far end. */
export function bballOppList(size: number, mode: CourtMode, side: Side): Formation[] {
  if (mode === 'full') return ourList(size, 'full', side);
  return (side === 'offense' ? HALF_DEFENSE : HALF_OFFENSE)[size] ?? [];
}

export function bballOppSlots(size: number, mode: CourtMode, side: Side, idx: number): Slot[] {
  if (mode === 'full') {
    return ourList(size, 'full', side)[idx]?.slots.map((s) => ({ x: s.x, y: COURT_H - s.y })) ?? [];
  }
  return bballOppList(size, mode, side)[idx]?.slots ?? [];
}

export const bballOppLabels = (size: number, mode: CourtMode, side: Side, idx: number): string[] =>
  bballOppList(size, mode, side)[idx]?.labels ?? [];

/** The tappable rim(s) for shot markers. */
export function bballHoops(mode: CourtMode): Slot[] {
  if (mode === 'half') return [{ x: 412, y: 250 }];
  return [
    { x: 250, y: 58 },
    { x: 250, y: 882 },
  ];
}

export const bballDims = (mode: CourtMode) =>
  mode === 'half' ? { w: HALF_W, h: HALF_H } : { w: COURT_W, h: COURT_H };
