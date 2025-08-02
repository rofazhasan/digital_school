// Script to create a realistic test exam with proper mark distribution
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRealisticTestExam() {
  console.log('🎯 Creating realistic test exam...');

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

    // Get questions to understand the mark distribution
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

    console.log('📊 Available Questions:');
    console.log(`- MCQ: ${mcqQuestions.length} questions (${mcqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);
    console.log(`- CQ: ${cqQuestions.length} questions (${cqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);
    console.log(`- SQ: ${sqQuestions.length} questions (${sqQuestions.reduce((sum, q) => sum + q.marks, 0)} total marks)`);

    // Calculate realistic total marks
    const mcqTotalMarks = mcqQuestions.reduce((sum, q) => sum + q.marks, 0);
    const cqTotalMarks = cqQuestions.reduce((sum, q) => sum + q.marks, 0);
    const sqTotalMarks = sqQuestions.reduce((sum, q) => sum + q.marks, 0);
    const realisticTotalMarks = mcqTotalMarks + cqTotalMarks + sqTotalMarks;

    console.log(`\n📋 Realistic Total Marks: ${realisticTotalMarks}`);

    // Create a realistic test exam
    const realisticExam = await prisma.exam.create({
      data: {
        name: "Realistic Test Exam - Question Selection",
        description: "A test exam with realistic mark distribution that matches available questions.",
        date: new Date('2024-12-16'),
        startTime: new Date('2024-12-16T09:00:00'),
        endTime: new Date('2024-12-16T12:00:00'),
        duration: 180, // 3 hours
        type: 'OFFLINE',
        totalMarks: realisticTotalMarks,
        passMarks: Math.floor(realisticTotalMarks * 0.5), // 50% pass marks
        isActive: true,
        allowRetake: false,
        instructions: "Answer all MCQ questions. For CQ, answer 3 out of 5 questions. For SQ, answer 3 out of 5 questions.",
        // Negative marking settings
        mcqNegativeMarking: 25, // 25% negative marking
        // Question selection settings - realistic based on available questions
        cqTotalQuestions: 5,
        cqRequiredQuestions: 3,
        sqTotalQuestions: 5,
        sqRequiredQuestions: 3,
        classId: class1.id,
        createdById: superUser.id,
      }
    });

    console.log('✅ Realistic test exam created:', realisticExam.name);
    console.log('📊 Exam Details:');
    console.log(`- Total Marks: ${realisticExam.totalMarks}`);
    console.log(`- Pass Marks: ${realisticExam.passMarks}`);
    console.log(`- MCQ Negative Marking: ${realisticExam.mcqNegativeMarking}%`);
    console.log(`- CQ: ${realisticExam.cqRequiredQuestions}/${realisticExam.cqTotalQuestions} questions`);
    console.log(`- SQ: ${realisticExam.sqRequiredQuestions}/${realisticExam.sqTotalQuestions} questions`);

    // Calculate required marks for each question type
    const cqRequiredMarks = (realisticExam.cqRequiredQuestions || 0) * 5; // CQ = 5 marks each
    const sqRequiredMarks = (realisticExam.sqRequiredQuestions || 0) * 2; // SQ = 2 marks each
    const mcqRequiredMarks = realisticExam.totalMarks - cqRequiredMarks - sqRequiredMarks;

    console.log('\n📋 Required Marks Breakdown:');
    console.log(`- MCQ: ${mcqRequiredMarks} marks`);
    console.log(`- CQ: ${cqRequiredMarks} marks (${realisticExam.cqRequiredQuestions} questions × 5 marks)`);
    console.log(`- SQ: ${sqRequiredMarks} marks (${realisticExam.sqRequiredQuestions} questions × 2 marks)`);

    // Create an exam set with all questions
    const examSet = await prisma.examSet.create({
      data: {
        name: "Realistic Test Set 1",
        description: "Complete question set for the realistic test exam",
        isActive: true,
        examId: realisticExam.id,
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
          examId: realisticExam.id,
          examSetId: examSet.id,
          isActive: true
        }
      });
      console.log(`✅ Mapped student: ${student.user.name}`);
    }

    console.log('\n🎉 Realistic test exam setup completed!');
    console.log('\n📋 Exam Information:');
    console.log(`- Exam ID: ${realisticExam.id}`);
    console.log(`- Name: ${realisticExam.name}`);
    console.log(`- Date: ${realisticExam.date.toLocaleDateString()}`);
    console.log(`- Duration: ${realisticExam.duration} minutes`);
    console.log(`- MCQ Negative Marking: ${realisticExam.mcqNegativeMarking}%`);
    console.log(`- CQ Selection: ${realisticExam.cqRequiredQuestions}/${realisticExam.cqTotalQuestions}`);
    console.log(`- SQ Selection: ${realisticExam.sqRequiredQuestions}/${realisticExam.sqTotalQuestions}`);
    console.log(`- Total Marks: ${realisticExam.totalMarks}`);
    console.log(`- Available MCQ Marks: ${mcqTotalMarks}`);
    console.log(`- Available CQ Marks: ${cqTotalMarks}`);
    console.log(`- Available SQ Marks: ${sqTotalMarks}`);

  } catch (error) {
    console.error('❌ Error creating realistic test exam:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealisticTestExam(); 