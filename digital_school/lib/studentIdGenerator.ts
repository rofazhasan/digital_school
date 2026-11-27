import prismadb from '@/lib/db';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

function toAsciiDigits(raw?: string | number | null): string {
  if (raw === undefined || raw === null) return '';
  return String(raw)
    .trim()
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/\D/g, '');
}

/**
 * Normalizes any numeric roll to strictly 4 digits (e.g. "1" -> "0001", "25" -> "0025", "1042" -> "1042").
 * Returns null if input has no valid digits or exceeds 4 digits.
 */
export function normalizeTo4DigitRoll(raw?: string | number | null): string | null {
  const digits = toAsciiDigits(raw);
  if (!digits) return null;
  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num <= 0 || num > 9999) return null;
  return String(num).padStart(4, '0');
}

/**
 * Normalizes any numeric registration to strictly 6 digits (100000..999999 or 000001..999999).
 */
export function normalizeTo6DigitReg(raw?: string | number | null): string | null {
  const digits = toAsciiDigits(raw);
  if (!digits || digits.length > 6) return null;
  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num <= 0 || num > 999999) return null;
  return String(num).padStart(6, '0');
}

/**
 * Generates the next unique 4-digit numeric roll (0001..9999) for a class (or globally).
 */
export async function generateNext4DigitRoll(classId?: string | null, preferred?: string | number | null): Promise<string> {
  const pref = normalizeTo4DigitRoll(preferred);
  const existing = await prismadb.studentProfile.findMany({
    where: classId ? { classId } : undefined,
    select: { roll: true },
  });
  const used = new Set(existing.map((e) => e.roll));

  if (pref && !used.has(pref)) {
    return pref;
  }

  let maxNum = 1000;
  for (const r of used) {
    if (/^\d{4}$/.test(r)) {
      const n = parseInt(r, 10);
      if (n > maxNum && n < 9999) maxNum = n;
    }
  }

  for (let cand = maxNum + 1; cand <= 9999; cand++) {
    const s = String(cand).padStart(4, '0');
    if (!used.has(s)) return s;
  }
  for (let cand = 1; cand <= 9999; cand++) {
    const s = String(cand).padStart(4, '0');
    if (!used.has(s)) return s;
  }
  return String(Math.floor(1000 + Math.random() * 8999));
}

/**
 * Generates the next globally unique 6-digit numeric registration number (e.g. 260001..999999).
 */
export async function generateNext6DigitReg(preferred?: string | number | null): Promise<string> {
  const pref = normalizeTo6DigitReg(preferred);
  const existing = await prismadb.studentProfile.findMany({
    select: { registrationNo: true },
  });
  const used = new Set(existing.map((e) => e.registrationNo));

  if (pref && !used.has(pref)) {
    return pref;
  }

  const yrPrefix = Number(String(new Date().getFullYear()).slice(-2)) * 10000; // e.g. 260000
  let maxNum = yrPrefix;
  for (const r of used) {
    if (/^\d{6}$/.test(r)) {
      const n = parseInt(r, 10);
      if (n > maxNum && n < 999999) maxNum = n;
    }
  }

  for (let cand = maxNum + 1; cand <= 999999; cand++) {
    const s = String(cand).padStart(6, '0');
    if (!used.has(s)) return s;
  }
  return String(Math.floor(100000 + Math.random() * 899999));
}
