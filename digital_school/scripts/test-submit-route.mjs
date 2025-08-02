#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSubmitRoute() {
  try {
    console.log('Testing Submit Route with Negative Marking...\n');

    // Find an exam with negative marking
    const exam = await prisma.exam.findFirst({
      where: {
        mcqNegativeMarking: {
          gt: 0
        }
      },
      include: {
        examSets: true
      }
    });

    if (!exam) {
      console.log('❌ No exam found with negative marking');
      return;
    }

    console.log('✅ Found exam:', {
      id: exam.id,
      name: exam.name,
      mcqNegativeMarking: exam.mcqNegativeMarking
    });

    // Test the submit route logic manually
    const testAnswers = {
      'test-question-1': 'correct-answer',
      'test-question-2': 'wrong-answer',
      'test-question-3': 'correct-answer'
    };

    const testQuestions = [
      {
        id: 'test-question-1',
        type: 'mcq',
        marks: 4,
        correct: 'correct-answer',
        options: [
          { text: 'correct-answer', isCorrect: true },
          { text: 'wrong-option-1' },
          { text: 'wrong-option-2' }
        ]
      },
      {
        id: 'test-question-2',
        type: 'mcq',
        marks: 4,
        correct: 'correct-answer',
        options: [
          { text: 'correct-answer', isCorrect: true },
          { text: 'wrong-answer' },
          { text: 'wrong-option-2' }
        ]
      },
      {
        id: 'test-question-3',
        type: 'mcq',
        marks: 4,
        correct: 'correct-answer',
        options: [
          { text: 'correct-answer', isCorrect: true },
          { text: 'wrong-option-1' },
          { text: 'wrong-option-2' }
        ]
      }
    ];

    // Simulate the grading logic
    let score = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let negativeMarksApplied = 0;

    testQuestions.forEach((q) => {
      const normalize = (s) => String(s).trim().toLowerCase().normalize();
      const userAns = normalize(testAnswers[q.id] || '');
      const correctAns = normalize(q.correct);
      const marks = Number(q.marks) || 1;
      const isCorrect = userAns === correctAns;

      if (isCorrect) {
        score += marks;
        totalCorrect++;
      } else {
        totalWrong++;
        if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
          const negativeMarks = (marks * exam.mcqNegativeMarking) / 100;
          score -= negativeMarks;
          negativeMarksApplied += negativeMarks;
        }
      }
    });

    score = Math.max(0, score);

    console.log('\n📊 Test Results:');
    console.log(`  Total Questions: ${testQuestions.length}`);
    console.log(`  Correct Answers: ${totalCorrect}`);
    console.log(`  Wrong Answers: ${totalWrong}`);
    console.log(`  Negative Marking: ${exam.mcqNegativeMarking}%`);
    console.log(`  Negative Marks Applied: ${negativeMarksApplied.toFixed(2)}`);
    console.log(`  Final Score: ${score}`);

    // Expected calculation:
    // Question 1: Correct (+4 marks)
    // Question 2: Wrong (-1 mark for 25% negative marking)
    // Question 3: Correct (+4 marks)
    // Total: 4 - 1 + 4 = 7 marks

    const expectedScore = 4 - 1 + 4; // 7 marks
    console.log(`  Expected Score: ${expectedScore}`);
    console.log(`  Test ${score === expectedScore ? '✅ PASSED' : '❌ FAILED'}`);

  } catch (error) {
    console.error('❌ Error testing submit route:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubmitRoute(); 