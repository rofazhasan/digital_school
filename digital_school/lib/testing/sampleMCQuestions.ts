// Sample MC Questions for Testing
// Use these to test the MC question type implementation

export const sampleMCQuestions = [
    {
        type: "MC",
        subject: "Mathematics",
        topic: "Algebra",
        marks: 5,
        difficulty: "MEDIUM",
        questionText: "Which of the following are solutions to the equation $x^2 - 5x + 6 = 0$?",
        options: [
            { text: "$x = 2$", isCorrect: true, explanation: "When $x=2$: $(2)^2 - 5(2) + 6 = 4 - 10 + 6 = 0$ ✓" },
            { text: "$x = 3$", isCorrect: true, explanation: "When $x=3$: $(3)^2 - 5(3) + 6 = 9 - 15 + 6 = 0$ ✓" },
            { text: "$x = 1$", isCorrect: false },
            { text: "$x = 6$", isCorrect: false }
        ],
        hasMath: true,
        classId: "YOUR_CLASS_ID" // Replace with actual class ID
    },
    {
        type: "MC",
        subject: "Science",
        topic: "Physics",
        marks: 4,
        difficulty: "EASY",
        questionText: "Which of the following are renewable energy sources?",
        options: [
            { text: "Solar energy", isCorrect: true, explanation: "Solar energy is renewable as it comes from the sun." },
            { text: "Wind energy", isCorrect: true, explanation: "Wind energy is renewable and sustainable." },
            { text: "Coal", isCorrect: false },
            { text: "Natural gas", isCorrect: false },
            { text: "Hydroelectric power", isCorrect: true, explanation: "Water power is renewable." }
        ],
        hasMath: false,
        classId: "YOUR_CLASS_ID"
    },
    {
        type: "MC",
        subject: "Mathematics",
        topic: "Geometry",
        marks: 3,
        difficulty: "HARD",
        questionText: "In a triangle ABC, which of the following statements are always true?",
        options: [
            { text: "The sum of any two sides is greater than the third side", isCorrect: true, explanation: "Triangle inequality theorem" },
            { text: "The sum of all angles equals $180°$", isCorrect: true, explanation: "Angle sum property of triangles" },
            { text: "All sides are equal", isCorrect: false },
            { text: "The largest angle is opposite the longest side", isCorrect: true, explanation: "Angle-side relationship" }
        ],
        hasMath: true,
        classId: "YOUR_CLASS_ID"
    }
];

// Test Scenarios
export const testScenarios = {
    // Scenario 1: Full marks (all correct, no wrong)
    fullMarks: {
        question: sampleMCQuestions[0],
        answer: { selectedOptions: [0, 1] }, // Both correct
        expectedScore: 5,
        settings: { negativeMarking: 25, partialMarking: true }
    },

    // Scenario 2: Partial marks (1 correct out of 2)
    partialMarks: {
        question: sampleMCQuestions[0],
        answer: { selectedOptions: [0] }, // Only one correct
        expectedScore: 2.5,
        settings: { negativeMarking: 25, partialMarking: true }
    },

    // Scenario 3: Partial with penalty (1 correct + 1 wrong)
    partialWithPenalty: {
        question: sampleMCQuestions[0],
        answer: { selectedOptions: [0, 2] }, // 1 correct, 1 wrong
        expectedScore: 1.25, // 2.5 - 1.25 = 1.25
        settings: { negativeMarking: 25, partialMarking: true }
    },

    // Scenario 4: Zero marks (all wrong)
    zeroMarks: {
        question: sampleMCQuestions[0],
        answer: { selectedOptions: [2, 3] }, // Both wrong
        expectedScore: 0,
        settings: { negativeMarking: 25, partialMarking: true }
    },

    // Scenario 5: No partial marking (all or nothing)
    noPartialMarking: {
        question: sampleMCQuestions[0],
        answer: { selectedOptions: [0] }, // Only one correct
        expectedScore: 0, // No partial marks allowed
        settings: { negativeMarking: 25, partialMarking: false }
    }
};
