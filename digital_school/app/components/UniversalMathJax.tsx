"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cleanupMath } from "@/lib/utils";
import { extractInlineFBDs } from "@/utils/fbd/inline-parser";
import { renderFBDToSVG } from "@/utils/fbd/svg-renderer";

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
    diagram?: any;
    fbd?: any;
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

        // Adaptive sizing: Detect if it's a ring, branch, or substituent
        const isComplex = fullMatch.includes('*') || fullMatch.includes('[') || fullMatch.includes('(');
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

/**
 * Tokenize diagrams into safe placeholder tokens and map them to their rendered SVG card strings.
 * Keeps KaTeX from scanning SVG XML as LaTeX math.
 */
function extractAndTokenizeDiagrams(text: string, isInline: boolean, instanceId: string): { 
    tokenizedText: string; 
    diagramMap: Record<string, string>; 
} {
    if (!text || !text.includes('##')) {
        return { tokenizedText: text, diagramMap: {} };
    }

    try {
        const { cleanText, fbds, placeholders } = extractInlineFBDs(text);
        if (!fbds || fbds.length === 0) {
            return { tokenizedText: text, diagramMap: {} };
        }

        const diagramMap: Record<string, string> = {};
        let result = cleanText;

        placeholders.forEach((placeholder, idx) => {
            const diagram = fbds[idx];
            if (diagram) {
                const svgString = renderFBDToSVG(diagram);
                const containerClass = isInline
                    ? "inline-diagram-card inline-flex my-1 py-1 px-2 items-center justify-center max-w-[200px] rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs select-none align-middle"
                    : "inline-diagram-card my-3 py-2.5 px-3.5 flex flex-col items-center justify-center w-fit max-w-full mx-auto rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/75 dark:bg-slate-900/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] backdrop-blur-xs select-none transition-all hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.07)] hover:border-slate-300 dark:hover:border-slate-700";

                const styledContainer = `<span class="${containerClass}">${svgString}</span>`;
                const token = `DSDIAGTOKEN${instanceId}${idx}ENDTOKEN`;
                diagramMap[token] = styledContainer;
                result = result.split(placeholder).join(token);
            }
        });

        return { tokenizedText: result, diagramMap };
    } catch (err) {
        console.error('Error tokenizing inline diagrams:', err);
        return { tokenizedText: text, diagramMap: {} };
    }
}

export function UniversalMathJax({ children, inline, dynamic, diagram, fbd }: UniversalMathJaxProps) {
    const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));
    const [cacheVersion, setCacheVersion] = useState(0);

    const rawText = typeof children === "string" ? children : "";

    // 1. Extract and isolate diagrams into safe tokens
    const { tokenizedText, diagramMap } = useMemo(() => {
        return extractAndTokenizeDiagrams(rawText, !!inline, instanceId);
    }, [rawText, inline, instanceId]);

    // 2. Clean up math delimiters on the tokenized text (KaTeX & LaTeX safe)
    const cleanText = useMemo(() => {
        return cleanupMath(tokenizedText);
    }, [tokenizedText]);

    // 3. Process chemical formulas
    const { text: processedText, hasChemfig, formulaMap } = useMemo(() => 
        processChemfig(cleanText, instanceId), 
        [cleanText, instanceId, cacheVersion]
    );

    useEffect(() => {
        if (!hasChemfig) return;

        const renderQueue = Object.entries(formulaMap);
        if (renderQueue.length === 0) return;

        renderQueue.forEach(async ([id, formula]) => {
            const el = document.getElementById(id);
            if (!el) return;

            const chemfigHash = hashString(formula);
            
            // 1. Check Caches (Memory & LocalStorage already checked in useMemo, but double check for async safety)
            if (globalSvgCache[chemfigHash]) {
                el.innerHTML = globalSvgCache[chemfigHash];
                el.classList.remove('chemfig-placeholder');
                el.classList.add('chemfig-rendered');
                return;
            }

            // 2. Fetch from Cloud bridge (Native Chemfig support)
            // Properly wrap if needed
            let latex = formula.trim().replace(/\s+/g, ' ');
            if (!latex.includes('\\chemfig') && !latex.includes('\\tikz')) {
                latex = `\\chemfig{${latex}}`;
            }

            const codecogsUrl = `https://latex.codecogs.com/svg.image?${encodeURIComponent(latex)}`;
            const pngUrl = `https://latex.codecogs.com/png.latex?${encodeURIComponent(latex)}`;

            const updateCacheAndRender = (content: string) => {
                globalSvgCache[chemfigHash] = content;
                try {
                    localStorage.setItem(`chemfig-svg-v2-${chemfigHash}`, content);
                } catch (e) {}
                if (el) {
                    el.innerHTML = content;
                    el.classList.remove('chemfig-placeholder');
                    el.classList.add('chemfig-rendered');
                }
                setCacheVersion(v => v + 1);
            };

            try {
                const response = await fetch(codecogsUrl);
                const svgContent = await response.text();

                if (svgContent.includes('<svg') || svgContent.includes('<?xml')) {
                    updateCacheAndRender(svgContent);
                } else {
                    throw new Error('Not an SVG');
                }
            } catch (err) {
                // PNG Fallback
                const img = new Image();
                img.onload = () => updateCacheAndRender(img.outerHTML);
                img.onerror = () => {
                    // Final Fallback: mhchem
                    let mFormula = formula.replace(/\\chemfig\*?(\[[^\]]*\])?\{|\}/g, '')
                        .replace(/-\[([0-9]+)\]/g, '-')
                        .replace(/=\[([0-9]+)\]/g, '=')
                        .replace(/\s+/g, '');
                    
                    const fallbackHtml = `<span class="chem-fallback">$\\ce{${mFormula}}$</span>`;
                    updateCacheAndRender(fallbackHtml);
                };
                img.src = pngUrl;
            }
        });
    }, [hasChemfig, formulaMap, cacheVersion]);

    // 4. Pre-render standard math with KaTeX safely
    const mathRenderedText = useMemo(() => {
        let text = processedText;
        
        // 1. Render Display Math $$...$$ or \[...\]
        text = text.replace(/(\$\$|\\\[)([\s\S]*?)(?:\$\$|\\\])/g, (_, __, math) => {
            try {
                return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false, trust: true });
            } catch (e) { return `$$${math}$$`; }
        });

        // 2. Render Inline Math $...$ or \(...\)
        // Avoid matching $ inside attributes (e.g. data-hash="...")
        text = text.replace(new RegExp('(?:(?<![="])\\$(.*?)\\$|\\\\\\(([\\s\\S]*?)\\\\\\))', 'gs'), (_, math1, math2) => {
            const math = math1 ?? math2;
            if (!math) return '';
            try {
                return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false, trust: true });
            } catch (e) { return `$${math}$`; }
        });

        return text;
    }, [processedText]);

    // 5. Re-hydrate diagram tokens with actual SVG cards (KaTeX never touched them!)
    const finalText = useMemo(() => {
        let text = mathRenderedText;
        Object.entries(diagramMap).forEach(([token, svgCard]) => {
            text = text.split(token).join(svgCard);
        });

        // If standalone diagram/fbd prop was passed and no diagram was inline
        const standaloneDiag = diagram || fbd;
        if (standaloneDiag && Object.keys(diagramMap).length === 0) {
            try {
                const diagObj = typeof standaloneDiag === 'string' 
                    ? extractInlineFBDs(`##${standaloneDiag}##`).fbds[0] 
                    : standaloneDiag;
                if (diagObj) {
                    const svgString = renderFBDToSVG(diagObj);
                    const containerClass = inline
                        ? "inline-diagram-card inline-flex my-1 py-1 px-2 items-center justify-center max-w-[200px] rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs select-none align-middle"
                        : "inline-diagram-card my-3 py-2.5 px-3.5 flex flex-col items-center justify-center w-fit max-w-full mx-auto rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/75 dark:bg-slate-900/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] backdrop-blur-xs select-none transition-all hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.07)] hover:border-slate-300 dark:hover:border-slate-700";
                    text += `<span class="${containerClass}">${svgString}</span>`;
                }
            } catch (e) {}
        }

        return text;
    }, [mathRenderedText, diagramMap, diagram, fbd, inline]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Legacy/Complex MathJax Fallback: Only used for things KaTeX might miss, safely guarded
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        try {
            const mj = (window as any).MathJax;
            // Only trigger if MathJax is fully loaded and ready, and there is unrendered math
            if (mj && typeof mj.typesetPromise === 'function' && (finalText.includes('\\ce{') || finalText.includes('\\begin{'))) {
                if (mj.startup?.promise) {
                    mj.startup.promise.then(() => {
                        if (containerRef.current && mj.typesetPromise) {
                            mj.typesetPromise([containerRef.current]).catch(() => {});
                        }
                    }).catch(() => {});
                }
            }
        } catch (e) {}
    }, [finalText, cacheVersion]);

    if (inline) {
        return (
            <span 
                ref={containerRef as any}
                className="inline-block" 
                dangerouslySetInnerHTML={{ __html: finalText }} 
            />
        );
    }

    return (
        <div 
            ref={containerRef}
            className="block" 
            dangerouslySetInnerHTML={{ __html: finalText }} 
        />
    );
}
