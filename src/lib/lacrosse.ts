// Boys lacrosse, authored in the same 600 x 840 space as the soccer pitch, so
// the opponent mirror and shot-into-goal markers work the same way. Our goal is
// near the bottom, the opponent's near the top; sets attack the top goal.
//
// Sizes follow USA Lacrosse / Maine youth: 10v10 (full field, G+3D+3M+3A),
// 7v7 (G+2D+2M+2A) and 6v6 (G+2D+1M+2A) cross-field.

import type { Formation, Slot } from './formations';

/** Goal centres, inset from each end (there is playing space behind the goal). */
export const LAX_GOAL_TOP = { x: 300, y: 120 };
export const LAX_GOAL_BOTTOM = { x: 300, y: 656 };

export const LAX_FORMATIONS: Record<number, Formation[]> = {
  10: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 140, y: 600 },
        { x: 300, y: 630 },
        { x: 460, y: 600 },
        { x: 140, y: 410 },
        { x: 300, y: 415 },
        { x: 460, y: 410 },
        { x: 195, y: 240 },
        { x: 405, y: 240 },
        { x: 300, y: 175 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 140, y: 610 },
        { x: 300, y: 635 },
        { x: 460, y: 610 },
        { x: 110, y: 420 },
        { x: 300, y: 430 },
        { x: 490, y: 420 },
        { x: 140, y: 230 },
        { x: 460, y: 230 },
        { x: 300, y: 150 },
      ],
    },
  ],
  7: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 210, y: 600 },
        { x: 390, y: 600 },
        { x: 210, y: 410 },
        { x: 390, y: 410 },
        { x: 210, y: 235 },
        { x: 390, y: 235 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 220, y: 610 },
        { x: 380, y: 610 },
        { x: 150, y: 420 },
        { x: 450, y: 420 },
        { x: 180, y: 220 },
        { x: 420, y: 220 },
      ],
    },
  ],
  6: [
    {
      name: 'Standard',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 210, y: 600 },
        { x: 390, y: 600 },
        { x: 300, y: 410 },
        { x: 210, y: 235 },
        { x: 390, y: 235 },
      ],
    },
    {
      name: 'Spread',
      labels: ['G', 'D', 'D', 'M', 'A', 'A'],
      slots: [
        { x: 300, y: 700 },
        { x: 200, y: 610 },
        { x: 400, y: 610 },
        { x: 300, y: 420 },
        { x: 160, y: 220 },
        { x: 440, y: 220 },
      ],
    },
  ],
};

export function laxFormations(size: number): Formation[] {
  return LAX_FORMATIONS[size] ?? [];
}

export function laxSlots(size: number, idx: number): Slot[] {
  return LAX_FORMATIONS[size]?.[idx]?.slots ?? [];
}

export function laxLabels(size: number, idx: number): string[] {
  return LAX_FORMATIONS[size]?.[idx]?.labels ?? [];
}

/** Opponent: reflect our shape across the centre line onto the far half. */
export function laxMirror(size: number, idx: number): Slot[] {
  return (LAX_FORMATIONS[size]?.[idx]?.slots ?? []).map((s) => ({
    x: s.x,
    y: 776 - s.y,
  }));
}
