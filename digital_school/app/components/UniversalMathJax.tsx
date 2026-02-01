
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



    // TikZ rendering with manual DOM manipulation to avoid React reconciliation conflicts
    // (TikZJax replaces the <script> tag with <svg>, which breaks React if we render <script> directly)
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith("\\begin{tikzpicture}")) {
                    return <TikZBlock key={index} code={part} />;
                }

                if (!part.trim()) return null;

                return (
                    <MathJax key={index} inline={inline} dynamic={dynamic}>
                        {part}
                    </MathJax>
                );
            })}
        </span>
    );
};

// Sub-component for individual TikZ blocks to handle lifecycle
const TikZBlock = ({ code }: { code: string }) => {
    const containerRef = React.useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. Clear previous content
        container.innerHTML = '';

        // 2. Create script tag manually
        const script = document.createElement('script');
        script.type = 'text/tikz';
        script.textContent = code;

        // 3. Append to container (React doesn't know about this node, so it won't complain when TikZJax eats it)
        container.appendChild(script);

        // 4. Trigger TikZJax
        const trigger = async () => {
            if (typeof window !== 'undefined') {
                const win = window as any;
                // Retry a few times if library is still loading
                for (let i = 0; i < 10; i++) {
                    if (win.tikzjax) {
                        try {
                            // If process() accepts an element, pass the script. 
                            // Otherwise it usually scans the doc.
                            // Some versions return a promise.
                            if (typeof win.tikzjax.process === 'function') {
                                await win.tikzjax.process(script);
                            }
                            return;
                        } catch (e) {
                            // process() might be global scan only?
                            // Try global scan as fallback
                            try { win.tikzjax.process(); } catch (e2) { }
                            return;
                        }
                    }
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        };

        trigger();

    }, [code]);

    return (
        <span
            ref={containerRef}
            className="tikz-wrapper block my-4 flex justify-center overflow-x-auto min-h-[50px]"
        />
    );
};
