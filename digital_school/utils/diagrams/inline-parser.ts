import { getPreset, parseCombination } from './index';
import { parseExcelFBD } from '../fbd/excel-parser';
import { renderFBDToSVG } from '../fbd/svg-renderer';

const DIAGRAM_BLOCK_REGEX = /##(.*?)##/g;
const SIZE_REGEX = /\[size:(small|medium|large|tiny)\]/;
const COMBINE_REGEX = /^COMBINE:(.*?)\[(.*?)\]$/;

/**
 * Parses text and replaces diagram syntax with SVG strings.
 * Unified parser for:
 * 1. ##COMBINE:MODE[args]##
 * 2. ##PRESET:name(args)## (New System)
 * 3. ##P1...## (Legacy FBD Excel Format)
 */
export function parseDiagramsInText(text: string): string {
    if (!text) return '';

    // Use pre-compiled regex for O(n) scanning
    return text.replace(DIAGRAM_BLOCK_REGEX, (match, content) => {
        let trimmedContent = content.trim();

        // Check for size qualifier: [size:small], [size:medium], [size:large]
        let sizeStyle = '';
        const sizeMatch = trimmedContent.match(SIZE_REGEX);
        if (sizeMatch) {
            const size = sizeMatch[1];
            trimmedContent = trimmedContent.replace(sizeMatch[0], '').trim();
            if (size === 'tiny') sizeStyle = 'max-width: 80px;';
            else if (size === 'small') sizeStyle = 'max-width: 150px;';
            else if (size === 'medium') sizeStyle = 'max-width: 300px;';
            else if (size === 'large') sizeStyle = 'max-width: 500px;';
        }

        try {
            // 1. Handle Combinations
            if (trimmedContent.startsWith('COMBINE:')) {
                const parts = trimmedContent.split('|').map((p: string) => p.trim());
                const combinePart = parts[0];
                const fbdParts = parts.slice(1).join(' | ');

                const combineMatch = combinePart.match(COMBINE_REGEX);
                if (combineMatch) {
                    const [, mode, args] = combineMatch;
                    const syntax = `${mode}:${args}`;
                    let diagram = parseCombination(syntax);

                    if (diagram && fbdParts) {
                        const extraFBD = parseExcelFBD(fbdParts, `hybrid-combine-${Math.random().toString(36).substr(2, 5)}`);
                        if (extraFBD) {
                            diagram.points = [...diagram.points, ...extraFBD.points];
                            diagram.forces = [...diagram.forces, ...extraFBD.forces];
                            diagram.moments = [...(diagram.moments || []), ...(extraFBD.moments || [])];
                        }
                    }

                    if (diagram && diagram.customSVG) {
                        if (!fbdParts) {
                            let svg = diagram.customSVG;
                            if (!svg.trim().startsWith('<svg')) {
                                svg = `<svg width="${diagram.width}" height="${diagram.height}" viewBox="0 0 ${diagram.width} ${diagram.height}" xmlns="http://www.w3.org/2000/svg">${diagram.customSVG}</svg>`;
                            }
                            // Inject sizeStyle if present
                            if (sizeStyle) svg = svg.replace('<svg', `<svg style="${sizeStyle}"`);
                            return svg;
                        }
                        return renderFBDToSVG(diagram);
                    }
                }
            }

            // 2. Handle Presets
            if (trimmedContent.startsWith('PRESET:')) {
                const parts = trimmedContent.split('|').map((p: string) => p.trim());
                const presetPart = parts[0];
                const fbdParts = parts.slice(1).join(' | ');

                const presetMatch = presetPart.match(/^PRESET:([a-zA-Z0-9-_]+)(?:\((.*?)\))?$/);
                if (presetMatch) {
                    const [, name, argsStr] = presetMatch;
                    const presetFn = getPreset(name);

                    if (presetFn) {
                        const args = argsStr ? argsStr.split(',').map((a: string) => {
                            let val = a.trim();

                            // Detect and strip named parameters like "radius=5" or "angle:30"
                            if (val.includes('=') || val.includes(':')) {
                                const parts = val.split(/[=:]/);
                                val = parts[parts.length - 1].trim();
                            }

                            if (val === 'true') return true;
                            if (val === 'false') return false;

                            // Clean numeric strings (remove stray units or non-numeric baggage)
                            const numericVal = parseFloat(val);
                            if (!isNaN(numericVal) && String(numericVal) === val.replace(/[^0-9.-]/g, '')) {
                                return numericVal;
                            }
                            return val;
                        }) : [];

                        const id = `diagram-${name}-${Math.random().toString(36).substr(2, 9)}`;
                        let diagram = presetFn(id, ...args);

                        if (fbdParts) {
                            const extraFBD = parseExcelFBD(fbdParts, `hybrid-${id}`);
                            if (extraFBD) {
                                diagram.points = [...diagram.points, ...extraFBD.points];
                                diagram.forces = [...diagram.forces, ...extraFBD.forces];
                                diagram.moments = [...(diagram.moments || []), ...(extraFBD.moments || [])];
                            }
                        }

                        if (diagram.customSVG && !fbdParts) {
                            let svg = diagram.customSVG;
                            if (!svg.trim().startsWith('<svg')) {
                                svg = `<svg width="${diagram.width}" height="${diagram.height}" viewBox="0 0 ${diagram.width} ${diagram.height}" xmlns="http://www.w3.org/2000/svg">${diagram.customSVG}</svg>`;
                            }
                            // Inject sizeStyle if present
                            if (sizeStyle) svg = svg.replace('<svg', `<svg style="${sizeStyle}"`);
                            return svg;
                        }
                        return renderFBDToSVG(diagram);
                    }
                }
            }

            // 3. Fallback: Try Legacy/Excel FBD Parsing
            const legacyDiagram = parseExcelFBD(trimmedContent, `legacy-${Math.random().toString(36).substr(2, 5)}`);
            if (legacyDiagram) {
                if (legacyDiagram.customSVG) {
                    let svg = legacyDiagram.customSVG;
                    if (sizeStyle) svg = svg.replace('<svg', `<svg style="${sizeStyle}"`);
                    return svg;
                }
                return renderFBDToSVG(legacyDiagram);
            }

            return `<span class="text-red-500 font-mono text-xs">Error parsing diagram</span>`;

        } catch (e) {
            console.error('Error parsing diagram block:', trimmedContent, e);
            return match;
        }
    });
}
