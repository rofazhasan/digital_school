import { evaluateSubmission } from './lib/exam-logic';

const exam = {
  id: "test",
  totalMarks: 50,
  mcqNegativeMarking: 0,
  cqRequiredQuestions: 0,
  sqRequiredQuestions: 0
};

const examSet = {
  id: "set1",
  questionsJson: JSON.stringify([
    { id: "q1", type: "MCQ", marks: 2, options: [{text: "A", isCorrect: true}] },
    { id: "q2", type: "MC", marks: 2, options: [{text: "A", isCorrect: true}] },
    { id: "q3", type: "INT", marks: 2, answer: 5 },
    { id: "q4", type: "AR", marks: 2, correctOption: 1 },
    { id: "q5", type: "MTF", marks: 2, leftColumn: [{id: "1"}], rightColumn: [{id: "A"}], matches: {"1": "A"} },
    { id: "q6", type: "CQ", marks: 10 },
    { id: "q7", type: "SQ", marks: 5 }
  ])
};

const submission = {
  id: "sub1",
  studentId: "student1",
  examId: "test",
  examSetId: "set1",
  answers: {}
};

// Mock prisma to avoid DB connection
global.prisma = {
  examStudentMap: { findFirst: async () => null },
  examSet: { findUnique: async () => examSet },
  examSubmission: { update: async () => ({}) },
  result: { upsert: async () => ({}) }
} as any;

async function run() {
  try {
    const res = await evaluateSubmission(submission, exam, [examSet]);
    console.log("EVAL RESULT FOR EMPTY ANSWERS:", res);
  } catch(e) {
    console.error(e);
  }
}
run();
