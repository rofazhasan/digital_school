/**
 * Shared utility functions for Excel and JSON parsing in the Question Bank.
 * These helpers are used by both the bulk-upload API routes and specialized parsers.
 */

/**
 * Safely converts a value to a trimmed string.
 * Handles null, undefined, and non-string types.
 */
export const s = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
}

const UNICODE_FRACTIONS: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅕': 0.2,
    '⅖': 0.4,
    '⅗': 0.6,
    '⅘': 0.8,
    '⅙': 1 / 6,
    '⅚': 5 / 6,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875
};

const BN_TO_EN_MAP: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export const toEnglishDigits = (str: string): string => {
    return str.replace(/[\u09E6-\u09EF]/g, (d) => BN_TO_EN_MAP[d] || d);
};

/**
 * Safely parses a number from a value.
 * Robustly handles standard decimals (0.5, 0.25), fractions (1/2, 3/4),
 * mixed fractions (1 1/2), unicode vulgar fractions (½, ¼), Bengali numerals (০.৫, ১/২),
 * and strings containing marks suffixes (e.g. "0.5 marks", "[0.5 M]").
 */
export const n = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    let str = String(val).trim();
    if (!str) return 0;

    // Convert Bengali numerals to English numerals
    str = toEnglishDigits(str);

    // Replace unicode vulgar fractions
    for (const [frac, dec] of Object.entries(UNICODE_FRACTIONS)) {
        if (str.includes(frac)) {
            const mixedMatch = str.match(new RegExp(`(\\d+)\\s*${frac}`));
            if (mixedMatch) {
                return parseFloat(mixedMatch[1]) + dec;
            }
            return dec;
        }
    }

    // Check for mixed fraction like "1 1/2", "1-1/2", "2 3/4"
    const mixedMatch = str.match(/(\d+)\s*[-_ ]\s*(\d+)\s*\/\s*(\d+)/);
    if (mixedMatch) {
        const whole = parseFloat(mixedMatch[1]);
        const num = parseFloat(mixedMatch[2]);
        const den = parseFloat(mixedMatch[3]);
        if (den !== 0) {
            return whole + (num / den);
        }
    }

    // Check for simple fraction like "1/2", "3/4", "1 / 4", "[1/2 M]"
    const fracMatch = str.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (fracMatch) {
        const num = parseFloat(fracMatch[1]);
        const den = parseFloat(fracMatch[2]);
        if (den !== 0) {
            return num / den;
        }
    }

    // Check for regular decimal or integer, e.g. "0.5", "10", "1.25 marks", ".5"
    const decMatch = str.match(/-?(?:\d+\.?\d*|\.\d+)/);
    if (decMatch) {
        const parsed = parseFloat(decMatch[0]);
        return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
};

/**
 * Retrieves a value from an object using multiple possible keys.
 * Useful for handling varying Excel header names.
 */
export const getValue = (row: any, keys: string[]): any => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
        }
    }
    return '';
}
