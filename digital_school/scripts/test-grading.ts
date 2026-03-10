
// Self-contained grading logic for testing
function calculateGrade(percentage: number, passMark: number = 33): string {
    if (percentage < passMark) return 'F';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'D';
}

function calculateGPA(percentage: number, passMark: number = 33): number {
    if (percentage < passMark) return 0.00;
    if (percentage >= 80) return 5.00;

    const segments = [
        { start: 70, end: 80, minGPA: 4.00, maxGPA: 5.00 },
        { start: 60, end: 70, minGPA: 3.50, maxGPA: 4.00 },
        { start: 50, end: 60, minGPA: 3.00, maxGPA: 3.50 },
        { start: 40, end: 50, minGPA: 2.00, maxGPA: 3.00 },
        { start: passMark, end: 40, minGPA: 1.00, maxGPA: 2.00 },
    ];

    for (const seg of segments) {
        if (percentage >= seg.start && percentage < seg.end) {
            const range = seg.end - seg.start;
            if (range <= 0) return seg.minGPA;
            const ratio = (percentage - seg.start) / range;
            const gpa = seg.minGPA + ratio * (seg.maxGPA - seg.minGPA);
            return Math.round(gpa * 100) / 100;
        }
    }

    if (percentage >= 70) return 4.00;
    if (percentage >= 60) return 3.50;
    if (percentage >= 50) return 3.00;
    if (percentage >= 40) return 2.00;
    return 1.00;
}

function testGrading(passMark: number) {
    console.log(`\n--- Testing with Pass Mark: ${passMark} ---`);
    const testPoints = [0, 20, passMark - 0.1, passMark, passMark + 1, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100];

    console.log(`${'Percentage'.padEnd(12)} | ${'Grade'.padEnd(6)} | ${'GPA'.padEnd(6)}`);
    console.log('-'.repeat(30));

    testPoints.forEach(p => {
        const percentage = Math.round(p * 100) / 100;
        if (percentage < 0 || percentage > 100) return;

        const grade = calculateGrade(percentage, passMark);
        const gpa = calculateGPA(percentage, passMark);

        console.log(`${(percentage + '%').padEnd(12)} | ${grade.padEnd(6)} | ${gpa.toFixed(2).padEnd(6)}`);
    });
}

console.log("🚀 Starting Universal Grading System Tests\n");

testGrading(33);  // Standard
testGrading(40);  // High Pass
testGrading(50);  // Elite Pass

console.log("\n✨ Tests Completed.");
