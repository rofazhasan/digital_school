/**
 * Hand-Drawn & Architectural Drafting SVG Helper Primitives
 * Creates beautiful, crisp, textbook-quality geometry diagrams that look hand-crafted
 * with fine drafting pens, yet remain compact and crystal-clear in print and online exams.
 */

export interface Point {
  x: number;
  y: number;
}

export interface StrokeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  opacity?: number;
}

// Global SVG definition ID generator to avoid collision across multiple diagrams on the same page
let defIdCounter = 0;
export function getUniqueId(prefix: string = 'geo'): string {
  defIdCounter = (defIdCounter + 1) % 100000;
  return `${prefix}-${defIdCounter}`;
}

/**
 * Basic vector helpers
 */
export function dist(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function midpoint(p1: Point, p2: Point, ratio: number = 0.5): Point {
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
  };
}

export function pointAlong(from: Point, to: Point, distance: number): Point {
  const d = dist(from, to);
  if (d === 0) return { ...from };
  const ratio = distance / d;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

export function rotatePoint(p: Point, center: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Standard colors & styling tokens
 */
export const GEO_THEME = {
  // Deep drafting ink - renders deep slate in screen, dark black in print
  ink: '#1e293b',
  inkSecondary: '#475569',
  inkMuted: '#64748b',
  accentBlue: '#2563eb',
  accentRed: '#dc2626',
  accentGreen: '#059669',
  accentPurple: '#7c3aed',
  hatchLine: '#334155',
  hatchFill: 'rgba(59, 130, 246, 0.08)',
  printHatchFill: 'rgba(0, 0, 0, 0.05)',
  fontFamily: 'KaTeX_Math, "Cambria Math", "Times New Roman", STIX, Georgia, serif',
  sansFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

/**
 * SVG Definitions header for hatching patterns, filters and markers
 */
export function generateSvgDefs(hatchId: string, isHandDrawn: boolean = false): string {
  return `
    <defs>
      <!-- Architectural 45-degree diagonal hatching for shaded regions -->
      <pattern id="${hatchId}" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke="${GEO_THEME.hatchLine}" stroke-width="0.9" />
      </pattern>

      <!-- Directional Arrowhead for parallel lines & rays -->
      <marker id="parallelArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
        <polygon points="0 0.5, 5 3, 0 5.5" fill="${GEO_THEME.ink}" />
      </marker>
      <marker id="rayArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <polygon points="0 1, 6 3.5, 0 6" fill="${GEO_THEME.ink}" />
      </marker>
      <marker id="dimArrowStart" markerWidth="6" markerHeight="6" refX="2" refY="3" orient="auto-start-reverse">
        <polygon points="0 3, 5 1, 5 5" fill="${GEO_THEME.inkMuted}" />
      </marker>
      <marker id="dimArrowEnd" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
        <polygon points="0 1, 5 3, 0 5" fill="${GEO_THEME.inkMuted}" />
      </marker>
    </defs>
  `;
}

/**
 * Renders an authentic aligned right-angle symbol (corner square)
 * Aligned precisely along the directions of the two incident sides.
 */
export function renderRightAngleMarker(
  corner: Point,
  arm1: Point,
  arm2: Point,
  size: number = 10,
  withDot: boolean = true
): string {
  const p1 = pointAlong(corner, arm1, size);
  const p2 = pointAlong(corner, arm2, size);
  // Fourth point of the square: corner + (p1 - corner) + (p2 - corner)
  const p3 = {
    x: p1.x + (p2.x - corner.x),
    y: p1.y + (p2.y - corner.y),
  };

  const centerDot = withDot ? midpoint(corner, p3) : null;

  return `
    <path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.2" stroke-linecap="square" />
    ${centerDot ? `<circle cx="${centerDot.x.toFixed(1)}" cy="${centerDot.y.toFixed(1)}" r="1.2" fill="${GEO_THEME.ink}" />` : ''}
  `;
}

/**
 * Renders an angle arc between two arms with optional angle label / measurement
 */
export function renderAngleArc(
  vertex: Point,
  arm1: Point,
  arm2: Point,
  radius: number = 16,
  label?: string,
  isDouble: boolean = false
): string {
  const angle1 = Math.atan2(arm1.y - vertex.y, arm1.x - vertex.x);
  let angle2 = Math.atan2(arm2.y - vertex.y, arm2.x - vertex.x);

  // Normalize angle sweep in counter-clockwise direction
  let diff = angle2 - angle1;
  while (diff < 0) diff += 2 * Math.PI;
  while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

  // Choose the minor angle (< 180 deg)
  const sweepFlag = diff <= Math.PI ? 1 : 0;
  const startAng = angle1;
  const endAng = angle2;

  const startPt = {
    x: vertex.x + radius * Math.cos(startAng),
    y: vertex.y + radius * Math.sin(startAng),
  };
  const endPt = {
    x: vertex.x + radius * Math.cos(endAng),
    y: vertex.y + radius * Math.sin(endAng),
  };

  const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;

  let arcsSvg = `
    <path d="M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.2" />
  `;

  if (isDouble) {
    const r2 = radius + 3;
    const s2 = { x: vertex.x + r2 * Math.cos(startAng), y: vertex.y + r2 * Math.sin(startAng) };
    const e2 = { x: vertex.x + r2 * Math.cos(endAng), y: vertex.y + r2 * Math.sin(endAng) };
    arcsSvg += `
      <path d="M ${s2.x.toFixed(1)} ${s2.y.toFixed(1)} A ${r2} ${r2} 0 ${largeArcFlag} ${sweepFlag} ${e2.x.toFixed(1)} ${e2.y.toFixed(1)}" 
            fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.1" />
    `;
  }

  // Label along angle bisector
  let labelSvg = '';
  if (label) {
    let bisector = angle1 + diff / 2;
    if (diff > Math.PI) bisector += Math.PI;
    const labelDist = radius + (isDouble ? 12 : 9);
    const labelPos = {
      x: vertex.x + labelDist * Math.cos(bisector),
      y: vertex.y + labelDist * Math.sin(bisector) + 3.5, // vertical centering adjustment
    };
    labelSvg = `
      <text x="${labelPos.x.toFixed(1)}" y="${labelPos.y.toFixed(1)}" 
            font-family="${GEO_THEME.fontFamily}" font-size="10.5" font-weight="600"
            fill="${GEO_THEME.ink}" text-anchor="middle" font-style="italic">
        ${label}
      </text>
    `;
  }

  return arcsSvg + labelSvg;
}

/**
 * Congruent tick marks on line segments (single or double hash marks)
 */
export function renderTickMarks(
  p1: Point,
  p2: Point,
  count: 1 | 2 | 3 = 1,
  tickLength: number = 7
): string {
  const mid = midpoint(p1, p2);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perp = angle + Math.PI / 2;
  const halfLen = tickLength / 2;

  const dx = halfLen * Math.cos(perp);
  const dy = halfLen * Math.sin(perp);

  if (count === 1) {
    return `
      <line x1="${(mid.x - dx).toFixed(1)}" y1="${(mid.y - dy).toFixed(1)}" 
            x2="${(mid.x + dx).toFixed(1)}" y2="${(mid.y + dy).toFixed(1)}" 
            stroke="${GEO_THEME.ink}" stroke-width="1.4" stroke-linecap="round" />
    `;
  }

  if (count === 2) {
    const spacing = 3;
    const stepX = (spacing / 2) * Math.cos(angle);
    const stepY = (spacing / 2) * Math.sin(angle);
    return `
      <line x1="${(mid.x - stepX - dx).toFixed(1)}" y1="${(mid.y - stepY - dy).toFixed(1)}" 
            x2="${(mid.x - stepX + dx).toFixed(1)}" y2="${(mid.y - stepY + dy).toFixed(1)}" 
            stroke="${GEO_THEME.ink}" stroke-width="1.3" stroke-linecap="round" />
      <line x1="${(mid.x + stepX - dx).toFixed(1)}" y1="${(mid.y + stepY - dy).toFixed(1)}" 
            x2="${(mid.x + stepX + dx).toFixed(1)}" y2="${(mid.y + stepY + dy).toFixed(1)}" 
            stroke="${GEO_THEME.ink}" stroke-width="1.3" stroke-linecap="round" />
    `;
  }

  return '';
}

/**
 * Parallel arrow indicators along segment
 */
export function renderParallelArrows(
  p1: Point,
  p2: Point,
  count: 1 | 2 = 1,
  arrowSize: number = 5
): string {
  const mid = midpoint(p1, p2);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  const drawOne = (center: Point) => {
    const backAngle1 = angle + Math.PI * 0.82;
    const backAngle2 = angle - Math.PI * 0.82;
    const tip = { x: center.x + (arrowSize / 2) * Math.cos(angle), y: center.y + (arrowSize / 2) * Math.sin(angle) };
    const wing1 = { x: tip.x + arrowSize * Math.cos(backAngle1), y: tip.y + arrowSize * Math.sin(backAngle1) };
    const wing2 = { x: tip.x + arrowSize * Math.cos(backAngle2), y: tip.y + arrowSize * Math.sin(backAngle2) };
    return `<polygon points="${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${wing1.x.toFixed(1)},${wing1.y.toFixed(1)} ${wing2.x.toFixed(1)},${wing2.y.toFixed(1)}" fill="${GEO_THEME.ink}" />`;
  };

  if (count === 1) {
    return drawOne(mid);
  } else {
    const offset = 4;
    const c1 = { x: mid.x - offset * Math.cos(angle), y: mid.y - offset * Math.sin(angle) };
    const c2 = { x: mid.x + offset * Math.cos(angle), y: mid.y + offset * Math.sin(angle) };
    return drawOne(c1) + drawOne(c2);
  }
}

/**
 * Vertex point with mathematical label placed nicely outside
 */
export function renderVertex(
  p: Point,
  label: string,
  placement: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'auto',
  contextCenter?: Point
): string {
  let offsetX = 0;
  let offsetY = 0;
  let anchor: 'start' | 'middle' | 'end' = 'middle';

  if (placement === 'auto' && contextCenter) {
    const dx = p.x - contextCenter.x;
    const dy = p.y - contextCenter.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      placement = dx > 0 ? 'right' : 'left';
    } else {
      placement = dy > 0 ? 'bottom' : 'top';
    }
  }

  switch (placement) {
    case 'top':
      offsetY = -7;
      anchor = 'middle';
      break;
    case 'bottom':
      offsetY = 14;
      anchor = 'middle';
      break;
    case 'left':
      offsetX = -8;
      offsetY = 4;
      anchor = 'end';
      break;
    case 'right':
      offsetX = 8;
      offsetY = 4;
      anchor = 'start';
      break;
    case 'top-left':
      offsetX = -6;
      offsetY = -5;
      anchor = 'end';
      break;
    case 'top-right':
      offsetX = 6;
      offsetY = -5;
      anchor = 'start';
      break;
    case 'bottom-left':
      offsetX = -6;
      offsetY = 13;
      anchor = 'end';
      break;
    case 'bottom-right':
      offsetX = 6;
      offsetY = 13;
      anchor = 'start';
      break;
  }

  return `
    <!-- Vertex point -->
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="${GEO_THEME.ink}" stroke="#ffffff" stroke-width="0.8" />
    <!-- Vertex text label -->
    <text x="${(p.x + offsetX).toFixed(1)}" y="${(p.y + offsetY).toFixed(1)}" 
          font-family="${GEO_THEME.fontFamily}" font-size="11.5" font-weight="bold" font-style="italic"
          fill="${GEO_THEME.ink}" text-anchor="${anchor}">
      ${label}
    </text>
  `;
}

/**
 * Side length or variable label positioned along edge
 */
export function renderSideLabel(
  p1: Point,
  p2: Point,
  label: string,
  offsetDistance: number = 10,
  flipSide: boolean = false
): string {
  const mid = midpoint(p1, p2);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perp = angle + (flipSide ? -Math.PI / 2 : Math.PI / 2);

  const lx = mid.x + offsetDistance * Math.cos(perp);
  const ly = mid.y + offsetDistance * Math.sin(perp) + 3.5;

  return `
    <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" 
          font-family="${GEO_THEME.fontFamily}" font-size="10.5" font-weight="600"
          fill="${GEO_THEME.inkSecondary}" text-anchor="middle" font-style="italic">
      ${label}
    </text>
  `;
}

/**
 * Dashed projection / altitude line
 */
export function renderDashedLine(
  from: Point,
  to: Point,
  label?: string
): string {
  let lineSvg = `
    <line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" 
          x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" 
          stroke="${GEO_THEME.inkMuted}" stroke-width="1.3" stroke-dasharray="3.5,2.5" />
  `;

  if (label) {
    const mid = midpoint(from, to);
    lineSvg += `
      <text x="${(mid.x + 8).toFixed(1)}" y="${(mid.y + 3).toFixed(1)}" 
            font-family="${GEO_THEME.fontFamily}" font-size="10" font-style="italic" font-weight="600"
            fill="${GEO_THEME.inkMuted}">
        ${label}
      </text>
    `;
  }
  return lineSvg;
}

/**
 * Hand-drawn drafting line (crisp pen stroke with slight subtle overextension at intersections)
 */
export function renderDraftingLine(
  p1: Point,
  p2: Point,
  overshoot: number = 0,
  style: StrokeStyle = {}
): string {
  const { stroke = GEO_THEME.ink, strokeWidth = 1.7 } = style;
  let start = p1;
  let end = p2;

  if (overshoot > 0) {
    start = pointAlong(p2, p1, dist(p1, p2) + overshoot);
    end = pointAlong(p1, p2, dist(p1, p2) + overshoot);
  }

  return `
    <line x1="${start.x.toFixed(1)}" y1="${start.y.toFixed(1)}" 
          x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" 
          stroke="${stroke}" stroke-width="${strokeWidth}" 
          stroke-linecap="round" stroke-linejoin="round" />
  `;
}
