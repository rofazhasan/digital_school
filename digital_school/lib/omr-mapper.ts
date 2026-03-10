/**
 * OMR Mapper Utility (Refined)
 * 
 * Maps bubbles to normalized coordinates (0.0 to 1.0) relative to ArUco markers.
 * Markers define the coordinate system corners:
 * Marker 0: (0,0) - Top Left
 * Marker 1: (1,0) - Top Right
 * Marker 2: (1,1) - Bottom Right
 * Marker 3: (0,1) - Bottom Left
 */

export type SectionType = 'MCQ' | 'ROLL' | 'REG' | 'SET';

export interface OMRBubble {
    type: SectionType;
    qId: string | number; // Question number or Digit column index
    option: string;       // A-E for MCQ, 0-9 for ROLL/REG
    x: number;            // Normalized 0-1
    y: number;            // Normalized 0-1
    r: number;            // Normalized radius
}

export interface OMRTemplate {
    examId: string;
    setId: string;
    bubbles: OMRBubble[];
}

export const generateOMRTemplate = (examId: string, setId: string): OMRTemplate => {
    const bubbles: OMRBubble[] = [];

    /**
     * GEOMETRY CONSTANTS (Normalized to ArUco Marker Boundaries)
     * Markers are at: TL(32,32), TR(W-72, 32), BR(W-52, H-52), BL(52, H-52) approx
     * We normalize so Marker center to Marker center is 1.0
     */

    // 1. ROLL NUMBER SECTION (Ref: Section 1 in OMRSheet.tsx)
    // Finely tuned based on actual scan feedback (340922 vs 380222)
    for (let col = 0; col < 6; col++) {
        const xBase = 0.125 + (col * 0.0385);
        for (let digit = 0; digit < 10; digit++) {
            bubbles.push({
                type: 'ROLL',
                qId: col,
                option: digit.toString(),
                x: xBase,
                y: 0.315 + (digit * 0.0215),
                r: 0.0075
            });
        }
    }

    // 2. REGISTRATION NUMBER SECTION (Upgraded to 10 Digits)
    for (let col = 0; col < 10; col++) {
        const xBase = 0.445 + (col * 0.0385);
        for (let digit = 0; digit < 10; digit++) {
            bubbles.push({
                type: 'REG',
                qId: col,
                option: digit.toString(),
                x: xBase,
                y: 0.315 + (digit * 0.0215),
                r: 0.0075
            });
        }
    }

    // 3. SET CODE SECTION
    const setLabels = ['ক', 'খ', 'গ', 'ঘ'];
    for (let i = 0; i < 4; i++) {
        bubbles.push({
            type: 'SET',
            qId: 'set',
            option: setLabels[i],
            x: 0.50 + (i * 0.035), // Adjusted slightly right
            y: 0.125,
            r: 0.009
        });
    }

    // 4. MCQ GRID (4 Columns of 25)
    // Refined based on user's traditional template layout
    const startY = 0.58; // Moved up slightly to accommodate bottom footer
    const colSpacing = 0.24;
    const rowSpacing = 0.0145;
    const optSpacing = 0.032;

    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 25; row++) {
            const qNum = (col * 25) + row + 1;
            const xBase = 0.05 + (col * colSpacing) + 0.055;
            const yPos = startY + (row * rowSpacing);

            // 4 Options (matching the image which has 4 bubbles): ক, খ, গ, ঘ
            for (let opt = 0; opt < 4; opt++) {
                bubbles.push({
                    type: 'MCQ',
                    qId: qNum,
                    option: (opt).toString(),
                    x: xBase + (opt * optSpacing),
                    y: yPos,
                    r: 0.0085
                });
            }
        }
    }

    return { examId, setId, bubbles };
};
