// Boys lacrosse. Two layouts, mirroring the basketball model:
//  - FULL field (600 x 840): vertical, goals at both ends, drawn in the same
//    space as the soccer pitch. Attack the top, defend the bottom.
//  - HALF field (540 x 600): rotated so the goal is on the RIGHT, for settled
//    6v6 offense and defense.
// A team shows its offense or its defense (the Off/Def toggle); the opponent
// shadow takes the opposite role. Sizes: 10v10 / 7v7 / 6v6.

import type { Formation, Slot } from './formations';
import type { CourtMode } from './basketball';
import type { Side } from './types';

export const LAX_FULL_W = 600;
export const LAX_FULL_H = 840;
export const LAX_HALF_W = 540;
export const LAX_HALF_H = 600;

/** Goal centres for full field (inset from each end). */
export const LAX_GOAL_TOP = { x: 300, y: 120 };
export const LAX_GOAL_BOTTOM = { x: 300, y: 656 };
/** Goal centre for the half field (on the right). */
export const LAX_GOAL_HALF = { x: 440, y: 300 };

// ------------------------------ full field ----------------------------------

const FULL_OFFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 140, y: 600 }, { x: 300, y: 630 }, { x: 460, y: 600 },
        { x: 140, y: 410 }, { x: 300, y: 415 }, { x: 460, y: 410 },
        { x: 195, y: 240 }, { x: 405, y: 240 }, { x: 300, y: 175 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 140, y: 610 }, { x: 300, y: 635 }, { x: 460, y: 610 },
        { x: 110, y: 420 }, { x: 300, y: 430 }, { x: 490, y: 420 },
        { x: 140, y: 230 }, { x: 460, y: 230 }, { x: 300, y: 150 },
      ],
    },
  ],
  7: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 210, y: 600 }, { x: 390, y: 600 },
        { x: 210, y: 410 }, { x: 390, y: 410 },
        { x: 210, y: 235 }, { x: 390, y: 235 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 220, y: 610 }, { x: 380, y: 610 },
        { x: 150, y: 420 }, { x: 450, y: 420 },
        { x: 180, y: 220 }, { x: 420, y: 220 },
      ],
    },
  ],
  6: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 210, y: 600 }, { x: 390, y: 600 },
        { x: 300, y: 410 },
        { x: 210, y: 235 }, { x: 390, y: 235 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 200, y: 610 }, { x: 400, y: 610 },
        { x: 300, y: 420 },
        { x: 160, y: 220 }, { x: 440, y: 220 },
      ],
    },
  ],
};

const FULL_DEFENSE: Record<number, Formation[]> = {
  10: [
    {
      // Attackmen stay onside in the offensive half (above the midline, y<388);
      // middies drop back to defend, close D and G at our goal.
      name: 'Settled',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 180, y: 640 }, { x: 300, y: 665 }, { x: 420, y: 640 },
        { x: 160, y: 520 }, { x: 300, y: 535 }, { x: 440, y: 520 },
        { x: 200, y: 320 }, { x: 400, y: 320 }, { x: 300, y: 270 },
      ],
    },
  ],
  7: [
    {
      name: 'Settled',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 220, y: 645 }, { x: 380, y: 645 },
        { x: 210, y: 525 }, { x: 390, y: 525 },
        { x: 240, y: 320 }, { x: 360, y: 320 },
      ],
    },
  ],
  6: [
    {
      name: 'Settled',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 220, y: 645 }, { x: 380, y: 645 },
        { x: 300, y: 525 },
        { x: 240, y: 320 }, { x: 360, y: 320 },
      ],
    },
  ],
};

// ------------------------------ half field ----------------------------------
// Goal on the right at (440, 300); the ball is worked from the left.

const HALF_OFFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Set',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 45, y: 300 },
        { x: 140, y: 180 }, { x: 140, y: 300 }, { x: 140, y: 420 },
        { x: 255, y: 180 }, { x: 255, y: 300 }, { x: 255, y: 420 },
        { x: 370, y: 230 }, { x: 370, y: 370 }, { x: 485, y: 300 },
      ],
    },
  ],
  7: [
    {
      name: 'Set',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 45, y: 300 },
        { x: 175, y: 170 }, { x: 175, y: 430 },
        { x: 265, y: 200 }, { x: 265, y: 400 },
        { x: 380, y: 235 }, { x: 380, y: 365 },
      ],
    },
  ],
  6: [
    {
      name: 'Set',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 45, y: 300 },
        { x: 175, y: 180 }, { x: 175, y: 420 },
        { x: 265, y: 300 },
        { x: 375, y: 235 }, { x: 375, y: 365 },
      ],
    },
  ],
};

const HALF_DEFENSE: Record<number, Formation[]> = {
  10: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 440, y: 300 },
        { x: 360, y: 230 }, { x: 360, y: 300 }, { x: 360, y: 370 },
        { x: 285, y: 200 }, { x: 285, y: 300 }, { x: 285, y: 400 },
        { x: 200, y: 190 }, { x: 200, y: 300 }, { x: 200, y: 410 },
      ],
    },
  ],
  7: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 440, y: 300 },
        { x: 360, y: 235 }, { x: 360, y: 365 },
        { x: 290, y: 210 }, { x: 290, y: 390 },
        { x: 210, y: 190 }, { x: 210, y: 410 },
      ],
    },
  ],
  6: [
    {
      name: 'Man',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 440, y: 300 },
        { x: 360, y: 235 }, { x: 360, y: 365 },
        { x: 290, y: 300 },
        { x: 210, y: 200 }, { x: 210, y: 400 },
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
  // Full field: reflect across the centre line to the far end. Half field: same
  // half, so no reflection.
  return mode === 'full' ? f.slots.map((s) => ({ x: s.x, y: 776 - s.y })) : f.slots;
}
export const laxOppLabels = (size: number, mode: CourtMode, side: Side, idx: number): string[] =>
  oppTable(size, mode, side)[idx]?.labels ?? [];

/** Tappable goals for shot markers. */
export function laxHoops(mode: CourtMode): Slot[] {
  return mode === 'half' ? [LAX_GOAL_HALF] : [LAX_GOAL_TOP, LAX_GOAL_BOTTOM];
}

export const laxDims = (mode: CourtMode) =>
  mode === 'half' ? { w: LAX_HALF_W, h: LAX_HALF_H } : { w: LAX_FULL_W, h: LAX_FULL_H };
