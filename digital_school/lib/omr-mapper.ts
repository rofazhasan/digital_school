/**
 * OMR Mapper Utility
 * 
 * Generates a "Digital Twin" of the OMR sheet by mapping bubble coordinates
 * relative to the ArUco fiducial markers.
 */

export interface OMRTemplate {
    examId: string;
    setId: string;
    width: number; // reference width (e.g. 800)
    height: number; // reference height (e.g. 1131)
    bubbles: OMRBubble[];
}

export interface OMRBubble {
    qId: string | number;
    option: string;
    x: number; // normalized 0-1
    y: number; // normalized 0-1
    r: number; // normalized radius
}

export const generateOMRTemplate = (examId: string, setId: string, questions: any): OMRTemplate => {
    const template: OMRTemplate = {
        examId,
        setId,
        width: 800,
        height: 1131,
        bubbles: []
    };

    // The logic here must match OMRSheet.tsx geometry perfectly.
    // Normalized coordinates (assuming markers are exactly at corners)

    // Header section occupies roughly 30%
    // Info band roughly 20%
    // Question grid starts at y ≈ 0.5

    const startY = 0.52;
    const colWidth = 0.23; // 4 columns with gaps
    const rowHeight = 0.018; // approx row height for 25 questions

    // Questions Grid (matching OMRSheet.tsx 4-column layout)
    for (let col = 0; col < 4; col++) {
        const startIdx = col * 25;
        for (let row = 0; row < 25; row++) {
            const qIdx = startIdx + row;
            const qId = qIdx + 1;

            // X position: col * colWidth + padding
            const xBase = 0.06 + col * 0.235;
            // Y position: startY + row * rowHeight
            const yPos = startY + row * 0.0165;

            // Bubbles (4 options typically)
            for (let opt = 0; opt < 4; opt++) {
                const optLabel = ['A', 'B', 'C', 'D'][opt];
                template.bubbles.push({
                    qId: qId.toString(),
                    option: optLabel,
                    x: xBase + 0.06 + (opt * 0.035), // Bubble spacing
                    y: yPos,
                    r: 0.01
                });
            }
        }
    }

    return template;
};
