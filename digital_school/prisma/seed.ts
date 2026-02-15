import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default institute
  let institute = await prisma.institute.findFirst({
    where: { name: "Elite School & College" }
  });

  if (!institute) {
    institute = await prisma.institute.create({
      data: {
        name: "Elite School & College",
        email: "admin@eliteschool.edu.bd",
        phone: "+880-1234567890",
        address: "Rangpur, Bangladesh",
        website: "https://eliteschool.edu.bd",
      }
    });
  }

  console.log('✅ Institute ready:', institute.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create super user
  let superUser = await prisma.user.findFirst({
    where: { email: "admin@eliteschool.edu.bd" }
  });

  if (!superUser) {
    superUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@eliteschool.edu.bd",
        password: hashedPassword,
        role: 'SUPER_USER',
        instituteId: institute.id,
        isActive: true,
      }
    });
  }

  console.log('✅ Super user ready:', superUser.email);

  // Update institute with super user
  await prisma.institute.update({
    where: { id: institute.id },
    data: { superUserId: superUser.id }
  });

  // Create a class
  let class1 = await prisma.class.findFirst({
    where: { 
      name: "Class 10",
      section: "A",
      instituteId: institute.id
    }
  });

  if (!class1) {
    class1 = await prisma.class.create({
      data: {
        name: "Class 10",
        section: "A",
        instituteId: institute.id,
      }
    });
  }

  console.log('✅ Class ready:', class1.name, class1.section);

  // Create 5 students
  const students = [];
  const studentNames = [
    "Ahmed Rahman",
    "Fatima Khan", 
    "Mohammed Ali",
    "Aisha Begum",
    "Omar Hassan"
  ];

  for (let i = 0; i < 5; i++) {
    let studentUser = await prisma.user.findFirst({
      where: { email: `student${i + 1}@test.com` }
    });

    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          name: studentNames[i],
          email: `student${i + 1}@test.com`,
          password: hashedPassword,
          role: 'STUDENT',
          instituteId: institute.id,
          isActive: true,
        }
      });
    }

    let studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: studentUser.id }
    });

    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: studentUser.id,
          classId: class1.id,
          roll: `10A${String(i + 1).padStart(2, '0')}`,
          registrationNo: `2024${String(i + 1).padStart(4, '0')}`,
          guardianName: `Guardian of ${studentNames[i]}`,
          guardianPhone: `+880-1${String(i + 1).padStart(9, '0')}`,
          guardianEmail: `guardian${i + 1}@test.com`,
          address: `Address ${i + 1}, Rangpur, Bangladesh`,
        }
      });
    }

    students.push({ user: studentUser, profile: studentProfile });
    console.log(`✅ Student ${i + 1} ready:`, studentUser.email);
  }

  // Create questions (10 MCQ, 5 CQ, 5 SQ)
  const questions = [];

  // 10 MCQ Questions
  const mcqQuestions = [
    {
      questionText: "What is the capital of Bangladesh?",
      modelAnswer: "Dhaka",
      options: ["Dhaka", "Chittagong", "Sylhet", "Rangpur"],
      marks: 1,
      difficulty: "EASY"
    },
    {
      questionText: "Which is the largest river in Bangladesh?",
      modelAnswer: "Padma",
      options: ["Padma", "Meghna", "Jamuna", "Brahmaputra"],
      marks: 1,
      difficulty: "EASY"
    },
    {
      questionText: "What is 2 + 2?",
      modelAnswer: "4",
      options: ["3", "4", "5", "6"],
      marks: 1,
      difficulty: "EASY"
    },
    {
      questionText: "Which planet is closest to the Sun?",
      modelAnswer: "Mercury",
      options: ["Venus", "Mercury", "Earth", "Mars"],
      marks: 1,
      difficulty: "MEDIUM"
    },
    {
      questionText: "What is the chemical symbol for gold?",
      modelAnswer: "Au",
      options: ["Ag", "Au", "Fe", "Cu"],
      marks: 1,
      difficulty: "MEDIUM"
    },
    {
      questionText: "Who wrote 'Romeo and Juliet'?",
      modelAnswer: "William Shakespeare",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      marks: 1,
      difficulty: "MEDIUM"
    },
    {
      questionText: "What is the square root of 16?",
      modelAnswer: "4",
      options: ["2", "4", "8", "16"],
      marks: 1,
      difficulty: "MEDIUM"
    },
    {
      questionText: "Which year did Bangladesh gain independence?",
      modelAnswer: "1971",
      options: ["1969", "1970", "1971", "1972"],
      marks: 1,
      difficulty: "HARD"
    },
    {
      questionText: "What is the largest ocean on Earth?",
      modelAnswer: "Pacific Ocean",
      options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
      marks: 1,
      difficulty: "HARD"
    },
    {
      questionText: "What is the chemical formula for water?",
      modelAnswer: "H2O",
      options: ["CO2", "H2O", "O2", "N2"],
      marks: 1,
      difficulty: "HARD"
    }
  ];

  // 5 CQ Questions
  const cqQuestions = [
    {
      questionText: "Explain the process of photosynthesis in detail. Include the role of chlorophyll and the chemical equation.",
      modelAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy...",
      marks: 5,
      difficulty: "HARD"
    },
    {
      questionText: "Discuss the causes and effects of climate change. Provide examples and potential solutions.",
      modelAnswer: "Climate change refers to long-term shifts in global weather patterns...",
      marks: 5,
      difficulty: "HARD"
    },
    {
      questionText: "Analyze the impact of social media on modern society. Consider both positive and negative aspects.",
      modelAnswer: "Social media has revolutionized how people communicate and interact...",
      marks: 5,
      difficulty: "MEDIUM"
    },
    {
      questionText: "Describe the water cycle and explain how it maintains Earth's water balance.",
      modelAnswer: "The water cycle is a continuous process that circulates water through the Earth's systems...",
      marks: 5,
      difficulty: "MEDIUM"
    },
    {
      questionText: "Compare and contrast democracy and dictatorship as forms of government.",
      modelAnswer: "Democracy and dictatorship represent two fundamentally different approaches to governance...",
      marks: 5,
      difficulty: "HARD"
    }
  ];

  // 5 SQ Questions
  const sqQuestions = [
    {
      questionText: "What is the main function of the heart?",
      modelAnswer: "The heart pumps blood throughout the body to deliver oxygen and nutrients to cells.",
      marks: 2,
      difficulty: "EASY"
    },
    {
      questionText: "Name three renewable energy sources.",
      modelAnswer: "Solar energy, wind energy, and hydroelectric power are renewable energy sources.",
      marks: 2,
      difficulty: "EASY"
    },
    {
      questionText: "What is the difference between weather and climate?",
      modelAnswer: "Weather refers to short-term atmospheric conditions, while climate refers to long-term weather patterns.",
      marks: 2,
      difficulty: "MEDIUM"
    },
    {
      questionText: "Explain the concept of gravity.",
      modelAnswer: "Gravity is a force that attracts objects toward each other, with strength depending on mass and distance.",
      marks: 2,
      difficulty: "MEDIUM"
    },
    {
      questionText: "What are the three branches of government in a democracy?",
      modelAnswer: "The three branches are executive, legislative, and judicial.",
      marks: 2,
      difficulty: "EASY"
    }
  ];

  // Create MCQ questions
  for (let i = 0; i < mcqQuestions.length; i++) {
    const q = mcqQuestions[i];
    const question = await prisma.question.create({
      data: {
        type: 'MCQ',
        subject: 'General Knowledge',
        questionText: q.questionText,
        modelAnswer: q.modelAnswer,
        options: q.options,
        marks: q.marks,
        difficulty: q.difficulty,
        classId: class1.id,
        createdById: superUser.id,
        tags: ['mcq', 'general'],
        topic: 'General Knowledge',
      }
    });
    questions.push(question);
    console.log(`✅ MCQ Question ${i + 1} created`);
  }

  // Create CQ questions
  for (let i = 0; i < cqQuestions.length; i++) {
    const q = cqQuestions[i];
    const question = await prisma.question.create({
      data: {
        type: 'CQ',
        subject: 'General Knowledge',
        questionText: q.questionText,
        modelAnswer: q.modelAnswer,
        marks: q.marks,
        difficulty: q.difficulty,
        classId: class1.id,
        createdById: superUser.id,
        tags: ['cq', 'essay'],
        topic: 'General Knowledge',
      }
    });
    questions.push(question);
    console.log(`✅ CQ Question ${i + 1} created`);
  }

  // Create SQ questions
  for (let i = 0; i < sqQuestions.length; i++) {
    const q = sqQuestions[i];
    const question = await prisma.question.create({
      data: {
        type: 'SQ',
        subject: 'General Knowledge',
        questionText: q.questionText,
        modelAnswer: q.modelAnswer,
        marks: q.marks,
        difficulty: q.difficulty,
        classId: class1.id,
        createdById: superUser.id,
        tags: ['sq', 'short'],
        topic: 'General Knowledge',
      }
    });
    questions.push(question);
    console.log(`✅ SQ Question ${i + 1} created`);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Accounts:');
  console.log('Super User: admin@eliteschool.edu.bd / password123');
  console.log('\n📋 Students:');
  students.forEach((student, i) => {
    console.log(`Student ${i + 1}: ${student.user.email} / password123`);
  });
  console.log('\n📊 Questions Created:');
  console.log(`- ${mcqQuestions.length} MCQ Questions`);
  console.log(`- ${cqQuestions.length} CQ Questions`);
  console.log(`- ${sqQuestions.length} SQ Questions`);
  console.log(`- Total: ${questions.length} Questions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 