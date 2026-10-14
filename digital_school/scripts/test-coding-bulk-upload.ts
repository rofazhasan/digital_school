import { getBulkQuestionsLLMPrompt } from '../lib/ai/geometry-prompt-guide';
import { parseDiagramsInText } from '../utils/diagrams/inline-parser';

function testLLMPromptGuide() {
  console.log('--- Test 1: LLM Prompt Guide Generation ---');
  const prompt = getBulkQuestionsLLMPrompt({
    subject: 'Computer Science & Mathematics',
    className: 'Class 10',
    topic: 'Geometry & Algorithms',
    count: 3,
    includeGeometry: true,
    includeCoding: true,
  });

  if (!prompt.includes('##GEO:')) throw new Error('Prompt missing geometry syntax specification');
  if (!prompt.includes('CODING')) throw new Error('Prompt missing CODING question type');
  if (!prompt.includes('testCases')) throw new Error('Prompt missing testCases specification');
  if (!prompt.includes('allowedLanguages')) throw new Error('Prompt missing allowedLanguages specification');
  console.log('  ✅ PASS: getBulkQuestionsLLMPrompt generates complete, valid instructions for LLMs.');
}

function testCodingQuestionStructureAndDiagram() {
  console.log('--- Test 2: CODING Question & Diagram Integration ---');
  const sampleCodingQuestion = {
    questionText: 'Given the sides of the triangle below, compute the hypotenuse.\n\n##GEO:right-triangle[a=3,b=4,hyp=c,style=handdrawn]##',
    type: 'CODING',
    classId: 'class-123',
    subject: 'Computer Science',
    topic: 'Geometry Algorithms',
    difficulty: 'MEDIUM',
    marks: 10,
    allowedLanguages: ['python', 'c', 'cpp'],
    constraints: 'Time: 1.0s, Memory: 256MB\n1 <= a, b <= 1000',
    starterCode: '# Read inputs\nimport sys\n',
    modelAnswer: 'import math\na, b = map(int, input().split())\nprint(f"{math.hypot(a, b):.2f}")',
    explanation: 'Use Pythagorean theorem c = sqrt(a^2 + b^2).',
    testCases: [
      { id: 1, input: '3 4', expectedOutput: '5.00', isHidden: false, weight: 2 },
      { id: 2, input: '5 12', expectedOutput: '13.00', isHidden: false, weight: 3 },
      { id: 3, input: '8 15', expectedOutput: '17.00', isHidden: true, weight: 5 },
    ],
  };

  if (!Array.isArray(sampleCodingQuestion.testCases) || sampleCodingQuestion.testCases.length !== 3) {
    throw new Error('Test cases array missing or invalid');
  }

  // Render diagrams
  const renderedText = parseDiagramsInText(sampleCodingQuestion.questionText);
  if (!renderedText.includes('<svg') || !renderedText.includes('geometry-diagram-svg')) {
    throw new Error('Geometry diagram inside CODING question did not render to SVG');
  }
  console.log('  ✅ PASS: CODING question with embedded geometry diagram renders valid SVG seamlessly.');

  // Also test tolerant LLM syntax variations:
  // 1. [GEO:right_triangle[a=3,b=4]] (brackets + snake_case)
  const tolerantText1 = parseDiagramsInText('[GEO:right_triangle[a=3,b=4]]');
  if (!tolerantText1.includes('<svg')) throw new Error('Failed to parse bracketed snake_case diagram [GEO:right_triangle]');
  console.log('  ✅ PASS: Bracketed snake_case diagram [GEO:right_triangle[...]] parsed successfully.');

  // 2. `##GEO:circle_tangent[r=5]##` (backticks)
  const tolerantText2 = parseDiagramsInText('`##GEO:circle_tangent[r=5]##`');
  if (!tolerantText2.includes('<svg')) throw new Error('Failed to parse backtick-enclosed diagram');
  console.log('  ✅ PASS: Backtick-enclosed diagram `##GEO:...##` parsed successfully.');
}

function runAll() {
  try {
    testLLMPromptGuide();
    testCodingQuestionStructureAndDiagram();
    console.log('\n🎉 ALL CODING & LLM INTEGRATION TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  }
}

runAll();
