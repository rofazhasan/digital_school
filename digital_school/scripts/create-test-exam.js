// Script to create a test exam with negative marking and question selection
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestExam() {
  console.log('🎯 Creating test exam...');

  try {
    // Get the super user
    const superUser = await prisma.user.findFirst({
      where: { email: "admin@eliteschool.edu.bd" }
    });

    if (!superUser) {
      console.log('❌ Super user not found. Please run the seed script first.');
      return;
    }

    // Get the class
    const class1 = await prisma.class.findFirst({
      where: { 
        name: "Class 10",
        section: "A"
      }
    });

    if (!class1) {
      console.log('❌ Class not found. Please run the seed script first.');
      return;
    }

    // Create a test exam with negative marking and question selection
    const testExam = await prisma.exam.create({
      data: {
        name: "Test Exam - Negative Marking & Question Selection",
        description: "This is a test exam to demonstrate negative marking for MCQs and question selection for CQ and SQ questions.",
        date: new Date('2024-12-15'),
        startTime: new Date('2024-12-15T09:00:00'),
        endTime: new Date('2024-12-15T12:00:00'),
        duration: 180, // 3 hours
        type: 'OFFLINE',
        totalMarks: 50,
        passMarks: 25,
        isActive: true,
        allowRetake: false,
        instructions: "Answer all MCQ questions. For CQ, answer 3 out of 5 questions. For SQ, answer 3 out of 5 questions.",
        // Negative marking settings
        mcqNegativeMarking: 25, // 25% negative marking
        // Question selection settings
        cqTotalQuestions: 5,
        cqRequiredQuestions: 3,
        sqTotalQuestions: 5,
        sqRequiredQuestions: 3,
        classId: class1.id,
        createdById: superUser.id,
      }
    });

    console.log('✅ Test exam created:', testExam.name);
    console.log('📊 Exam Details:');
    console.log(`- Total Marks: ${testExam.totalMarks}`);
    console.log(`- Pass Marks: ${testExam.passMarks}`);
    console.log(`- MCQ Negative Marking: ${testExam.mcqNegativeMarking}%`);
    console.log(`- CQ: ${testExam.cqRequiredQuestions}/${testExam.cqTotalQuestions} questions`);
    console.log(`- SQ: ${testExam.sqRequiredQuestions}/${testExam.sqTotalQuestions} questions`);

    // Get all questions
    const mcqQuestions = await prisma.question.findMany({
      where: { 
        type: 'MCQ',
        classId: class1.id
      },
      take: 10
    });

    const cqQuestions = await prisma.question.findMany({
      where: { 
        type: 'CQ',
        classId: class1.id
      },
      take: 5
    });

    const sqQuestions = await prisma.question.findMany({
      where: { 
        type: 'SQ',
        classId: class1.id
      },
      take: 5
    });

    console.log(`\n📚 Questions Found:`);
    console.log(`- MCQ: ${mcqQuestions.length} questions`);
    console.log(`- CQ: ${cqQuestions.length} questions`);
    console.log(`- SQ: ${sqQuestions.length} questions`);

    // Create an exam set with all questions
    const examSet = await prisma.examSet.create({
      data: {
        name: "Test Exam Set 1",
        description: "Complete question set for the test exam",
        isActive: true,
        examId: testExam.id,
        createdById: superUser.id,
        questionsJson: {
          mcq: mcqQuestions.map(q => ({ id: q.id, marks: q.marks })),
          cq: cqQuestions.map(q => ({ id: q.id, marks: q.marks })),
          sq: sqQuestions.map(q => ({ id: q.id, marks: q.marks }))
        }
      }
    });

    console.log('✅ Exam set created:', examSet.name);

    // Map students to the exam
    const students = await prisma.studentProfile.findMany({
      where: { classId: class1.id },
      include: { user: true }
    });

    for (const student of students) {
      await prisma.examStudentMap.create({
        data: {
          studentId: student.id,
          examId: testExam.id,
          examSetId: examSet.id,
          isActive: true
        }
      });
      console.log(`✅ Mapped student: ${student.user.name}`);
    }

    console.log('\n🎉 Test exam setup completed!');
    console.log('\n📋 Exam Information:');
    console.log(`- Exam ID: ${testExam.id}`);
    console.log(`- Name: ${testExam.name}`);
    console.log(`- Date: ${testExam.date.toLocaleDateString()}`);
    console.log(`- Duration: ${testExam.duration} minutes`);
    console.log(`- MCQ Negative Marking: ${testExam.mcqNegativeMarking}%`);
    console.log(`- CQ Selection: ${testExam.cqRequiredQuestions}/${testExam.cqTotalQuestions}`);
    console.log(`- SQ Selection: ${testExam.sqRequiredQuestions}/${testExam.sqTotalQuestions}`);

  } catch (error) {
    console.error('❌ Error creating test exam:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestExam(); 