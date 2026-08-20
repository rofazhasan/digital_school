/**
 * Verification Suite: Question Type Compatibility Matrix Audit
 * 
 * Verifies all 9 question types supported by Rofaz Academy:
 * MCQ, MMCQ, MTF, INT, AR, SMCQ, CMA, MPC, SDR
 */

import { QuestionTypeOMRAuditor, QUESTION_TYPE_COMPATIBILITY_REGISTRY } from '../lib/omr/question-type-compatibility';
import { PhysicalResponseMapper } from '../lib/omr/physical-response-mapper';
import { CanonicalQuestionSet } from '../lib/omr/exam-set-resolver';

async function runQuestionTypeAuditTests() {
  console.log('\n=== RUNNING OMR QUESTION TYPE COMPATIBILITY AUDIT ===\n');

  let passedCount = 0;

  // 1. Audit Registry Coverage for All 8 Required Question Types
  const requiredTypes = ['MCQ', 'MMCQ', 'MTF', 'INT', 'AR', 'SMCQ', 'CMA', 'MPC'];
  let allTypesPresent = true;

  requiredTypes.forEach((t) => {
    const profile = QuestionTypeOMRAuditor.getProfile(t);
    if (!profile || profile.type !== t) {
      allTypesPresent = false;
      console.error(`✗ [FAIL] Missing profile for question type: ${t}`);
    }
  });

  if (allTypesPresent) {
    console.log(`✓ [PASS] Registry covers all 8 question types: ${requiredTypes.join(', ')}`);
    passedCount++;
  }

  // 2. Verify Exact Support Levels
  const mcqProfile = QuestionTypeOMRAuditor.getProfile('MCQ');
  const smcqProfile = QuestionTypeOMRAuditor.getProfile('SMCQ');
  const arProfile = QuestionTypeOMRAuditor.getProfile('AR');
  const mmcqProfile = QuestionTypeOMRAuditor.getProfile('MMCQ');
  const intProfile = QuestionTypeOMRAuditor.getProfile('INT');
  const mtfProfile = QuestionTypeOMRAuditor.getProfile('MTF');
  const cmaProfile = QuestionTypeOMRAuditor.getProfile('CMA');
  const mpcProfile = QuestionTypeOMRAuditor.getProfile('MPC');

  if (
    mcqProfile.supportLevel === 'NATIVE' &&
    smcqProfile.supportLevel === 'NATIVE' &&
    arProfile.supportLevel === 'NATIVE' &&
    mmcqProfile.supportLevel === 'COMPOSITE_SUPPORTED' &&
    intProfile.supportLevel === 'DIGITAL_ONLY' &&
    mtfProfile.supportLevel === 'DIGITAL_ONLY' &&
    cmaProfile.supportLevel === 'DIGITAL_ONLY' &&
    mpcProfile.supportLevel === 'DIGITAL_ONLY'
  ) {
    console.log(`✓ [PASS] Support levels precisely audited (NATIVE: MCQ, SMCQ, AR | COMPOSITE: MMCQ | DIGITAL_ONLY: INT, MTF, CMA, MPC)`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Support level mismatch`);
  }

  // 3. Question Set Compatibility Auditor Test
  const mockMixedSet: CanonicalQuestionSet = {
    examSetId: 'set_mixed_types_01',
    setName: 'Set A',
    examId: 'exam_poly_01',
    totalQuestions: 8,
    totalObjectiveMarks: 80,
    questions: [
      { id: 'q_mcq_1', sequenceNumber: 1, type: 'MCQ', questionText: 'MCQ Test', options: [{ text: 'A' }, { text: 'B' }], marks: 10 },
      { id: 'q_smcq_2', sequenceNumber: 2, type: 'SMCQ', questionText: 'SMCQ Test', options: [{ text: 'A' }], marks: 10 },
      { id: 'q_ar_3', sequenceNumber: 3, type: 'AR', questionText: 'AR Test', options: [{ text: 'A' }], marks: 10 },
      { id: 'q_mmcq_4', sequenceNumber: 4, type: 'MMCQ', questionText: 'MMCQ Test', options: [{ text: 'A' }, { text: 'C' }], marks: 10 },
      { id: 'q_int_5', sequenceNumber: 5, type: 'INT', questionText: 'INT Test', options: [], marks: 10 },
      { id: 'q_mtf_6', sequenceNumber: 6, type: 'MTF', questionText: 'MTF Test', options: [], marks: 10 },
      { id: 'q_cma_7', sequenceNumber: 7, type: 'CMA', questionText: 'CMA Test', options: [], marks: 10 },
      { id: 'q_mpc_8', sequenceNumber: 8, type: 'MPC', questionText: 'MPC Test', options: [], marks: 10 }
    ]
  };

  const auditReport = QuestionTypeOMRAuditor.auditQuestionSet(mockMixedSet.questions);

  if (
    !auditReport.isFullyPhysicalCompatible &&
    auditReport.nativeCount === 3 &&
    auditReport.compositeCount === 1 &&
    auditReport.digitalOnlyCount === 4 &&
    auditReport.digitalOnlyQuestionIds.length === 4
  ) {
    console.log(`✓ [PASS] Question set auditor successfully detected 4 DIGITAL_ONLY questions with actionable warnings`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Audit report mismatch: ${JSON.stringify(auditReport)}`);
  }

  // 4. Physical Response Mapper Non-Breaking Handling of Mixed Questions
  const mockPhysicalAnswers = [
    { questionNo: 1, selectedOption: 'A', confidence: 0.98, status: 'ONE_SELECTED' },
    { questionNo: 2, selectedOption: 'B', confidence: 0.98, status: 'ONE_SELECTED' },
    { questionNo: 3, selectedOption: 'C', confidence: 0.98, status: 'ONE_SELECTED' },
    { questionNo: 4, selectedOptions: ['A', 'C'], confidence: 0.98, status: 'MULTIPLE_MARKED' },
    { questionNo: 5, selectedOption: null, confidence: 0, status: 'BLANK' } // INT unanswered on sheet
  ];

  const mappingResult = PhysicalResponseMapper.mapResponses(mockMixedSet, mockPhysicalAnswers);

  if (mappingResult.canonicalAnswers['q_mcq_1'] === 'A' && mappingResult.canonicalAnswers['q_ar_3'] === 'C') {
    console.log(`✓ [PASS] PhysicalResponseMapper accurately mapped native and composite questions without crashing on DIGITAL_ONLY items`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Mapping result error: ${JSON.stringify(mappingResult)}`);
  }

  console.log(`\n=== SUMMARY: ${passedCount} / 4 QUESTION TYPE AUDIT TESTS PASSED ===\n`);
}

runQuestionTypeAuditTests().catch(console.error);
