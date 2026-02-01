
"use client";

import { MathJax } from "better-react-mathjax";
import React, { useEffect, useState } from "react";

import { cleanupMath } from "@/lib/utils";

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

    // Pre-process the content to strip $$ around TikZ and normalize delimiters
    const content = cleanupMath(children);

    // Quick check to avoid complex parsing if no TikZ is present
    if (!content.includes("\\begin{tikzpicture}")) {
        return <MathJax inline={inline} dynamic={dynamic}>{content}</MathJax>;
    }

    // Regex to capture the TikZ environment.
    // We capture the content INCLUDING \begin and \end.
    // This regex matches non-greedy.
    const tikzRegex = /(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g;

    const parts = content.split(tikzRegex);

    // Trigger TikZ rendering: dynamic parts need a nudge
    useEffect(() => {
        const triggerTikz = async () => {
            if (typeof window !== 'undefined') {
                // Short wait to ensure DOM elements are painted
                await new Promise(r => setTimeout(r, 100));

                const win = window as any;
                if (win.tikzjax && typeof win.tikzjax.process === 'function') {
                    try {
                        win.tikzjax.process();
                    } catch (e) {
                        console.error("TikZ process error:", e);
                    }
                }
            }
        };

        // Execute trigger if TikZ content is present
        if (content.includes("\\begin{tikzpicture}")) {
            triggerTikz();
        }
    }, [content]);

    return (
        <span>
            {parts.map((part, index) => {
                // If this part is a TikZ block
                if (part.startsWith("\\begin{tikzpicture}")) {
                    return (
                        <span key={index} className="tikz-wrapper block my-4 flex justify-center overflow-x-auto">
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
