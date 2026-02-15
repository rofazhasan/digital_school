/**
 * Inline FBD Parser
 * Extracts and parses FBD diagrams embedded in text using ## ## delimiters
 * Similar to how $$ $$ works for LaTeX
 */

import type { FBDDiagram } from './types';
import { parseExcelFBD } from './excel-parser';
import { DIAGRAM_PRESETS, hasPreset, getPreset, parseCombination } from '../diagrams/index';

/**
 * Extract FBD blocks from text
 * Format: ##PRESET:incline(30,10,true)##
 * or: ##P1(300,200) | F1@P1(80,0,mg,weight)##
 * 
 * Returns: { text: string, fbds: FBDDiagram[] }
 */
export function extractInlineFBDs(text: string): {
    cleanText: string;
    fbds: FBDDiagram[];
    placeholders: string[];
} {
    if (!text) {
        return { cleanText: '', fbds: [], placeholders: [] };
    }

    const fbds: FBDDiagram[] = [];
    const placeholders: string[] = [];
    let cleanText = text;
    let counter = 0;

    // Match ##...## blocks
    const fbdRegex = /##(.*?)##/g;
    const matches = text.matchAll(fbdRegex);

    for (const match of matches) {
        const fbdText = match[1].trim();
        const placeholder = `__FBD_${counter}__`;

        try {
            // Check if it's a combination syntax
            if (fbdText.startsWith('SERIES:') || fbdText.startsWith('PARALLEL:') ||
                fbdText.startsWith('GRID:') || fbdText.startsWith('COMPARE:')) {
                const diagram = parseCombination(fbdText);
                if (diagram) {
                    diagram.id = `inline-combo-${counter}`;
                    fbds.push(diagram);
                    placeholders.push(placeholder);
                    cleanText = cleanText.replace(match[0], placeholder);
                    counter++;
                    continue;
                }
            }

            // Standard FBD parsing
            const diagram = parseExcelFBD(fbdText, `inline-fbd-${counter}`);
            if (diagram) {
                fbds.push(diagram);
                placeholders.push(placeholder);

                // Replace FBD block with placeholder
                cleanText = cleanText.replace(match[0], placeholder);
                counter++;
            }
        } catch (error) {
            console.error('Failed to parse inline FBD:', fbdText, error);
            // Keep the original text if parsing fails
        }
    }

    return { cleanText, fbds, placeholders };
}

/**
 * Process question data to extract inline FBDs
 * Checks questionText, options, modelAnswer, subQuestions, etc.
 */
export function processQuestionWithInlineFBDs(questionData: any): {
    processedData: any;
    fbds: FBDDiagram[];
} {
    const allFBDs: FBDDiagram[] = [];
    const processedData = { ...questionData };

    // Process question text
    if (questionData.questionText) {
        const result = extractInlineFBDs(questionData.questionText);
        processedData.questionText = result.cleanText;
        allFBDs.push(...result.fbds);
    }

    // Process model answer
    if (questionData.modelAnswer) {
        const result = extractInlineFBDs(questionData.modelAnswer);
        processedData.modelAnswer = result.cleanText;
        allFBDs.push(...result.fbds);
    }

    // Process MCQ options
    if (questionData.options && Array.isArray(questionData.options)) {
        processedData.options = questionData.options.map((opt: any) => {
            const optResult = extractInlineFBDs(opt.text || '');
            const expResult = extractInlineFBDs(opt.explanation || '');

            allFBDs.push(...optResult.fbds, ...expResult.fbds);

            return {
                ...opt,
                text: optResult.cleanText,
                explanation: expResult.cleanText,
            };
        });
    }

    // Process CQ sub-questions
    if (questionData.subQuestions && Array.isArray(questionData.subQuestions)) {
        processedData.subQuestions = questionData.subQuestions.map((sq: any) => {
            const qResult = extractInlineFBDs(sq.question || '');
            const aResult = extractInlineFBDs(sq.modelAnswer || '');

            allFBDs.push(...qResult.fbds, ...aResult.fbds);

            return {
                ...sq,
                question: qResult.cleanText,
                modelAnswer: aResult.cleanText,
            };
        });
    }

    // Store all FBDs in the fbd field (as array if multiple, single if one)
    if (allFBDs.length > 0) {
        processedData.fbd = allFBDs.length === 1 ? allFBDs[0] : allFBDs;
    }

    return { processedData, fbds: allFBDs };
}

/**
 * Render text with FBD placeholders replaced by actual diagrams
 * Used in frontend to display questions with embedded FBDs
 */
export function renderTextWithFBDs(
    text: string,
    fbds: FBDDiagram[]
): Array<{ type: 'text' | 'fbd'; content: string | FBDDiagram }> {
    const parts: Array<{ type: 'text' | 'fbd'; content: string | FBDDiagram }> = [];

    if (!text) return parts;

    let currentText = text;
    let fbdIndex = 0;

    // Split by FBD placeholders
    const placeholderRegex = /__FBD_(\d+)__/g;
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(text)) !== null) {
        // Add text before placeholder
        if (match.index > lastIndex) {
            const textContent = text.substring(lastIndex, match.index);
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }

        // Add FBD
        const index = parseInt(match[1]);
        if (fbds[index]) {
            parts.push({ type: 'fbd', content: fbds[index] });
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        const textContent = text.substring(lastIndex);
        if (textContent) {
            parts.push({ type: 'text', content: textContent });
        }
    }

    // If no placeholders found, return the whole text
    if (parts.length === 0 && text) {
        parts.push({ type: 'text', content: text });
    }

    return parts;
}

/**
 * Check if text contains FBD blocks
 */
export function hasInlineFBDs(text: string): boolean {
    if (!text) return false;
    return /##.*?##/.test(text);
}

/**
 * Validate all inline FBDs in text
 */
export function validateInlineFBDs(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text) return { valid: true, errors: [] };

    const fbdRegex = /##(.*?)##/g;
    const matches = text.matchAll(fbdRegex);

    for (const match of matches) {
        const fbdText = match[1].trim();
        try {
            const diagram = parseExcelFBD(fbdText, 'validation');
            if (!diagram) {
                errors.push(`Invalid FBD: ${fbdText}`);
            }
        } catch (error) {
            errors.push(`FBD parse error: ${fbdText} - ${(error as Error).message}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
