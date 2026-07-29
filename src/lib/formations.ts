// Ported verbatim from the original Bench Coach pitch geometry.
// Field coordinate space is 600 x 840; the pitch spans y 8..768.

export type Slot = { x: number; y: number };
export type Formation = { name: string; slots: Slot[] };
export type TeamSize = 7 | 9 | 11;

export const FIELD_W = 600;
export const FIELD_H = 840;
export const BENCH_Y = 831;

export const FORMATIONS: Record<TeamSize, Formation[]> = {
  7: [
    { name: "2-3-1", slots: [{ x: 300, y: 750 }, { x: 205, y: 600 }, { x: 395, y: 600 }, { x: 110, y: 380 }, { x: 300, y: 380 }, { x: 490, y: 380 }, { x: 300, y: 150 }] },
    { name: "3-2-1", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 205, y: 390 }, { x: 395, y: 390 }, { x: 300, y: 150 }] },
    { name: "3-1-2", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 300, y: 430 }, { x: 210, y: 175 }, { x: 390, y: 175 }] },
    { name: "2-1-2-1", slots: [{ x: 300, y: 750 }, { x: 205, y: 610 }, { x: 395, y: 610 }, { x: 300, y: 490 }, { x: 205, y: 340 }, { x: 395, y: 340 }, { x: 300, y: 150 }] },
    { name: "2-2-2", slots: [{ x: 300, y: 750 }, { x: 205, y: 600 }, { x: 395, y: 600 }, { x: 205, y: 400 }, { x: 395, y: 400 }, { x: 205, y: 160 }, { x: 395, y: 160 }] },
    { name: "1-3-2", slots: [{ x: 300, y: 750 }, { x: 300, y: 635 }, { x: 110, y: 430 }, { x: 300, y: 430 }, { x: 490, y: 430 }, { x: 210, y: 180 }, { x: 390, y: 180 }] },
    { name: "3-3", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 110, y: 230 }, { x: 300, y: 230 }, { x: 490, y: 230 }] },
    { name: "2-4", slots: [{ x: 300, y: 750 }, { x: 205, y: 620 }, { x: 395, y: 620 }, { x: 90, y: 300 }, { x: 230, y: 300 }, { x: 370, y: 300 }, { x: 510, y: 300 }] },
    { name: "1-4-1", slots: [{ x: 300, y: 750 }, { x: 300, y: 640 }, { x: 90, y: 400 }, { x: 230, y: 400 }, { x: 370, y: 400 }, { x: 510, y: 400 }, { x: 300, y: 150 }] },
    { name: "2-2-1-1", slots: [{ x: 300, y: 750 }, { x: 205, y: 615 }, { x: 395, y: 615 }, { x: 205, y: 455 }, { x: 395, y: 455 }, { x: 300, y: 300 }, { x: 300, y: 140 }] },
  ],
  9: [
    { name: "2-4-2 Diamond", slots: [{ x: 300, y: 750 }, { x: 198, y: 600 }, { x: 402, y: 600 }, { x: 300, y: 482 }, { x: 96, y: 362 }, { x: 504, y: 362 }, { x: 300, y: 300 }, { x: 216, y: 138 }, { x: 384, y: 138 }] },
    { name: "2-4-2 Flat", slots: [{ x: 300, y: 750 }, { x: 205, y: 600 }, { x: 395, y: 600 }, { x: 96, y: 380 }, { x: 232, y: 380 }, { x: 368, y: 380 }, { x: 504, y: 380 }, { x: 215, y: 150 }, { x: 385, y: 150 }] },
    { name: "3-3-2", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 110, y: 380 }, { x: 300, y: 380 }, { x: 490, y: 380 }, { x: 215, y: 150 }, { x: 385, y: 150 }] },
    { name: "3-2-3", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 205, y: 400 }, { x: 395, y: 400 }, { x: 110, y: 150 }, { x: 300, y: 150 }, { x: 490, y: 150 }] },
    { name: "2-3-3", slots: [{ x: 300, y: 750 }, { x: 205, y: 610 }, { x: 395, y: 610 }, { x: 110, y: 400 }, { x: 300, y: 400 }, { x: 490, y: 400 }, { x: 110, y: 150 }, { x: 300, y: 150 }, { x: 490, y: 150 }] },
    { name: "3-4-1", slots: [{ x: 300, y: 750 }, { x: 110, y: 600 }, { x: 300, y: 600 }, { x: 490, y: 600 }, { x: 96, y: 380 }, { x: 232, y: 380 }, { x: 368, y: 380 }, { x: 504, y: 380 }, { x: 300, y: 140 }] },
    { name: "2-5-1", slots: [{ x: 300, y: 750 }, { x: 205, y: 610 }, { x: 395, y: 610 }, { x: 90, y: 390 }, { x: 200, y: 390 }, { x: 300, y: 390 }, { x: 400, y: 390 }, { x: 510, y: 390 }, { x: 300, y: 150 }] },
    { name: "4-3-1", slots: [{ x: 300, y: 750 }, { x: 96, y: 615 }, { x: 232, y: 615 }, { x: 368, y: 615 }, { x: 504, y: 615 }, { x: 110, y: 400 }, { x: 300, y: 400 }, { x: 490, y: 400 }, { x: 300, y: 150 }] },
    { name: "3-1-3-1", slots: [{ x: 300, y: 750 }, { x: 110, y: 615 }, { x: 300, y: 615 }, { x: 490, y: 615 }, { x: 300, y: 490 }, { x: 110, y: 370 }, { x: 300, y: 370 }, { x: 490, y: 370 }, { x: 300, y: 150 }] },
    { name: "3-2-2-1", slots: [{ x: 300, y: 750 }, { x: 110, y: 615 }, { x: 300, y: 615 }, { x: 490, y: 615 }, { x: 205, y: 470 }, { x: 395, y: 470 }, { x: 210, y: 330 }, { x: 390, y: 330 }, { x: 300, y: 150 }] },
  ],
  11: [
    { name: "4-4-2 Diamond", slots: [{ x: 300, y: 750 }, { x: 96, y: 645 }, { x: 232, y: 645 }, { x: 368, y: 645 }, { x: 504, y: 645 }, { x: 300, y: 470 }, { x: 96, y: 375 }, { x: 504, y: 375 }, { x: 300, y: 262 }, { x: 210, y: 148 }, { x: 390, y: 148 }] },
    { name: "4-4-2", slots: [{ x: 300, y: 750 }, { x: 96, y: 600 }, { x: 232, y: 600 }, { x: 368, y: 600 }, { x: 504, y: 600 }, { x: 96, y: 390 }, { x: 232, y: 390 }, { x: 368, y: 390 }, { x: 504, y: 390 }, { x: 215, y: 150 }, { x: 385, y: 150 }] },
    { name: "4-3-3", slots: [{ x: 300, y: 750 }, { x: 96, y: 600 }, { x: 232, y: 600 }, { x: 368, y: 600 }, { x: 504, y: 600 }, { x: 110, y: 400 }, { x: 300, y: 400 }, { x: 490, y: 400 }, { x: 110, y: 150 }, { x: 300, y: 150 }, { x: 490, y: 150 }] },
    { name: "4-2-3-1", slots: [{ x: 300, y: 750 }, { x: 96, y: 610 }, { x: 232, y: 610 }, { x: 368, y: 610 }, { x: 504, y: 610 }, { x: 210, y: 495 }, { x: 390, y: 495 }, { x: 110, y: 345 }, { x: 300, y: 345 }, { x: 490, y: 345 }, { x: 300, y: 150 }] },
    { name: "4-4-1-1", slots: [{ x: 300, y: 750 }, { x: 96, y: 600 }, { x: 232, y: 600 }, { x: 368, y: 600 }, { x: 504, y: 600 }, { x: 96, y: 400 }, { x: 232, y: 400 }, { x: 368, y: 400 }, { x: 504, y: 400 }, { x: 300, y: 255 }, { x: 300, y: 140 }] },
    { name: "3-5-2", slots: [{ x: 300, y: 750 }, { x: 110, y: 610 }, { x: 300, y: 610 }, { x: 490, y: 610 }, { x: 70, y: 400 }, { x: 185, y: 400 }, { x: 300, y: 400 }, { x: 415, y: 400 }, { x: 530, y: 400 }, { x: 215, y: 150 }, { x: 385, y: 150 }] },
    { name: "3-4-3", slots: [{ x: 300, y: 750 }, { x: 110, y: 610 }, { x: 300, y: 610 }, { x: 490, y: 610 }, { x: 96, y: 400 }, { x: 232, y: 400 }, { x: 368, y: 400 }, { x: 504, y: 400 }, { x: 110, y: 150 }, { x: 300, y: 150 }, { x: 490, y: 150 }] },
    { name: "4-5-1", slots: [{ x: 300, y: 750 }, { x: 96, y: 610 }, { x: 232, y: 610 }, { x: 368, y: 610 }, { x: 504, y: 610 }, { x: 70, y: 400 }, { x: 185, y: 400 }, { x: 300, y: 400 }, { x: 415, y: 400 }, { x: 530, y: 400 }, { x: 300, y: 150 }] },
    { name: "5-3-2", slots: [{ x: 300, y: 750 }, { x: 70, y: 620 }, { x: 185, y: 620 }, { x: 300, y: 620 }, { x: 415, y: 620 }, { x: 530, y: 620 }, { x: 110, y: 410 }, { x: 300, y: 410 }, { x: 490, y: 410 }, { x: 215, y: 160 }, { x: 385, y: 160 }] },
    { name: "4-1-4-1", slots: [{ x: 300, y: 750 }, { x: 96, y: 615 }, { x: 232, y: 615 }, { x: 368, y: 615 }, { x: 504, y: 615 }, { x: 300, y: 505 }, { x: 96, y: 370 }, { x: 232, y: 370 }, { x: 368, y: 370 }, { x: 504, y: 370 }, { x: 300, y: 150 }] },
    { name: "5-4-1", slots: [{ x: 300, y: 750 }, { x: 70, y: 620 }, { x: 185, y: 620 }, { x: 300, y: 620 }, { x: 415, y: 620 }, { x: 530, y: 620 }, { x: 96, y: 405 }, { x: 232, y: 405 }, { x: 368, y: 405 }, { x: 504, y: 405 }, { x: 300, y: 160 }] },
  ],
};

/**
 * A position code for one outfield slot from its role and where it sits.
 * `x` gives the side (600 wide, centre 300); `y` gives depth (own goal high,
 * opponent goal low) which separates a holding mid from an attacking one.
 */
function slotCode(
  role: 'D' | 'M' | 'F',
  x: number,
  y: number,
  mirror: boolean
): string {
  // Opponents face the other way, so their left/right is flipped vs the field.
  const sx = mirror ? FIELD_W - x : x;
  const side = sx < 200 ? 'L' : sx > 400 ? 'R' : 'C';
  if (role === 'D') return side === 'C' ? 'CB' : `${side}B`;
  if (role === 'F') return side === 'C' ? 'ST' : `${side}W`;
  // Midfield: wide slots are flank mids; central slots split by depth.
  if (side !== 'C') return `${side}M`;
  if (y >= 470) return 'CDM';
  if (y <= 320) return 'CAM';
  return 'CM';
}

/**
 * A human position code (GK, CB, CDM, LW, ST, …) for every slot of a formation.
 * The line each slot belongs to is read from the formation name (defence →
 * attack); the exact code then comes from the slot's position. Used to label
 * empty starter slots on the board so the shape is legible before players load.
 */
export function positionLabels(
  size: TeamSize,
  idx: number,
  mirror = false
): string[] {
  const { name, slots } = FORMATIONS[size][idx];
  // Outfield line counts from the name, dropping qualifiers like "Diamond".
  const lines = name
    .split(/\s+/)[0]
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const roles = new Array<'GK' | 'D' | 'M' | 'F'>(slots.length).fill('M');
  roles[0] = 'GK';
  let cursor = 1;
  lines.forEach((count, lineNo) => {
    const role: 'D' | 'M' | 'F' =
      lineNo === 0 ? 'D' : lineNo === lines.length - 1 ? 'F' : 'M';
    for (let k = 0; k < count && cursor < slots.length; k++, cursor++) {
      roles[cursor] = role;
    }
  });

  return slots.map((s, i) =>
    roles[i] === 'GK'
      ? 'GK'
      : slotCode(roles[i] as 'D' | 'M' | 'F', s.x, s.y, mirror)
  );
}

/** Opponent slots: mirrored across the halfway line, compressed to 90%. */
export function mirrorSlots(size: TeamSize, idx: number): Slot[] {
  return FORMATIONS[size][idx].slots.map((s, i) =>
    i === 0 ? { x: 300, y: 40 } : { x: s.x, y: Math.round(628 - 0.9 * s.y) }
  );
}
