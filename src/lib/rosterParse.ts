/**
 * Turning raw OCR text into a list of player names.
 *
 * ML Kit hands back every line it can see on the page: the club name, column
 * headers, jersey numbers, coach contact details, the print date in the
 * footer. The names are in there, but so is a lot of noise, and a scan that
 * imports "Emergency Contact" as a player is worse than no scan at all.
 *
 * Everything here is deliberately conservative. A name that gets missed is one
 * the coach types in — mildly annoying. A header that gets imported is a
 * phantom player who quietly collects minutes all season.
 */

/** Words that mean the line is structure, not a person. */
const NOISE = [
  'roster', 'team', 'club', 'league', 'division', 'season', 'coach',
  'assistant', 'manager', 'trainer', 'staff', 'parent', 'guardian',
  'contact', 'emergency', 'phone', 'email', 'address', 'name', 'player',
  'jersey', 'number', 'position', 'dob', 'birth', 'age', 'grade', 'notes',
  'total', 'page', 'printed', 'updated', 'schedule', 'practice', 'game',
  'signature', 'spring', 'fall', 'summer', 'winter', 'list', 'no', 'num',
];

/** Common position abbreviations that sit in their own column. */
const POSITIONS = [
  'gk', 'gkp', 'def', 'mid', 'fwd', 'pos', 'lb', 'rb', 'cb', 'cm', 'lm',
  'rm', 'lw', 'rw', 'st', 'cf', 'cdm', 'cam', 'd', 'm', 'f', 'g',
];

/**
 * Does this line contain a structural word anywhere in it?
 *
 * Checked against the whole line before any cleaning, because the giveaway is
 * often exactly what cleaning removes: "2026 Spring Roster" loses its year and
 * becomes a plausible two-word name, and "Coach: Charlie Burnham" is a real
 * person's name attached to a label that means they aren't a player.
 */
function isStructural(line: string): boolean {
  const words = line.toLowerCase().match(/\p{L}+/gu) ?? [];
  return words.some((w) => NOISE.includes(w));
}

const EMAIL = /\S+@\S+\.\S+/;
const PHONE = /(\+?\d[\d\-.() ]{7,}\d)/;
const DATE = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/;

/**
 * Strip the things that cling to a name on a printed roster: a leading jersey
 * number, a trailing position, surrounding punctuation.
 */
function clean(raw: string): string {
  let s = raw.trim();

  // "12 Sarah Fox" or "#12 Sarah Fox" or "12. Sarah Fox"
  s = s.replace(/^#?\s*\d{1,2}\s*[.):\-]?\s+/, '');
  // "Sarah Fox - GK" / "Sarah Fox (GK)" / "Sarah Fox, GK"
  s = s.replace(/\s*[(\-,|]\s*[A-Za-z]{1,4}\s*\)?\s*$/, '');
  // Collapse whitespace and drop stray edge punctuation.
  s = s.replace(/\s+/g, ' ').replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, '');

  return s.trim();
}

/**
 * "SARAH FOX" and "sarah fox" both become "Sarah Fox". All-caps rosters are
 * common and importing shouted names looks broken.
 */
function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => {
      if (w.length === 0) return w;
      // Preserve internal capitals people actually use: McRae, O'Neil, D'Angelo
      if (/^(mc|mac|o'|d')/i.test(w) && w.length > 2) {
        const head = w.slice(0, w[1] === "'" ? 2 : w.toLowerCase().startsWith('mac') ? 3 : 2);
        const tail = w.slice(head.length);
        return (
          head[0].toUpperCase() +
          head.slice(1).toLowerCase() +
          (tail ? tail[0].toUpperCase() + tail.slice(1).toLowerCase() : '')
        );
      }
      // Hyphenated surnames: Smith-Jones
      return w
        .split('-')
        .map((part) =>
          part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part
        )
        .join('-');
    })
    .join(' ');
}

function looksLikeName(s: string): boolean {
  if (s.length < 2 || s.length > 32) return false;
  if (EMAIL.test(s) || PHONE.test(s) || DATE.test(s)) return false;
  // Any digits left after cleaning means it was probably data, not a name.
  if (/\d/.test(s)) return false;

  const lower = s.toLowerCase();
  if (POSITIONS.includes(lower)) return false;

  const words = s.split(' ').filter(Boolean);
  if (words.length > 4) return false;
  if (words.length === 1) {
    // A single word can be a first name, but not a position code or an
    // all-caps header fragment.
    if (POSITIONS.includes(lower)) return false;
    if (s.length < 3) return false;
  }
  // Must be mostly letters.
  const letters = (s.match(/\p{L}/gu) ?? []).length;
  if (letters / s.length < 0.75) return false;

  return true;
}

/**
 * Parse OCR output into candidate names.
 * Order is preserved — printed rosters are usually alphabetical or by number,
 * and coaches recognise their own list faster in its original order.
 */
export function parseRoster(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    // Drop the whole row if any part of it is structural — a header row's
    // other columns are headers too.
    if (isStructural(line)) continue;

    // A tab- or multi-space-separated row: the name is the widest text cell.
    const cells = line.split(/\t|\s{3,}/).filter((c) => c.trim().length > 0);
    const candidates = cells.length > 1 ? cells : [line];

    for (const cell of candidates) {
      const name = clean(cell);
      if (!looksLikeName(name)) continue;
      const cased = titleCase(name);
      const key = cased.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(cased);
      // One name per line: multi-cell rows are columns of one player's data,
      // not several players.
      break;
    }
  }

  // A scan yielding more than this is almost certainly picking up noise.
  return out.slice(0, 40);
}
