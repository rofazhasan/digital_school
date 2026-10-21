/**
 * Geometry Diagram Types
 * Defines configuration for compact, textbook & hand-drawn style geometry diagrams
 * optimized for Objective (MCQ), CQ, SQ print and online exams.
 */

export type GeometryShapeType =
  // Triangles
  | 'right-triangle'
  | 'equilateral-triangle'
  | 'isosceles-triangle'
  | 'scalene-triangle'
  | 'triangle-altitude'
  | 'triangle-median'
  | 'vector-triangle'
  | 'triangle-incircle'
  | 'triangle-circumcircle'
  | 'triangle-midsegment'
  | 'similar-triangles'
  | 'pythagoras-visual'
  // Quadrilaterals
  | 'rectangle'
  | 'square'
  | 'parallelogram'
  | 'rhombus'
  | 'trapezium'
  | 'cyclic-quadrilateral'
  // Circles
  | 'circle-radius'
  | 'circle-chord'
  | 'circle-tangent'
  | 'circle-two-tangents'
  | 'circle-central-inscribed'
  | 'circle-semicircle-angle'
  | 'circle-intersecting-chords'
  // Lines & Angles
  | 'parallel-transversal'
  | 'intersecting-lines'
  | 'angle-bisector'
  | 'adjacent-angles'
  // Shaded Areas
  | 'shaded-sector'
  | 'shaded-segment'
  | 'circle-in-square'
  | 'shaded-annulus'
  // 3D Solids
  | 'cylinder'
  | 'cone'
  | 'sphere'
  | 'cube'
  | 'rectangular-prism'
  // Mechanics & Physics
  | 'pendulum';

export type DiagramStyleMode = 'drafting' | 'hand-drawn' | 'textbook' | 'monochrome';
export type DiagramSize = 'tiny' | 'small' | 'compact' | 'medium' | 'large';

export interface GeometryOptions {
  type: GeometryShapeType;
  style?: DiagramStyleMode;
  size?: DiagramSize;
  width?: number;
  height?: number;
  interactive?: boolean;
  
  // Vertices labels (default: A, B, C, D, O, P, Q, etc.)
  labels?: Record<string, string>;
  
  // Side lengths or expressions (e.g. { a: '3 cm', b: '4 cm', c: '5 cm', h: 'h', r: 'r' })
  sides?: Record<string, string | number>;
  
  // Angle values or expressions (e.g. { A: '30°', B: '90°', C: '60°', theta: 'θ', x: 'x' })
  angles?: Record<string, string | number>;

  // Indicators toggle
  showRightAngle?: boolean;
  rightAngleVertex?: string; // e.g. 'B'
  showEqualTicks?: boolean; // single or double hash marks on congruent sides
  showParallelArrows?: boolean; // directional arrows on parallel edges
  showAltitude?: boolean;
  showCenter?: boolean;
  centerLabel?: string;
  showDottedLines?: boolean;
  showShading?: boolean;
  shadingType?: 'hatch' | 'tint' | 'both';

  // Custom text annotations [text, xRatio, yRatio]
  annotations?: Array<{ text: string; x: number; y: number; color?: string }>;
}

export interface RenderedGeometry {
  svg: string;
  width: number;
  height: number;
  viewBox: string;
}
