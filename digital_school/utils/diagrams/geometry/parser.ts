/**
 * Geometry Diagram Parser
 * Converts ##GEO:...## syntax into beautiful, compact SVGs.
 *
 * Supported formats:
 * 1. ##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5,angle=30°]##
 * 2. ##GEO:equilateral[s=6,angle=60°][size:small]##
 * 3. ##GEO:parallelogram(b=8, h=5, theta=60°)[style:hand-drawn]##
 * 4. ##GEO:circle-tangent[O=O,P=P,r=5,t=8]##
 * 5. ##GEO:cyclic-quad[A=A,B=B,C=C,D=D]##
 * 6. ##GEO:shaded-sector[r=6,theta=60°]##
 */

import { GEOMETRY_GENERATORS } from './generators';
import { renderCustomGeometry } from './custom-generator';
import type { GeometryOptions, GeometryShapeType, DiagramSize, DiagramStyleMode } from './types';

// Aliases mapping user-friendly names to canonical shape types
const SHAPE_ALIASES: Record<string, GeometryShapeType> = {
  // Triangles
  'triangle': 'scalene-triangle',
  'tri': 'scalene-triangle',
  'right-triangle': 'right-triangle',
  'rtriangle': 'right-triangle',
  'right': 'right-triangle',
  'right-tri': 'right-triangle',
  'equilateral': 'equilateral-triangle',
  'equilateral-triangle': 'equilateral-triangle',
  'equi-triangle': 'equilateral-triangle',
  'isosceles': 'isosceles-triangle',
  'isosceles-triangle': 'isosceles-triangle',
  'scalene': 'scalene-triangle',
  'scalene-triangle': 'scalene-triangle',
  'triangle-altitude': 'triangle-altitude',
  'altitude': 'triangle-altitude',
  'triangle-median': 'triangle-median',
  'median': 'triangle-median',
  'apollonius': 'triangle-median',
  'vector-triangle': 'vector-triangle',
  'vector': 'vector-triangle',
  'vector-tri': 'vector-triangle',
  'triangle-incircle': 'triangle-incircle',
  'incircle': 'triangle-incircle',
  'triangle-circumcircle': 'triangle-circumcircle',
  'circumcircle': 'triangle-circumcircle',
  'similar-triangles': 'similar-triangles',
  'similar': 'similar-triangles',

  // Quadrilaterals
  'rectangle': 'rectangle',
  'rect': 'rectangle',
  'square': 'square',
  'parallelogram': 'parallelogram',
  'para': 'parallelogram',
  'rhombus': 'rhombus',
  'trapezium': 'trapezium',
  'trapezoid': 'trapezium',
  'quadrilateral': 'parallelogram',
  'quad': 'parallelogram',
  'cyclic-quad': 'cyclic-quadrilateral',
  'cyclic-quadrilateral': 'cyclic-quadrilateral',

  // Circles
  'circle': 'circle-radius',
  'circle-radius': 'circle-radius',
  'circle-chord': 'circle-chord',
  'chord': 'circle-chord',
  'circle-tangent': 'circle-tangent',
  'tangent': 'circle-tangent',
  'two-tangents': 'circle-two-tangents',
  'circle-two-tangents': 'circle-two-tangents',
  'circle-angles': 'circle-central-inscribed',
  'circle-central-inscribed': 'circle-central-inscribed',
  'central-inscribed': 'circle-central-inscribed',
  'semicircle': 'circle-semicircle-angle',
  'circle-semicircle-angle': 'circle-semicircle-angle',

  // Lines & Angles
  'parallel-transversal': 'parallel-transversal',
  'parallel-lines': 'parallel-transversal',
  'transversal': 'parallel-transversal',
  'lines': 'parallel-transversal',
  'line': 'parallel-transversal',
  'intersecting-lines': 'intersecting-lines',
  'intersecting': 'intersecting-lines',
  'angle-bisector': 'angle-bisector',
  'bisector': 'angle-bisector',

  // Shaded
  'shaded-sector': 'shaded-sector',
  'sector': 'shaded-sector',
  'shaded-segment': 'shaded-segment',
  'segment': 'shaded-segment',
  'circle-in-square': 'circle-in-square',
  'circle-square': 'circle-in-square',

  // 3D Solids
  'cylinder': 'cylinder',
  'cone': 'cone',
  'sphere': 'sphere',
  'cube': 'cube',
  'cuboid': 'cube',
  // Measuring Instruments & Conics
  'ellipse': 'circle-radius',
  'vernier': 'rectangle',
  'screw-gauge': 'cylinder',
};

const SIZE_MODIFIERS: Record<string, DiagramSize> = {
  tiny: 'tiny',
  small: 'small',
  compact: 'compact',
  medium: 'medium',
  large: 'large',
};

/**
 * Parses a parameter string like:
 * "A=A, B=B, C=C, a=3, b=4, c=5, angle=30°, showAltitude=true"
 * or "type:right, A:A, b:12"
 * Tolerant to semicolons, pipes, newlines, and quotes from LLMs.
 */
function parseParamString(raw: string): {
  labels: Record<string, string>;
  sides: Record<string, string | number>;
  angles: Record<string, string | number>;
  flags: Record<string, boolean>;
  rawMap: Record<string, string>;
} {
  const labels: Record<string, string> = {};
  const sides: Record<string, string | number> = {};
  const angles: Record<string, string | number> = {};
  const flags: Record<string, boolean> = {};
  const rawMap: Record<string, string> = {};

  if (!raw || !raw.trim()) {
    return { labels, sides, angles, flags, rawMap };
  }

  // Clean quotes or outer parentheses if LLM passed them
  let text = raw.replace(/^["'`]|["'`]$/g, '').trim();

  // Extract explicit labels group e.g. "labels:A,B,C,D" or "labels=[A,B,C,D]"
  const labelsMatch = text.match(/(?:labels|vertices)\s*[:=]\s*\[?([A-Za-z0-9_,\s=]+)\]?/i);
  if (labelsMatch) {
    const defaultKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'P', 'Q', 'R'];
    const items = labelsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    items.forEach((item, idx) => {
      if (item.includes('=')) {
        const [k, v] = item.split('=');
        labels[k.trim()] = v.trim();
      } else {
        const k = defaultKeys[idx] || item;
        labels[k] = item;
      }
    });
    text = text.replace(labelsMatch[0], '').trim();
  }

  // Extract explicit sides group e.g. "sides:c=6,b=8,m=AD" or "sides=[c=6,b=8]"
  const sidesMatch = text.match(/sides\s*[:=]\s*\[?([A-Za-z0-9_=.,\s]+)\]?/i);
  if (sidesMatch) {
    const items = sidesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    items.forEach(item => {
      if (item.includes('=')) {
        const [k, v] = item.split('=');
        sides[k.trim()] = v.trim();
      } else if (item.includes(':')) {
        const [k, v] = item.split(':');
        sides[k.trim()] = v.trim();
      }
    });
    text = text.replace(sidesMatch[0], '').trim();
  }

  // Extract explicit angles group e.g. "angles:A=60°,B=45°" or "angles=[A=60°,B=45°]"
  const anglesMatch = text.match(/angles\s*[:=]\s*\[?([A-Za-z0-9_=.,\s°]+)\]?/i);
  if (anglesMatch) {
    const items = anglesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    items.forEach(item => {
      if (item.includes('=')) {
        const [k, v] = item.split('=');
        angles[k.trim()] = v.trim();
      } else if (item.includes(':')) {
        const [k, v] = item.split(':');
        angles[k.trim()] = v.trim();
      } else {
        angles['angle'] = item;
      }
    });
    text = text.replace(anglesMatch[0], '').trim();
  }

  // Split remainder by comma, semicolon, pipe, or newline outside brackets
  const tokens = text.split(/[,;\n|](?![^[]*\])/g).map(s => s.trim()).filter(Boolean);

  for (const token of tokens) {
    const separatorIdx = token.search(/[=:]/);
    if (separatorIdx === -1) {
      // Standalone flag like "shaded" or "altitude"
      flags[token.toLowerCase().replace(/['"`]/g, '')] = true;
      continue;
    }

    let key = token.slice(0, separatorIdx).trim().replace(/^['"`]+|['"`]+$/g, '');
    let val = token.slice(separatorIdx + 1).trim().replace(/^['"`]+|['"`]+$/g, '');

    rawMap[key] = val;

    // Detect boolean flags
    if (val.toLowerCase() === 'true' || val === '1') {
      flags[key.toLowerCase()] = true;
      continue;
    }
    if (val.toLowerCase() === 'false' || val === '0') {
      flags[key.toLowerCase()] = false;
      continue;
    }

    // Vertex labels: A, B, C, D, O, P, Q, T, V, M
    if (/^[A-Z]$/.test(key) || ['center', 'origin', 'apex'].includes(key.toLowerCase())) {
      labels[key] = val;
      continue;
    }

    // Angles: angle, angleA, angleB, theta, alpha, x, central, inscribed
    if (key.toLowerCase().startsWith('angle') || ['theta', 'alpha', 'beta', 'x', 'central', 'inscribed'].includes(key.toLowerCase())) {
      angles[key] = val;
      continue;
    }

    // Sides / measurements: a, b, c, s, h, r, l, w, d, base, height, radius
    sides[key] = val;
  }

  return { labels, sides, angles, flags, rawMap };
}

/**
 * Parses a single GEO block string like:
 * "GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5][size:small]"
 * Tolerant to backticks, spaces, brackets, and snake_case for LLMs.
 */
export function parseSingleGeometryDiagram(geoString: string): string | null {
  try {
    let text = geoString.trim();

    // Strip backticks or formatting wrapper if LLM placed them
    text = text.replace(/^`+|`+$/g, '').trim();

    // Strip leading/trailing markdown characters or brackets
    if (text.startsWith('[') && text.endsWith(']')) {
      text = text.slice(1, -1).trim();
    }
    if (text.startsWith('##') && text.endsWith('##')) {
      text = text.slice(2, -2).trim();
    }

    // Extract size modifier [size:small] or size:small
    let size: DiagramSize = 'small';
    const sizeMatch = text.match(/\[?size:(tiny|small|compact|medium|large)\]?/i);
    if (sizeMatch) {
      size = SIZE_MODIFIERS[sizeMatch[1].toLowerCase()] || 'small';
      text = text.replace(sizeMatch[0], '').trim();
    }

    // Extract style modifier [style:hand-drawn]
    let style: DiagramStyleMode = 'drafting';
    const styleMatch = text.match(/\[?style:(hand-drawn|drafting|textbook|monochrome)\]?/i);
    if (styleMatch) {
      style = styleMatch[1].toLowerCase() as DiagramStyleMode;
      text = text.replace(styleMatch[0], '').trim();
    }

    // Strip "GEO:" or "geo:" prefix (allowing spaces)
    text = text.replace(/^(?:GEO|geo)\s*[:=]?\s*/i, '').trim();

    // Match shape name and parameters:
    // e.g. "right-triangle[A=A, a=3]" or "right_triangle(A=A, a=3)" or "right-triangle"
    const match = text.match(/^([a-zA-Z0-9-_]+)(?:[\[(](.*)[\])])?$/);
    if (!match) return null;

    // Normalize underscores to hyphens for shape name (e.g. right_triangle -> right-triangle)
    const rawShape = match[1].toLowerCase().replace(/_/g, '-');
    const rawParams = match[2] || '';

    // Handle universal custom geometry DSL
    if (rawShape === 'custom' || rawShape === 'draw' || rawShape === 'freeform') {
      const rendered = renderCustomGeometry(rawParams, {
        type: 'custom' as any,
        size,
        style,
      });
      return rendered.svg;
    }

    const canonicalType = SHAPE_ALIASES[rawShape];
    if (!canonicalType) return null;

    const generator = GEOMETRY_GENERATORS[canonicalType];
    if (!generator) return null;

    const { labels, sides, angles, flags, rawMap } = parseParamString(rawParams);

    const options: GeometryOptions = {
      type: canonicalType,
      size,
      style,
      labels,
      sides,
      angles,
      showShading: flags.shaded ?? flags.showshading ?? flags.showShading,
      showAltitude: flags.altitude ?? flags.showaltitude ?? flags.showAltitude,
      showRightAngle: flags.rightangle ?? flags.showrightangle,
      showEqualTicks: flags.ticks ?? flags.showequalticks,
      showParallelArrows: flags.parallel ?? flags.showparallelarrows,
      showDottedLines: flags.dotted ?? flags.showdottedlines,
    };

    const rendered = generator(options);
    return rendered.svg;

  } catch (err) {
    console.error('Error parsing geometry diagram:', geoString, err);
    return null;
  }
}

/**
 * Checks if a string contains geometry markup
 */
export function hasGeometryDiagrams(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /##\s*GEO:(.*?)##/i.test(text) || /\[\s*GEO:(.*?)\]/i.test(text);
}

/**
 * Replaces all ##GEO:...## and [GEO:...] blocks in text with high-quality SVG strings
 */
export function replaceGeometryDiagramsInText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  if (!text.includes('GEO:') && !text.includes('geo:')) return text;

  // 1. Replace standard ##GEO:...## blocks
  let result = text.replace(/##\s*GEO:(.*?)##/gi, (fullMatch, geoBody) => {
    const svg = parseSingleGeometryDiagram(`GEO:${geoBody}`);
    return svg !== null ? svg : fullMatch;
  });

  // 2. Replace alternative [GEO:...] blocks (used by some LLMs)
  result = result.replace(/\[\s*GEO:(.*?)\]/gi, (fullMatch, geoBody) => {
    const svg = parseSingleGeometryDiagram(`GEO:${geoBody}`);
    return svg !== null ? svg : fullMatch;
  });

  return result;
}
