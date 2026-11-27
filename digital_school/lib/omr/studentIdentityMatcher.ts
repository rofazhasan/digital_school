/**
 * Strict Numeric-Only & Fault-Tolerant Student Identity Matcher (Roll + Registration)
 *
 * Guarantees:
 * 1. Student Roll & Registration are ALWAYS normalized to digits-only (Bengali ০–৯ → 0–9, strips non-digits).
 * 2. If a student makes a mistake in Roll BUT Registration is correct → auto-recovers student via Registration.
 * 3. If a student makes a mistake in Registration BUT Roll is correct → auto-recovers student via Roll.
 * 4. If Roll is off by 1 single digit (Hamming distance = 1) and uniquely matches 1 student in the exam's class
 *    → recovers with `FUZZY_1DIGIT_ROLL` and flags for quick examiner verification.
 */

export interface RosterStudentRecord {
  id: string;
  roll?: string | null;
  registrationNo?: string | null;
  classId?: string | null;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

export type StudentMatchMethod =
  | 'EXACT_BOTH'
  | 'EXACT_ROLL'
  | 'RECOVERED_BY_REG'
  | 'RECOVERED_BY_ROLL'
  | 'FUZZY_1DIGIT_ROLL'
  | 'UNMATCHED';

export interface StudentMatchResult<T extends RosterStudentRecord = RosterStudentRecord> {
  student: T | null;
  matchMethod: StudentMatchMethod;
  sanitizedRoll: string;
  sanitizedReg: string;
  hadNonNumericRoll: boolean;
  hadNonNumericReg: boolean;
  note?: string;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/**
 * Converts Bengali numerals to ASCII digits and strips all non-numeric characters.
 */
export function sanitizeNumericId(raw?: string | number | null): {
  digits: string;
  stripped: string;
  hadNonNumeric: boolean;
} {
  if (raw === undefined || raw === null) {
    return { digits: '', stripped: '', hadNonNumeric: false };
  }
  const str = String(raw).trim();
  if (!str) return { digits: '', stripped: '', hadNonNumeric: false };

  const ascii = str.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const digits = ascii.replace(/\D/g, '');
  const hadNonNumeric = digits.length !== ascii.length;
  const stripped = digits.replace(/^0+/, '') || (digits.length > 0 ? '0' : '');
  return { digits, stripped, hadNonNumeric };
}

function hammingDistanceEqualLen(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diff++;
      if (diff > 2) return diff;
    }
  }
  return diff;
}

export interface RosterIndex<T extends RosterStudentRecord> {
  byRollExact: Map<string, T>;
  byRollStripped: Map<string, T>;
  byRegExact: Map<string, T>;
  byRegStripped: Map<string, T>;
  all: Array<{ student: T; rollDigits: string; rollStripped: string; regDigits: string }>;
}

export function buildRosterIndex<T extends RosterStudentRecord>(students: T[]): RosterIndex<T> {
  const byRollExact = new Map<string, T>();
  const byRollStripped = new Map<string, T>();
  const byRegExact = new Map<string, T>();
  const byRegStripped = new Map<string, T>();
  const all: Array<{ student: T; rollDigits: string; rollStripped: string; regDigits: string }> = [];

  for (const sp of students) {
    const r = sanitizeNumericId(sp.roll);
    const reg = sanitizeNumericId(sp.registrationNo);
    if (r.digits) {
      byRollExact.set(r.digits, sp);
      if (r.stripped) byRollStripped.set(r.stripped, sp);
    }
    if (reg.digits) {
      byRegExact.set(reg.digits, sp);
      if (reg.stripped) byRegStripped.set(reg.stripped, sp);
    }
    all.push({ student: sp, rollDigits: r.digits, rollStripped: r.stripped, regDigits: reg.digits });
  }

  return { byRollExact, byRollStripped, byRegExact, byRegStripped, all };
}

export function matchStudentByRollOrReg<T extends RosterStudentRecord>(
  index: RosterIndex<T>,
  rawRoll?: string | null,
  rawReg?: string | null
): StudentMatchResult<T> {
  const rollInfo = sanitizeNumericId(rawRoll);
  const regInfo = sanitizeNumericId(rawReg);

  const rollMatch =
    (rollInfo.digits ? index.byRollExact.get(rollInfo.digits) : undefined) ||
    (rollInfo.stripped ? index.byRollStripped.get(rollInfo.stripped) : undefined) ||
    null;

  const regMatch =
    (regInfo.digits ? index.byRegExact.get(regInfo.digits) : undefined) ||
    (regInfo.stripped ? index.byRegStripped.get(regInfo.stripped) : undefined) ||
    null;

  // Tier 1: Both Roll & Registration match the same student
  if (rollMatch && regMatch && rollMatch.id === regMatch.id) {
    return {
      student: rollMatch,
      matchMethod: 'EXACT_BOTH',
      sanitizedRoll: sanitizeNumericId(rollMatch.roll).digits || rollInfo.digits,
      sanitizedReg: sanitizeNumericId(rollMatch.registrationNo).digits || regInfo.digits,
      hadNonNumericRoll: rollInfo.hadNonNumeric,
      hadNonNumericReg: regInfo.hadNonNumeric,
    };
  }

  // Tier 2A: Roll failed/wrong, Registration matched → Auto-recover student via Registration!
  if (!rollMatch && regMatch) {
    const trueRoll = sanitizeNumericId(regMatch.roll).digits || rollInfo.digits;
    return {
      student: regMatch,
      matchMethod: 'RECOVERED_BY_REG',
      sanitizedRoll: trueRoll,
      sanitizedReg: regInfo.digits,
      hadNonNumericRoll: rollInfo.hadNonNumeric,
      hadNonNumericReg: regInfo.hadNonNumeric,
      note: `Roll '${rollInfo.digits || 'blank'}' auto-corrected to '${trueRoll}' via Registration '${regInfo.digits}'.`,
    };
  }

  // Tier 2B: Registration failed/wrong (or blank), Roll matched → Auto-recover student via Roll!
  if (rollMatch && !regMatch) {
    const trueReg = sanitizeNumericId(rollMatch.registrationNo).digits || regInfo.digits;
    const isRegMistake = Boolean(regInfo.digits && trueReg && regInfo.digits !== trueReg);
    return {
      student: rollMatch,
      matchMethod: isRegMistake ? 'RECOVERED_BY_ROLL' : 'EXACT_ROLL',
      sanitizedRoll: sanitizeNumericId(rollMatch.roll).digits || rollInfo.digits,
      sanitizedReg: trueReg,
      hadNonNumericRoll: rollInfo.hadNonNumeric,
      hadNonNumericReg: regInfo.hadNonNumeric,
      note: isRegMistake
        ? `Registration '${regInfo.digits}' auto-corrected to '${trueReg}' via Roll '${rollInfo.digits}'.`
        : undefined,
    };
  }

  // Tier 2C: Both matched DIFFERENT students (rare bubble collision) → prefer Registration (10-digit unique ID)
  if (rollMatch && regMatch && rollMatch.id !== regMatch.id) {
    const trueRoll = sanitizeNumericId(regMatch.roll).digits || rollInfo.digits;
    return {
      student: regMatch,
      matchMethod: 'RECOVERED_BY_REG',
      sanitizedRoll: trueRoll,
      sanitizedReg: regInfo.digits,
      hadNonNumericRoll: rollInfo.hadNonNumeric,
      hadNonNumericReg: regInfo.hadNonNumeric,
      note: `Roll '${rollInfo.digits}' conflicted with Registration '${regInfo.digits}'; resolved to '${trueRoll}' via unique Registration.`,
    };
  }

  // Tier 3: Unique 1-digit Hamming-distance recovery on Roll (>= 4 digits) within class roster
  if (rollInfo.digits.length >= 4) {
    const fuzzyHits: T[] = [];
    for (const item of index.all) {
      if (!item.rollDigits) continue;
      const maxLen = Math.max(rollInfo.digits.length, item.rollDigits.length);
      const a = rollInfo.digits.padStart(maxLen, '0');
      const b = item.rollDigits.padStart(maxLen, '0');
      if (hammingDistanceEqualLen(a, b) === 1) {
        fuzzyHits.push(item.student);
      }
    }
    if (fuzzyHits.length === 1) {
      const hit = fuzzyHits[0];
      const trueRoll = sanitizeNumericId(hit.roll).digits || rollInfo.digits;
      return {
        student: hit,
        matchMethod: 'FUZZY_1DIGIT_ROLL',
        sanitizedRoll: trueRoll,
        sanitizedReg: sanitizeNumericId(hit.registrationNo).digits || regInfo.digits,
        hadNonNumericRoll: rollInfo.hadNonNumeric,
        hadNonNumericReg: regInfo.hadNonNumeric,
        note: `1-digit roll typo '${rollInfo.digits}' uniquely matched to '${trueRoll}'.`,
      };
    }
  }

  return {
    student: null,
    matchMethod: 'UNMATCHED',
    sanitizedRoll: rollInfo.digits,
    sanitizedReg: regInfo.digits,
    hadNonNumericRoll: rollInfo.hadNonNumeric,
    hadNonNumericReg: regInfo.hadNonNumeric,
  };
}
