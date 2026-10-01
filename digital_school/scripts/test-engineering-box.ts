import {
  classifySqQuestion,
  calculateSqLines,
  parseSqQuestion,
  estimateSqVisualUnits
} from '../utils/engineeringAnswerBox';

function testEngineeringAnswerBox() {
  console.log('--- Testing Engineering SQ Answer-Box Engine ---');

  // Test 1: Definition
  const q1 = {
    questionText: 'Explain the working principle of a transformer.',
    marks: 3
  };
  const parsed1 = parseSqQuestion(q1);
  console.log('Q1 (Definition/Explanation):', {
    classification: parsed1.overallClassification,
    totalLines: parsed1.totalLines,
    guideType: parsed1.guideType,
    units: estimateSqVisualUnits(q1)
  });
  if (parsed1.totalLines < 3 || parsed1.totalLines > 8) throw new Error('Q1 lines out of expected bounds');

  // Test 2: Numerical
  const q2 = {
    questionText: 'A 10 Ω resistor is connected to a 20 V source. Calculate the current and power dissipated.',
    marks: 5
  };
  const parsed2 = parseSqQuestion(q2);
  console.log('Q2 (Numerical):', {
    classification: parsed2.overallClassification,
    totalLines: parsed2.totalLines,
    guideType: parsed2.guideType,
    units: estimateSqVisualUnits(q2)
  });
  if (parsed2.overallClassification !== 'numerical') throw new Error('Q2 should be classified as numerical');
  if (parsed2.guideType !== 'numerical') throw new Error('Q2 guideType should be numerical');
  if (parsed2.totalLines < 8) throw new Error('Q2 numerical should have >= 8 lines');

  // Test 3: Derivation
  const q3 = {
    questionText: 'সমীকরণটি প্রতিপাদন কর: E = mc^2',
    marks: 6
  };
  const parsed3 = parseSqQuestion(q3);
  console.log('Q3 (Derivation):', {
    classification: parsed3.overallClassification,
    totalLines: parsed3.totalLines,
    guideType: parsed3.guideType,
    units: estimateSqVisualUnits(q3)
  });
  if (parsed3.overallClassification !== 'derivation') throw new Error('Q3 should be classified as derivation');

  // Test 4: Multi-part SQ (English)
  const q4 = {
    questionText: 'Answer the following:\n(a) Define entropy. [2]\n(b) State the second law of thermodynamics. [2]\n(c) Explain its engineering significance. [4]',
    marks: 8
  };
  const parsed4 = parseSqQuestion(q4);
  console.log('Q4 (Multi-part SQ):', {
    isMultiPart: parsed4.isMultiPart,
    stem: parsed4.stem,
    partsCount: parsed4.parts.length,
    parts: parsed4.parts.map(p => ({ label: p.label, text: p.text, marks: p.marks, lines: p.lines, type: p.classification })),
    totalLines: parsed4.totalLines
  });
  if (!parsed4.isMultiPart) throw new Error('Q4 should be detected as multi-part');
  if (parsed4.parts.length !== 3) throw new Error('Q4 should have 3 subparts');
  if (parsed4.parts[0].lines < 2 || parsed4.parts[0].lines > 3) throw new Error('Q4 (a) should have compact mini-box (2-3 lines)');
  if (parsed4.parts[2].lines < 2 || parsed4.parts[2].lines > 4) throw new Error('Q4 (c) subpart should be compact (2-3 lines, max 4 on legal)');

  // Test 5: Multi-part SQ (Bengali)
  const q5 = {
    questionText: '(ক) পরম শূন্য তাপমাত্রা কাকে বলে? [২]\n(খ) কার্নো ইঞ্জিনের দক্ষতা কেন ১০০% হতে পারে না ব্যাখ্যা কর। [৩]',
    marks: 5
  };
  const parsed5 = parseSqQuestion(q5);
  console.log('Q5 (Bengali Multi-part SQ):', {
    isMultiPart: parsed5.isMultiPart,
    partsCount: parsed5.parts.length,
    parts: parsed5.parts.map(p => ({ label: p.label, text: p.text, marks: p.marks, lines: p.lines, type: p.classification }))
  });
  if (!parsed5.isMultiPart) throw new Error('Q5 should be detected as multi-part');
  if (parsed5.parts.length !== 2) throw new Error('Q5 should have 2 subparts');
  for (const part of parsed5.parts) {
    if (part.lines < 2 || part.lines > 3) throw new Error('Bengali subparts must be strictly 2-3 lines');
  }

  // Test 6: Diagram
  const q6 = {
    questionText: 'Draw the circuit diagram of a full wave bridge rectifier.',
    marks: 4
  };
  const parsed6 = parseSqQuestion(q6);
  console.log('Q6 (Diagram):', {
    classification: parsed6.overallClassification,
    totalLines: parsed6.totalLines,
    guideType: parsed6.guideType
  });
  if (parsed6.totalLines < 6 || parsed6.totalLines > 8) throw new Error('Q6 should fit 3-finger distance (6-8 lines)');

  // Test 7: Legal Paper Optimization
  const q7 = {
    questionText: 'Derive the Maxwell thermodynamic relations and solve the heat engine efficiency for an ideal Stirling cycle.',
    marks: 8
  };
  const parsed7A4 = parseSqQuestion(q7, 1.0, 'a4');
  const parsed7Legal = parseSqQuestion(q7, 1.0, 'legal');
  console.log('Q7 (A4 vs Legal Optimization):', {
    a4Lines: parsed7A4.totalLines,
    legalLines: parsed7Legal.totalLines,
    ratio: (parsed7Legal.totalLines / parsed7A4.totalLines).toFixed(2)
  });
  if (parsed7Legal.totalLines < parsed7A4.totalLines) {
    throw new Error('Legal paper should allocate at least as many lines as A4');
  }

  // Test 8: Page Partitioning Algorithm (At least 2, at most 3 questions per page)
  console.log('\n--- Testing 2-to-3 Questions Per Page Partitioning Algorithm ---');
  function partitionQuestions(wTotal: number): number[] {
    const P = Math.max(1, Math.ceil(wTotal / 3));
    const pageChunkSizes: number[] = [];
    let remQs = wTotal;
    let remPages = P;

    for (let i = 0; i < P; i++) {
      if (remPages === 1) {
        pageChunkSizes.push(remQs);
        break;
      }
      let take = 2;
      if (remQs - 3 >= (remPages - 1) * 2) {
        take = 3;
      } else if (remQs - 2 >= (remPages - 1) * 2) {
        take = 2;
      } else {
        take = Math.max(1, Math.min(3, Math.ceil(remQs / remPages)));
      }
      take = Math.min(take, remQs);
      pageChunkSizes.push(take);
      remQs -= take;
      remPages--;
    }
    return pageChunkSizes;
  }

  for (let n = 2; n <= 20; n++) {
    const chunks = partitionQuestions(n);
    console.log(`N = ${n} questions -> ${chunks.length} pages: [${chunks.join(', ')}]`);
    const sum = chunks.reduce((a, b) => a + b, 0);
    if (sum !== n) throw new Error(`Partition sum ${sum} does not match total ${n}`);
    for (let pIdx = 0; pIdx < chunks.length; pIdx++) {
      const c = chunks[pIdx];
      if (c < 2 || c > 3) {
        throw new Error(`Page ${pIdx + 1} has ${c} questions! Must be strictly between 2 and 3 questions.`);
      }
    }
  }

  console.log('✓ ALL ENGINEERING SQ ANSWER-BOX TESTS (INCLUDING 2-TO-3 Q PER PAGE & 3-FINGER DISTANCE) PASSED SUCCESSFULLY!');
}

testEngineeringAnswerBox();
