// 5v5 basketball. Unlike the soccer pitch (which is stretched to fill the
// screen), the court is drawn to true proportions: a 50 ft x 94 ft floor at
// 10 px/ft, so COURT_W x COURT_H = 500 x 940. Field.tsx scales this uniformly
// (contain) and centres it. Our hoop sits at the bottom (y ~= 882), the
// opponent's at the top; sets are laid out attacking the top hoop.

import type { Formation, Slot } from './formations';

/** True-proportion court coordinate space (10 px per foot). */
export const COURT_W = 500;
export const COURT_H = 940;

/** Reflect a y across the centre line (y = 470) onto the far half. */
const flipY = (y: number) => COURT_H - y;

export const BASKETBALL_FORMATIONS: Record<number, Formation[]> = {
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

/** Basketball labels are authored per slot, so this just reads them back. */
export function basketballLabels(
  size: number,
  idx: number,
  _mirror = false
): string[] {
  return BASKETBALL_FORMATIONS[size]?.[idx]?.labels ?? [];
}

/** Opponent set: reflect our formation across the centre line to the far half. */
export function basketballMirror(size: number, idx: number): Slot[] {
  const f = BASKETBALL_FORMATIONS[size]?.[idx];
  if (!f) return [];
  return f.slots.map((s) => ({ x: s.x, y: flipY(s.y) }));
}
