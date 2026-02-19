/**
 * Converts Arabic numerals (0-9) in a string or number to Bengali numerals (০-৯).
 */
export const toBengaliNumerals = (input: string | number | undefined | null): string => {
    if (input === undefined || input === null) return '';
    const str = String(input);
    const bengaliNumerals: { [key: string]: string } = {
        '0': '০',
        '1': '১',
        '2': '২',
        '3': '৩',
        '4': '৪',
        '5': '৫',
        '6': '৬',
        '7': '৭',
        '8': '৮',
        '9': '৯',
    };
    return str.replace(/[0-9]/g, (digit) => bengaliNumerals[digit]);
};

/**
 * Formats a duration in minutes to a Bengali string (e.g., "১ ঘণ্টা ২০ মিনিট" or "৪০ মিনিট").
 */
export const formatBengaliDuration = (minutes: number | string | undefined | null): string => {
    if (minutes === undefined || minutes === null || minutes === '') return '';
    const mins = Number(minutes);
    if (isNaN(mins)) return String(minutes);

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    const parts = [];
    if (hours > 0) {
        parts.push(`${toBengaliNumerals(hours)} ঘণ্টা`);
    }
    if (remainingMins > 0 || hours === 0) {
        parts.push(`${toBengaliNumerals(remainingMins)} মিনিট`);
    }

    return parts.join(' ');
};

/**
 * Converts index (0, 1, 2...) to Bengali alphabets (ক, খ, গ, ঘ...).
 */
export const toBengaliAlphabets = (index: number): string => {
    const alphabets = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ', 'ড়', 'ঢ়', 'য়'];
    return alphabets[index] || String.fromCharCode(0x0995 + index);
};
