import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if super user already exists
  const existingSuperUser = await prisma.user.findFirst({
    where: { role: 'SUPER_USER' }
  });

  if (existingSuperUser) {
    console.log('✅ Super user already exists');
    console.log('Email:', existingSuperUser.email);
    console.log('Name:', existingSuperUser.name);
    return;
  }

  // Create default institute
  const institute = await prisma.institute.create({
    data: {
      name: "Elite School & College",
      email: "admin@eliteschool.edu.bd",
      phone: "+880-1234567890",
      address: "Rangpur, Bangladesh",
      website: "https://eliteschool.edu.bd",
    }
  });

  console.log('✅ Created institute:', institute.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create super user
  const superUser = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@eliteschool.edu.bd",
      password: hashedPassword,
      role: 'SUPER_USER',
      instituteId: institute.id,
      isActive: true,
    }
  });

  console.log('✅ Created super user:', superUser.email);

  // Update institute with super user
  await prisma.institute.update({
    where: { id: institute.id },
    data: { superUserId: superUser.id }
  });

  console.log('✅ Updated institute with super user');

  // Create some test data
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      role: 'ADMIN',
      instituteId: institute.id,
      isActive: true,
    }
  });

  const teacherUser = await prisma.user.create({
    data: {
      name: "Teacher User",
      email: "teacher@test.com",
      password: hashedPassword,
      role: 'TEACHER',
      instituteId: institute.id,
      isActive: true,
    }
  });

  const studentUser = await prisma.user.create({
    data: {
      name: "Student User",
      email: "student@test.com",
      password: hashedPassword,
      role: 'STUDENT',
      instituteId: institute.id,
      isActive: true,
    }
  });

  console.log('✅ Created test users:');
  console.log('  Admin:', adminUser.email);
  console.log('  Teacher:', teacherUser.email);
  console.log('  Student:', studentUser.email);

  // Ensure mock user exists
  const mockUserId = 'clxys56780001abcd5678ijkl';
  const mockUserEmail = 'mock@example.com';
  const mockUser = await prisma.user.upsert({
    where: { id: mockUserId },
    update: {},
    create: {
      id: mockUserId,
      name: 'Mock User',
      email: mockUserEmail,
      password: 'password',
      role: 'SUPER_USER',
    },
  });

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Accounts:');
  console.log('Super User: admin@eliteschool.edu.bd / password123');
  console.log('Admin: admin@test.com / password123');
  console.log('Teacher: teacher@test.com / password123');
  console.log('Student: student@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 