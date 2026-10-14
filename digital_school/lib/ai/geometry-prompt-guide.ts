/**
 * Geometry Diagram & Coding Question Prompt Guide for LLMs
 * Provides standardized prompt templates, schemas, and cheatsheets to make it
 * dead simple for any LLM (Gemini, GPT-4, Claude, DeepSeek, Local SLM)
 * to reliably generate bulk questions with compact textbook geometry diagrams.
 */

export const GEOMETRY_DIAGRAM_SYNTAX_GUIDE = `
### Geometry Diagram Format Specification (Antigravity Geometry Engine)
Embed compact, responsive SVGs directly into question text or sub-questions using:
\`##GEO:shape-name[parameters][size:small]##\`
(Alternative bracket syntax is also supported: \`[GEO:shape-name[parameters]]\`)

Size modifiers (optional, default is small):
- \`[size:tiny]\`   (95px max-width, inline for compact options)
- \`[size:small]\`  (145px max-width, optimal for standard exam questions)
- \`[size:compact]\` (165px max-width, slightly wider for multi-line labels)
- \`[size:medium]\` (210px max-width, for complex figures / CQ stems)

Common Shapes & Parameter Reference:
1. Triangles:
   - Right Triangle: ##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=5,angle=30°][size:small]##
   - Equilateral: ##GEO:equilateral[A=A,B=B,C=C,s=6,angle=60°][size:small]##
   - Isosceles: ##GEO:isosceles[A=A,B=B,C=C,a=5,b=6][size:small]##
   - Scalene: ##GEO:scalene[A=A,B=B,C=C,a=5,b=7,c=8][size:small]##
   - Triangle with Altitude: ##GEO:triangle-altitude[A=A,B=B,C=C,D=D,h=4,base=6][size:small]##
   - Inscribed Circle: ##GEO:triangle-incircle[A=A,B=B,C=C,r=2][size:small]##
   - Circumscribed Circle: ##GEO:triangle-circumcircle[A=A,B=B,C=C,R=4][size:small]##
   - Similar Triangles: ##GEO:similar-triangles[A=A,B=B,C=C,D=D,E=E][size:small]##

2. Quadrilaterals:
   - Parallelogram: ##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5][size:small]##
   - Rectangle: ##GEO:rectangle[A=A,B=B,C=C,D=D,l=8,w=5][size:small]##
   - Square: ##GEO:square[A=A,B=B,C=C,D=D,s=6][size:small]##
   - Rhombus: ##GEO:rhombus[A=A,B=B,C=C,D=D,d1=8,d2=6][size:small]##
   - Trapezium: ##GEO:trapezium[A=A,B=B,C=C,D=D,a=10,b=6,h=4][size:small]##
   - Cyclic Quad: ##GEO:cyclic-quad[A=A,B=B,C=C,D=D][size:small]##

3. Circles & Arcs:
   - Circle Radius: ##GEO:circle[O=O,r=5,label=r=5 cm][size:small]##
   - Chord & Bisector: ##GEO:circle-chord[O=O,A=A,B=B,M=M,r=5,chord=6][size:small]##
   - Tangent Line: ##GEO:circle-tangent[O=O,P=P,T=T,r=5,t=12][size:small]##
   - Two Tangents: ##GEO:circle-two-tangents[O=O,P=P,A=A,B=B,r=5][size:small]##
   - Central & Inscribed: ##GEO:circle-angles[O=O,A=A,B=B,C=C,central=80°,inscribed=40°][size:small]##
   - Semicircle: ##GEO:semicircle[A=A,B=B,C=C,angle=90°][size:small]##

4. Lines & Angles:
   - Parallel Lines Transversal: ##GEO:parallel-transversal[angle1=110°,angle2=70°][size:small]##
   - Intersecting Lines: ##GEO:intersecting-lines[angle=45°][size:small]##
   - Angle Bisector: ##GEO:angle-bisector[angle=60°,half=30°][size:small]##

5. Shaded Areas:
   - Shaded Sector: ##GEO:shaded-sector[r=6,theta=60°][size:small]##
   - Shaded Segment: ##GEO:shaded-segment[r=6,chord=6][size:small]##
   - Circle in Square: ##GEO:circle-in-square[s=10,r=5][size:small]##

6. 3D Solids:
   - Cylinder: ##GEO:cylinder[r=3,h=7][size:small]##
   - Cone: ##GEO:cone[r=4,h=9][size:small]##
   - Sphere: ##GEO:sphere[r=5][size:small]##
   - Cube: ##GEO:cube[s=5][size:small]##

7. Freeform Custom DSL (for arbitrary figures):
   \`##GEO:custom[point(A,20,80),point(B,80,80),point(C,50,20),polygon(A,B,C),angle(B,A,C,30°),label(A,B,c=6)]##\`
`;

export const CODING_QUESTION_SYNTAX_GUIDE = `
### Coding Question Format Specification
Set \`"type": "CODING"\`.
Required fields:
- \`"questionText"\`: Problem statement with description, Input Format, Output Format, and Sample input/output. Supports Markdown & LaTeX.
- \`"constraints"\`: Constraints on inputs (e.g., "$1 \\le N \\le 10^5$, $-10^9 \\le A_i \\le 10^9$").
- \`"allowedLanguages"\`: Array of supported languages, e.g. \`["python", "c", "cpp"]\`.
- \`"starterCode"\`: Map of starter code templates, e.g. \`{ "python": "def solve():\\n    pass\\n" }\`.
- \`"modelAnswer"\`: Clean, reference solution code.
- \`"testCases"\`: Array of automated evaluation test cases:
  * \`"input"\`: Standard input string (STDIN)
  * \`"expectedOutput"\`: Expected standard output string (STDOUT)
  * \`"isHidden"\`: boolean (false for public sample tests, true for hidden assessment tests)
  * \`"weight"\`: integer or float marks for this test case
  * \`"explanation"\`: optional explanation of this test case
`;

export interface GeneratePromptOptions {
  subject?: string;
  className?: string;
  topic?: string;
  count?: number;
  includeGeometry?: boolean;
  includeCoding?: boolean;
  types?: string[];
}

/**
 * Returns a complete, self-contained system prompt for an LLM to generate bulk questions
 * formatted ready to be pasted directly into Digital School's Bulk Upload JSON tab.
 */
export function getBulkQuestionsLLMPrompt(options: GeneratePromptOptions = {}): string {
  const {
    subject = "Mathematics & Computer Science",
    className = "Class 10",
    topic = "Geometry & Problem Solving",
    count = 5,
    includeGeometry = true,
    includeCoding = true,
    types = ['MCQ', 'CQ', 'SQ', 'CODING']
  } = options;

  return `You are an expert curriculum developer and question creator for ${className} (${subject}).
Generate ${count} high-quality questions in JSON array format, ready for direct bulk import into the Digital School platform.

Topic: ${topic}
Target Class: "${className}"
Target Subject: "${subject}"
Include Question Types: ${types.join(', ')}

### Output Format Requirements:
Output ONLY a valid JSON array containing question objects:
[
  { ...question 1... },
  { ...question 2... }
]

Do not include any conversational filler, markdown intro, or text before/after the JSON array. Output strict valid JSON.

### Question Type Specifications:

1. MCQ (Single Choice):
{
  "type": "MCQ",
  "className": "${className}",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "marks": 1,
  "questionText": "Question text here... ${includeGeometry ? '(Include ##GEO:...## diagram if applicable)' : ''}",
  "options": [
    { "text": "Option A text", "isCorrect": true, "explanation": "Why this option is correct" },
    { "text": "Option B text", "isCorrect": false },
    { "text": "Option C text", "isCorrect": false },
    { "text": "Option D text", "isCorrect": false }
  ]
}

2. CQ (Creative / Comprehension Multi-Part Question):
{
  "type": "CQ",
  "className": "${className}",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "MEDIUM",
  "marks": 10,
  "questionText": "Scenario / Stem text... ${includeGeometry ? '##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=?][size:small]##' : ''}",
  "subQuestions": [
    { "question": "(a) State the definition or theorem.", "marks": 2, "modelAnswer": "Expected answer for part a" },
    { "question": "(b) Calculate the required value with proof.", "marks": 4, "modelAnswer": "Step-by-step solution for part b" },
    { "question": "(c) Verify the geometric relationship.", "marks": 4, "modelAnswer": "Step-by-step solution for part c" }
  ]
}

3. SQ (Short Answer / Calculation):
{
  "type": "SQ",
  "className": "${className}",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "EASY",
  "marks": 2,
  "questionText": "Direct question text... ${includeGeometry ? '##GEO:circle-tangent[O=O,P=P,r=5,t=12][size:small]##' : ''}",
  "modelAnswer": "Official answer key / calculation result",
  "explanation": "Teacher notes or step-by-step rationale"
}

${includeCoding ? `4. CODING (Programming Contest Question):
{
  "type": "CODING",
  "className": "${className}",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "MEDIUM",
  "marks": 10,
  "questionText": "Problem Title\\n\\nProblem description here.\\n\\n### Input Format\\n- First line: integer $N$\\n\\n### Output Format\\n- Print the required answer.",
  "constraints": "1 <= N <= 10^5",
  "allowedLanguages": ["python", "c", "cpp"],
  "starterCode": {
    "python": "import sys\\ndef solve():\\n    # Your code here\\n    pass\\nsolve()\\n"
  },
  "modelAnswer": "import sys\\ndef solve():\\n    lines = sys.stdin.read().split()\\n    if not lines: return\\n    print(sum(int(x) for x in lines[1:]))\\nsolve()",
  "testCases": [
    { "id": 1, "input": "5\\n1 2 3 4 5", "expectedOutput": "15", "isHidden": false, "weight": 2, "explanation": "Sample test 1" },
    { "id": 2, "input": "3\\n10 20 30", "expectedOutput": "60", "isHidden": false, "weight": 2, "explanation": "Sample test 2" },
    { "id": 3, "input": "1\\n100", "expectedOutput": "100", "isHidden": true, "weight": 3, "explanation": "Hidden boundary test" },
    { "id": 4, "input": "4\\n-5 5 -10 10", "expectedOutput": "0", "isHidden": true, "weight": 3, "explanation": "Hidden negative test" }
  ]
}` : ''}

${includeGeometry ? GEOMETRY_DIAGRAM_SYNTAX_GUIDE : ''}

### Concrete Example of Generated Output:
[
  {
    "type": "MCQ",
    "className": "${className}",
    "subject": "${subject}",
    "topic": "Right Triangles",
    "difficulty": "EASY",
    "marks": 1,
    "questionText": "In right-angled triangle $\\\\triangle ABC$, if $AB = 3\\\\text{ cm}$ and $BC = 4\\\\text{ cm}$, what is the length of hypotenuse $AC$?\\\\n\\\\n##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,c=?][size:small]##",
    "options": [
      { "text": "5 cm", "isCorrect": true, "explanation": "$AC = \\\\sqrt{3^2 + 4^2} = \\\\sqrt{25} = 5\\\\text{ cm}$" },
      { "text": "6 cm", "isCorrect": false },
      { "text": "7 cm", "isCorrect": false },
      { "text": "8 cm", "isCorrect": false }
    ]
  },
  {
    "type": "CQ",
    "className": "${className}",
    "subject": "${subject}",
    "topic": "Circle Tangents",
    "difficulty": "MEDIUM",
    "marks": 10,
    "questionText": "From an external point $P$, a tangent $PT$ of length $12\\\\text{ cm}$ is drawn to a circle of radius $5\\\\text{ cm}$ centered at $O$.\\\\n\\\\n##GEO:circle-tangent[O=O,P=P,T=T,r=5,t=12][size:small]##",
    "subQuestions": [
      { "question": "(a) State the relationship between the radius and the tangent at the point of contact.", "marks": 2, "modelAnswer": "The radius to the point of contact is perpendicular to the tangent line ($OT \\\\perp PT$)." },
      { "question": "(b) Calculate the distance from center $O$ to point $P$.", "marks": 4, "modelAnswer": "In right $\\\\triangle OTP$, $OP^2 = OT^2 + PT^2 = 5^2 + 12^2 = 25 + 144 = 169 \\\\implies OP = 13\\\\text{ cm}$." },
      { "question": "(c) If another tangent $PT'$ is drawn to the same circle, prove that $PT = PT'$.", "marks": 4, "modelAnswer": "In $\\\\triangle OTP$ and $\\\\triangle OT'P$, $OT = OT' = r$, $OP$ is common, and $\\\\angle OTP = \\\\angle OT'P = 90^\\\\circ$. By RHS congruence, $\\\\triangle OTP \\\\cong \\\\triangle OT'P \\\\implies PT = PT' = 12\\\\text{ cm}$." }
    ]
  }
]

Now generate ${count} unique, accurate questions following the exact JSON specifications above.
`.trim();
}
