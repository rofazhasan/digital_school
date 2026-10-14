/**
 * Modern Geometry Diagram System
 * Public API and Pre-made Template Catalog
 */

export * from './types';
export * from './hand-drawn-svg';
export * from './generators';
export * from './parser';
export * from './custom-generator';

export interface GeometryTemplateMeta {
  id: string;
  name: string;
  nameBn: string;
  category: 'triangles' | 'quadrilaterals' | 'circles' | 'lines' | 'shaded' | 'solids';
  description: string;
  syntax: string;
  defaultParams: string;
}

export const GEOMETRY_TEMPLATES: GeometryTemplateMeta[] = [
  // Triangles
  {
    id: 'right-triangle',
    name: 'Right Triangle',
    nameBn: 'সমকোণী ত্রিভুজ',
    category: 'triangles',
    description: 'Right triangle with 90° corner square, vertices A,B,C, sides a,b,c, angle arcs.',
    syntax: '##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5,angle=30°]##',
    defaultParams: 'A=A,B=B,C=C,a=3,b=4,c=5,angle=30°',
  },
  {
    id: 'equilateral-triangle',
    name: 'Equilateral Triangle',
    nameBn: 'সমবাহু ত্রিভুজ',
    category: 'triangles',
    description: 'Equilateral triangle with equal side tick marks, 60° angle arc, and optional altitude.',
    syntax: '##GEO:equilateral[A=A,B=B,C=C,s=6,angle=60°]##',
    defaultParams: 'A=A,B=B,C=C,s=6,angle=60°',
  },
  {
    id: 'isosceles-triangle',
    name: 'Isosceles Triangle',
    nameBn: 'সমদ্বিবাহু ত্রিভুজ',
    category: 'triangles',
    description: 'Isosceles triangle with tick marks on equal legs, altitude line to base, base angles θ.',
    syntax: '##GEO:isosceles[A=A,B=B,C=C,b=6,h=4,theta=θ]##',
    defaultParams: 'A=A,B=B,C=C,b=6,h=4,theta=θ',
  },
  {
    id: 'triangle-altitude',
    name: 'Triangle with Altitude (AD ⊥ BC)',
    nameBn: 'উচ্চতাসহ ত্রিভুজ (AD ⊥ BC)',
    category: 'triangles',
    description: 'General triangle with dashed altitude AD perpendicular to base BC.',
    syntax: '##GEO:triangle-altitude[A=A,B=B,C=C,D=D,h=h,b=b]##',
    defaultParams: 'A=A,B=B,C=C,D=D,h=h,b=b',
  },
  {
    id: 'triangle-incircle',
    name: 'Triangle with Inscribed Circle',
    nameBn: 'ত্রিভুজের অন্তর্বৃত্ত',
    category: 'triangles',
    description: 'Incircle tangent to all 3 sides, incenter O, inradius r.',
    syntax: '##GEO:incircle[A=A,B=B,C=C,O=O,r=r]##',
    defaultParams: 'A=A,B=B,C=C,O=O,r=r',
  },
  {
    id: 'triangle-circumcircle',
    name: 'Triangle with Circumscribed Circle',
    nameBn: 'ত্রিভুজের পরিবৃত্ত',
    category: 'triangles',
    description: 'Circumcircle passing through vertices A, B, C with circumcenter O.',
    syntax: '##GEO:circumcircle[A=A,B=B,C=C,O=O]##',
    defaultParams: 'A=A,B=B,C=C,O=O',
  },
  {
    id: 'similar-triangles',
    name: 'Similar Triangles (DE ∥ BC)',
    nameBn: 'সদৃশ ত্রিভুজ (DE ∥ BC)',
    category: 'triangles',
    description: 'Triangle with parallel midsegment line DE showing parallel arrows.',
    syntax: '##GEO:similar[A=A,B=B,C=C,D=D,E=E]##',
    defaultParams: 'A=A,B=B,C=C,D=D,E=E',
  },

  // Quadrilaterals
  {
    id: 'rectangle',
    name: 'Rectangle',
    nameBn: 'আয়তক্ষেত্র',
    category: 'quadrilaterals',
    description: 'Rectangle with 4 right-angle corner markers, opposite equal tick marks, length and width.',
    syntax: '##GEO:rectangle[A=A,B=B,C=C,D=D,l=8,w=5]##',
    defaultParams: 'A=A,B=B,C=C,D=D,l=8,w=5',
  },
  {
    id: 'square',
    name: 'Square',
    nameBn: 'বর্গক্ষেত্র',
    category: 'quadrilaterals',
    description: 'Square with 4 right angles and 4 congruent side tick marks.',
    syntax: '##GEO:square[A=A,B=B,C=C,D=D,s=5]##',
    defaultParams: 'A=A,B=B,C=C,D=D,s=5',
  },
  {
    id: 'parallelogram',
    name: 'Parallelogram',
    nameBn: 'সামান্তরিক',
    category: 'quadrilaterals',
    description: 'Parallelogram with parallel directional arrows, dashed altitude h, base b.',
    syntax: '##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5,theta=60°]##',
    defaultParams: 'A=A,B=B,C=C,D=D,b=8,h=5,theta=60°',
  },
  {
    id: 'rhombus',
    name: 'Rhombus',
    nameBn: 'রম্বস',
    category: 'quadrilaterals',
    description: 'Rhombus with 4 equal sides, diagonals intersecting at 90° center O.',
    syntax: '##GEO:rhombus[A=A,B=B,C=C,D=D,O=O,a=5]##',
    defaultParams: 'A=A,B=B,C=C,D=D,O=O,a=5',
  },
  {
    id: 'trapezium',
    name: 'Trapezium / Trapezoid',
    nameBn: 'ট্রাপিজিয়াম',
    category: 'quadrilaterals',
    description: 'Trapezoid with parallel arrows on bases a and b, dashed altitude h.',
    syntax: '##GEO:trapezium[A=A,B=B,C=C,D=D,a=6,b=10,h=4]##',
    defaultParams: 'A=A,B=B,C=C,D=D,a=6,b=10,h=4',
  },
  {
    id: 'cyclic-quadrilateral',
    name: 'Cyclic Quadrilateral',
    nameBn: 'বৃত্তস্থ চতুর্ভুজ',
    category: 'quadrilaterals',
    description: 'Quadrilateral inscribed in a circle with opposite angles.',
    syntax: '##GEO:cyclic-quad[A=A,B=B,C=C,D=D,O=O]##',
    defaultParams: 'A=A,B=B,C=C,D=D,O=O',
  },

  // Circles
  {
    id: 'circle-radius',
    name: 'Circle with Center & Radius',
    nameBn: 'বৃত্ত (ব্যাসার্ধ ও কেন্দ্র)',
    category: 'circles',
    description: 'Circle with center point O, radius line OA with measurement r.',
    syntax: '##GEO:circle[O=O,A=A,r=5]##',
    defaultParams: 'O=O,A=A,r=5',
  },
  {
    id: 'circle-chord',
    name: 'Circle with Chord & Bisector',
    nameBn: 'বৃত্তের জ্যা ও লম্ব সমদ্বিখণ্ডক',
    category: 'circles',
    description: 'Chord AB with perpendicular bisector OM from center O with equal ticks on AM, MB.',
    syntax: '##GEO:chord[O=O,A=A,B=B,M=M,r=r]##',
    defaultParams: 'O=O,A=A,B=B,M=M,r=r',
  },
  {
    id: 'circle-tangent',
    name: 'Circle with Tangent Line',
    nameBn: 'বৃত্তের স্পর্শক ও ব্যাসার্ধ লম্ব',
    category: 'circles',
    description: 'Tangent line through T to external point P, radius OT ⊥ PT with right angle marker.',
    syntax: '##GEO:tangent[O=O,T=T,P=P,r=r]##',
    defaultParams: 'O=O,T=T,P=P,r=r',
  },
  {
    id: 'circle-two-tangents',
    name: 'Two Tangents from External Point',
    nameBn: 'বহিস্থ বিন্দু হতে দুটি স্পর্শক',
    category: 'circles',
    description: 'External point P with two tangents PA and PB meeting circle with right angle markers.',
    syntax: '##GEO:two-tangents[O=O,P=P,A=A,B=B]##',
    defaultParams: 'O=O,P=P,A=A,B=B',
  },
  {
    id: 'circle-central-inscribed',
    name: 'Central & Inscribed Angles',
    nameBn: 'কেন্দ্রস্থ কোণ ও বৃত্তস্থ কোণ',
    category: 'circles',
    description: 'Central angle 2θ and inscribed angle θ subtended by the same arc AB.',
    syntax: '##GEO:circle-angles[O=O,A=A,B=B,C=C,central=2θ,inscribed=θ]##',
    defaultParams: 'O=O,A=A,B=B,C=C,central=2θ,inscribed=θ',
  },
  {
    id: 'circle-semicircle-angle',
    name: 'Angle in a Semicircle (90°)',
    nameBn: 'অর্ধবৃত্তস্থ কোণ (এক সমকোণ)',
    category: 'circles',
    description: 'Triangle on diameter AB with right angle 90° at point C on circumference.',
    syntax: '##GEO:semicircle[A=A,B=B,C=C,O=O]##',
    defaultParams: 'A=A,B=B,C=C,O=O',
  },

  // Lines & Angles
  {
    id: 'parallel-transversal',
    name: 'Parallel Lines with Transversal',
    nameBn: 'সমান্তরাল রেখা ও ছেদক',
    category: 'lines',
    description: 'Two parallel lines cut by a transversal showing alternate interior angles 1 and 2.',
    syntax: '##GEO:transversal[angle1=115°,angle2=x]##',
    defaultParams: 'angle1=115°,angle2=x',
  },
  {
    id: 'intersecting-lines',
    name: 'Intersecting Lines (Vertically Opposite)',
    nameBn: 'পরস্পরচ্ছেদী রেখা (বিপ্রতীপ কোণ)',
    category: 'lines',
    description: 'Two intersecting lines with vertically opposite angle arcs x.',
    syntax: '##GEO:intersecting-lines[x=x]##',
    defaultParams: 'x=x',
  },
  {
    id: 'angle-bisector',
    name: 'Angle Bisector Ray',
    nameBn: 'কোণের সমদ্বিখণ্ডক রশ্মি',
    category: 'lines',
    description: 'Angle AOB divided into equal halves by ray OC with matching arcs.',
    syntax: '##GEO:bisector[O=O,A=A,B=B,C=C,alpha=α]##',
    defaultParams: 'O=O,A=A,B=B,C=C,alpha=α',
  },

  // Shaded
  {
    id: 'shaded-sector',
    name: 'Shaded Circle Sector',
    nameBn: 'ছায়াবৃত বৃত্তকলা',
    category: 'shaded',
    description: 'Sector with radius r, angle θ, shaded with crisp architectural hatching.',
    syntax: '##GEO:sector[r=6,theta=60°]##',
    defaultParams: 'r=6,theta=60°',
  },
  {
    id: 'shaded-segment',
    name: 'Shaded Circle Segment',
    nameBn: 'ছায়াবৃত বৃত্তাংশ',
    category: 'shaded',
    description: 'Circular segment between chord AB and arc, shaded.',
    syntax: '##GEO:segment[O=O,A=A,B=B]##',
    defaultParams: 'O=O,A=A,B=B',
  },
  {
    id: 'circle-in-square',
    name: 'Circle inside Square (Shaded Corners)',
    nameBn: 'বর্গের অন্তর্বৃত্ত (ছায়াবৃত কোণ)',
    category: 'shaded',
    description: 'Square with inscribed circle, corner regions shaded with hatching.',
    syntax: '##GEO:circle-square[s=10,r=5]##',
    defaultParams: 's=10,r=5',
  },

  // Solids
  {
    id: 'cylinder',
    name: 'Cylinder',
    nameBn: 'বেলন / সিলিন্ডার',
    category: 'solids',
    description: '3D cylinder with radius r, height h, dashed hidden back curve.',
    syntax: '##GEO:cylinder[r=3,h=6]##',
    defaultParams: 'r=3,h=6',
  },
  {
    id: 'cone',
    name: 'Cone',
    nameBn: 'কোণক',
    category: 'solids',
    description: '3D cone with vertex V, base radius r, height h, slant height l.',
    syntax: '##GEO:cone[r=3,h=4,l=5]##',
    defaultParams: 'r=3,h=4,l=5',
  },
  {
    id: 'sphere',
    name: 'Sphere',
    nameBn: 'গোলক',
    category: 'solids',
    description: '3D sphere with equator dashed ellipse, center O, radius r.',
    syntax: '##GEO:sphere[r=4,O=O]##',
    defaultParams: 'r=4,O=O',
  },
  {
    id: 'cube',
    name: 'Cube',
    nameBn: 'ঘনক',
    category: 'solids',
    description: '3D cube with dashed hidden edges and side length s.',
    syntax: '##GEO:cube[s=5]##',
    defaultParams: 's=5',
  },
];
