"use client";

import { MathJax } from "better-react-mathjax";
import React from "react";
import { cleanupMath } from "@/lib/utils";

import { parseDiagramsInText } from "@/utils/diagrams/inline-parser";

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

/**
 * Helper to extract \chemfig{} blocks and wrap them for TikZJax
 */
function processChemfig(text: string): { text: string, hasChemfig: boolean } {
    if (!text.includes('\\chemfig')) return { text, hasChemfig: false };
    
    let result = '';
    let i = 0;
    let hasChemfig = false;
    
    while (i < text.length) {
        const idx = text.indexOf('\\chemfig', i);
        if (idx === -1) {
            result += text.slice(i);
            break;
        }
        
        result += text.slice(i, idx);
        
        let braceStart = text.indexOf('{', idx);
        if (braceStart === -1) {
            result += '\\chemfig';
            i = idx + 8;
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
            const tikzScript = `<script type="text/tikz">\n\\usepackage{chemfig}\n\\begin{document}\n${chemfigContent}\n\\end{document}\n</script>`;
            
            // Clean up surrounding math delimiters if users mistakenly wrap chemfig in math mode
            if (result.endsWith('$$') && text.slice(j).startsWith('$$')) {
                result = result.slice(0, -2);
                j += 2;
            } else if (result.endsWith('$') && text.slice(j).startsWith('$')) {
                result = result.slice(0, -1);
                j += 1;
            } else if (result.endsWith('\\[') && text.slice(j).startsWith('\\]')) {
                result = result.slice(0, -2);
                j += 2;
            } else if (result.endsWith('\\(') && text.slice(j).startsWith('\\)')) {
                result = result.slice(0, -2);
                j += 2;
            }
            
            result += tikzScript;
            i = j;
        } else {
            result += text.slice(idx, braceStart + 1);
            i = braceStart + 1;
        }
    }
    
    return { text: result, hasChemfig };
}

/**
 * Simplified UniversalMathJax component
 * TikZ/Chemfig support enabled via WebAssembly TikZJax
 */
export const UniversalMathJax: React.FC<UniversalMathJaxProps> = ({ children, inline, dynamic }) => {
    // If children isn't a string, fallback to standard MathJax
    if (typeof children !== "string") {
        return <MathJax inline={inline} dynamic={dynamic}>{children}</MathJax>;
    }

    // Pre-process the content to normalize delimiters
    let content = cleanupMath(children);
    
    // Parse chemfig
    const { text: contentWithChemfig, hasChemfig } = processChemfig(content);
    content = contentWithChemfig;

    // Parse diagrams (##PRESET...## -> <svg>...</svg>)
    const contentWithDiagrams = parseDiagramsInText(content);

    // If diagrams or chemfig were found, we need to render HTML inside MathJax
    // And ensure MathJax processes the math inside it
    const mathRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // Trigger MathJax typeset
        if (window.MathJax && window.MathJax.typesetPromise && mathRef.current) {
            window.MathJax.typesetPromise([mathRef.current]).catch((err: any) => console.log('MathJax typeset failed: ' + err.message));
        }
        
        // Trigger TikZJax parsing if chemfig was found
        if (hasChemfig) {
            // TikZJax hooks into DOMContentLoaded, so dispatching it forces a re-parse of dynamically added scripts
            setTimeout(() => {
                document.dispatchEvent(new Event('DOMContentLoaded'));
            }, 100);
        }
    }, [content, contentWithDiagrams, hasChemfig]);

    // Safely apply pedagogical formatting (|| -> <br />, **bold**) 
    // This is now handled within cleanupMath, but we must detect if HTML is present
    const hasHtml = contentWithDiagrams.includes('<') && contentWithDiagrams.includes('>');

    if (hasHtml || hasChemfig) {
        return (
            <MathJax inline={inline} dynamic={dynamic}>
                <span ref={mathRef} dangerouslySetInnerHTML={{ __html: contentWithDiagrams }} />
            </MathJax>
        );
    }

    return <MathJax inline={inline} dynamic={dynamic}>{contentWithDiagrams}</MathJax>;
};
