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

/**
 * Safely parses a number from a value.
 * Handles strings with commas, extra characters, and empty values.
 */
export const n = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    // Extract first number found in string (handles cases like "10 marks" or "5.5")
    const match = String(val).match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
}

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
