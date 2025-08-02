// Test script for question selection logic
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuestionSelection() {
  console.log('🧪 Testing Question Selection Logic...\n');

  try {
    // Get the test exam
    const exam = await prisma.exam.findFirst({
      where: { name: "Test Exam - Negative Marking & Question Selection" }
    });

    if (!exam) {
      console.log('❌ Test exam not found. Please run the create-test-exam script first.');
      return;
    }

    console.log('📊 Exam Details:');
    console.log(`- Name: ${exam.name}`);
    console.log(`- Total Marks: ${exam.totalMarks}`);
    console.log(`- MCQ Negative Marking: ${exam.mcqNegativeMarking}%`);
    console.log(`- CQ: ${exam.cqRequiredQuestions}/${exam.cqTotalQuestions} questions`);
    console.log(`- SQ: ${exam.sqRequiredQuestions}/${exam.sqTotalQuestions} questions`);

    // Calculate required marks for each question type
    const cqRequiredMarks = (exam.cqRequiredQuestions || 0) * 5; // CQ = 5 marks each
    const sqRequiredMarks = (exam.sqRequiredQuestions || 0) * 2; // SQ = 2 marks each
    const mcqRequiredMarks = exam.totalMarks - cqRequiredMarks - sqRequiredMarks;

    console.log('\n📋 Required Marks Breakdown:');
    console.log(`- MCQ: ${mcqRequiredMarks} marks`);
    console.log(`- CQ: ${cqRequiredMarks} marks (${exam.cqRequiredQuestions} questions × 5 marks)`);
    console.log(`- SQ: ${sqRequiredMarks} marks (${exam.sqRequiredQuestions} questions × 2 marks)`);

    // Get questions by type
    const mcqQuestions = await prisma.question.findMany({
      where: { 
        type: 'MCQ',
        classId: exam.classId
      },
      take: 10
    });

    const cqQuestions = await prisma.question.findMany({
      where: { 
        type: 'CQ',
        classId: exam.classId
      },
      take: 5
    });

    const sqQuestions = await prisma.question.findMany({
      where: { 
        type: 'SQ',
        classId: exam.classId
      },
      take: 5
    });

    console.log('\n📚 Available Questions:');
    console.log(`- MCQ: ${mcqQuestions.length} questions (${mcqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);
    console.log(`- CQ: ${cqQuestions.length} questions (${cqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);
    console.log(`- SQ: ${sqQuestions.length} questions (${sqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);

    // Test selection scenarios
    console.log('\n🎯 Test Scenarios:');

    // Scenario 1: Perfect selection
    const perfectMCQ = mcqQuestions.slice(0, mcqRequiredMarks); // Assuming 1 mark each
    const perfectCQ = cqQuestions.slice(0, exam.cqRequiredQuestions);
    const perfectSQ = sqQuestions.slice(0, exam.sqRequiredQuestions);

    const perfectTotal = perfectMCQ.reduce((sum, q) => sum + q.marks, 0) +
                        perfectCQ.reduce((sum, q) => sum + q.marks, 0) +
                        perfectSQ.reduce((sum, q) => sum + q.marks, 0);

    console.log('✅ Perfect Selection:');
    console.log(`  - MCQ: ${perfectMCQ.length} questions (${perfectMCQ.reduce((sum, q) => sum + q.marks, 0)} marks)`);
    console.log(`  - CQ: ${perfectCQ.length} questions (${perfectCQ.reduce((sum, q) => sum + q.marks, 0)} marks)`);
    console.log(`  - SQ: ${perfectSQ.length} questions (${perfectSQ.reduce((sum, q) => sum + q.marks, 0)} marks)`);
    console.log(`  - Total: ${perfectTotal} marks (Required: ${exam.totalMarks})`);
    console.log(`  - Valid: ${perfectTotal === exam.totalMarks ? '✅' : '❌'}`);

    // Scenario 2: Too many CQ questions
    const tooManyCQ = cqQuestions.slice(0, exam.cqRequiredQuestions + 1);
    const tooManyCQTotal = tooManyCQ.reduce((sum, q) => sum + q.marks, 0) +
                           perfectMCQ.reduce((sum, q) => sum + q.marks, 0) +
                           perfectSQ.reduce((sum, q) => sum + q.marks, 0);

    console.log('\n❌ Too Many CQ Questions:');
    console.log(`  - CQ: ${tooManyCQ.length} questions (${tooManyCQ.reduce((sum, q) => sum + q.marks, 0)} marks)`);
    console.log(`  - Total: ${tooManyCQTotal} marks`);
    console.log(`  - Valid: ${tooManyCQ.length <= exam.cqRequiredQuestions ? '✅' : '❌'}`);

    // Scenario 3: Insufficient marks
    const insufficientMCQ = mcqQuestions.slice(0, Math.max(0, mcqRequiredMarks - 2));
    const insufficientTotal = insufficientMCQ.reduce((sum, q) => sum + q.marks, 0) +
                             perfectCQ.reduce((sum, q) => sum + q.marks, 0) +
                             perfectSQ.reduce((sum, q) => sum + q.marks, 0);

    console.log('\n❌ Insufficient Marks:');
    console.log(`  - MCQ: ${insufficientMCQ.length} questions (${insufficientMCQ.reduce((sum, q) => sum + q.marks, 0)} marks)`);
    console.log(`  - Total: ${insufficientTotal} marks (Required: ${exam.totalMarks})`);
    console.log(`  - Valid: ${insufficientTotal >= exam.totalMarks ? '✅' : '❌'}`);

    console.log('\n🎉 Question selection logic test completed!');

  } catch (error) {
    console.error('❌ Error testing question selection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuestionSelection(); 