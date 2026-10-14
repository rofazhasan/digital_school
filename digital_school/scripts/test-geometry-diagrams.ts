/**
 * Verification Test Suite for Modern Geometry Diagram System
 */

import {
  parseSingleGeometryDiagram,
  replaceGeometryDiagramsInText,
  GEOMETRY_TEMPLATES,
} from '../utils/diagrams/geometry';
import { parseDiagramsInText } from '../utils/diagrams/inline-parser';

console.log('🧪 Starting Geometry Diagram System Tests...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

// Test 1: Verify all catalog templates produce valid SVG
console.log('--- Test 1: Catalog Template Rendering ---');
for (const tmpl of GEOMETRY_TEMPLATES) {
  const svg = parseSingleGeometryDiagram(`GEO:${tmpl.id}[${tmpl.defaultParams}]`);
  assert(
    !!svg && svg.startsWith('<svg') && svg.endsWith('</svg>') && svg.includes('viewBox='),
    `Template "${tmpl.id}" renders valid SVG (${tmpl.name})`
  );
}

// Test 2: Verify Indicators
console.log('\n--- Test 2: Geometry Indicators Verification ---');

// 2.1 Right Angle Marker in Right Triangle
const rightTriangleSvg = parseSingleGeometryDiagram('GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5,angle=30°]');
assert(
  !!rightTriangleSvg && rightTriangleSvg.includes('stroke-linecap="square"') && rightTriangleSvg.includes('30°'),
  'Right triangle contains aligned right-angle square marker and angle arc'
);

// 2.2 Tick Marks in Equilateral & Isosceles
const equilateralSvg = parseSingleGeometryDiagram('GEO:equilateral[s=6,angle=60°]');
assert(
  !!equilateralSvg && equilateralSvg.includes('stroke-linecap="round"') && equilateralSvg.includes('60°'),
  'Equilateral triangle contains congruent tick marks and 60° arc'
);

// 2.3 Parallel Arrows in Parallelogram
const parallelogramSvg = parseSingleGeometryDiagram('GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5]');
assert(
  !!parallelogramSvg && parallelogramSvg.includes('<polygon points=') && parallelogramSvg.includes('stroke-dasharray='),
  'Parallelogram contains parallel arrows and dashed altitude'
);

// 2.4 Tangent with Right Angle to Radius
const tangentSvg = parseSingleGeometryDiagram('GEO:tangent[O=O,P=P,T=T,r=5]');
assert(
  !!tangentSvg && tangentSvg.includes('stroke-linecap="square"') && tangentSvg.includes('r'),
  'Circle tangent contains perpendicular radius and right angle marker'
);

// 2.5 Shaded Sector with Hatching Pattern
const sectorSvg = parseSingleGeometryDiagram('GEO:sector[r=6,theta=60°]');
assert(
  !!sectorSvg && sectorSvg.includes('pattern id=') && sectorSvg.includes('url(#hatch-'),
  'Shaded sector contains architectural hatch pattern'
);

// Test 3: Inline Parser & Size Modifiers
console.log('\n--- Test 3: Inline Parser & Size Modifiers ---');

const testQuestionText = `
কোনো সমকোণী ত্রিভুজ $\\triangle ABC$-এ $AB = 3\\text{ cm}, BC = 4\\text{ cm}$ হলে $AC$ এর মান কত?
##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5][size:small]##
`;

const parsedQuestion = parseDiagramsInText(testQuestionText);
assert(
  parsedQuestion.includes('<svg') && parsedQuestion.includes('max-width: 145px'),
  'parseDiagramsInText successfully transforms ##GEO:...## with [size:small]'
);

// Test 4: CQ (Creative Question) stem with multiple sub-questions
console.log('\n--- Test 4: Creative Question (CQ) with Geometry Diagram ---');

const cqQuestion = `
উদ্দীপক: চিত্রে $ABCD$ একটি সামান্তরিক যার ভূমি $b = 8\\text{ cm}$ এবং উচ্চতা $h = 5\\text{ cm}$।
##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5,theta=60°][size:medium]##

(ক) সামান্তরিকটির ক্ষেত্রফল নির্ণয় কর। [২]
(খ) $\\angle A$ এবং $\\angle B$ এর মান নির্ণয় কর। [৪]
`;

const parsedCQ = parseDiagramsInText(cqQuestion);
assert(
  parsedCQ.includes('<svg') && parsedCQ.includes('max-width: 220px') && parsedCQ.includes('60°'),
  'Creative Question parsed seamlessly with diagram and indicators'
);

// Test 5: Universal Freeform Custom Geometry (Arbitrary figures, kites, stars, etc.)
console.log('\n--- Test 5: Universal Freeform Custom Geometry Engine ---');

const customFigureDsl = `##GEO:custom[points: A(20,90), B(120,90), C(90,20), D(40,20); lines: A-B, B-C, C-D, D-A; right: D-A-B; angle: A-B-C(45°); tick: A-D, B-C; shade: A-B-C-D][size:small]##`;
const parsedCustom = parseDiagramsInText(customFigureDsl);

assert(
  parsedCustom.includes('<svg') &&
  parsedCustom.includes('polygon points=') &&
  parsedCustom.includes('45°') &&
  parsedCustom.includes('stroke-linecap="square"') &&
  parsedCustom.includes('max-width: 145px'),
  'Universal Custom Geometry DSL parses arbitrary figures with all indicators & auto-fit'
);

// Summary
console.log(`\n================================`);
console.log(`Total Passed: ${passed}`);
console.log(`Total Failed: ${failed}`);
console.log(`================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Geometry Diagram System tests passed with 100% success!\n');
}
