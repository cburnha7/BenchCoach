/**
 * Design tokens.
 *
 * The core palette is carried over from the original Bench Coach CSS variables
 * so the rebuild reads as the same product. Values only implied there
 * (elevation, glass, stadium) are defined here for the first time.
 */
export const theme = {
  // Surfaces — from --ink / --panel / --panel2 / --edge
  bg: '#0e1320',
  surface: '#141b2a',
  surfaceAlt: '#1b2436',
  border: '#26314a',

  // Type — from --text / --muted
  text: '#e9edf6',
  textDim: '#8794ad',

  // Pitch — from --turf / --turf2 / --chalk
  turf: '#2b7544',
  turfAlt: '#2f7c49',
  chalk: 'rgba(255,255,255,0.5)',

  // Tactics layer — from --pass / --carry / --run
  pass: '#ef4651',
  carry: '#e23b46',
  run: '#ffffff',
  opponent: '#7ab3ff',

  // Status — from --green
  live: '#34b56a',
  danger: '#e23b46',
  queued: '#e6b332',

  // Ball possession ring
  ball: '#ffd54a',

  /** Text on a saturated accent (live green, danger red, team colour). */
  onAccent: '#ffffff',

  /**
   * Button and control fill. Lighter than `surface` on purpose: a control has
   * to look raised against the background, and `surface` sat close enough to
   * `bg` that buttons read as flat grey panels.
   */
  control: '#232e45',
  controlBorder: '#38455f',

  /** Modal scrim. One value everywhere so sheets feel like one system. */
  scrim: 'rgba(7,11,20,0.72)',
} as const;

/**
 * Stadium backdrop palette. Dusk: the sky reads cool, the floodlights warm.
 * Deliberately desaturated so foreground controls stay legible on top.
 */
export const stadium = {
  skyTop: '#070b14',
  skyMid: '#111a2e',
  skyLow: '#1b2740',
  glow: '#3d4f78',
  standFar: '#0d1422',
  standNear: '#070a12',
  seat: '#1c2740',
  seatLit: '#2b3a5e',
  pylon: '#0a0f1a',
  lamp: '#ffe9b8',
  pitch: '#2b7544',
  pitchFar: '#205834',
} as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

/** 4pt spacing scale. */
export const space = (n: number) => n * 4;

/** hex + alpha -> rgba() string. */
export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Pick black or white text depending on how light the backing colour is. */
export function contrastText(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // Rec. 601 luma
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0e1320' : '#ffffff';
}

/**
 * Translucent panel used over the stadium backdrop. Alpha is high enough that
 * body text stays legible even at the backdrop's brightest point.
 */
export const glass = {
  backgroundColor: 'rgba(20,27,42,0.82)',
  borderWidth: 1,
  borderColor: 'rgba(233,237,246,0.09)',
} as const;

/**
 * Raised control surface for the match screen. Unlike `glass`, this is opaque:
 * over the field the priority is legibility at a glance, not translucency.
 */
export const elevated = {
  backgroundColor: theme.surface,
  borderWidth: 1,
  borderColor: theme.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8,
  shadowOpacity: 0.35,
  elevation: 4,
} as const;

/**
 * Blend a colour toward the app's base. `t` is how much base to mix in:
 * 0 returns the colour untouched, 1 returns the base.
 *
 * This exists because laying a colour over dark at low alpha desaturates it —
 * the result trends grey rather than staying recognisably the team's colour.
 * Mixing keeps the hue and only moves the value.
 */
export function mix(hex: string, t: number, base = theme.bg): string {
  const a = parseInt(hex.replace('#', ''), 16);
  const b = parseInt(base.replace('#', ''), 16);
  const ch = (shift: number) => {
    const av = (a >> shift) & 255;
    const bv = (b >> shift) & 255;
    return Math.round(av + (bv - av) * t);
  };
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`;
}

/**
 * Shared height for every control that sits in the top bar — step buttons,
 * formation trigger, gear, and the action buttons. One number so the row reads
 * as a single band rather than a set of mismatched blocks.
 */
export const CONTROL_H = 46;
