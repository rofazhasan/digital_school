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
 * Simplified UniversalMathJax component
 * TikZ support removed - use FBD system instead
 */
export const UniversalMathJax: React.FC<UniversalMathJaxProps> = ({ children, inline, dynamic }) => {
    // If children isn't a string, fallback to standard MathJax
    if (typeof children !== "string") {
        return <MathJax inline={inline} dynamic={dynamic}>{children}</MathJax>;
    }

    // Pre-process the content to normalize delimiters
    const content = cleanupMath(children);

    // Parse diagrams (##PRESET...## -> <svg>...</svg>)
    const contentWithDiagrams = parseDiagramsInText(content);

    // If diagrams were found, we need to render HTML inside MathJax
    // And ensure MathJax processes the math inside it
    const mathRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (content !== contentWithDiagrams && mathRef.current && window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathRef.current]).catch((err: any) => console.log('MathJax typeset failed: ' + err.message));
        }
    }, [contentWithDiagrams]);

    if (content !== contentWithDiagrams) {
        return (
            <MathJax inline={inline} dynamic={dynamic}>
                <span ref={mathRef} dangerouslySetInnerHTML={{ __html: contentWithDiagrams }} />
            </MathJax>
        );
    }

    return <MathJax inline={inline} dynamic={dynamic}>{content}</MathJax>;
};
