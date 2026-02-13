import { evaluateMCQuestion, getMCFeedback } from '../evaluation/mcEvaluation';

// Test the MC evaluation logic
const testMCEvaluation = () => {
    console.log('🧪 Testing MC Question Evaluation Logic\n');

    // Test Question: 2 correct out of 4 options, 5 marks
    const testQuestion = {
        options: [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: true },
            { text: 'Option C', isCorrect: false },
            { text: 'Option D', isCorrect: false }
        ],
        marks: 5
    };

    const settings = {
        negativeMarking: 25, // 25% penalty per wrong answer
        partialMarking: true
    };

    // Test Case 1: All correct
    console.log('Test 1: All correct (both A and B selected)');
    let score = evaluateMCQuestion(testQuestion, { selectedOptions: [0, 1] }, settings);
    console.log(`Expected: 5, Got: ${score} ${score === 5 ? '✅' : '❌'}\n`);

    // Test Case 2: Partial correct (only A)
    console.log('Test 2: Partial correct (only A selected)');
    score = evaluateMCQuestion(testQuestion, { selectedOptions: [0] }, settings);
    console.log(`Expected: 2.5, Got: ${score} ${score === 2.5 ? '✅' : '❌'}\n`);

    // Test Case 3: Partial with penalty (A + C)
    console.log('Test 3: Partial with penalty (A and C selected)');
    score = evaluateMCQuestion(testQuestion, { selectedOptions: [0, 2] }, settings);
    console.log(`Expected: 1.25, Got: ${score} ${score === 1.25 ? '✅' : '❌'}\n`);

    // Test Case 4: All wrong
    console.log('Test 4: All wrong (C and D selected)');
    score = evaluateMCQuestion(testQuestion, { selectedOptions: [2, 3] }, settings);
    console.log(`Expected: 0, Got: ${score} ${score === 0 ? '✅' : '❌'}\n`);

    // Test Case 5: No partial marking
    console.log('Test 5: No partial marking (only A selected)');
    score = evaluateMCQuestion(testQuestion, { selectedOptions: [0] }, { ...settings, partialMarking: false });
    console.log(`Expected: 0, Got: ${score} ${score === 0 ? '✅' : '❌'}\n`);

    // Test Feedback
    console.log('Test 6: Feedback generation');
    const feedback = getMCFeedback(testQuestion, { selectedOptions: [0, 2] }, 1.25);
    console.log('Feedback:', feedback.feedback);
    console.log(`Missed: ${feedback.missedCorrect.length}, Wrong: ${feedback.wronglySelected.length}\n`);

    console.log('✅ All evaluation tests complete!');
};

// Run tests
testMCEvaluation();
