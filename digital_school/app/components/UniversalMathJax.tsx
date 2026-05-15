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
function extractNestedBraces(str: string): string {
    if (str[0] !== '{') return '';
    let braceCount = 1;
    let j = 1;
    while (j < str.length && braceCount > 0) {
        if (str[j] === '{') braceCount++;
        else if (str[j] === '}') braceCount--;
        j++;
    }
    return braceCount === 0 ? str.slice(1, j - 1) : '';
}

function extractChemfig(text: string, startIdx: number): { content: string, fullMatch: string, endIdx: number } | null {
    const chemfigStart = text.indexOf('\\chemfig', startIdx);
    if (chemfigStart === -1) return null;

    let searchIdx = chemfigStart + 8;
    // Skip * if present
    if (text[searchIdx] === '*') searchIdx++;
    
    // Skip optional arguments [...]
    if (text[searchIdx] === '[') {
        let bracketCount = 1;
        searchIdx++;
        while (searchIdx < text.length && bracketCount > 0) {
            if (text[searchIdx] === '[') bracketCount++;
            else if (text[searchIdx] === ']') bracketCount--;
            searchIdx++;
        }
    }

    // Find opening brace (with whitespace support)
    while (searchIdx < text.length && (text[searchIdx] === ' ' || text[searchIdx] === '\t' || text[searchIdx] === '\n' || text[searchIdx] === '\r')) {
        searchIdx++;
    }

    if (text[searchIdx] !== '{') return null;

    const content = extractNestedBraces(text.slice(searchIdx));
    if (!content) return null;

    const endIdx = searchIdx + content.length + 2;
    const fullMatch = text.slice(chemfigStart, endIdx);
    
    return { content, fullMatch, endIdx };
}

function processChemfig(text: string, instanceId: string): { text: string, hasChemfig: boolean, formulaMap: Record<string, string> } {
    if (!text.includes('\\chemfig') && !text.includes('\\tikz')) return { text, hasChemfig: false, formulaMap: {} };

    let result = '';
    let i = 0;
    let hasChemfig = false;
    let chemfigIndex = 0;
    const formulaMap: Record<string, string> = {};

    while (i < text.length) {
        const match = extractChemfig(text, i);
        
        if (!match) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, match.endIdx - match.fullMatch.length);
        hasChemfig = true;
        
        const chemfigContent = match.content;
        const fullMatch = match.fullMatch;
        const chemfigHash = hashString(fullMatch);
        const chemfigId = `chemfig-${instanceId}-${chemfigIndex++}`;
        
        let j = match.endIdx;
        
        // Strip surrounding math delimiters
        const openDelims = ['\\$\\$', '\\$', '\\\\\\[', '\\\\\\('];
        const closeDelims = ['\\$\\$', '\\$', '\\\\\\]', '\\\\\\)'];
        
        for (let d = 0; d < openDelims.length; d++) {
            const openRegex = new RegExp(`${openDelims[d]}\\s*$`);
            const closeRegex = new RegExp(`^\\s*${closeDelims[d]}`);
            
            if (openRegex.test(result) && closeRegex.test(text.slice(j))) {
                result = result.replace(openRegex, '');
                const closeMatch = text.slice(j).match(closeRegex);
                if (closeMatch) j += closeMatch[0].length;
                break;
            }
        }

        // Check if we have this in local storage for "Zero Delay"
        if (!globalSvgCache[chemfigHash]) {
            try {
                const saved = localStorage.getItem(`chemfig-svg-v2-${chemfigHash}`);
                if (saved) globalSvgCache[chemfigHash] = saved;
            } catch (e) {}
        }

        // Adaptive sizing: Detect if it's a ring or complex structure
        const isComplex = fullMatch.includes('*') || (fullMatch.match(/\[/g) || []).length > 2;
        const chemfigClass = isComplex ? 'chemfig-inline chemfig-complex' : 'chemfig-inline';

        if (globalSvgCache[chemfigHash]) {
            result += `<span class="${chemfigClass}" data-hash="${chemfigHash}">${globalSvgCache[chemfigHash]}</span>`;
        } else {
            result += `<span id="${chemfigId}" class="chemfig-placeholder ${isComplex ? 'complex' : ''}" data-chem="${encodeURIComponent(fullMatch)}" data-hash="${chemfigHash}"></span>`;
            formulaMap[chemfigId] = fullMatch;
        }
        i = j;
    }

    // Safety: Ensure no raw \chemfig leaks to MathJax (causes red box "Invalid Equation")
    result = result.replace(/\\chemfig/g, '\\text{\\chemfig}');

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
                    localStorage.setItem(`chemfig-svg-v2-${e.data.hash}`, e.data.svgContent);
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
                iframe.style.display = 'inline-block';
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
            <div className="inline" dangerouslySetInnerHTML={{ __html: processedText }} />
        </MathJax>
    );
}
