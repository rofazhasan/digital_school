
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
    // Separate ref for the script container so we don't wipe out React's status UI
    const scriptContainerRef = React.useRef<HTMLSpanElement>(null);
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [debugMsg, setDebugMsg] = useState("");

    useEffect(() => {
        const container = scriptContainerRef.current;
        if (!container) return;

        // 1. Clear previous content (only the script container)
        container.innerHTML = '';
        setStatus("pending");
        setDebugMsg("");

        // 2. Create script tag manually
        const script = document.createElement('script');
        script.type = 'text/tikz';
        script.textContent = code;

        // 3. Append to container
        container.appendChild(script);

        // 4. Trigger TikZJax
        const trigger = async () => {
            let attempts = 0;
            // Increase timeout to 15 seconds to allow for slow network loading of the library
            const maxAttempts = 30;

            while (attempts < maxAttempts) {
                if (typeof window !== 'undefined') {
                    const win = window as any;
                    // Check if library is loaded
                    if (win.tikzjax) {
                        try {
                            if (typeof win.tikzjax.process === 'function') {
                                await win.tikzjax.process(script);
                                setStatus("success");
                                return;
                            } else {
                                // Fallback for some versions
                                setDebugMsg("process() not found on tikzjax");
                            }
                        } catch (e: any) {
                            console.error("TikZ process error:", e);
                            setStatus("error");
                            setDebugMsg(e.message || "Process failed");
                            return;
                        }
                    } else {
                        // Library not loaded yet
                    }
                }
                attempts++;
                await new Promise(r => setTimeout(r, 500));
            }
            setStatus("error");
            setDebugMsg("TikZJax library not loaded (timeout)");
        };

        trigger();

    }, [code]);

    return (
        <span className="tikz-wrapper block my-4 flex flex-col items-center justify-center overflow-x-auto min-h-[50px] border border-transparent p-2 transition-all">
            {/* The script injection happens here. React leaves this empty. */}
            <span ref={scriptContainerRef} />

            {/* React manages these. They are siblings, not children of the ref. */}
            {status === "error" && (
                <span className="text-red-500 text-xs font-mono bg-red-50 p-1 rounded border border-red-200 mt-2">
                    Graphics Error: {debugMsg}
                </span>
            )}
            {status === "pending" && (
                <span className="text-gray-400 text-xs animate-pulse flex items-center gap-1 mt-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Rendering graphics...
                </span>
            )}
        </span>
    );
};
