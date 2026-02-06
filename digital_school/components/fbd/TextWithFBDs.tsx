/**
 * React component for rendering text with embedded FBD diagrams
 * Handles the inline ## ## syntax seamlessly
 */

'use client';

import React from 'react';
import { extractInlineFBDs } from '@/utils/fbd/inline-parser';
import { FBDRenderer } from './FBDRenderer';

interface TextWithFBDsProps {
    text: string;
    className?: string;
}

export const TextWithFBDs: React.FC<TextWithFBDsProps> = ({ text, className = '' }) => {
    const { cleanText, fbds, placeholders } = extractInlineFBDs(text);

    // Split text by placeholders and interleave with diagrams
    const parts: React.ReactNode[] = [];
    let remainingText = cleanText;

    placeholders.forEach((placeholder, idx) => {
        const [before, after] = remainingText.split(placeholder, 2);

        if (before) {
            parts.push(
                <span key={`text-${idx}`} dangerouslySetInnerHTML={{ __html: before }} />
            );
        }

        if (fbds[idx]) {
            parts.push(
                <div key={`fbd-${idx}`} className="my-4 fbd-inline-diagram">
                    <FBDRenderer diagram={fbds[idx]} />
                </div>
            );
        }

        remainingText = after || '';
    });

    // Add any remaining text
    if (remainingText) {
        parts.push(
            <span key="text-final" dangerouslySetInnerHTML={{ __html: remainingText }} />
        );
    }

    return <div className={className}>{parts}</div>;
};
