"use client";

import { MathJax } from "better-react-mathjax";
import React, { useState, useEffect, useMemo } from "react";
import { cleanupMath } from "@/lib/utils";

declare global {
    interface Window {
        MathJax?: {
            typesetPromise: (elements: HTMLElement[]) => Promise<void>;
        };
    }
}

interface UniversalMathJaxProps {
    children: React.ReactNode;
    inline?: boolean;
    dynamic?: boolean;
}

// Module-level SVG cache — persists across renders for the entire session
const globalSvgCache: Record<string, string> = {};

function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Extract \chemfig{} blocks and replace with:
 *   - Cached inline SVG (if already rendered before)
 *   - Temporary hidden iframe (first render; will postMessage the SVG back)
 */
function processChemfig(text: string, instanceId: string): { text: string, hasChemfig: boolean, formulaMap: Record<string, string> } {
    if (!text.includes('\\chemfig') && !text.includes('\\tikz')) return { text, hasChemfig: false, formulaMap: {} };

    let result = '';
    let i = 0;
    let hasChemfig = false;
    let chemfigIndex = 0;
    const formulaMap: Record<string, string> = {};

    while (i < text.length) {
        const chemIdx = text.indexOf('\\chemfig', i);
        const tikzIdx = text.indexOf('\\tikz', i);
        
        let idx = -1;
        let cmdLen = 0;
        
        if (chemIdx !== -1 && (tikzIdx === -1 || chemIdx < tikzIdx)) {
            idx = chemIdx; cmdLen = 8;
        } else if (tikzIdx !== -1) {
            idx = tikzIdx; cmdLen = 5;
        }

        if (idx === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, idx);

        const braceStart = text.indexOf('{', idx);
        if (braceStart === -1) {
            result += text.slice(idx, idx + cmdLen);
            i = idx + cmdLen;
            continue;
        }

        let braceCount = 1;
        let j = braceStart + 1;
        while (j < text.length && braceCount > 0) {
            if (text[j] === '{') braceCount++;
            else if (text[j] === '}') braceCount--;
            j++;
        }

        if (braceCount === 0) {
            hasChemfig = true;
            const chemfigContent = text.slice(idx, j);
            const chemfigHash = hashString(chemfigContent);
            const chemfigId = `chemfig-${instanceId}-${chemfigIndex++}`;

            // Strip surrounding math delimiters if chemfig was mistakenly wrapped in them
            // We use a more robust regex approach here to handle optional whitespace
            const openDelims = ['\\$\\$', '\\$', '\\\\\\[', '\\\\\\('];
            const closeDelims = ['\\$\\$', '\\$', '\\\\\\]', '\\\\\\)'];
            
            let stripped = false;
            for (let d = 0; d < openDelims.length; d++) {
                const open = openDelims[d];
                const close = closeDelims[d];
                
                const openRegex = new RegExp(`${open}\\s*$`);
                const closeRegex = new RegExp(`^\\s*${close}`);
                
                if (openRegex.test(result) && closeRegex.test(text.slice(j))) {
                    result = result.replace(openRegex, '');
                    const closeMatch = text.slice(j).match(closeRegex);
                    if (closeMatch) j += closeMatch[0].length;
                    stripped = true;
                    break;
                }
            }

            // Check if we have this in local storage for "Zero Delay"
            if (!globalSvgCache[chemfigHash]) {
                try {
                    const saved = localStorage.getItem(`chemfig-svg-${chemfigHash}`);
                    if (saved) globalSvgCache[chemfigHash] = saved;
                } catch (e) {}
            }

            if (globalSvgCache[chemfigHash]) {
                // If it's too large, it might be an error message
                if (globalSvgCache[chemfigHash].length > 50000) {
                    result += `<span class="chem-fallback" data-hash="${chemfigHash}">$${chemfigContent}$</span>`;
                } else {
                    result += `<span class="chemfig-inline" data-hash="${chemfigHash}">${globalSvgCache[chemfigHash]}</span>`;
                }
            } else {
                // Placeholder that will be replaced by the iframe rendering engine
                result += `<span id="${chemfigId}" class="chemfig-placeholder" data-chem="${encodeURIComponent(chemfigContent)}" data-hash="${chemfigHash}" style="display:inline-block; vertical-align:middle; min-width:40px; min-height:40px;"></span>`;
                formulaMap[chemfigId] = chemfigContent;
            }
            i = j;
        } else {
            result += text.slice(idx, idx + cmdLen);
            i = idx + cmdLen;
        }
    }

    return { text: result, hasChemfig, formulaMap };
}

export function UniversalMathJax({ children, inline, dynamic }: UniversalMathJaxProps) {
    const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));
    const [cacheVersion, setCacheVersion] = useState(0);

    const rawText = typeof children === "string" ? children : "";
    const cleanText = cleanupMath(rawText);

    const { text: processedText, hasChemfig, formulaMap } = useMemo(() => 
        processChemfig(cleanText, instanceId), 
        [cleanText, instanceId, cacheVersion]
    );

    useEffect(() => {
        if (!hasChemfig) return;

        const handleMessage = (e: MessageEvent) => {
            if (!e.data || e.data.type !== 'resize-chemfig') return;

            // Save SVG to cache and trigger re-render (swap iframe → inline SVG)
            if (e.data.hash && e.data.svgContent && !globalSvgCache[e.data.hash]) {
                globalSvgCache[e.data.hash] = e.data.svgContent;
                // Persistent cache to LocalStorage for "Zero Delay" on next visit
                try {
                    localStorage.setItem(`chemfig-svg-${e.data.hash}`, e.data.svgContent);
                } catch (err) {}
                setCacheVersion(v => v + 1);
            }

            // Fallback: If rendering failed or is taking too long (signal from iframe)
            if ((e.data.failed || e.data.slow) && e.data.hash) {
                const rawChem = e.data.rawChem || '';
                // NEW ALGORITHM: Syntax-aware Chemfig to mhchem converter
                let formula = '';
                
                // Special case for aromatic rings like **6(------)
                if (rawChem.includes('**6')) {
                    formula = 'C6H6'; // Benzene fallback
                } else if (rawChem.includes('**5')) {
                    formula = 'C5H5';
                } else {
                    // Robust extraction of content between first { and last }
                    const firstBrace = rawChem.indexOf('{');
                    const lastBrace = rawChem.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        formula = rawChem.slice(firstBrace + 1, lastBrace)
                            .replace(/-\[([0-9]+)\]/g, '-') // Remove angle modifiers
                            .replace(/=\[([0-9]+)\]/g, '=')
                            .replace(/\(~\[([0-9]+)\]/g, '~')
                            .replace(/\(([^)]+)\)/g, (match, p1) => {
                                // Extract content from parens and remove nested modifiers
                                return `(${p1.replace(/-\[([0-9]+)\]/g, '').replace(/=\[([0-9]+)\]/g, '')})`;
                            });
                    }
                }
                
                if (formula) {
                    // Further cleanup for mhchem
                    formula = formula.replace(/\s+/g, '');
                    const fallbackHtml = `<span class="chem-fallback" data-hash="${e.data.hash}">$\\ce{${formula}}$</span>`;
                    globalSvgCache[e.data.hash] = fallbackHtml;
                    setCacheVersion(v => v + 1);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        
        // Inject iframes for placeholders
        Object.entries(formulaMap).forEach(([id, formula]) => {
            const el = document.getElementById(id);
            if (el && !el.querySelector('iframe')) {
                const iframe = document.createElement('iframe');
                iframe.src = `/chemfig.html?c=${encodeURIComponent(formula)}&id=${id}&hash=${hashString(formula)}`;
                iframe.style.border = 'none';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.display = 'block';
                el.appendChild(iframe);
            }
        });

        return () => window.removeEventListener('message', handleMessage);
    }, [hasChemfig, formulaMap, cacheVersion]);

    if (inline) {
        return (
            <MathJax inline dynamic={dynamic}>
                <span dangerouslySetInnerHTML={{ __html: processedText }} />
            </MathJax>
        );
    }

    return (
        <MathJax dynamic={dynamic}>
            <div dangerouslySetInnerHTML={{ __html: processedText }} />
        </MathJax>
    );
}
