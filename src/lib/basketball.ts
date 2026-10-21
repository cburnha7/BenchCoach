// Basketball geometry, drawn to true proportions at 10 px/ft.
//
//  - FULL court (500x940): vertical, used for TRANSITION. We defend the bottom
//    and attack the top. One offensive shape (get the ball up: point guard back,
//    centre rim-running, the other three filling the lanes at half court) and a
//    get-back defensive shape.
//  - HALF court (470x500): the hoop is on the RIGHT (baseline right, half-court
//    line left). This is where set offense and defense live, so it carries the
//    real formations: four spread offensive sets (5 Out, 4 Out 1 In, 3 Out 2 In,
//    Horns) and three defenses (Man, 2-3 Zone, 3-2 Zone).
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
      // Transition / inbound: C under our own (bottom) hoop with the ball, PG
      // back to receive, the other three filling the lanes at half court.
      name: 'Transition',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 170, y: 760 },
        { x: 90, y: 470 },
        { x: 410, y: 470 },
        { x: 250, y: 470 },
        { x: 250, y: 900 },
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

// Half-court geometry the offense sits on (10 px/ft, rim at 412,250):
//   - 3-pt arc radius 237.5 (23.75 ft) around the rim; corner lines at y=35 /
//     y=465, 22 ft from the rim's axis. Perimeter spots stand ~25 ft out, a
//     step beyond the arc, so the shape is clearly "outside".
//   - Paint x 275..465, y 170..330. Elbows at (275,170)/(275,330). Low blocks
//     ~7 ft off the baseline (x≈400), a step outside the lane line.
// Spots (all measured from the rim):
const TOP = { x: 157, y: 250 }; //  top of the key, 25.5 ft
const WING_L = { x: 232, y: 70 }; //  45° wing, 25.5 ft
const WING_R = { x: 232, y: 430 };
const CORNER_L = { x: 440, y: 32 }; //  deep corner, just beyond the corner 3
const CORNER_R = { x: 440, y: 468 };
const SLOT_L = { x: 177, y: 150 }; //  guard "slot", lane line extended, 25.5 ft
const SLOT_R = { x: 177, y: 350 };
const FT_WING_L = { x: 255, y: 55 }; // free-throw-line-extended wing, 25 ft
const FT_WING_R = { x: 255, y: 445 };
const ELBOW_L = { x: 268, y: 165 }; // a step above the elbow
const ELBOW_R = { x: 268, y: 335 };
const BLOCK_L = { x: 400, y: 150 }; // low block, outside the lane
const BLOCK_R = { x: 400, y: 350 };

const HALF_OFFENSE: Record<number, Formation[]> = {
  5: [
    {
      // Everyone on the perimeter: point, two wings, two corners. The lane is
      // empty for drives and cuts.
      name: '5 Out',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [TOP, WING_L, WING_R, CORNER_L, CORNER_R],
    },
    {
      // Two guards in the slots, two wings at the free-throw line extended,
      // one post on the low block.
      name: '4 Out 1 In',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [SLOT_L, SLOT_R, FT_WING_L, FT_WING_R, BLOCK_R],
    },
    {
      // Point and two wings outside, two posts on the blocks.
      name: '3 Out 2 In',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [TOP, WING_L, WING_R, BLOCK_L, BLOCK_R],
    },
    {
      // Point up top, both bigs at the elbows, shooters spotted in the corners.
      name: 'Horns',
      labels: ['PG', 'PF', 'C', 'SG', 'SF'],
      slots: [TOP, ELBOW_L, ELBOW_R, CORNER_L, CORNER_R],
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

/** The opponent takes the OPPOSITE role. In half court that's the other side's
 *  shape (same half); in full court it's the other side's shape reflected to the
 *  far end, so the defense sits back at its own basket rather than on top of us. */
const oppTable = (size: number, mode: CourtMode, side: Side): Formation[] => {
  const wantOffense = side === 'defense'; // opponent is offense when we defend
  const table =
    mode === 'full'
      ? wantOffense
        ? FULL_OFFENSE
        : FULL_DEFENSE
      : wantOffense
        ? HALF_OFFENSE
        : HALF_DEFENSE;
  return table[size] ?? [];
};

export function bballOppList(size: number, mode: CourtMode, side: Side): Formation[] {
  return oppTable(size, mode, side);
}

export function bballOppSlots(size: number, mode: CourtMode, side: Side, idx: number): Slot[] {
  const f = oppTable(size, mode, side)[idx];
  if (!f) return [];
  // Full court: reflect across the centre line so they defend/attack the far
  // hoop. Half court: both teams share the one half, so no reflection.
  return mode === 'full' ? f.slots.map((s) => ({ x: s.x, y: COURT_H - s.y })) : f.slots;
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
