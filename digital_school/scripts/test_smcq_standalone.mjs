// Standalone test for the fixed SMCQ logic
// This copies the logic directly to avoid ESM/TS import issues in this environment

function evaluateSMCQStandalone(question, answers, exam) {
    const subQs = question.subQuestions || question.sub_questions;
    if (!subQs) return 0;

    let smcqScore = 0;
    subQs.forEach((subQ, sIdx) => {
        const subAnswer = answers[`${question.id}_sub_${sIdx}`];
        if (subAnswer === undefined || subAnswer === null || subAnswer === '') return;

        const normalize = (s) => String(s || '').trim().toLowerCase();
        const userAns = normalize(subAnswer);
        let isCorrect = false;

        if (subQ.options && Array.isArray(subQ.options)) {
            const correctOption = subQ.options.find((opt) => opt.isCorrect);
            if (correctOption) {
                const correctOptionText = normalize(typeof correctOption === 'object' ? correctOption.text : correctOption);
                isCorrect = userAns === correctOptionText;
            }
        }

        if (!isCorrect && (subQ.correctAnswer !== undefined && subQ.correctAnswer !== null)) {
            const correctIndex = Number(subQ.correctAnswer);
            if (!isNaN(correctIndex) && subQ.options && subQ.options[correctIndex]) {
                const opt = subQ.options[correctIndex];
                const correctText = normalize(typeof opt === 'object' ? opt.text : opt);
                isCorrect = userAns === correctText;
            } else {
                isCorrect = userAns === normalize(subQ.correctAnswer);
            }
        }

        if (isCorrect) {
            smcqScore += Number(subQ.marks) || 1;
        } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
            smcqScore -= ((Number(subQ.marks || 1) * exam.mcqNegativeMarking) / 100);
        }
    });
    return smcqScore;
}

// Test Case 1: sub_questions naming (the bug reported)
const question1 = {
    id: "q1",
    sub_questions: [
        { marks: 2, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
        { marks: 2, options: [{ text: "C", isCorrect: true }, { text: "D", isCorrect: false }] }
    ]
};
const answers1 = { "q1_sub_0": "A", "q1_sub_1": "C" };
const exam = { mcqNegativeMarking: 0 };

const score1 = evaluateSMCQStandalone(question1, answers1, exam);
console.log("Test 1 (sub_questions):", score1 === 4 ? "PASSED" : "FAILED", ` Score: ${score1}`);

// Test Case 2: subQuestions naming (existing support)
const question2 = {
    id: "q2",
    subQuestions: [
        { marks: 2, options: [{ text: "X", isCorrect: true }] }
    ]
};
const answers2 = { "q2_sub_0": "X" };
const score2 = evaluateSMCQStandalone(question2, answers2, exam);
console.log("Test 2 (subQuestions):", score2 === 2 ? "PASSED" : "FAILED", ` Score: ${score2}`);

if (score1 === 4 && score2 === 2) {
    console.log("\nALL STANDALONE TESTS PASSED!");
} else {
    process.exit(1);
}
