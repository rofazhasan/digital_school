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
 * Generates an authentic Bangladesh Board CQ script serial number (e.g. T2608492015, R2648192305).
 * Uses cryptographic randomness to ensure high entropy and zero repetition.
 */
export const generateBoardCQSerial = (prefix = 'T', year = '26'): string => {
    // Normalize year to 2 English digits (e.g. '2026' -> '26', '২৬' -> '26', '2025' -> '25')
    const enYear = String(year || '26')
        .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
        .replace(/\D/g, '');
    const cleanYear = enYear.length >= 2 ? enYear.slice(-2) : (enYear.length === 1 ? `0${enYear}` : '26');
    const cleanPrefix = (prefix || 'T').toUpperCase().trim();

    // Use cryptographic randomness when available in browser or Node.js runtime
    let randNum: number;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const uint32Array = new Uint32Array(1);
        crypto.getRandomValues(uint32Array);
        // Generates an authentic 8-digit random integer between 10000000 and 99999999
        randNum = 10000000 + (uint32Array[0] % 90000000);
    } else {
        randNum = Math.floor(10000000 + Math.random() * 90000000);
    }

    return `${cleanPrefix}${cleanYear}${randNum}`;
};

/**
 * Increments an alphanumeric board serial number for batch printing copies.
 */
export const incrementBoardSerial = (serial: string, offset: number): string => {
    const match = serial.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return `${serial}-${offset}`;
    const prefix = match[1];
    const numStr = match[2];
    const nextNum = (BigInt(numStr) + BigInt(offset)).toString();
    return `${prefix}${nextNum.padStart(numStr.length, '0')}`;
};

/**
 * Converts index (0, 1, 2...) to Bengali alphabets (ক, খ, গ, ঘ...).
 */
export const toBengaliAlphabets = (index: number): string => {
    const alphabets = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ', 'ড়', 'ঢ়', 'য়'];
    return alphabets[index] || String.fromCharCode(0x0995 + index);
};

/**
 * Converts index (1, 2, 3...) to Roman Numerals (I, II, III...).
 */
export const toRoman = (num: number): string => {
    const romanMap: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, symbol] of romanMap) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
};

export {
    toEnglishNumerals,
    toggleNumerals,
    detectAnswerFormat,
    smartConvert,
    smartConvertAsync,
    translateOnline,
    translateEnglishToBangla,
    translateBanglaToEnglish,
    convertEnglishToBanglaPhonetic,
    convertBanglaToEnglishPhonetic,
    FORMAT_HINT_CONFIGS
} from './banglaConverter';
export type { AnswerFormatHint, FormatHintConfig, ConversionMode } from './banglaConverter';

