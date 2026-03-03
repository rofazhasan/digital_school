import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock prisma global
(global as any).prisma = {
    examStudentMap: { findFirst: async () => null },
    examSet: {
        findUnique: async () => ({
            id: "set1",
            questionsJson: JSON.stringify([
                {
                    id: "q1",
                    type: "SMCQ",
                    marks: 4,
                    sub_questions: [
                        { question: "Sub 1", marks: 2, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
                        { question: "Sub 2", marks: 2, options: [{ text: "C", isCorrect: true }, { text: "D", isCorrect: false }] }
                    ]
                }
            ])
        })
    },
    examSubmission: { update: async () => ({}) },
    result: { upsert: async () => ({}) }
};

import { evaluateSubmission } from '../lib/exam-logic';

const exam = { id: "test", totalMarks: 50, mcqNegativeMarking: 0, cqRequiredQuestions: 0, sqRequiredQuestions: 0 };
const submission = {
    id: "sub1",
    studentId: "student1",
    examId: "test",
    examSetId: "set1",
    answers: {
        "q1_sub_0": "A",
        "q1_sub_1": "C"
    }
};

async function run() {
    try {
        console.log("Running SMCQ Fix Verification Test...");
        const res = await evaluateSubmission(submission, exam, [await (global as any).prisma.examSet.findUnique()]);
        console.log("EVAL RESULT:", res);

        if (res.totalScore === 4) {
            console.log("SUCCESS: SMCQ marks calculated correctly with 'sub_questions' naming.");
        } else {
            console.log(`FAILURE: Expected 4 marks, got ${res.totalScore}`);
            process.exit(1);
        }
    } catch (e) {
        console.error("Error during test:", e);
        process.exit(1);
    }
}

run();
