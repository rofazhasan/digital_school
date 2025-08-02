#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNegativeMarking() {
  try {
    console.log('Testing Negative Marking Functionality...\n');

    // Test 1: Check if exam with negative marking exists
    const examWithNegativeMarking = await prisma.exam.findFirst({
      where: {
        mcqNegativeMarking: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        mcqNegativeMarking: true,
        cqRequiredQuestions: true,
        sqRequiredQuestions: true
      }
    });

    if (examWithNegativeMarking) {
      console.log('✅ Found exam with negative marking:', {
        id: examWithNegativeMarking.id,
        name: examWithNegativeMarking.name,
        mcqNegativeMarking: examWithNegativeMarking.mcqNegativeMarking,
        cqRequiredQuestions: examWithNegativeMarking.cqRequiredQuestions,
        sqRequiredQuestions: examWithNegativeMarking.sqRequiredQuestions
      });
    } else {
      console.log('⚠️ No exam found with negative marking. Creating test exam...');
      
      // Create a test exam with negative marking
      const testExam = await prisma.exam.create({
        data: {
          name: 'Test Negative Marking Exam',
          description: 'Test exam for negative marking functionality',
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
          duration: 120,
          type: 'ONLINE',
          totalMarks: 100,
          passMarks: 40,
          isActive: true,
          mcqNegativeMarking: 25, // 25% negative marking
          cqRequiredQuestions: 3,
          sqRequiredQuestions: 2,
          createdById: 'test-user-id',
          classId: 'test-class-id'
        }
      });
      
      console.log('✅ Created test exam with negative marking:', {
        id: testExam.id,
        mcqNegativeMarking: testExam.mcqNegativeMarking
      });
    }

    // Test 2: Check exam submissions with exceeded question limit
    const submissionsWithExceededLimit = await prisma.examSubmission.findMany({
      where: {
        exceededQuestionLimit: true
      },
      select: {
        id: true,
        studentId: true,
        examId: true,
        exceededQuestionLimit: true,
        score: true
      }
    });

    console.log('\n📊 Submissions with exceeded question limit:', submissionsWithExceededLimit.length);
    submissionsWithExceededLimit.forEach(sub => {
      console.log(`  - Submission ${sub.id}: Score ${sub.score}, Exceeded: ${sub.exceededQuestionLimit}`);
    });

    // Test 3: Check recent MCQ submissions
    const recentMCQSubmissions = await prisma.examSubmission.findMany({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        exam: {
          select: {
            mcqNegativeMarking: true,
            name: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5
    });

    console.log('\n📊 Recent MCQ submissions:');
    recentMCQSubmissions.forEach(sub => {
      console.log(`  - ${sub.exam.name}: Score ${sub.score}, Negative Marking: ${sub.exam.mcqNegativeMarking}%`);
    });

    console.log('\n✅ Negative marking test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing negative marking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNegativeMarking(); 