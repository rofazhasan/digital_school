// Test script for MCQ disable logic when marks are reached
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMCQDisableLogic() {
  console.log('🧪 Testing MCQ Disable Logic When Marks Reached...\n');

  try {
    // Get the exam
    const exam = await prisma.exam.findFirst({
      where: { name: "Realistic Test Exam - Question Selection" }
    });

    if (!exam) {
      console.log('❌ Exam not found. Please run the update-exam-actual-marks script first.');
      return;
    }

    console.log('📊 Exam Configuration:');
    console.log(`- Name: ${exam.name}`);
    console.log(`- Total Marks: ${exam.totalMarks}`);
    console.log(`- CQ: ${exam.cqRequiredQuestions}/${exam.cqTotalQuestions} questions`);
    console.log(`- SQ: ${exam.sqRequiredQuestions}/${exam.sqTotalQuestions} questions`);

    // Get sample questions
    const questions = await prisma.question.findMany({
      where: { classId: exam.classId },
      take: 20
    });

    const cqQuestions = questions.filter(q => q.type === 'CQ').slice(0, 5);
    const sqQuestions = questions.filter(q => q.type === 'SQ').slice(0, 5);
    const mcqQuestions = questions.filter(q => q.type === 'MCQ').slice(0, 10);

    console.log('\n📋 Sample Questions:');
    console.log(`- CQ Questions: ${cqQuestions.length} (marks: ${cqQuestions.map(q => q.marks).join(', ')})`);
    console.log(`- SQ Questions: ${sqQuestions.length} (marks: ${sqQuestions.map(q => q.marks).join(', ')})`);
    console.log(`- MCQ Questions: ${mcqQuestions.length} (marks: ${mcqQuestions.map(q => q.marks).join(', ')})`);

    // Test scenarios
    console.log('\n🎯 Test Scenarios:');

    // Scenario 1: Calculate marks when CQ and SQ are selected
    const selectedCQ3 = cqQuestions.slice(0, 3);
    const selectedSQ3 = sqQuestions.slice(0, 3);
    
    const cqMarks3 = selectedCQ3.slice(0, exam.cqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const sqMarks3 = selectedSQ3.slice(0, exam.sqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const availableMarks = exam.totalMarks - cqMarks3 - sqMarks3;

    console.log('✅ Scenario 1: Select 3 CQ, 3 SQ');
    console.log(`  - CQ Marks: ${cqMarks3} (${exam.cqRequiredQuestions} required)`);
    console.log(`  - SQ Marks: ${sqMarks3} (${exam.sqRequiredQuestions} required)`);
    console.log(`  - Available Marks for MCQ: ${availableMarks}`);
    console.log(`  - MCQ Questions Can Be Added: ${availableMarks > 0 ? 'YES' : 'NO'}`);

    // Scenario 2: Test MCQ selection when marks are almost full
    const selectedMCQ5 = mcqQuestions.slice(0, 5);
    const mcqMarks5 = selectedMCQ5.reduce((sum, q) => sum + q.marks, 0);
    const remainingMarks = availableMarks - mcqMarks5;

    console.log('\n✅ Scenario 2: Add 5 MCQ questions');
    console.log(`  - MCQ Marks Added: ${mcqMarks5}`);
    console.log(`  - Remaining Marks: ${remainingMarks}`);
    console.log(`  - More MCQ Can Be Added: ${remainingMarks > 0 ? 'YES' : 'NO'}`);

    // Scenario 3: Test when adding MCQ would exceed total marks
    const nextMCQ = mcqQuestions[5];
    const wouldExceed = (remainingMarks + nextMCQ.marks) > exam.totalMarks;

    console.log('\n✅ Scenario 3: Try to add one more MCQ');
    console.log(`  - Next MCQ Marks: ${nextMCQ.marks}`);
    console.log(`  - Would Exceed Total: ${wouldExceed ? 'YES' : 'NO'}`);
    console.log(`  - MCQ Should Be Disabled: ${wouldExceed ? 'YES' : 'NO'}`);

    // Scenario 4: Test exact marks match
    const exactMarks = cqMarks3 + sqMarks3 + mcqMarks5;
    const isExactMatch = exactMarks === exam.totalMarks;

    console.log('\n✅ Scenario 4: Exact marks match');
    console.log(`  - Total Marks: ${exactMarks} / ${exam.totalMarks}`);
    console.log(`  - Is Exact Match: ${isExactMatch ? 'YES' : 'NO'}`);
    console.log(`  - MCQ Should Be Disabled: ${isExactMatch ? 'YES' : 'NO'}`);

    console.log('\n🎉 MCQ disable logic test completed!');
    console.log('\n📋 Expected Behavior:');
    console.log('✅ MCQ questions should be disabled when adding would exceed total marks');
    console.log('✅ MCQ questions should be disabled when marks are exactly full');
    console.log('✅ MCQ questions should be enabled when marks are below total');
    console.log('✅ Add button should be disabled for MCQ when marks would exceed');

  } catch (error) {
    console.error('❌ Error testing MCQ disable logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMCQDisableLogic(); 