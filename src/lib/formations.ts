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

/** Position codes for one line, by role and how many players are in it. */
function lineCodes(role: 'D' | 'M' | 'F', n: number): string[] {
  const table: Record<'D' | 'M' | 'F', Record<number, string[]>> = {
    D: {
      1: ['CB'],
      2: ['LB', 'RB'],
      3: ['LB', 'CB', 'RB'],
      4: ['LB', 'LCB', 'RCB', 'RB'],
      5: ['LB', 'LCB', 'CB', 'RCB', 'RB'],
    },
    M: {
      1: ['CM'],
      2: ['LM', 'RM'],
      3: ['LM', 'CM', 'RM'],
      4: ['LM', 'LCM', 'RCM', 'RM'],
      5: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
    },
    F: {
      1: ['ST'],
      2: ['LS', 'RS'],
      3: ['LW', 'ST', 'RW'],
    },
  };
  return table[role][n] ?? Array<string>(n).fill(role);
}

/**
 * A human position code (GK, CB, LM, ST, …) for every slot of a formation,
 * derived from its name. Slot 0 is always the keeper; the remaining lines read
 * defence → attack, and within a line left → right by x. Used to label empty
 * starter slots on the board so the shape is legible before players are added.
 */
export function positionLabels(size: TeamSize, idx: number): string[] {
  const formation = FORMATIONS[size][idx];
  const slots = formation.slots;
  // Outfield line counts from the name, dropping qualifiers like "Diamond".
  const lines = formation.name
    .split(/\s+/)[0]
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const labels = new Array<string>(slots.length).fill('·');
  labels[0] = 'GK';

  let cursor = 1;
  lines.forEach((count, lineNo) => {
    const role: 'D' | 'M' | 'F' =
      lineNo === 0 ? 'D' : lineNo === lines.length - 1 ? 'F' : 'M';
    // The line's slots are consecutive in the array; order them left → right.
    const idxs: number[] = [];
    for (let k = 0; k < count && cursor + k < slots.length; k++) {
      idxs.push(cursor + k);
    }
    idxs.sort((a, b) => slots[a].x - slots[b].x);
    const codes = lineCodes(role, count);
    idxs.forEach((si, i) => {
      labels[si] = codes[i] ?? role;
    });
    cursor += count;
  });

  return labels;
}

/** Opponent slots: mirrored across the halfway line, compressed to 90%. */
export function mirrorSlots(size: TeamSize, idx: number): Slot[] {
  return FORMATIONS[size][idx].slots.map((s, i) =>
    i === 0 ? { x: 300, y: 40 } : { x: s.x, y: Math.round(628 - 0.9 * s.y) }
  );
}
