// Boys lacrosse, drawn to true proportions at 10 px/yd.
//
//  - FULL field (600 x 1100 = 60 x 110 yd): vertical, a goal 15 yd off each end
//    in its crease, restraining lines 20 yd off centre, wing lines + the
//    substitution area at midfield. Attack the top, defend the bottom.
//  - HALF field (560 x 600): rotated so the goal is on the right, for settled
//    offense/defense. A 10v10 zone only shows the 6 on-side players; the
//    smaller sizes show the whole unit.
//
// A team shows its offense or its defense (the Off/Def toggle); the opponent
// takes the opposite role. Sizes: 10v10 / 7v7 / 6v6.

import type { Formation, Slot } from './formations';
import type { CourtMode } from './basketball';
import type { Side } from './types';

export const LAX_FULL_W = 600;
export const LAX_FULL_H = 1100;
export const LAX_HALF_W = 560;
export const LAX_HALF_H = 600;

/** Bump when the coordinate space changes, so saved matches re-lay on load. */
export const LAX_COORD_V = 2;

// Goal centres (15 yd off each endline; endlines inset ~15px for the boundary).
export const LAX_GOAL_TOP = { x: 300, y: 165 };
export const LAX_GOAL_BOTTOM = { x: 300, y: 935 };
export const LAX_GOAL_HALF = { x: 420, y: 300 };

// ------------------------------ full field ----------------------------------

const FULL_OFFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 180, y: 850 }, { x: 300, y: 875 }, { x: 420, y: 850 },
        { x: 160, y: 560 }, { x: 300, y: 570 }, { x: 440, y: 560 },
        { x: 200, y: 300 }, { x: 400, y: 300 }, { x: 300, y: 240 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 170, y: 860 }, { x: 300, y: 885 }, { x: 430, y: 860 },
        { x: 120, y: 570 }, { x: 300, y: 580 }, { x: 480, y: 570 },
        { x: 150, y: 290 }, { x: 450, y: 290 }, { x: 300, y: 200 },
      ],
    },
  ],
  7: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 220, y: 860 }, { x: 380, y: 860 },
        { x: 210, y: 560 }, { x: 390, y: 560 },
        { x: 220, y: 310 }, { x: 380, y: 310 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 230, y: 870 }, { x: 370, y: 870 },
        { x: 150, y: 570 }, { x: 450, y: 570 },
        { x: 180, y: 290 }, { x: 420, y: 290 },
      ],
    },
  ],
  6: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 220, y: 860 }, { x: 380, y: 860 },
        { x: 300, y: 560 },
        { x: 220, y: 310 }, { x: 380, y: 310 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 210, y: 870 }, { x: 390, y: 870 },
        { x: 300, y: 570 },
        { x: 160, y: 290 }, { x: 440, y: 290 },
      ],
    },
  ],
};

// Attackmen stay onside (above centre y=550); middies drop back to defend.
const FULL_DEFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Settled',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 180, y: 855 }, { x: 300, y: 880 }, { x: 420, y: 855 },
        { x: 160, y: 700 }, { x: 300, y: 715 }, { x: 440, y: 700 },
        { x: 200, y: 430 }, { x: 400, y: 430 }, { x: 300, y: 370 },
      ],
    },
  ],
  7: [
    {
      name: 'Settled',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 220, y: 860 }, { x: 380, y: 860 },
        { x: 210, y: 700 }, { x: 390, y: 700 },
        { x: 240, y: 430 }, { x: 360, y: 430 },
      ],
    },
  ],
  6: [
    {
      name: 'Settled',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 985 },
        { x: 220, y: 860 }, { x: 380, y: 860 },
        { x: 300, y: 700 },
        { x: 240, y: 430 }, { x: 360, y: 430 },
      ],
    },
  ],
};

// ------------------------------ half field ----------------------------------
// Goal on the right at (420, 300); worked from the left. 10v10 shows only the
// six on-side players; 7v7 / 6v6 (already small-sided) show the whole unit.

const HALF_OFFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Set',
      labels: ['A', 'A', 'A', 'M', 'M', 'M'],
      slots: [
        { x: 370, y: 235 }, { x: 370, y: 365 }, { x: 490, y: 300 },
        { x: 250, y: 180 }, { x: 250, y: 420 }, { x: 175, y: 300 },
      ],
    },
  ],
  7: [
    {
      name: 'Set',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 55, y: 300 },
        { x: 180, y: 175 }, { x: 180, y: 425 },
        { x: 280, y: 210 }, { x: 280, y: 390 },
        { x: 385, y: 240 }, { x: 385, y: 360 },
      ],
    },
  ],
  6: [
    {
      name: 'Set',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 55, y: 300 },
        { x: 185, y: 185 }, { x: 185, y: 415 },
        { x: 285, y: 300 },
        { x: 390, y: 240 }, { x: 390, y: 360 },
      ],
    },
  ],
};

const HALF_DEFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'D', 'M', 'M'],
      slots: [
        { x: 425, y: 300 },
        { x: 345, y: 235 }, { x: 345, y: 365 }, { x: 300, y: 300 },
        { x: 225, y: 220 }, { x: 225, y: 380 },
      ],
    },
  ],
  7: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 425, y: 300 },
        { x: 345, y: 235 }, { x: 345, y: 365 },
        { x: 270, y: 210 }, { x: 270, y: 390 },
        { x: 185, y: 200 }, { x: 185, y: 400 },
      ],
    },
  ],
  6: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 425, y: 300 },
        { x: 345, y: 235 }, { x: 345, y: 365 },
        { x: 275, y: 300 },
        { x: 195, y: 220 }, { x: 195, y: 380 },
      ],
    },
  ],
};

// ------------------------------ accessors -----------------------------------

const ourTable = (size: number, mode: CourtMode, side: Side): Formation[] => {
  const t =
    mode === 'full'
      ? side === 'offense'
        ? FULL_OFFENSE
        : FULL_DEFENSE
      : side === 'offense'
        ? HALF_OFFENSE
        : HALF_DEFENSE;
  return t[size] ?? [];
};

export const laxOurList = ourTable;
export const laxOurSlots = (size: number, mode: CourtMode, side: Side, idx: number): Slot[] =>
  ourTable(size, mode, side)[idx]?.slots ?? [];
export const laxOurLabels = (size: number, mode: CourtMode, side: Side, idx: number): string[] =>
  ourTable(size, mode, side)[idx]?.labels ?? [];

const oppTable = (size: number, mode: CourtMode, side: Side): Formation[] => {
  const wantOffense = side === 'defense';
  const t =
    mode === 'full'
      ? wantOffense
        ? FULL_OFFENSE
        : FULL_DEFENSE
      : wantOffense
        ? HALF_OFFENSE
        : HALF_DEFENSE;
  return t[size] ?? [];
};

export const laxOppList = oppTable;
export function laxOppSlots(size: number, mode: CourtMode, side: Side, idx: number): Slot[] {
  const f = oppTable(size, mode, side)[idx];
  if (!f) return [];
  return mode === 'full' ? f.slots.map((s) => ({ x: s.x, y: LAX_FULL_H - s.y })) : f.slots;
}
export const laxOppLabels = (size: number, mode: CourtMode, side: Side, idx: number): string[] =>
  oppTable(size, mode, side)[idx]?.labels ?? [];

export function laxHoops(mode: CourtMode): Slot[] {
  return mode === 'half' ? [LAX_GOAL_HALF] : [LAX_GOAL_TOP, LAX_GOAL_BOTTOM];
}

export const laxDims = (mode: CourtMode) =>
  mode === 'half' ? { w: LAX_HALF_W, h: LAX_HALF_H } : { w: LAX_FULL_W, h: LAX_FULL_H };
