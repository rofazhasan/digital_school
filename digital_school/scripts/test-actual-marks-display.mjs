// Test script for actual marks display fix
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testActualMarksDisplay() {
  console.log('🧪 Testing Actual Marks Display Fix...\n');

  try {
    // Get the updated exam
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
    console.log(`- CQ: ${exam.cqRequiredQuestions}/${exam.cqTotalQuestions} questions (select ${exam.cqRequiredQuestions}-${exam.cqTotalQuestions})`);
    console.log(`- SQ: ${exam.sqRequiredQuestions}/${exam.sqTotalQuestions} questions (select ${exam.sqRequiredQuestions}-${exam.sqTotalQuestions})`);

    // Get some sample questions to test with
    const questions = await prisma.question.findMany({
      where: { classId: exam.classId },
      take: 10
    });

    const cqQuestions = questions.filter(q => q.type === 'CQ').slice(0, 5);
    const sqQuestions = questions.filter(q => q.type === 'SQ').slice(0, 5);
    const mcqQuestions = questions.filter(q => q.type === 'MCQ').slice(0, 5);

    console.log('\n📋 Sample Questions:');
    console.log(`- CQ Questions: ${cqQuestions.length} (marks: ${cqQuestions.map(q => q.marks).join(', ')})`);
    console.log(`- SQ Questions: ${sqQuestions.length} (marks: ${sqQuestions.map(q => q.marks).join(', ')})`);
    console.log(`- MCQ Questions: ${mcqQuestions.length} (marks: ${mcqQuestions.map(q => q.marks).join(', ')})`);

    // Test scenarios
    console.log('\n🎯 Test Scenarios:');

    // Scenario 1: Select 3 CQ (5 marks each), 3 SQ (2 marks each)
    const selectedCQ3 = cqQuestions.slice(0, 3);
    const selectedSQ3 = sqQuestions.slice(0, 3);
    
    const cqMarks3 = selectedCQ3.slice(0, exam.cqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const sqMarks3 = selectedSQ3.slice(0, exam.sqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const totalSelectedMarks = selectedCQ3.reduce((sum, q) => sum + q.marks, 0) + selectedSQ3.reduce((sum, q) => sum + q.marks, 0);
    const actualCountedMarks = cqMarks3 + sqMarks3;

    console.log('✅ Scenario 1: Select 3 CQ, 3 SQ');
    console.log(`  - Total Selected Marks: ${totalSelectedMarks}`);
    console.log(`  - Actual Counted Marks: ${actualCountedMarks} (CQ: ${cqMarks3}, SQ: ${sqMarks3})`);
    console.log(`  - MCQ Required: ${exam.totalMarks - actualCountedMarks} marks`);
    console.log(`  - Display Should Show: ${actualCountedMarks} / ${exam.totalMarks}`);

    // Scenario 2: Select 5 CQ (5 marks each), 5 SQ (2 marks each)
    const selectedCQ5 = cqQuestions.slice(0, 5);
    const selectedSQ5 = sqQuestions.slice(0, 5);
    
    const cqMarks5 = selectedCQ5.slice(0, exam.cqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const sqMarks5 = selectedSQ5.slice(0, exam.sqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const totalSelectedMarks5 = selectedCQ5.reduce((sum, q) => sum + q.marks, 0) + selectedSQ5.reduce((sum, q) => sum + q.marks, 0);
    const actualCountedMarks5 = cqMarks5 + sqMarks5;

    console.log('\n✅ Scenario 2: Select 5 CQ, 5 SQ');
    console.log(`  - Total Selected Marks: ${totalSelectedMarks5}`);
    console.log(`  - Actual Counted Marks: ${actualCountedMarks5} (CQ: ${cqMarks5}, SQ: ${sqMarks5})`);
    console.log(`  - MCQ Required: ${exam.totalMarks - actualCountedMarks5} marks`);
    console.log(`  - Display Should Show: ${actualCountedMarks5} / ${exam.totalMarks}`);

    console.log('\n🎉 Actual marks display test completed!');
    console.log('\n📋 Expected Behavior:');
    console.log('✅ Selected Marks should show actual counted marks (not total selected marks)');
    console.log('✅ CQ/SQ marks should only count up to required number');
    console.log('✅ MCQ marks should be added to the total');
    console.log('✅ Display should be consistent with the breakdown below');

  } catch (error) {
    console.error('❌ Error testing actual marks display:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActualMarksDisplay(); 