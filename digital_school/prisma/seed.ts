import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ROBUST database seed...');

  // 1. Create Default Institute
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

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 2. Super User (1)
  const superUserEmail = "superuser@school.com";
  let superUser = await prisma.user.findUnique({ where: { email: superUserEmail } });
  if (!superUser) {
    superUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: superUserEmail,
        password: hashedPassword,
        role: 'SUPER_USER',
        instituteId: institute.id,
        isActive: true,
      }
    });
    // Link to institute
    await prisma.institute.update({
      where: { id: institute.id },
      data: { superUserId: superUser.id }
    });
  }
  console.log('✅ Super User ready:', superUser.email);

  // 3. Admins (3)
  for (let i = 1; i <= 3; i++) {
    const email = `admin${i}@school.com`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          name: `Admin User ${i}`,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          instituteId: institute.id,
          isActive: true
        }
      });
    }
  }
  console.log('✅ 3 Admins ready');

  // 4. Teachers (10)
  for (let i = 1; i <= 10; i++) {
    const email = `teacher${i}@school.com`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          name: `Teacher User ${i}`,
          email,
          password: hashedPassword,
          role: 'TEACHER',
          instituteId: institute.id,
          isActive: true
        }
      });
    }
  }
  console.log('✅ 10 Teachers ready');

  // 5. Classes (3)
  const classesData = [
    { name: "Class 8", section: "A" },
    { name: "Class 9", section: "A" },
    { name: "Class 10", section: "A" }
  ];
  const classes = [];

  for (const c of classesData) {
    let cls = await prisma.class.findFirst({
      where: { name: c.name, section: c.section, instituteId: institute.id }
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: c.name,
          section: c.section,
          instituteId: institute.id
        }
      });
    }
    classes.push(cls);
  }
  console.log('✅ 3 Classes ready');

  // 6. Students (200+)
  // Distribute 210 students across 3 classes (70 each)
  let studentCount = 0;
  for (let cIndex = 0; cIndex < classes.length; cIndex++) {
    const cls = classes[cIndex];
    const startRoll = (cIndex + 8) * 1000; // 8000, 9000, 10000 base

    for (let i = 1; i <= 70; i++) {
      const email = `student_${cls.name.replace(" ", "")}_${i}@school.com`.toLowerCase();
      const exists = await prisma.user.findUnique({ where: { email } });

      let userId = exists?.id;

      if (!exists) {
        const u = await prisma.user.create({
          data: {
            name: `Student ${cls.name} ${i}`,
            email,
            password: hashedPassword,
            role: 'STUDENT',
            instituteId: institute.id,
            isActive: true
          }
        });
        userId = u.id;
      }

      // Profile
      if (userId) {
        const roll = String(startRoll + i);
        const prof = await prisma.studentProfile.findFirst({ where: { userId } });
        if (!prof) {
          await prisma.studentProfile.create({
            data: {
              userId,
              classId: cls.id,
              roll: roll,
              registrationNo: `REG-${roll}`,
              guardianName: `Parent of ${i}`,
              guardianPhone: `017000000${String(i).padStart(2, '0')}`,
              address: `Rangpur City`
            }
          });
        }
      }
      studentCount++;
    }
  }
  console.log(`✅ ${studentCount} Students ready`);

  // 7. Exams (3)
  const examTypes = ['Half Yearly', 'Final', 'Test'];
  const examDates = [
    new Date('2025-06-15T10:00:00Z'),
    new Date('2025-12-10T10:00:00Z'),
    new Date('2026-03-20T10:00:00Z')
  ];

  for (let i = 0; i < 3; i++) {
    // Create exam for Class 10 (Targeting one class for seeding robustly)
    const targetClass = classes[2]; // Class 10
    const examName = `${examTypes[i]} Exam ${targetClass.name}`;

    let exam = await prisma.exam.findFirst({ where: { name: examName } });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          name: examName,
          description: `Standard ${examTypes[i]} Examination`,
          date: examDates[i],
          startTime: examDates[i],
          endTime: new Date(examDates[i].getTime() + 3 * 60 * 60 * 1000), // 3 hours
          duration: 180,
          type: 'OFFLINE', // or MIXED
          totalMarks: 100,
          passMarks: 33,
          isActive: true,
          classId: targetClass.id,
          createdById: superUser.id
        }
      });
    }
    console.log(`✅ Exam '${examName}' ready`);

    // 8. Questions (Add some sample questions to this exam context if needed, 
    // but usually Questions are in QuestionBank. Let's add 5 Questions to Bank linked to Class 10)
    if (i === 0) { // Only do once to avoid spam
      const subjects = ['Physics', 'Chemistry', 'Math'];
      for (const sub of subjects) {
        await prisma.question.create({
          data: {
            type: 'MCQ',
            subject: sub,
            questionText: `Sample MCQ for ${sub}?`,
            modelAnswer: 'Option A',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            marks: 1,
            difficulty: 'MEDIUM',
            classId: targetClass.id,
            createdById: superUser.id,
            topic: 'General'
          }
        });
        await prisma.question.create({
          data: {
            type: 'CQ',
            subject: sub,
            questionText: `Explain a concept in ${sub}.`,
            modelAnswer: 'Detailed answer...',
            marks: 10,
            difficulty: 'HARD',
            classId: targetClass.id,
            createdById: superUser.id,
            topic: 'Theory'
          }
        });
      }
      console.log(`✅ Sample Questions for ${targetClass.name} ready`);
    }
  }

  // 9. Exam Halls
  let hall = await prisma.examHall.findFirst({ where: { name: "Main Hall A" } });
  if (!hall) {
    hall = await prisma.examHall.create({
      data: {
        name: "Main Hall A",
        roomNo: "101",
        capacity: 100,
        rows: 10,
        columns: 5,
        seatsPerBench: 2,
        instituteId: institute.id
      }
    });
  }
  console.log('✅ Exam Hall "Main Hall A" ready');

  console.log('🎉 ROBUST SEEDING COMPLETE!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });