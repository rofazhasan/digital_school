// Script to update exam configuration for actual marks testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExamActualMarks() {
  console.log('🔧 Updating exam configuration for actual marks testing...');

  try {
    // Get the realistic test exam
    const exam = await prisma.exam.findFirst({
      where: { name: "Realistic Test Exam - Question Selection" }
    });

    if (!exam) {
      console.log('❌ Realistic test exam not found. Please run the create-realistic-test-exam script first.');
      return;
    }

    console.log('📊 Current Exam Details:');
    console.log(`- Name: ${exam.name}`);
    console.log(`- Total Marks: ${exam.totalMarks}`);
    console.log(`- CQ: ${exam.cqRequiredQuestions}/${exam.cqTotalQuestions} questions`);
    console.log(`- SQ: ${exam.sqRequiredQuestions}/${exam.sqTotalQuestions} questions`);

    // Update the exam for actual marks testing
    const updatedExam = await prisma.exam.update({
      where: { id: exam.id },
      data: {
        cqTotalQuestions: 8,      // Total 8 CQ questions available
        cqRequiredQuestions: 3,   // Must select at least 3 CQ (marks count up to 3)
        sqTotalQuestions: 15,     // Total 15 SQ questions available
        sqRequiredQuestions: 3,   // Must select at least 3 SQ (marks count up to 3)
        totalMarks: 50,           // Total marks (reduced for testing)
        passMarks: 25,            // 50% pass marks
      }
    });

    console.log('\n✅ Exam Updated for Actual Marks Testing:');
    console.log(`- Name: ${updatedExam.name}`);
    console.log(`- Total Marks: ${updatedExam.totalMarks}`);
    console.log(`- CQ: ${updatedExam.cqRequiredQuestions}/${updatedExam.cqTotalQuestions} questions (select 3-8)`);
    console.log(`- SQ: ${updatedExam.sqRequiredQuestions}/${updatedExam.sqTotalQuestions} questions (select 3-15)`);

    console.log('\n🎯 Actual Marks Logic:');
    console.log('✅ CQ: Can select 3-8 questions, marks count up to 3 (actual question marks)');
    console.log('✅ SQ: Can select 3-15 questions, marks count up to 3 (actual question marks)');
    console.log('✅ MCQ: Fill remaining marks after CQ/SQ marks');

    console.log('\n📊 Example Scenarios:');
    console.log('Scenario 1: Select 3 CQ (5 marks each), 3 SQ (2 marks each)');
    console.log('  - CQ: 3 questions selected, 15 marks count (3 × 5)');
    console.log('  - SQ: 3 questions selected, 6 marks count (3 × 2)');
    console.log('  - MCQ: Need 29 marks (50 - 15 - 6)');
    console.log('  - Total: 50 marks ✅');

    console.log('Scenario 2: Select 5 CQ (5 marks each), 5 SQ (2 marks each)');
    console.log('  - CQ: 5 questions selected, 15 marks count (still 3 × 5)');
    console.log('  - SQ: 5 questions selected, 6 marks count (still 3 × 2)');
    console.log('  - MCQ: Need 29 marks (50 - 15 - 6)');
    console.log('  - Total: 50 marks ✅');

    console.log('\n📋 Expected Behavior:');
    console.log('✅ Marks are calculated from actual question marks in database');
    console.log('✅ Only required number of marks count (up to 3 CQ, 3 SQ)');
    console.log('✅ MCQ fills remaining marks after CQ/SQ marks');

    console.log('\n🎉 Exam configuration updated for actual marks testing!');

  } catch (error) {
    console.error('❌ Error updating exam configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExamActualMarks(); 