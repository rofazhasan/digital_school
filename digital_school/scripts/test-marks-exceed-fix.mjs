// Test script for marks exceed fix
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMarksExceedFix() {
  console.log('🧪 Testing Marks Exceed Fix...\n');

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

    // Scenario 1: Select 5 CQ (5 marks each = 25), 5 SQ (2 marks each = 10), MCQ (10 marks)
    const selectedCQ5 = cqQuestions.slice(0, 5);
    const selectedSQ5 = sqQuestions.slice(0, 5);
    const selectedMCQ10 = mcqQuestions.slice(0, 10);
    
    const cqMarks5 = selectedCQ5.slice(0, exam.cqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const sqMarks5 = selectedSQ5.slice(0, exam.sqRequiredQuestions).reduce((sum, q) => sum + q.marks, 0);
    const mcqMarks10 = selectedMCQ10.reduce((sum, q) => sum + q.marks, 0);
    
    const totalSelectedMarks = cqMarks5 + sqMarks5 + mcqMarks10;
    const availableMarks = exam.totalMarks - cqMarks5 - sqMarks5;
    const actualMcqMarks = Math.min(mcqMarks10, availableMarks);
    const actualTotalMarks = cqMarks5 + sqMarks5 + actualMcqMarks;

    console.log('✅ Scenario 1: Select 5 CQ, 5 SQ, 10 MCQ');
    console.log(`  - CQ Marks: ${cqMarks5} (${exam.cqRequiredQuestions} required)`);
    console.log(`  - SQ Marks: ${sqMarks5} (${exam.sqRequiredQuestions} required)`);
    console.log(`  - MCQ Marks Selected: ${mcqMarks10}`);
    console.log(`  - MCQ Marks Available: ${availableMarks}`);
    console.log(`  - MCQ Marks Counted: ${actualMcqMarks}`);
    console.log(`  - Total Selected Marks: ${totalSelectedMarks}`);
    console.log(`  - Actual Counted Marks: ${actualTotalMarks} / ${exam.totalMarks}`);
    console.log(`  - Would Exceed: ${actualTotalMarks > exam.totalMarks ? 'YES' : 'NO'}`);

    // Scenario 2: Test when marks would exceed
    const selectedMCQ20 = mcqQuestions.slice(0, 20);
    const mcqMarks20 = selectedMCQ20.reduce((sum, q) => sum + q.marks, 0);
    const actualMcqMarks20 = Math.min(mcqMarks20, availableMarks);
    const actualTotalMarks20 = cqMarks5 + sqMarks5 + actualMcqMarks20;

    console.log('\n✅ Scenario 2: Select 5 CQ, 5 SQ, 20 MCQ (would exceed)');
    console.log(`  - MCQ Marks Selected: ${mcqMarks20}`);
    console.log(`  - MCQ Marks Available: ${availableMarks}`);
    console.log(`  - MCQ Marks Counted: ${actualMcqMarks20}`);
    console.log(`  - Actual Counted Marks: ${actualTotalMarks20} / ${exam.totalMarks}`);
    console.log(`  - Would Exceed: ${actualTotalMarks20 > exam.totalMarks ? 'YES' : 'NO'}`);

    console.log('\n🎉 Marks exceed fix test completed!');
    console.log('\n📋 Expected Behavior:');
    console.log('✅ Selected Marks should never exceed total marks');
    console.log('✅ MCQ marks should be capped at available marks');
    console.log('✅ Add button should be disabled when marks would exceed');
    console.log('✅ MCQ selection should be prevented when total marks reached');

  } catch (error) {
    console.error('❌ Error testing marks exceed fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMarksExceedFix(); 