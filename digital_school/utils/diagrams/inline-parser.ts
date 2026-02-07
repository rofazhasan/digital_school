
import { getPreset, parseCombination } from './index';

/**
 * Parses text and replaces diagram syntax with SVG strings.
 * Supported syntax:
 * 1. ##PRESET:name(arg1,arg2)##
 * 2. ##COMBINE:MODE[args]##
 */
export function parseDiagramsInText(text: string): string {
    if (!text) return '';

    // 1. Handle Combinations first (as they might contain parentheses or similar chars)
    // Syntax: ##COMBINE:MODE[args]##
    // We use a regex that matches the tag boundaries.
    text = text.replace(/##COMBINE:(.*?)\[(.*?)\]##/g, (match, mode, args) => {
        try {
            // Reconstruct the syntax expected by parseCombination
            // mode is "SERIES", args is "spring,pendulum"
            // parseCombination expects "SERIES:spring,pendulum"
            const syntax = `${mode}:${args}`;
            const diagram = parseCombination(syntax);
            if (diagram && diagram.customSVG) {
                return diagram.customSVG;
            }
            return `<span class="text-red-500 font-mono text-xs">Error parsing combination: ${mode}</span>`;
        } catch (e) {
            console.error('Error parsing combination:', e);
            return match; // Return original on error
        }
    });

    // 2. Handle Individual Presets
    // Syntax: ##PRESET:name(arg1,arg2)## or ##PRESET:name##
    text = text.replace(/##PRESET:([a-zA-Z0-9-]+)(?:\((.*?)\))?##/g, (match, name, argsStr) => {
        try {
            const presetFn = getPreset(name);
            if (!presetFn) return `<span class="text-red-500 font-mono text-xs">Unknown preset: ${name}</span>`;

            const args = argsStr ? argsStr.split(',').map((a: string) => {
                const val = a.trim();
                // Try to parse numbers/booleans
                if (val === 'true') return true;
                if (val === 'false') return false;
                if (!isNaN(Number(val)) && val !== '') return Number(val);
                return val;
            }) : [];

            // Generate unique ID
            const id = `diagram-${name}-${Math.random().toString(36).substr(2, 9)}`;
            const diagram = presetFn(id, ...args);

            if (diagram.customSVG) {
                return diagram.customSVG;
            }
            return match;
        } catch (e) {
            console.error('Error parsing preset:', e);
            return match;
        }
    });

    return text;
}
