// We must mock prisma BEFORE importing exam-logic
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// A simple mock for prisma
global.prisma = {
    examStudentMap: { findFirst: async () => null },
    examSet: { findUnique: async () => ({
        id: "set1",
        questionsJson: JSON.stringify([
            { id: "q1", type: "MCQ", marks: 2, options: [{text: "A", isCorrect: true}] },
            { id: "q2", type: "MC", marks: 2, options: [{text: "A", isCorrect: true}] },
            { id: "q3", type: "INT", marks: 2, answer: 5 },
            { id: "q4", type: "AR", marks: 2, correctOption: 1 },
            { id: "q5", type: "MTF", marks: 2, leftColumn: [{id: "1"}], rightColumn: [{id: "A"}], matches: {"1": "A"} },
            { id: "q6", type: "CMA", marks: 10, parts: [{ id: "p1", label: "Velocity", type: "decimal", marks: 5, expectedAnswer: 20, tolerance: 0.1 }, { id: "p2", label: "Displacement", type: "decimal", marks: 5, expectedAnswer: 50, tolerance: 0.1 }] },
            { id: "q7", type: "MPC", marks: 10, stages: [{ id: "s1", stageTitle: "Stage 1", marks: 5, expectedAnswer: 10 }, { id: "s2", stageTitle: "Stage 2", marks: 5, expectedAnswer: 50, dependsOnStageId: "s1", formula: "prev * 5" }] },
            { id: "q8", type: "DR", marks: 10, expectedAnswer: 0, reasonOptions: [{ id: "r1", text: "Velocity is constant, so dv=0", isCorrect: true }, { id: "r2", text: "Flawed reason", isCorrect: false }] }
        ])
    }) },
    examSubmission: { update: async () => ({}) },
    result: { upsert: async () => ({}) }
};

// Now dynamic import the logic
const { evaluateSubmission } = await import('./lib/exam-logic.ts');

const exam = { id: "test", totalMarks: 50, mcqNegativeMarking: 0, cqRequiredQuestions: 0, sqRequiredQuestions: 0 };

async function run() {
    try {
        const submissionWithAnswers = {
            id: "sub1",
            studentId: "student1",
            examId: "test",
            examSetId: "set1",
            answers: {
                "q6": { "p1": "20.02", "p2": "50" }, 
                "q7": { "s1": "12", "s2": "60" },    
                "q8": { "answer": "0", "reasonId": "r2", "confidence": "Certain" } // DR: Answer correct, Reason wrong, High confidence -> MISCONCEPTION (2.5 marks)
            }
        };

        const res = await evaluateSubmission(submissionWithAnswers, exam, [await global.prisma.examSet.findUnique()]);
        console.log("EVALUATION RESULT:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e);
    }
}

run();
