"use client";

import { MathJax } from "better-react-mathjax";
import React from "react";
import { cleanupMath } from "@/lib/utils";

import { parseDiagramsInText } from "@/utils/diagrams/inline-parser";

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
    if (content !== contentWithDiagrams) {
        return (
            <MathJax inline={inline} dynamic={dynamic}>
                <span dangerouslySetInnerHTML={{ __html: contentWithDiagrams }} />
            </MathJax>
        );
    }

    return <MathJax inline={inline} dynamic={dynamic}>{content}</MathJax>;
};
