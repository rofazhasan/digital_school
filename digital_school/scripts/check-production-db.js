#!/usr/bin/env node

/**
 * Production Database Connection Test
 * Tests the provided database connection
 */

const { PrismaClient } = require('@prisma/client');

async function testProductionDatabase() {
  console.log('🔍 Testing Production Database Connection...\n');
  
  // Set the production DATABASE_URL from environment variable
  const productionDbUrl = process.env.DATABASE_URL;
  
  if (!productionDbUrl) {
    console.log('❌ DATABASE_URL environment variable is not set');
    return;
  }
  
  console.log('Database URL: [HIDDEN FOR SECURITY]');
  console.log('Host: [HIDDEN FOR SECURITY]');
  console.log('Port: [HIDDEN FOR SECURITY]');
  console.log('Database: [HIDDEN FOR SECURITY]');
  console.log('SSL Mode: require\n');
  
  try {
    // Create Prisma client with production URL
    const prismadb = new PrismaClient({
      datasources: {
        db: {
          url: productionDbUrl
        }
      }
    });
    
    console.log('🔌 Attempting to connect...');
    
    // Test connection
    await prismadb.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    try {
      const userCount = await prismadb.user.count();
      console.log(`✅ Users table accessible (${userCount} users)`);
    } catch (error) {
      console.log('❌ Users table not accessible:', error.message);
      console.log('💡 You may need to run database migrations');
    }
    
    try {
      const instituteCount = await prismadb.institute.count();
      console.log(`✅ Institutes table accessible (${instituteCount} institutes)`);
    } catch (error) {
      console.log('❌ Institutes table not accessible:', error.message);
      console.log('💡 You may need to run database migrations');
    }
    
    // Check for existing super user
    try {
      const superUser = await prismadb.user.findFirst({
        where: { role: 'SUPER_USER' }
      });
      
      if (superUser) {
        console.log('⚠️  Super user already exists:', superUser.email);
      } else {
        console.log('✅ No super user exists (setup can proceed)');
      }
    } catch (error) {
      console.log('❌ Error checking super user:', error.message);
    }
    
    await prismadb.$disconnect();
    console.log('\n✅ Production database test completed successfully!');
    
  } catch (error) {
    console.log('❌ Production database connection failed:', error.message);
    
    if (error.message.includes('connection')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the database is accessible from your deployment platform');
      console.log('2. Verify the database credentials are correct');
      console.log('3. Ensure the database allows connections from your IP/deployment platform');
      console.log('4. Check if the database requires SSL connections');
    } else if (error.message.includes('schema')) {
      console.log('\n💡 Solution: Run database migrations');
      console.log('npx prisma migrate deploy');
    }
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  try {
    const { execSync } = require('child_process');
    
    // Set the production DATABASE_URL for migrations
    // The DATABASE_URL should be set as an environment variable
    
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🚀 Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ Migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testProductionDatabase();
      break;
    case 'migrate':
      await runMigrations();
      break;
    default:
      console.log('Usage: node check-production-db.js [test|migrate]');
      console.log('  test    - Test database connection');
      console.log('  migrate - Run database migrations');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testProductionDatabase,
  runMigrations
}; 