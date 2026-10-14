/**
 * Geometry Diagram Generators
 * Compact, beautiful, textbook-quality SVG generators for school & admission exams.
 * Optimized to take minimal space while displaying all essential geometric indicators,
 * vertices, side measurements, angle arcs, and indicators.
 */

import {
  type Point,
  GEO_THEME,
  getUniqueId,
  generateSvgDefs,
  renderRightAngleMarker,
  renderAngleArc,
  renderTickMarks,
  renderParallelArrows,
  renderVertex,
  renderSideLabel,
  renderDashedLine,
  renderDraftingLine,
  dist,
  midpoint,
} from './hand-drawn-svg';
import type { GeometryOptions, RenderedGeometry } from './types';

/**
 * Helper to wrap elements in an optimized, responsive SVG container
 */
function wrapSvg(
  content: string,
  width: number,
  height: number,
  hatchId: string,
  options: GeometryOptions
): RenderedGeometry {
  const isHandDrawn = options.style === 'hand-drawn';
  const size = options.size || 'small';
  
  // Sizing scale for display
  let maxWidth = 160;
  if (size === 'tiny') maxWidth = 95;
  else if (size === 'small') maxWidth = 145;
  else if (size === 'compact') maxWidth = 165;
  else if (size === 'medium') maxWidth = 210;
  else if (size === 'large') maxWidth = 300;

  if (options.width) maxWidth = options.width;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     class="geometry-diagram-svg ${isHandDrawn ? 'geo-hand-drawn' : ''}" 
     style="max-width: ${maxWidth}px; width: 100%; height: auto; display: inline-block; vertical-align: middle; margin: 4px 6px; user-select: none;" 
     xmlns="http://www.w3.org/2000/svg">
  ${generateSvgDefs(hatchId, isHandDrawn)}
  ${content}
</svg>`.trim();

  return {
    svg,
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
  };
}

// ============================================================================
// 1. TRIANGLE GENERATORS
// ============================================================================

export function renderRightTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 155, h = 120;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const vA: Point = { x: 30, y: 22 };
  const vB: Point = { x: 30, y: 98 };
  const vC: Point = { x: 125, y: 98 };

  let content = '';

  // Triangle body
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Right-angle marker at B
  content += renderRightAngleMarker(vB, vA, vC, 10, true);

  // Angle arc at A or C
  if (angles.A || angles.a || angles.angle) {
    content += renderAngleArc(vA, vB, vC, 18, String(angles.A || angles.a || angles.angle));
  }
  if (angles.C || angles.c || angles.theta || angles.x) {
    content += renderAngleArc(vC, vA, vB, 18, String(angles.C || angles.c || angles.theta || angles.x));
  }

  // Side labels
  if (sides.a || sides.BC) content += renderSideLabel(vB, vC, String(sides.a || sides.BC), 11, false);
  if (sides.b || sides.AB) content += renderSideLabel(vB, vA, String(sides.b || sides.AB), 11, false);
  if (sides.c || sides.AC) content += renderSideLabel(vA, vC, String(sides.c || sides.AC), 11, true);

  // Equal tick marks if requested
  if (options.showEqualTicks) {
    content += renderTickMarks(vA, vB, 1);
    content += renderTickMarks(vB, vC, 1);
  }

  // Vertex labels
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderEquilateralTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 20, y: 105 };
  const vC: Point = { x: 130, y: 105 };

  let content = '';

  // Triangle body
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Equal tick marks on all 3 sides by default or toggle
  if (options.showEqualTicks !== false) {
    content += renderTickMarks(vA, vB, 1);
    content += renderTickMarks(vA, vC, 1);
    content += renderTickMarks(vB, vC, 1);
  }

  // Altitude if requested
  if (options.showAltitude) {
    const vD: Point = { x: 75, y: 105 };
    content += renderDashedLine(vA, vD, String(sides.h || 'h'));
    content += renderRightAngleMarker(vD, vA, vC, 8, false);
    content += renderVertex(vD, labels.D || 'D', 'bottom');
  }

  // Angle arc
  const angleText = angles.B || angles.A || angles.theta || '60°';
  content += renderAngleArc(vB, vC, vA, 16, String(angleText));

  // Side label
  if (sides.a || sides.s) {
    content += renderSideLabel(vB, vC, String(sides.a || sides.s), 11, false);
  }

  // Vertices
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderIsoscelesTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 25, y: 105 };
  const vC: Point = { x: 125, y: 105 };
  const vD: Point = { x: 75, y: 105 };

  let content = '';

  // Triangle body
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Tick marks on legs AB and AC
  content += renderTickMarks(vA, vB, 1);
  content += renderTickMarks(vA, vC, 1);

  // Dashed altitude / median
  if (options.showAltitude !== false) {
    content += renderDashedLine(vA, vD, String(sides.h || 'h'));
    content += renderRightAngleMarker(vD, vA, vC, 8, false);
    content += renderVertex(vD, labels.D || 'D', 'bottom');
  }

  // Base angles
  if (angles.B || angles.theta) {
    content += renderAngleArc(vB, vC, vA, 15, String(angles.B || angles.theta));
    content += renderAngleArc(vC, vA, vB, 15, String(angles.C || angles.theta));
  } else if (angles.A) {
    content += renderAngleArc(vA, vB, vC, 16, String(angles.A));
  }

  // Side label for base
  if (sides.b || sides.BC) {
    content += renderSideLabel(vB, vC, String(sides.b || sides.BC), 11, false);
  }

  // Vertices
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderScaleneTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const vA: Point = { x: 55, y: 20 };
  const vB: Point = { x: 18, y: 104 };
  const vC: Point = { x: 140, y: 104 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  if (angles.A) content += renderAngleArc(vA, vB, vC, 15, String(angles.A));
  if (angles.B) content += renderAngleArc(vB, vC, vA, 15, String(angles.B));
  if (angles.C) content += renderAngleArc(vC, vA, vB, 15, String(angles.C));

  if (sides.a || sides.BC) content += renderSideLabel(vB, vC, String(sides.a || sides.BC), 11, false);
  if (sides.b || sides.AC) content += renderSideLabel(vA, vC, String(sides.b || sides.AC), 10, true);
  if (sides.c || sides.AB) content += renderSideLabel(vB, vA, String(sides.c || sides.AB), 10, false);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderTriangleWithAltitude(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 65, y: 18 };
  const vB: Point = { x: 18, y: 105 };
  const vC: Point = { x: 142, y: 105 };
  const vD: Point = { x: 65, y: 105 }; // foot of altitude

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Altitude AD
  content += renderDashedLine(vA, vD, String(sides.h || 'h'));
  content += renderRightAngleMarker(vD, vA, vC, 8, true);

  if (sides.b || sides.BC) content += renderSideLabel(vB, vC, String(sides.b || sides.BC), 11, false);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderTriangleWithMedian(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 18, y: 105 };
  const vC: Point = { x: 142, y: 105 };
  const vD: Point = midpoint(vB, vC); // midpoint of base BC (80, 105)

  let content = '';

  // Triangle body
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Median line AD
  content += `
    <line x1="${vA.x}" y1="${vA.y}" x2="${vD.x}" y2="${vD.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.6" stroke-dasharray="4 3" stroke-linecap="round" />
  `;

  // Equal tick marks on BD and DC to show D is midpoint
  content += renderTickMarks(vB, vD, 1);
  content += renderTickMarks(vD, vC, 1);

  // Side labels
  if (sides.c || sides.AB) content += renderSideLabel(vB, vA, String(sides.c || sides.AB), 10, false);
  if (sides.b || sides.AC) content += renderSideLabel(vA, vC, String(sides.b || sides.AC), 10, true);
  if (sides.m || sides.AD) content += renderSideLabel(vA, vD, String(sides.m || sides.AD), 8, false);

  // Vertices
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderVectorTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 20, y: 105 };
  const vC: Point = { x: 140, y: 105 };

  let content = '';

  // Triangle lines with directional arrows
  content += `
    <line x1="${vB.x}" y1="${vB.y}" x2="${vA.x}" y2="${vA.y}" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="${vA.x}" y1="${vA.y}" x2="${vC.x}" y2="${vC.y}" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="${vB.x}" y1="${vB.y}" x2="${vC.x}" y2="${vC.y}" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Arrows along vectors: B -> A, A -> C, B -> C
  content += renderParallelArrows(vB, vA, 1, 6);
  content += renderParallelArrows(vA, vC, 1, 6);
  content += renderParallelArrows(vB, vC, 1, 6);

  // Vector labels
  if (sides.u || sides.BA || sides.AB) content += renderSideLabel(vB, vA, String(sides.u || sides.BA || sides.AB), 11, false);
  if (sides.v || sides.AC) content += renderSideLabel(vA, vC, String(sides.v || sides.AC), 11, true);
  if (sides.w || sides.BC) content += renderSideLabel(vB, vC, String(sides.w || sides.BC), 11, false);

  // Vertices
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderInscribedCircleTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 155, h = 130;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 20, y: 110 };
  const vC: Point = { x: 135, y: 110 };

  // Incenter & inradius for equilateral approx
  const center: Point = { x: 75, y: 79 };
  const inradius = 31;

  let content = '';

  // Triangle
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Inscribed circle
  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${inradius}" 
            fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
            stroke="${GEO_THEME.accentBlue}" stroke-width="1.6" />
  `;

  // Center point
  content += `<circle cx="${center.x}" cy="${center.y}" r="2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || labels.I || 'O', 'left');

  // Inradius dashed line to base
  const contactBase: Point = { x: 75, y: 110 };
  content += renderDashedLine(center, contactBase, String(sides.r || 'r'));
  content += renderRightAngleMarker(contactBase, center, vC, 7, false);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircumscribedCircleTriangle(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 145;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};

  const center: Point = { x: 72, y: 72 };
  const radius = 55;

  const vA: Point = { x: 72, y: 17 };
  const vB: Point = { x: 24, y: 100 };
  const vC: Point = { x: 120, y: 100 };

  let content = '';

  // Circumcircle
  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.accentBlue}" stroke-width="1.5" />
  `;

  // Inscribed triangle
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Center O
  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'right');

  // Radii
  content += renderDashedLine(center, vA);
  content += renderDashedLine(center, vB);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderSimilarTriangles(options: GeometryOptions): RenderedGeometry {
  const w = 155, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  // Triangle ABC with midsegment / parallel line DE
  const vA: Point = { x: 75, y: 18 };
  const vB: Point = { x: 20, y: 105 };
  const vC: Point = { x: 135, y: 105 };

  const vD: Point = midpoint(vA, vB, 0.45);
  const vE: Point = midpoint(vA, vC, 0.45);

  let content = '';

  // Triangle ABC
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Parallel segment DE
  content += `
    <line x1="${vD.x.toFixed(1)}" y1="${vD.y.toFixed(1)}" 
          x2="${vE.x.toFixed(1)}" y2="${vE.y.toFixed(1)}" 
          stroke="${GEO_THEME.accentBlue}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Parallel arrows on DE and BC
  content += renderParallelArrows(vD, vE, 1, 5);
  content += renderParallelArrows(vB, vC, 1, 5);

  if (sides.DE) content += renderSideLabel(vD, vE, String(sides.DE), 8, true);
  if (sides.BC) content += renderSideLabel(vB, vC, String(sides.BC), 10, false);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom-left');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'left');
  content += renderVertex(vE, labels.E || 'E', 'right');

  return wrapSvg(content, w, h, hatchId, options);
}

// ============================================================================
// 2. QUADRILATERAL GENERATORS
// ============================================================================

export function renderRectangle(options: GeometryOptions): RenderedGeometry {
  const w = 155, h = 115;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 25, y: 25 };
  const vB: Point = { x: 130, y: 25 };
  const vC: Point = { x: 130, y: 90 };
  const vD: Point = { x: 25, y: 90 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Right angles at 4 corners
  content += renderRightAngleMarker(vA, vD, vB, 8, false);
  content += renderRightAngleMarker(vB, vA, vC, 8, false);
  content += renderRightAngleMarker(vC, vB, vD, 8, false);
  content += renderRightAngleMarker(vD, vC, vA, 8, false);

  // Equal tick marks (single tick on lengths, double on widths)
  if (options.showEqualTicks !== false) {
    content += renderTickMarks(vA, vB, 1);
    content += renderTickMarks(vD, vC, 1);
    content += renderTickMarks(vA, vD, 2);
    content += renderTickMarks(vB, vC, 2);
  }

  // Dimension labels
  if (sides.l || sides.w || sides.a || sides.b) {
    if (sides.l || sides.a) content += renderSideLabel(vD, vC, String(sides.l || sides.a), 11, false);
    if (sides.w || sides.b) content += renderSideLabel(vB, vC, String(sides.w || sides.b), 10, true);
  }

  // Diagonal if requested
  if (options.showDottedLines) {
    content += renderDashedLine(vA, vC, String(sides.d || ''));
  }

  content += renderVertex(vA, labels.A || 'A', 'top-left');
  content += renderVertex(vB, labels.B || 'B', 'top-right');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderSquare(options: GeometryOptions): RenderedGeometry {
  const w = 135, h = 135;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 25, y: 25 };
  const vB: Point = { x: 110, y: 25 };
  const vC: Point = { x: 110, y: 110 };
  const vD: Point = { x: 25, y: 110 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  content += renderRightAngleMarker(vA, vD, vB, 8, false);
  content += renderRightAngleMarker(vB, vA, vC, 8, false);
  content += renderRightAngleMarker(vC, vB, vD, 8, false);
  content += renderRightAngleMarker(vD, vC, vA, 8, false);

  if (options.showEqualTicks !== false) {
    content += renderTickMarks(vA, vB, 1);
    content += renderTickMarks(vB, vC, 1);
    content += renderTickMarks(vC, vD, 1);
    content += renderTickMarks(vD, vA, 1);
  }

  if (sides.s || sides.a) {
    content += renderSideLabel(vD, vC, String(sides.s || sides.a), 11, false);
  }

  content += renderVertex(vA, labels.A || 'A', 'top-left');
  content += renderVertex(vB, labels.B || 'B', 'top-right');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderParallelogram(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 120;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const vA: Point = { x: 45, y: 25 };
  const vB: Point = { x: 145, y: 25 };
  const vC: Point = { x: 120, y: 95 };
  const vD: Point = { x: 20, y: 95 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Parallel arrows on opposite pairs
  content += renderParallelArrows(vA, vB, 1, 5);
  content += renderParallelArrows(vD, vC, 1, 5);
  content += renderParallelArrows(vD, vA, 2, 5);
  content += renderParallelArrows(vC, vB, 2, 5);

  // Dashed altitude
  if (options.showAltitude !== false) {
    const footH: Point = { x: 45, y: 95 };
    content += renderDashedLine(vA, footH, String(sides.h || 'h'));
    content += renderRightAngleMarker(footH, vA, vC, 7, false);
  }

  // Angle arc
  if (angles.D || angles.theta) {
    content += renderAngleArc(vD, vC, vA, 15, String(angles.D || angles.theta));
  }

  if (sides.b || sides.base) {
    content += renderSideLabel(vD, vC, String(sides.b || sides.base), 11, false);
  }

  content += renderVertex(vA, labels.A || 'A', 'top-left');
  content += renderVertex(vB, labels.B || 'B', 'top-right');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderRhombus(options: GeometryOptions): RenderedGeometry {
  const w = 155, h = 130;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 77, y: 18 };
  const vB: Point = { x: 135, y: 65 };
  const vC: Point = { x: 77, y: 112 };
  const vD: Point = { x: 20, y: 65 };
  const vO: Point = { x: 77, y: 65 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Diagonals AC and BD
  content += renderDashedLine(vA, vC);
  content += renderDashedLine(vD, vB);

  // Right angle at center O
  content += renderRightAngleMarker(vO, vA, vB, 8, false);

  // Equal tick marks on all 4 sides
  content += renderTickMarks(vA, vB, 1);
  content += renderTickMarks(vB, vC, 1);
  content += renderTickMarks(vC, vD, 1);
  content += renderTickMarks(vD, vA, 1);

  if (sides.a || sides.s) content += renderSideLabel(vD, vC, String(sides.a || sides.s), 9, false);

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'right');
  content += renderVertex(vC, labels.C || 'C', 'bottom');
  content += renderVertex(vD, labels.D || 'D', 'left');
  content += renderVertex(vO, labels.O || 'O', 'bottom-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderTrapezium(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 120;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const vA: Point = { x: 45, y: 25 };
  const vB: Point = { x: 115, y: 25 };
  const vC: Point = { x: 145, y: 95 };
  const vD: Point = { x: 18, y: 95 };

  let content = '';

  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Parallel arrows on bases AB and DC
  content += renderParallelArrows(vA, vB, 1, 5);
  content += renderParallelArrows(vD, vC, 1, 5);

  // Altitude
  if (options.showAltitude !== false) {
    const footH: Point = { x: 45, y: 95 };
    content += renderDashedLine(vA, footH, String(sides.h || 'h'));
    content += renderRightAngleMarker(footH, vA, vC, 7, false);
  }

  if (sides.a || sides.top) content += renderSideLabel(vA, vB, String(sides.a || sides.top), 9, true);
  if (sides.b || sides.bottom) content += renderSideLabel(vD, vC, String(sides.b || sides.bottom), 11, false);

  content += renderVertex(vA, labels.A || 'A', 'top-left');
  content += renderVertex(vB, labels.B || 'B', 'top-right');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'bottom-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCyclicQuadrilateral(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 150;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const angles = options.angles || {};

  const center: Point = { x: 75, y: 75 };
  const radius = 58;

  const vA: Point = { x: 75, y: 17 };
  const vB: Point = { x: 130, y: 55 };
  const vC: Point = { x: 105, y: 128 };
  const vD: Point = { x: 22, y: 95 };

  let content = '';

  // Circle
  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.accentBlue}" stroke-width="1.4" />
  `;

  // Inscribed quad
  content += `
    <polygon points="${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y} ${vD.x},${vD.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Center O
  content += `<circle cx="${center.x}" cy="${center.y}" r="2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'bottom-right');

  // Opposite angles
  if (angles.B) content += renderAngleArc(vB, vC, vA, 14, String(angles.B));
  if (angles.D) content += renderAngleArc(vD, vA, vC, 14, String(angles.D));

  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'right');
  content += renderVertex(vC, labels.C || 'C', 'bottom-right');
  content += renderVertex(vD, labels.D || 'D', 'left');

  return wrapSvg(content, w, h, hatchId, options);
}

// ============================================================================
// 3. CIRCLE GEOMETRY GENERATORS
// ============================================================================

export function renderCircleRadius(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 140;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const center: Point = { x: 72, y: 70 };
  const radius = 50;
  const ptA: Point = { x: center.x + radius, y: center.y };

  let content = '';

  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
            stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Radius line
  content += `
    <line x1="${center.x}" y1="${center.y}" x2="${ptA.x}" y2="${ptA.y}" 
          stroke="${GEO_THEME.accentRed}" stroke-width="1.6" />
  `;

  // Radius label
  content += renderSideLabel(center, ptA, String(sides.r || 'r'), 9, true);

  // Center dot & vertices
  content += `<circle cx="${center.x}" cy="${center.y}" r="2.4" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'left');
  content += renderVertex(ptA, labels.A || 'A', 'right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircleChord(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 145;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const center: Point = { x: 75, y: 72 };
  const radius = 54;

  const vA: Point = { x: 30, y: 104 };
  const vB: Point = { x: 120, y: 104 };
  const vM: Point = midpoint(vA, vB); // chord midpoint

  let content = '';

  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Chord AB
  content += `
    <line x1="${vA.x}" y1="${vA.y}" x2="${vB.x}" y2="${vB.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Perpendicular OM
  content += renderDashedLine(center, vM, String(sides.d || ''));
  content += renderRightAngleMarker(vM, center, vB, 7, false);

  // Equal tick marks on AM and MB
  content += renderTickMarks(vA, vM, 1);
  content += renderTickMarks(vM, vB, 1);

  // Radius OA
  content += renderDashedLine(center, vA, String(sides.r || 'r'));

  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'top');
  content += renderVertex(vA, labels.A || 'A', 'bottom-left');
  content += renderVertex(vB, labels.B || 'B', 'bottom-right');
  content += renderVertex(vM, labels.M || 'M', 'bottom');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircleTangent(options: GeometryOptions): RenderedGeometry {
  const w = 175, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const center: Point = { x: 52, y: 46 };
  const radius = 35;

  // Tangency point T at bottom of circle where tangent is perfectly horizontal
  const vT: Point = { x: 52, y: 46 + radius }; // (52, 81)
  const vP: Point = { x: 138, y: 81 };         // external point P
  const tangentBack: Point = { x: 22, y: 81 }; // slight backward extension of tangent line

  let content = '';

  // Circle
  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Tangent line through T extending to P
  content += `
    <line x1="${tangentBack.x}" y1="${tangentBack.y}" 
          x2="${vP.x}" y2="${vP.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Radius OT (perpendicular to tangent)
  content += `
    <line x1="${center.x}" y1="${center.y}" x2="${vT.x}" y2="${vT.y}" 
          stroke="${GEO_THEME.accentBlue || '#2563eb'}" stroke-width="1.6" />
  `;

  // Hypotenuse OP (completing right-angled triangle OTP)
  content += `
    <line x1="${center.x}" y1="${center.y}" x2="${vP.x}" y2="${vP.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.3" stroke-dasharray="4,3" />
  `;

  // Right-angle marker at point of tangency T
  content += renderRightAngleMarker(vT, center, vP, 8, true);

  // Label OT = r (placed to the left of vertical segment OT, outside the triangle)
  const rLabel = sides.r || sides.ot || (sides.a ? sides.a : '');
  if (rLabel) {
    content += renderSideLabel(center, vT, String(rLabel), 12, false);
  }

  // Label PT = t (placed below horizontal segment TP)
  const tLabel = sides.t || sides.pt || (sides.b ? sides.b : '');
  if (tLabel) {
    content += renderSideLabel(vT, vP, String(tLabel), 11, false);
  }

  // Label OP = hyp (placed above slanted hypotenuse OP)
  const hypLabel = sides.op || sides.hyp || (sides.c ? sides.c : '');
  if (hypLabel) {
    content += renderSideLabel(center, vP, String(hypLabel), 10, true);
  }

  // Center O dot and label
  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" stroke="#ffffff" stroke-width="0.8" />`;
  content += renderVertex(center, labels.O || 'O', 'top-left');

  // Tangency point T dot and label
  content += `<circle cx="${vT.x}" cy="${vT.y}" r="2.2" fill="${GEO_THEME.ink}" stroke="#ffffff" stroke-width="0.8" />`;
  content += renderVertex(vT, labels.T || 'T', 'bottom-left');

  // External point P dot and label
  content += `<circle cx="${vP.x}" cy="${vP.y}" r="2.2" fill="${GEO_THEME.ink}" stroke="#ffffff" stroke-width="0.8" />`;
  content += renderVertex(vP, labels.P || 'P', 'right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircleTwoTangents(options: GeometryOptions): RenderedGeometry {
  const w = 175, h = 145;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const center: Point = { x: 55, y: 72 };
  const radius = 42;
  const vP: Point = { x: 155, y: 72 };

  // Tangency points A and B
  const dCenterP = dist(center, vP); // 100
  const angleT = Math.acos(radius / dCenterP); // ~65 deg
  const vA: Point = { x: center.x + radius * Math.cos(angleT), y: center.y - radius * Math.sin(angleT) };
  const vB: Point = { x: center.x + radius * Math.cos(angleT), y: center.y + radius * Math.sin(angleT) };

  let content = '';

  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Tangents PA and PB
  content += `
    <line x1="${vP.x}" y1="${vP.y}" x2="${vA.x.toFixed(1)}" y2="${vA.y.toFixed(1)}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="${vP.x}" y1="${vP.y}" x2="${vB.x.toFixed(1)}" y2="${vB.y.toFixed(1)}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Radii OA and OB
  content += renderDashedLine(center, vA);
  content += renderDashedLine(center, vB);

  // Line OP
  content += renderDashedLine(center, vP);

  // Right angles at A and B
  content += renderRightAngleMarker(vA, center, vP, 7, false);
  content += renderRightAngleMarker(vB, center, vP, 7, false);

  // Equal tick marks on tangents PA and PB
  content += renderTickMarks(vP, vA, 1);
  content += renderTickMarks(vP, vB, 1);

  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'left');
  content += renderVertex(vA, labels.A || 'A', 'top');
  content += renderVertex(vB, labels.B || 'B', 'bottom');
  content += renderVertex(vP, labels.P || 'P', 'right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircleCentralInscribed(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 150;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const angles = options.angles || {};

  const center: Point = { x: 75, y: 75 };
  const radius = 56;

  const vA: Point = { x: 30, y: 110 };
  const vB: Point = { x: 120, y: 110 };
  const vC: Point = { x: 75, y: 19 }; // point on major arc

  let content = '';

  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Central angle lines OA, OB
  content += `
    <line x1="${center.x}" y1="${center.y}" x2="${vA.x}" y2="${vA.y}" 
          stroke="${GEO_THEME.accentBlue}" stroke-width="1.6" stroke-linecap="round" />
    <line x1="${center.x}" y1="${center.y}" x2="${vB.x}" y2="${vB.y}" 
          stroke="${GEO_THEME.accentBlue}" stroke-width="1.6" stroke-linecap="round" />
  `;

  // Inscribed angle lines CA, CB
  content += `
    <line x1="${vC.x}" y1="${vC.y}" x2="${vA.x}" y2="${vA.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.6" stroke-linecap="round" />
    <line x1="${vC.x}" y1="${vC.y}" x2="${vB.x}" y2="${vB.y}" 
          stroke="${GEO_THEME.ink}" stroke-width="1.6" stroke-linecap="round" />
  `;

  // Angle arcs
  content += renderAngleArc(center, vA, vB, 15, String(angles.central || angles.O || '2θ'));
  content += renderAngleArc(vC, vA, vB, 18, String(angles.inscribed || angles.C || 'θ'));

  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'top');
  content += renderVertex(vA, labels.A || 'A', 'bottom-left');
  content += renderVertex(vB, labels.B || 'B', 'bottom-right');
  content += renderVertex(vC, labels.C || 'C', 'top');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderSemicircleAngle(options: GeometryOptions): RenderedGeometry {
  const w = 150, h = 120;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};

  const center: Point = { x: 75, y: 95 };
  const radius = 55;

  const vA: Point = { x: 20, y: 95 };
  const vB: Point = { x: 130, y: 95 };
  const vC: Point = { x: 50, y: 44 }; // on circumference

  let content = '';

  // Semicircle arc
  content += `
    <path d="M ${vA.x} ${vA.y} A ${radius} ${radius} 0 0 1 ${vB.x} ${vB.y} Z" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Triangle ABC
  content += `
    <polygon points="${vA.x},${vA.y} ${vC.x},${vC.y} ${vB.x},${vB.y}" 
             fill="${options.showShading ? `url(#${hatchId})` : 'none'}" 
             stroke="${GEO_THEME.accentBlue}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Right-angle marker at C
  content += renderRightAngleMarker(vC, vA, vB, 8, true);

  content += `<circle cx="${center.x}" cy="${center.y}" r="2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'bottom');
  content += renderVertex(vA, labels.A || 'A', 'bottom-left');
  content += renderVertex(vB, labels.B || 'B', 'bottom-right');
  content += renderVertex(vC, labels.C || 'C', 'top-left');

  return wrapSvg(content, w, h, hatchId, options);
}

// ============================================================================
// 4. LINES & ANGLES GENERATORS
// ============================================================================

export function renderParallelTransversal(options: GeometryOptions): RenderedGeometry {
  const w = 160, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const angles = options.angles || {};

  let content = '';

  // Two parallel horizontal lines
  content += `
    <line x1="15" y1="35" x2="145" y2="35" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="15" y1="90" x2="145" y2="90" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Parallel arrows
  content += renderParallelArrows({ x: 15, y: 35 }, { x: 145, y: 35 }, 1, 5);
  content += renderParallelArrows({ x: 15, y: 90 }, { x: 145, y: 90 }, 1, 5);

  // Transversal line
  const pTrans1: Point = { x: 45, y: 15 };
  const pTrans2: Point = { x: 115, y: 110 };
  content += `
    <line x1="${pTrans1.x}" y1="${pTrans1.y}" x2="${pTrans2.x}" y2="${pTrans2.y}" 
          stroke="${GEO_THEME.accentBlue}" stroke-width="1.8" stroke-linecap="round" />
  `;

  // Intersections
  const int1: Point = { x: 60, y: 35 };
  const int2: Point = { x: 100, y: 90 };

  // Alternate interior angles
  const ang1Val = angles.angle1 || angles.a || '1';
  const ang2Val = angles.angle2 || angles.b || '2';

  content += renderAngleArc(int1, { x: 145, y: 35 }, pTrans2, 14, String(ang1Val));
  content += renderAngleArc(int2, { x: 15, y: 90 }, pTrans1, 14, String(ang2Val));

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderIntersectingLines(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const angles = options.angles || {};

  const center: Point = { x: 72, y: 62 };

  let content = '';

  // Two crossed lines
  content += `
    <line x1="20" y1="25" x2="124" y2="99" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="20" y1="99" x2="124" y2="25" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />
  `;

  const thetaVal = angles.theta || angles.x || 'x';
  content += renderAngleArc(center, { x: 124, y: 99 }, { x: 124, y: 25 }, 16, String(thetaVal));
  content += renderAngleArc(center, { x: 20, y: 25 }, { x: 20, y: 99 }, 16, String(thetaVal));

  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'bottom');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderAngleBisector(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 125;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const angles = options.angles || {};

  const vO: Point = { x: 25, y: 100 };
  const vA: Point = { x: 130, y: 100 };
  const vB: Point = { x: 80, y: 20 };
  const vC: Point = { x: 110, y: 55 }; // bisector ray

  let content = '';

  // Ray OA
  content += `<line x1="${vO.x}" y1="${vO.y}" x2="${vA.x}" y2="${vA.y}" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />`;
  // Ray OB
  content += `<line x1="${vO.x}" y1="${vO.y}" x2="${vB.x}" y2="${vB.y}" stroke="${GEO_THEME.ink}" stroke-width="1.8" stroke-linecap="round" />`;
  // Bisector OC
  content += `<line x1="${vO.x}" y1="${vO.y}" x2="${vC.x}" y2="${vC.y}" stroke="${GEO_THEME.accentBlue}" stroke-width="1.7" stroke-dasharray="4,2.5" stroke-linecap="round" />`;

  const arcLabel = angles.alpha || angles.theta || '•';
  content += renderAngleArc(vO, vA, vC, 18, String(arcLabel));
  content += renderAngleArc(vO, vC, vB, 22, String(arcLabel));

  content += renderVertex(vO, labels.O || 'O', 'bottom-left');
  content += renderVertex(vA, labels.A || 'A', 'bottom-right');
  content += renderVertex(vB, labels.B || 'B', 'top');
  content += renderVertex(vC, labels.C || 'C', 'right');

  return wrapSvg(content, w, h, hatchId, options);
}

// ============================================================================
// 5. SHADED REGIONS FOR AREA PROBLEMS
// ============================================================================

export function renderShadedSector(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 140;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};
  const angles = options.angles || {};

  const center: Point = { x: 35, y: 105 };
  const radius = 90;
  const startAng = 0; // horizontal
  const endAng = -Math.PI / 3; // -60 deg

  const p1: Point = { x: center.x + radius * Math.cos(startAng), y: center.y + radius * Math.sin(startAng) };
  const p2: Point = { x: center.x + radius * Math.cos(endAng), y: center.y + radius * Math.sin(endAng) };

  let content = '';

  // Shaded sector
  content += `
    <path d="M ${center.x} ${center.y} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 0 ${p2.x} ${p2.y} Z" 
          fill="url(#${hatchId})" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Central angle arc
  content += renderAngleArc(center, p1, p2, 22, String(angles.theta || angles.angle || '60°'));

  // Radius label
  content += renderSideLabel(center, p1, String(sides.r || 'r'), 10, false);

  content += `<circle cx="${center.x}" cy="${center.y}" r="2.2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'bottom-left');
  content += renderVertex(p1, labels.A || 'A', 'bottom-right');
  content += renderVertex(p2, labels.B || 'B', 'top-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderShadedSegment(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 145;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};

  const center: Point = { x: 72, y: 72 };
  const radius = 54;

  const vA: Point = { x: 72 - radius * Math.cos(Math.PI / 4), y: 72 + radius * Math.sin(Math.PI / 4) };
  const vB: Point = { x: 72 + radius * Math.cos(Math.PI / 4), y: 72 + radius * Math.sin(Math.PI / 4) };

  let content = '';

  // Full circle outline
  content += `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" fill="none" stroke="${GEO_THEME.inkSecondary}" stroke-width="1.3" />
  `;

  // Shaded segment between chord AB and minor arc
  content += `
    <path d="M ${vA.x.toFixed(1)} ${vA.y.toFixed(1)} L ${vB.x.toFixed(1)} ${vB.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${vA.x.toFixed(1)} ${vA.y.toFixed(1)} Z" 
          fill="url(#${hatchId})" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Radii to A and B
  content += renderDashedLine(center, vA);
  content += renderDashedLine(center, vB);

  content += `<circle cx="${center.x}" cy="${center.y}" r="2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex(center, labels.O || 'O', 'top');
  content += renderVertex(vA, labels.A || 'A', 'bottom-left');
  content += renderVertex(vB, labels.B || 'B', 'bottom-right');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCircleInSquare(options: GeometryOptions): RenderedGeometry {
  const w = 140, h = 140;
  const hatchId = getUniqueId('hatch');
  const sides = options.sides || {};

  const s = 100;
  const ox = 20, oy = 20;
  const r = s / 2;
  const cx = ox + r, cy = oy + r;

  let content = '';

  // Shaded background (square minus circle)
  content += `
    <!-- Outer square filled with hatch -->
    <rect x="${ox}" y="${oy}" width="${s}" height="${s}" fill="url(#${hatchId})" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
    <!-- Cutout inner white circle -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Radius line
  content += renderDashedLine({ x: cx, y: cy }, { x: cx + r, y: cy }, String(sides.r || 'r'));
  content += `<circle cx="${cx}" cy="${cy}" r="2" fill="${GEO_THEME.ink}" />`;

  if (sides.a || sides.s) {
    content += renderSideLabel({ x: ox, y: oy + s }, { x: ox + s, y: oy + s }, String(sides.a || sides.s), 11, false);
  }

  return wrapSvg(content, w, h, hatchId, options);
}

// ============================================================================
// 6. 3D SOLID GENERATORS
// ============================================================================

export function renderCylinder(options: GeometryOptions): RenderedGeometry {
  const w = 135, h = 145;
  const hatchId = getUniqueId('hatch');
  const sides = options.sides || {};

  const cx = 67, topY = 32, bottomY = 112;
  const rx = 40, ry = 14;

  let content = '';

  // Top ellipse
  content += `
    <ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Side lines
  content += `
    <line x1="${cx - rx}" y1="${topY}" x2="${cx - rx}" y2="${bottomY}" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
    <line x1="${cx + rx}" y1="${topY}" x2="${cx + rx}" y2="${bottomY}" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Bottom front arc (solid)
  content += `
    <path d="M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY}" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;
  // Bottom back arc (dashed hidden)
  content += `
    <path d="M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${bottomY}" 
          fill="none" stroke="${GEO_THEME.inkMuted}" stroke-width="1.2" stroke-dasharray="3,3" />
  `;

  // Height line (dashed)
  content += renderDashedLine({ x: cx, y: topY }, { x: cx, y: bottomY }, String(sides.h || 'h'));

  // Top radius line
  content += renderDashedLine({ x: cx, y: topY }, { x: cx + rx, y: topY }, String(sides.r || 'r'));

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCone(options: GeometryOptions): RenderedGeometry {
  const w = 135, h = 145;
  const hatchId = getUniqueId('hatch');
  const sides = options.sides || {};
  const labels = options.labels || {};

  const vApex: Point = { x: 67, y: 18 };
  const bottomY = 118;
  const cx = 67;
  const rx = 42, ry = 14;

  let content = '';

  // Lateral edges
  content += `
    <line x1="${vApex.x}" y1="${vApex.y}" x2="${cx - rx}" y2="${bottomY}" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
    <line x1="${vApex.x}" y1="${vApex.y}" x2="${cx + rx}" y2="${bottomY}" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Base front arc (solid)
  content += `
    <path d="M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY}" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;
  // Base back arc (dashed hidden)
  content += `
    <path d="M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${bottomY}" 
          fill="none" stroke="${GEO_THEME.inkMuted}" stroke-width="1.2" stroke-dasharray="3,3" />
  `;

  // Altitude height h
  content += renderDashedLine(vApex, { x: cx, y: bottomY }, String(sides.h || 'h'));
  content += renderRightAngleMarker({ x: cx, y: bottomY }, vApex, { x: cx + rx, y: bottomY }, 7, false);

  // Radius r
  content += renderDashedLine({ x: cx, y: bottomY }, { x: cx + rx, y: bottomY }, String(sides.r || 'r'));

  // Slant height label
  if (sides.l) {
    content += renderSideLabel(vApex, { x: cx + rx, y: bottomY }, String(sides.l), 10, true);
  }

  content += renderVertex(vApex, labels.V || 'V', 'top');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderSphere(options: GeometryOptions): RenderedGeometry {
  const w = 135, h = 135;
  const hatchId = getUniqueId('hatch');
  const labels = options.labels || {};
  const sides = options.sides || {};

  const cx = 67, cy = 67;
  const r = 50;

  let content = '';

  // Outer circle
  content += `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Equator ellipse front (solid)
  content += `
    <path d="M ${cx - r} ${cy} A ${r} ${r * 0.32} 0 0 0 ${cx + r} ${cy}" 
          fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.4" />
  `;
  // Equator ellipse back (dashed)
  content += `
    <path d="M ${cx - r} ${cy} A ${r} ${r * 0.32} 0 0 1 ${cx + r} ${cy}" 
          fill="none" stroke="${GEO_THEME.inkMuted}" stroke-width="1.2" stroke-dasharray="3,3" />
  `;

  // Radius line
  content += renderDashedLine({ x: cx, y: cy }, { x: cx + r, y: cy }, String(sides.r || 'r'));

  content += `<circle cx="${cx}" cy="${cy}" r="2" fill="${GEO_THEME.ink}" />`;
  content += renderVertex({ x: cx, y: cy }, labels.O || 'O', 'top-left');

  return wrapSvg(content, w, h, hatchId, options);
}

export function renderCube(options: GeometryOptions): RenderedGeometry {
  const w = 145, h = 135;
  const hatchId = getUniqueId('hatch');
  const sides = options.sides || {};

  // Isometric / Cabinet projection
  const s = 65; // side length
  const dx = 28, dy = -22; // depth offset
  const ox = 25, oy = 55;

  const fA: Point = { x: ox, y: oy };
  const fB: Point = { x: ox + s, y: oy };
  const fC: Point = { x: ox + s, y: oy + s };
  const fD: Point = { x: ox, y: oy + s };

  const bA: Point = { x: fA.x + dx, y: fA.y + dy };
  const bB: Point = { x: fB.x + dx, y: fB.y + dy };
  const bC: Point = { x: fC.x + dx, y: fC.y + dy };
  const bD: Point = { x: fD.x + dx, y: fD.y + dy };

  let content = '';

  // Visible front face
  content += `
    <polygon points="${fA.x},${fA.y} ${fB.x},${fB.y} ${fC.x},${fC.y} ${fD.x},${fD.y}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Visible top face
  content += `
    <polygon points="${fA.x},${fA.y} ${bA.x},${bA.y} ${bB.x},${bB.y} ${fB.x},${fB.y}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Visible right face
  content += `
    <polygon points="${fB.x},${fB.y} ${bB.x},${bB.y} ${bC.x},${bC.y} ${fC.x},${fC.y}" 
             fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
  `;

  // Hidden edges (dashed)
  content += renderDashedLine(fD, bD);
  content += renderDashedLine(bD, bA);
  content += renderDashedLine(bD, bC);

  if (sides.a || sides.s) {
    content += renderSideLabel(fD, fC, String(sides.a || sides.s), 10, false);
  }

  return wrapSvg(content, w, h, hatchId, options);
}

// Registry map of generators
export const GEOMETRY_GENERATORS: Record<string, (options: GeometryOptions) => RenderedGeometry> = {
  'right-triangle': renderRightTriangle,
  'equilateral-triangle': renderEquilateralTriangle,
  'isosceles-triangle': renderIsoscelesTriangle,
  'scalene-triangle': renderScaleneTriangle,
  'triangle-altitude': renderTriangleWithAltitude,
  'triangle-median': renderTriangleWithMedian,
  'vector-triangle': renderVectorTriangle,
  'triangle-incircle': renderInscribedCircleTriangle,
  'triangle-circumcircle': renderCircumscribedCircleTriangle,
  'similar-triangles': renderSimilarTriangles,

  'rectangle': renderRectangle,
  'square': renderSquare,
  'parallelogram': renderParallelogram,
  'rhombus': renderRhombus,
  'trapezium': renderTrapezium,
  'cyclic-quadrilateral': renderCyclicQuadrilateral,

  'circle-radius': renderCircleRadius,
  'circle-chord': renderCircleChord,
  'circle-tangent': renderCircleTangent,
  'circle-two-tangents': renderCircleTwoTangents,
  'circle-central-inscribed': renderCircleCentralInscribed,
  'circle-semicircle-angle': renderSemicircleAngle,

  'parallel-transversal': renderParallelTransversal,
  'intersecting-lines': renderIntersectingLines,
  'angle-bisector': renderAngleBisector,

  'shaded-sector': renderShadedSector,
  'shaded-segment': renderShadedSegment,
  'circle-in-square': renderCircleInSquare,

  'cylinder': renderCylinder,
  'cone': renderCone,
  'sphere': renderSphere,
  'cube': renderCube,
};
