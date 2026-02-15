/**
 * FBD Calculation Utilities
 * Vector math and geometry calculations for Free Body Diagrams
 */

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Calculate the end point of a force vector
 */
export function calculateForceEndPoint(
    startX: number,
    startY: number,
    magnitude: number,
    angleDegrees: number
): { x: number; y: number } {
    const angleRad = degToRad(angleDegrees);

    // In SVG, y-axis is inverted (positive is down)
    // So we negate the y component to make angles intuitive
    return {
        x: startX + magnitude * Math.cos(angleRad),
        y: startY - magnitude * Math.sin(angleRad),
    };
}

/**
 * Snap angle to nearest preset angle
 */
export function snapAngle(angle: number, snapAngles: number[]): number {
    let closestAngle = snapAngles[0];
    let minDiff = Math.abs(angle - closestAngle);

    for (const snapAngle of snapAngles) {
        const diff = Math.abs(angle - snapAngle);
        if (diff < minDiff) {
            minDiff = diff;
            closestAngle = snapAngle;
        }
    }

    return closestAngle;
}

/**
 * Calculate angle between two points
 */
export function calculateAngle(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x2 - x1;
    const dy = y1 - y2; // Inverted because SVG y-axis is down
    const angleRad = Math.atan2(dy, dx);
    let angleDeg = radToDeg(angleRad);

    // Normalize to 0-360
    if (angleDeg < 0) {
        angleDeg += 360;
    }

    return angleDeg;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snap point to grid
 */
export function snapToGrid(
    x: number,
    y: number,
    gridSize: number
): { x: number; y: number } {
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
    };
}

/**
 * Calculate arrow head points for a given vector
 */
export function calculateArrowHead(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    headSize: number
): { left: { x: number; y: number }; right: { x: number; y: number } } {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headAngle = Math.PI / 6; // 30 degrees

    return {
        left: {
            x: x2 - headSize * Math.cos(angle - headAngle),
            y: y2 - headSize * Math.sin(angle - headAngle),
        },
        right: {
            x: x2 - headSize * Math.cos(angle + headAngle),
            y: y2 - headSize * Math.sin(angle + headAngle),
        },
    };
}

/**
 * Format force magnitude for display
 */
export function formatMagnitude(magnitude: number): string {
    if (magnitude >= 1000) {
        return `${(magnitude / 1000).toFixed(1)}k`;
    }
    return magnitude.toFixed(1);
}
