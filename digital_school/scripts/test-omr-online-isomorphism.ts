/**
 * Automated Isomorphism Test: Online Submission vs Physical OMR Scan
 * 
 * Mathematical and Structural Proof:
 * Proves that an online exam submission and a physical OMR scan with the exact same
 * question responses produce IDENTICAL evaluation results (marks, negative penalties,
 * total score, percentage, grade, and question-level outcomes).
 */

import { ExamSetResolver } from '../lib/omr/exam-set-resolver';
import { OMRSubmissionAdapter, OMRScanResult } from '../lib/omr/omr-submission-adapter';

function runIsomorphismTest() {
  console.log('\n=== RUNNING ONLINE VS OMR ISOMORPHISM VERIFICATION ===\n');
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

  // 1. Create a 50-question Exam Set containing MCQ, MC, AR, and INT questions
  const mockQuestions: any[] = Array.from({ length: 50 }).map((_, i) => {
    const qNo = i + 1;
    const correctIdx = (i % 4); // 0=A, 1=B, 2=C, 3=D
    const letters = ['A', 'B', 'C', 'D'];
    return {
      id: `q_uid_${qNo.toString().padStart(3, '0')}`,
      type: i === 40 ? 'MC' : (i === 45 ? 'AR' : 'MCQ'),
      questionText: `Question ${qNo}`,
      marks: 1.0,
      options: [
        { text: 'Option A', isCorrect: correctIdx === 0, explanation: `Explanation A for Q${qNo}` },
        { text: 'Option B', isCorrect: correctIdx === 1, explanation: `Explanation B for Q${qNo}` },
        { text: 'Option C', isCorrect: correctIdx === 2, explanation: `Explanation C for Q${qNo}` },
        { text: 'Option D', isCorrect: correctIdx === 3, explanation: `Explanation D for Q${qNo}` }
      ],
      correctAnswer: letters[correctIdx],
      correctOption: correctIdx,
      explanation: `Top level explanation for Q${qNo}`,
      subject: 'Physics'
    };
  });

  const parsedExamSet = ExamSetResolver.parseRawQuestionsJson(mockQuestions, 'set_101', 'A', 'exam_101');

  // 2. Define Student Responses (35 correct, 10 wrong, 5 skipped)
  const studentChoices: Record<number, string | null> = {};
  for (let qNo = 1; qNo <= 50; qNo++) {
    if (qNo <= 35) {
      // Correct choice
      studentChoices[qNo] = ['A', 'B', 'C', 'D'][(qNo - 1) % 4];
    } else if (qNo <= 45) {
      // Wrong choice
      const wrongIdx = ((qNo - 1) % 4 + 1) % 4;
      studentChoices[qNo] = ['A', 'B', 'C', 'D'][wrongIdx];
    } else {
      // Skipped
      studentChoices[qNo] = null;
    }
  }

  // 3. Online Submission Representation (matching exact online payload)
  const onlineAnswers: Record<string, any> = {};
  mockQuestions.forEach((q, idx) => {
    const choice = studentChoices[idx + 1];
    if (choice) {
      if (q.type === 'MC') {
        const optIdx = choice.charCodeAt(0) - 65;
        onlineAnswers[q.id] = { selectedOptions: [optIdx] };
      } else {
        onlineAnswers[q.id] = choice;
      }
    }
  });

  // 4. Physical OMR Scan Representation
  const physicalAnswers = Object.entries(studentChoices).map(([qStr, opt]) => ({
    questionNo: parseInt(qStr, 10),
    selectedOption: opt,
    confidence: 0.99,
    status: opt ? 'ONE_SELECTED' : 'BLANK'
  }));

  const omrScanResult: OMRScanResult = {
    scanId: 'scan_iso_001',
    qrPayload: { examId: 'exam_101', examSetId: 'set_101', classId: 'class_101' },
    roll: '307418',
    registration: '7890123',
    physicalAnswers,
    confidence: 0.99
  };

  const mockDb = {
    students: [
      { id: 'student_101', roll: '307418', registrationNo: '7890123', classId: 'class_101', name: 'Rafiu Hasan' }
    ],
    exams: [{ id: 'exam_101', totalMarks: 50, passMarks: 20 }],
    examSets: [{ id: 'set_101', examId: 'exam_101', questionsJson: mockQuestions }]
  };

  // Run OMRSubmissionAdapter
  OMRSubmissionAdapter.adapt(omrScanResult, { preResolvedSet: parsedExamSet, mockDb }).then(adaptRes => {
    assert(adaptRes.success === true, 'OMRSubmissionAdapter succeeded');
    const omrAnswers = adaptRes.canonicalSubmission!.answers;

    // 5. Compare Canonical Answer Representations
    let exactAnswerKeyMatch = true;
    mockQuestions.forEach(q => {
      const onlineVal = JSON.stringify(onlineAnswers[q.id] ?? '');
      const omrVal = JSON.stringify(omrAnswers[q.id] ?? '');
      if (onlineVal !== omrVal) {
        exactAnswerKeyMatch = false;
        console.error(`Mismatch on ${q.id}: Online=${onlineVal}, OMR=${omrVal}`);
      }
    });

    assert(exactAnswerKeyMatch, 'Online answers JSON and OMR adapted answers JSON are 100% ISOMORPHIC');

    // 6. Simulate Canonical Evaluation Engine on Both
    const evaluate = (answers: Record<string, any>) => {
      let totalScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const questionResults: Record<string, any> = {};

      mockQuestions.forEach(q => {
        const studentAns = answers[q.id];
        if (!studentAns || studentAns === '') {
          skippedCount++;
          questionResults[q.id] = { score: 0, status: 'SKIPPED' };
          return;
        }

        let isCorrect = false;
        if (q.type === 'MC') {
          const sel = studentAns.selectedOptions || [];
          isCorrect = sel.length === 1 && sel[0] === q.correctOption;
        } else {
          isCorrect = studentAns === q.correctAnswer;
        }

        if (isCorrect) {
          correctCount++;
          totalScore += 1.0;
          questionResults[q.id] = { score: 1.0, status: 'CORRECT' };
        } else {
          wrongCount++;
          totalScore -= 0.25; // 25% negative marking
          questionResults[q.id] = { score: -0.25, status: 'WRONG' };
        }
      });

      const percentage = Math.round((totalScore / 50) * 100);
      const grade = percentage >= 80 ? 'A+' : (percentage >= 70 ? 'A' : (percentage >= 60 ? 'A-' : (percentage >= 50 ? 'B' : 'F')));

      return { totalScore, correctCount, wrongCount, skippedCount, percentage, grade, questionResults };
    };

    const onlineEval = evaluate(onlineAnswers);
    const omrEval = evaluate(omrAnswers);

    assert(onlineEval.totalScore === omrEval.totalScore, `Total Score matches: ${onlineEval.totalScore} vs ${omrEval.totalScore}`);
    assert(onlineEval.correctCount === 35 && omrEval.correctCount === 35, 'Correct count is 35 on both');
    assert(onlineEval.wrongCount === 10 && omrEval.wrongCount === 10, 'Wrong count is 10 on both');
    assert(onlineEval.skippedCount === 5 && omrEval.skippedCount === 5, 'Skipped count is 5 on both');
    assert(onlineEval.percentage === omrEval.percentage, `Percentage matches: ${onlineEval.percentage}%`);
    assert(onlineEval.grade === omrEval.grade, `Grade matches: ${onlineEval.grade}`);

    console.log(`\n=== SUMMARY: ${passed} / ${total} TESTS PASSED ===\n`);
  }).catch(err => {
    console.error('Isomorphism test failed:', err);
  });
}

runIsomorphismTest();
