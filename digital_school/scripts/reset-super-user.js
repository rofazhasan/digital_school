#!/usr/bin/env node

/**
 * Reset Super User Script
 * This script removes the existing super user and institute to allow setup to work again
 * WARNING: This will delete all data associated with the super user
 */

const { PrismaClient } = require('@prisma/client');

async function resetSuperUser() {
  console.log('⚠️  WARNING: This will delete the existing super user and institute');
  console.log('This action cannot be undone. All data will be lost.\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise((resolve) => {
    rl.question('Are you sure you want to continue? (yes/no): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    return;
  }
  
  try {
    console.log('🔍 Connecting to database...');
    const prismadb = new PrismaClient();
    
    // Check for existing super user
    const existingSuperUser = await prismadb.user.findFirst({
      where: { role: 'SUPER_USER' },
      include: {
        institute: true
      }
    });
    
    if (!existingSuperUser) {
      console.log('✅ No super user found. Setup page should work.');
      await prismadb.$disconnect();
      return;
    }
    
    console.log(`Found super user: ${existingSuperUser.email}`);
    console.log(`Institute: ${existingSuperUser.institute?.name || 'Unknown'}`);
    
    // Delete super user and institute
    console.log('🗑️  Deleting super user and institute...');
    
    // First, delete the super user
    await prismadb.user.delete({
      where: { id: existingSuperUser.id }
    });
    
    // Then delete the institute
    if (existingSuperUser.institute) {
      await prismadb.institute.delete({
        where: { id: existingSuperUser.institute.id }
      });
    }
    
    console.log('✅ Super user and institute deleted successfully');
    console.log('🎉 Setup page should now work!');
    
    await prismadb.$disconnect();
    
  } catch (error) {
    console.error('❌ Error resetting super user:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('💡 Solution: Set DATABASE_URL environment variable');
    } else if (error.message.includes('connection')) {
      console.log('💡 Solution: Check database connection');
    }
  }
}

async function checkSuperUserStatus() {
  try {
    console.log('🔍 Checking super user status...\n');
    
    const prismadb = new PrismaClient();
    
    const existingSuperUser = await prismadb.user.findFirst({
      where: { role: 'SUPER_USER' },
      include: {
        institute: true
      }
    });
    
    if (existingSuperUser) {
      console.log('⚠️  Super user exists:');
      console.log(`  - Email: ${existingSuperUser.email}`);
      console.log(`  - Name: ${existingSuperUser.name}`);
      console.log(`  - Institute: ${existingSuperUser.institute?.name || 'Unknown'}`);
      console.log('\n💡 Setup page will return error. Run reset script to fix.');
    } else {
      console.log('✅ No super user found');
      console.log('🎉 Setup page should work correctly');
    }
    
    await prismadb.$disconnect();
    
  } catch (error) {
    console.error('❌ Error checking super user status:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'check') {
    await checkSuperUserStatus();
  } else if (command === 'reset') {
    await resetSuperUser();
  } else {
    console.log('Usage:');
    console.log('  node scripts/reset-super-user.js check  - Check super user status');
    console.log('  node scripts/reset-super-user.js reset  - Reset super user (DANGEROUS)');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { resetSuperUser, checkSuperUserStatus }; 