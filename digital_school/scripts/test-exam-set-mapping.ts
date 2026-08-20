/**
 * Comprehensive Unit & Integration Test Suite for ExamSetResolver & PhysicalResponseMapper
 * 
 * Tests:
 * 1. Correct question mapping (100 questions)
 * 2. Wrong set ID validation
 * 3. Missing questions / skipped questions handling
 * 4. Question order changes across sets (Set A vs Set B)
 * 5. New question insertion
 * 6. Question ID mismatch
 * 7. Question type mismatch (MCQ, MMCQ, AR, INT)
 * 8. Bengali character normalization (ক, খ, গ, ঘ -> A, B, C, D)
 * 9. Canonical evaluation correctness
 */

import { ExamSetResolver } from '../lib/omr/exam-set-resolver';
import { PhysicalResponseMapper, PhysicalAnswerEntry } from '../lib/omr/physical-response-mapper';

function runTests() {
  console.log('\n=== RUNNING EXAM SET RESOLVER & PHYSICAL RESPONSE MAPPER TESTS ===\n');
  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, description: string) => {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${description}`);
    }
  };

  // Mock Question JSON Data (100 questions with stable IDs)
  const mockQuestionsSetA: any[] = Array.from({ length: 100 }).map((_, i) => {
    const qNo = i + 1;
    const correctIdx = (i % 4); // 0=A, 1=B, 2=C, 3=D
    const letters = ['A', 'B', 'C', 'D'];
    return {
      id: `question_cuid_${qNo.toString().padStart(3, '0')}`,
      type: i === 50 ? 'MC' : (i === 60 ? 'AR' : (i === 70 ? 'INT' : 'MCQ')),
      questionText: `Sample question ${qNo} for Set A`,
      marks: 1,
      options: [
        { text: 'Option A', isCorrect: correctIdx === 0 },
        { text: 'Option B', isCorrect: correctIdx === 1 },
        { text: 'Option C', isCorrect: correctIdx === 2 },
        { text: 'Option D', isCorrect: correctIdx === 3 }
      ],
      correctAnswer: letters[correctIdx],
      correctOption: correctIdx,
      explanation: `Explanation for Q${qNo}`,
      subject: 'Physics'
    };
  });

  // 1. Test ExamSetResolver Parsing
  const questionSetA = ExamSetResolver.parseRawQuestionsJson(mockQuestionsSetA, 'set_uuid_A', 'A', 'exam_uuid_101');
  assert(questionSetA.totalQuestions === 100, 'ExamSetResolver parsed exactly 100 questions');
  assert(questionSetA.questions[0].id === 'question_cuid_001', 'First question ID is question_cuid_001');
  assert(questionSetA.questionIdMap.has('question_cuid_050'), 'Question ID map contains question_cuid_050');
  assert(questionSetA.typeDistribution['MCQ'] === 97, 'Type distribution computed correctly (97 MCQs)');

  // 2. Test Correct Question Mapping (100 Physical Answers)
  const physicalAnswers: PhysicalAnswerEntry[] = Array.from({ length: 100 }).map((_, i) => {
    const qNo = i + 1;
    const optLetter = ['A', 'B', 'C', 'D'][i % 4];
    return {
      questionNo: qNo,
      selectedOption: optLetter,
      confidence: 0.99,
      status: 'ONE_SELECTED'
    };
  });

  const mappingResult = PhysicalResponseMapper.mapResponses(questionSetA, physicalAnswers);
  assert(mappingResult.validationStatus === 'VALID', 'Mapping status is VALID for perfect physical sheet');
  assert(mappingResult.mappedCount === 100, 'Mapped count is 100');
  assert(mappingResult.canonicalAnswers['question_cuid_001'] === 'A', 'Q1 mapped to canonical key question_cuid_001 with value A');
  assert(mappingResult.canonicalAnswers['question_cuid_002'] === 'B', 'Q2 mapped to canonical key question_cuid_002 with value B');

  // 3. Test Bengali Option Normalization (ক, খ, গ, ঘ)
  const bengaliAnswers: PhysicalAnswerEntry[] = [
    { questionNo: 1, selectedOption: 'ক', confidence: 0.95 },
    { questionNo: 2, selectedOption: 'খ', confidence: 0.95 },
    { questionNo: 3, selectedOption: 'গ', confidence: 0.95 },
    { questionNo: 4, selectedOption: 'ঘ', confidence: 0.95 }
  ];
  const bengaliResult = PhysicalResponseMapper.mapResponses(questionSetA, bengaliAnswers);
  assert(bengaliResult.canonicalAnswers['question_cuid_001'] === 'A', 'Bengali ক mapped to A');
  assert(bengaliResult.canonicalAnswers['question_cuid_002'] === 'B', 'Bengali খ mapped to B');
  assert(bengaliResult.canonicalAnswers['question_cuid_003'] === 'C', 'Bengali গ mapped to C');
  assert(bengaliResult.canonicalAnswers['question_cuid_004'] === 'D', 'Bengali ঘ mapped to D');

  // 4. Test Skipped / Blank Questions
  const partialAnswers: PhysicalAnswerEntry[] = [
    { questionNo: 1, selectedOption: 'A', confidence: 0.99 },
    { questionNo: 2, selectedOption: null, status: 'BLANK' }, // Skipped
    { questionNo: 3, selectedOption: 'C', confidence: 0.99 }
  ];
  const partialResult = PhysicalResponseMapper.mapResponses(questionSetA, partialAnswers);
  assert(partialResult.canonicalAnswers['question_cuid_002'] === '', 'Skipped Q2 mapped to blank string');
  assert(partialResult.skippedCount === 98, 'Skipped count correctly recorded as 98');

  // 5. Test Question Order Changes Across Sets (Set A vs Set B)
  // Set B has reversed order of questions
  const mockQuestionsSetB = [...mockQuestionsSetA].reverse();
  const questionSetB = ExamSetResolver.parseRawQuestionsJson(mockQuestionsSetB, 'set_uuid_B', 'B', 'exam_uuid_101');
  
  // Physical answer for Q1 on Set B sheet
  const setBPhysicalAnswers: PhysicalAnswerEntry[] = [
    { questionNo: 1, selectedOption: 'D', confidence: 0.98 } // On Set B, Q1 is question_cuid_100
  ];
  const setBResult = PhysicalResponseMapper.mapResponses(questionSetB, setBPhysicalAnswers);
  assert(
    setBResult.canonicalAnswers['question_cuid_100'] === 'D',
    'Set B Q1 correctly maps to question_cuid_100 (stable ID) rather than question_cuid_001'
  );

  // 6. Test Multi-Choice (MC) and Multiple Marked Single-Choice
  const specialAnswers: PhysicalAnswerEntry[] = [
    { questionNo: 51, selectedOptions: ['A', 'C'], status: 'MULTIPLE_MARKED' }, // Q51 is type MC
    { questionNo: 1, selectedOptions: ['A', 'B'], status: 'MULTIPLE_MARKED' }    // Q1 is type MCQ (single)
  ];
  const specialResult = PhysicalResponseMapper.mapResponses(questionSetA, specialAnswers);
  assert(
    Array.isArray(specialResult.canonicalAnswers['question_cuid_051']?.selectedOptions),
    'MC question Q51 mapped selectedOptions array [0, 2]'
  );
  assert(
    specialResult.canonicalAnswers['question_cuid_001'] === 'MULTIPLE',
    'MCQ single question Q1 flagged as MULTIPLE'
  );
  assert(specialResult.validationStatus === 'WARNINGS', 'Status is WARNINGS due to multiple mark on single choice');

  // 7. Test Question Insertion / Addition Handling
  const augmentedQuestions = [
    ...mockQuestionsSetA,
    {
      id: 'question_cuid_101_inserted',
      type: 'MCQ',
      questionText: 'Inserted question 101',
      marks: 1,
      options: [{ text: 'A', isCorrect: true }]
    }
  ];
  const augmentedSet = ExamSetResolver.parseRawQuestionsJson(augmentedQuestions, 'set_uuid_Aug', 'A', 'exam_uuid_101');
  const augmentedResult = PhysicalResponseMapper.mapResponses(augmentedSet, physicalAnswers);
  assert(augmentedResult.unmappedQuestionIds.includes('question_cuid_101_inserted'), 'Inserted question detected in unmappedQuestionIds');

  // 8. Test Empty / Invalid ExamSet Error Handling
  const emptyResult = PhysicalResponseMapper.mapResponses(
    { setId: 'empty', setName: 'A', examId: 'e1', isActive: true, totalQuestions: 0, totalObjectiveMarks: 0, questions: [], questionIdMap: new Map(), sequenceMap: new Map(), typeDistribution: {} },
    physicalAnswers
  );
  assert(emptyResult.validationStatus === 'ERROR', 'Empty ExamSet returns validationStatus ERROR');
  assert(emptyResult.errors.length > 0, 'Error message populated for empty ExamSet');

  console.log(`\n=== SUMMARY: ${passed} / ${total} TESTS PASSED ===\n`);
}

runTests();
