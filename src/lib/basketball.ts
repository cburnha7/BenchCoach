// 5v5 basketball, authored in the same 600 x 840 space as the soccer pitch so
// every coordinate, the opponent mirror, and the shot-into-hoop markers keep
// working unchanged. Our hoop sits at the bottom (y ~= 742), the opponent's at
// the top; sets are laid out attacking the top hoop, mirroring how a soccer
// lineup runs from its own goal up toward the opponent's.

import type { Formation, Slot } from './formations';

/** Reflect a y across the centre line (y = 388) onto the far half. */
const flipY = (y: number) => 776 - y;

export const BASKETBALL_FORMATIONS: Record<number, Formation[]> = {
  5: [
    {
      name: 'Man',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 300, y: 480 },
        { x: 140, y: 370 },
        { x: 460, y: 370 },
        { x: 205, y: 205 },
        { x: 395, y: 205 },
      ],
    },
    {
      name: 'Spread',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 300, y: 485 },
        { x: 105, y: 360 },
        { x: 495, y: 360 },
        { x: 185, y: 215 },
        { x: 300, y: 150 },
      ],
    },
    {
      name: '1-3-1',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 300, y: 495 },
        { x: 110, y: 345 },
        { x: 490, y: 345 },
        { x: 300, y: 290 },
        { x: 300, y: 155 },
      ],
    },
    {
      name: 'Hi-Lo',
      labels: ['PG', 'SG', 'SF', 'PF', 'C'],
      slots: [
        { x: 300, y: 470 },
        { x: 140, y: 380 },
        { x: 460, y: 380 },
        { x: 300, y: 255 },
        { x: 300, y: 150 },
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
