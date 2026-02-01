
"use client";

import { MathJax } from "better-react-mathjax";
import React, { useEffect, useState } from "react";

interface UniversalMathJaxProps {
    children: React.ReactNode;
    inline?: boolean;
    dynamic?: boolean;
}

export const UniversalMathJax: React.FC<UniversalMathJaxProps> = ({ children, inline, dynamic }) => {
    // If children isn't a string (e.g. nested elements), we can't easily parse for TikZ.
    // Fallback to standard MathJax.
    if (typeof children !== "string") {
        return <MathJax inline={inline} dynamic={dynamic}>{children}</MathJax>;
    }

    const content = children;

    // Quick check to avoid complex parsing if no TikZ is present
    if (!content.includes("\\begin{tikzpicture}")) {
        return <MathJax inline={inline} dynamic={dynamic}>{content}</MathJax>;
    }

    // Regex to capture the TikZ environment.
    // We capture the content INCLUDING \begin and \end.
    // This regex matches non-greedy.
    const tikzRegex = /(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g;

    const parts = content.split(tikzRegex);

    return (
        <span>
            {parts.map((part, index) => {
                // If this part is a TikZ block
                if (part.startsWith("\\begin{tikzpicture}")) {
                    return (
                        <span key={index} className="tikz-wrapper block my-4 flex justify-center">
                            <script
                                type="text/tikz"
                                dangerouslySetInnerHTML={{ __html: part }}
                            />
                        </span>
                    );
                }

                // If it's pure whitespace (often happens around the split), skip rendering empty MathJax
                if (!part.trim()) return null;

                // Render regular content with MathJax
                return (
                    <MathJax key={index} inline={inline} dynamic={dynamic}>
                        {part}
                    </MathJax>
                );
            })}
        </span>
    );
};
