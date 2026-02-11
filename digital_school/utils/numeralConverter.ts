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
 * Formats a date string to a more readable Bengali format with Bengali numerals.
 */
export const formatBengaliDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';
    // Basic conversion for now, assuming dateStr might already have some text
    return toBengaliNumerals(dateStr);
};
