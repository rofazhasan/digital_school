/**
 * Universal Custom Geometry Engine
 * Allows teachers and users to generate ANY arbitrary geometric figure,
 * composite shape, multi-circle diagram, or custom problem.
 *
 * Syntax Example:
 * ##GEO:custom[
 *   points: A(25,95), B(125,95), C(75,20), D(75,95);
 *   lines: A-B, B-C, C-A;
 *   dash: C-D;
 *   right: C-D-B;
 *   angle: A-B-C(45°);
 *   tick: A-C, B-C;
 *   shade: A-D-C
 * ][size:small]##
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
import type { GeometryOptions, RenderedGeometry, DiagramSize, DiagramStyleMode } from './types';

export interface CustomGeometryParsed {
  points: Map<string, Point>;
  lines: Array<{ from: string; to: string; dashed?: boolean }>;
  circles: Array<{ center: string; radius: number; dashed?: boolean }>;
  rightAngles: Array<{ corner: string; arm1?: string; arm2?: string }>;
  angleArcs: Array<{ vertex: string; arm1?: string; arm2?: string; label?: string }>;
  ticks: Array<{ from: string; to: string; count: 1 | 2 }>;
  parallels: Array<Array<{ from: string; to: string }>>;
  shadedPolygons: Array<string[]>; // list of vertex names
  sideLabels: Array<{ from: string; to: string; label: string }>;
  freeTexts: Array<{ text: string; x: number; y: number }>;
  style: DiagramStyleMode;
  size: DiagramSize;
}

/**
 * Parses freeform custom geometry commands
 */
export function parseCustomGeometryDsl(input: string): CustomGeometryParsed {
  const result: CustomGeometryParsed = {
    points: new Map(),
    lines: [],
    circles: [],
    rightAngles: [],
    angleArcs: [],
    ticks: [],
    parallels: [],
    shadedPolygons: [],
    sideLabels: [],
    freeTexts: [],
    style: 'drafting',
    size: 'small',
  };

  if (!input) return result;

  // Split into statements by semicolon
  const statements = input.split(';').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    const colonIdx = stmt.indexOf(':');
    let key = '';
    let val = stmt;

    if (colonIdx !== -1) {
      key = stmt.slice(0, colonIdx).trim().toLowerCase();
      val = stmt.slice(colonIdx + 1).trim();
    }

    // 1. Points definition: e.g. "A(20,90), B(120,90), C(70,25)"
    if (key === 'points' || key === 'pts' || (!key && /^[A-Za-z0-9_]+\s*\([0-9.,\s-]+\)/.test(stmt))) {
      const pointMatches = (key ? val : stmt).matchAll(/([A-Za-z0-9_]+)\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g);
      for (const m of pointMatches) {
        result.points.set(m[1], { x: parseFloat(m[2]), y: parseFloat(m[3]) });
      }
      continue;
    }

    // 2. Lines / Segments: e.g. "lines: A-B, B-C, C-A"
    if (key === 'lines' || key === 'line' || key === 'segments') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        const [from, to] = item.split(/[-–—]/).map(s => s.trim());
        if (from && to) result.lines.push({ from, to, dashed: false });
      }
      continue;
    }

    // 3. Dashed lines: e.g. "dash: C-D, A-C"
    if (key === 'dash' || key === 'dashed' || key === 'altitude' || key === 'median') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        const [from, to] = item.split(/[-–—]/).map(s => s.trim());
        if (from && to) result.lines.push({ from, to, dashed: true });
      }
      continue;
    }

    // 4. Right angles: e.g. "right: B" or "right: A-B-C"
    if (key === 'right' || key === 'rightangle') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        if (item.includes('-')) {
          const [arm1, corner, arm2] = item.split(/[-–—]/).map(s => s.trim());
          if (corner) result.rightAngles.push({ corner, arm1, arm2 });
        } else {
          result.rightAngles.push({ corner: item });
        }
      }
      continue;
    }

    // 5. Angle arcs: e.g. "angle: A-B-C(45°)" or "angle: B=30°" or "arc: B(θ)"
    if (key === 'angle' || key === 'arc' || key === 'angles') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        const m = item.match(/^([A-Za-z0-9_]+)(?:-([A-Za-z0-9_]+)-([A-Za-z0-9_]+))?(?:[=(](.*?)[)])?$/);
        if (m) {
          if (m[2] && m[3]) {
            // A-B-C format where B is vertex
            result.angleArcs.push({ vertex: m[2], arm1: m[1], arm2: m[3], label: m[4] });
          } else {
            result.angleArcs.push({ vertex: m[1], label: m[4] });
          }
        }
      }
      continue;
    }

    // 6. Tick marks: e.g. "tick: A-B, A-C" or "ticks: A-B(1), C-D(2)"
    if (key === 'tick' || key === 'ticks' || key === 'equal') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        const m = item.match(/^([A-Za-z0-9_]+)[-–—]([A-Za-z0-9_]+)(?:\(([12])\))?$/);
        if (m) {
          const count = (m[3] === '2' ? 2 : 1) as 1 | 2;
          result.ticks.push({ from: m[1], to: m[2], count });
        }
      }
      continue;
    }

    // 7. Parallel lines: e.g. "parallel: A-B, D-C"
    if (key === 'parallel' || key === 'arrows') {
      const pairs = val.split(/&|and/i).map(s => s.trim());
      const group: Array<{ from: string; to: string }> = [];
      const lineTokens = (pairs.length > 1 ? pairs : val.split(',')).map(s => s.trim());
      for (const lt of lineTokens) {
        const [from, to] = lt.split(/[-–—]/).map(s => s.trim());
        if (from && to) group.push({ from, to });
      }
      if (group.length > 0) result.parallels.push(group);
      continue;
    }

    // 8. Circles: e.g. "circle: O(r=35)" or "circle: O, 40"
    if (key === 'circle') {
      const m = val.match(/([A-Za-z0-9_]+)(?:.*?r\s*=\s*([\d.]+)|[,\s]+([\d.]+))/);
      if (m) {
        const center = m[1];
        const radius = parseFloat(m[2] || m[3] || '40');
        result.circles.push({ center, radius });
      }
      continue;
    }

    // 9. Shading: e.g. "shade: A-B-C" or "shade: A-B-C-D"
    if (key === 'shade' || key === 'shaded') {
      const polys = val.split(',').map(s => s.trim());
      for (const p of polys) {
        const verts = p.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
        if (verts.length >= 3) result.shadedPolygons.push(verts);
      }
      continue;
    }

    // 10. Side labels: e.g. "label: A-B(5 cm), B-C(12 cm)"
    if (key === 'label' || key === 'labels' || key === 'side') {
      const items = val.split(',').map(s => s.trim());
      for (const item of items) {
        const m = item.match(/([A-Za-z0-9_]+)[-–—]([A-Za-z0-9_]+)\s*\((.*?)\)/);
        if (m) {
          result.sideLabels.push({ from: m[1], to: m[2], label: m[3] });
        }
      }
      continue;
    }
  }

  return result;
}

/**
 * Normalizes user points to fit snugly inside target canvas (w x h)
 * with minimal padding so the diagram is space-efficient.
 */
function normalizeAndScalePoints(
  rawPoints: Map<string, Point>,
  targetWidth: number = 155,
  targetHeight: number = 125,
  padding: number = 22
): Map<string, Point> {
  if (rawPoints.size === 0) return rawPoints;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  rawPoints.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const availW = targetWidth - padding * 2;
  const availH = targetHeight - padding * 2;

  const scale = Math.min(availW / spanX, availH / spanY);

  const scaledW = spanX * scale;
  const scaledH = spanY * scale;

  const offsetX = padding + (availW - scaledW) / 2;
  const offsetY = padding + (availH - scaledH) / 2;

  const scaledPoints = new Map<string, Point>();
  rawPoints.forEach((p, name) => {
    scaledPoints.set(name, {
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (p.y - minY) * scale,
    });
  });

  return scaledPoints;
}

/**
 * Renders arbitrary custom geometry from DSL commands
 */
export function renderCustomGeometry(
  dslString: string,
  options: GeometryOptions
): RenderedGeometry {
  const parsed = parseCustomGeometryDsl(dslString);

  const w = options.width || 160;
  const h = options.height || 125;
  const hatchId = getUniqueId('custom-hatch');

  // Scale and center points
  const points = normalizeAndScalePoints(parsed.points, w, h);

  let content = '';

  // 1. Shaded Polygons (rendered first in background)
  for (const poly of parsed.shadedPolygons) {
    const polyPts = poly.map(name => points.get(name)).filter(Boolean) as Point[];
    if (polyPts.length >= 3) {
      const ptsStr = polyPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      content += `
        <polygon points="${ptsStr}" fill="url(#${hatchId})" stroke="none" />
      `;
    }
  }

  // 2. Circles
  for (const c of parsed.circles) {
    const centerPt = points.get(c.center);
    if (centerPt) {
      content += `
        <circle cx="${centerPt.x.toFixed(1)}" cy="${centerPt.y.toFixed(1)}" r="${c.radius}" 
                fill="none" stroke="${GEO_THEME.ink}" stroke-width="1.8" />
      `;
    }
  }

  // 3. Lines & Dashed Segments
  for (const line of parsed.lines) {
    const p1 = points.get(line.from);
    const p2 = points.get(line.to);
    if (p1 && p2) {
      if (line.dashed) {
        content += renderDashedLine(p1, p2);
      } else {
        content += renderDraftingLine(p1, p2, 0, { stroke: GEO_THEME.ink, strokeWidth: 1.8 });
      }
    }
  }

  // 4. Right angle indicators
  for (const ra of parsed.rightAngles) {
    const cornerPt = points.get(ra.corner);
    if (cornerPt) {
      let arm1Pt: Point | undefined;
      let arm2Pt: Point | undefined;

      if (ra.arm1 && ra.arm2) {
        arm1Pt = points.get(ra.arm1);
        arm2Pt = points.get(ra.arm2);
      } else {
        // Find connected lines to this corner
        const connected = parsed.lines
          .filter(l => l.from === ra.corner || l.to === ra.corner)
          .map(l => (l.from === ra.corner ? l.to : l.from));
        if (connected.length >= 2) {
          arm1Pt = points.get(connected[0]);
          arm2Pt = points.get(connected[1]);
        }
      }

      if (cornerPt && arm1Pt && arm2Pt) {
        content += renderRightAngleMarker(cornerPt, arm1Pt, arm2Pt, 8, true);
      }
    }
  }

  // 5. Angle arcs
  for (const aa of parsed.angleArcs) {
    const vPt = points.get(aa.vertex);
    if (vPt) {
      let arm1Pt: Point | undefined;
      let arm2Pt: Point | undefined;

      if (aa.arm1 && aa.arm2) {
        arm1Pt = points.get(aa.arm1);
        arm2Pt = points.get(aa.arm2);
      } else {
        const connected = parsed.lines
          .filter(l => l.from === aa.vertex || l.to === aa.vertex)
          .map(l => (l.from === aa.vertex ? l.to : l.from));
        if (connected.length >= 2) {
          arm1Pt = points.get(connected[0]);
          arm2Pt = points.get(connected[1]);
        }
      }

      if (arm1Pt && arm2Pt) {
        content += renderAngleArc(vPt, arm1Pt, arm2Pt, 15, aa.label);
      }
    }
  }

  // 6. Tick marks
  for (const tick of parsed.ticks) {
    const p1 = points.get(tick.from);
    const p2 = points.get(tick.to);
    if (p1 && p2) {
      content += renderTickMarks(p1, p2, tick.count);
    }
  }

  // 7. Parallel arrows
  for (const group of parsed.parallels) {
    for (let i = 0; i < group.length; i++) {
      const p1 = points.get(group[i].from);
      const p2 = points.get(group[i].to);
      if (p1 && p2) {
        content += renderParallelArrows(p1, p2, (i > 1 ? 2 : 1) as 1 | 2);
      }
    }
  }

  // 8. Side labels
  for (const sl of parsed.sideLabels) {
    const p1 = points.get(sl.from);
    const p2 = points.get(sl.to);
    if (p1 && p2) {
      content += renderSideLabel(p1, p2, sl.label, 10, false);
    }
  }

  // 9. Vertices with labels
  points.forEach((pt, name) => {
    content += renderVertex(pt, name, 'auto', { x: w / 2, y: h / 2 });
  });

  const isHandDrawn = options.style === 'hand-drawn';
  const size = options.size || 'small';
  let maxWidth = 160;
  if (size === 'tiny') maxWidth = 95;
  else if (size === 'small') maxWidth = 145;
  else if (size === 'compact') maxWidth = 165;
  else if (size === 'medium') maxWidth = 220;
  else if (size === 'large') maxWidth = 320;

  const svg = `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" 
     class="geometry-diagram-svg ${isHandDrawn ? 'geo-hand-drawn' : ''}" 
     style="max-width: ${maxWidth}px; width: 100%; height: auto; display: inline-block; vertical-align: middle; margin: 4px 6px; user-select: none;" 
     xmlns="http://www.w3.org/2000/svg">
  ${generateSvgDefs(hatchId, isHandDrawn)}
  ${content}
</svg>`.trim();

  return { svg, width: w, height: h, viewBox: `0 0 ${w} ${h}` };
}
