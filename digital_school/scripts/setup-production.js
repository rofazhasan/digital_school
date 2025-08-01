#!/usr/bin/env node

const crypto = require('crypto');

console.log('🚀 Setting up production environment for Netlify deployment...\n');

// Your production database URL - Set this as environment variable
const DATABASE_URL = process.env.DATABASE_URL || 'your-database-url-here';

// Generate secure secrets
const NEXTAUTH_SECRET = crypto.randomBytes(32).toString('base64');
const JWT_SECRET = crypto.randomBytes(32).toString('base64');

console.log('📋 Production Environment Variables for Netlify:');
console.log('===============================================\n');

console.log('DATABASE_URL=' + DATABASE_URL);
console.log('NEXTAUTH_SECRET=' + NEXTAUTH_SECRET);
console.log('JWT_SECRET=' + JWT_SECRET);
console.log('NEXTAUTH_URL=https://your-app-name.netlify.app');
console.log('NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app');
console.log('GOOGLE_AI_API_KEY=your-google-ai-api-key-here');

console.log('\n📝 Instructions:');
console.log('1. Go to your Netlify site settings');
console.log('2. Navigate to Environment variables');
console.log('3. Add each variable above with its corresponding value');
console.log('4. Replace "your-app-name" with your actual Netlify app name');
console.log('5. Add your Google AI API key if you have one');

console.log('\n🔧 Database Setup Commands:');
console.log('After deployment, run these commands to set up your database:');
console.log('npx prisma db push');
console.log('npm run db:seed');

console.log('\n✅ Test Accounts (after seeding):');
console.log('Super User: admin@eliteschool.edu.bd / password123');
console.log('Admin: admin@test.com / password123');
console.log('Teacher: teacher@test.com / password123');
console.log('Student: student@test.com / password123');

console.log('\n⚠️  Important Security Notes:');
console.log('- Keep these secrets secure and never commit them to Git');
console.log('- Use different secrets for development and production');
console.log('- Rotate secrets periodically for security');
console.log('- Your database URL contains sensitive credentials');

console.log('\n🔗 Next Steps:');
console.log('1. Deploy to Netlify with these environment variables');
console.log('2. Run database migrations and seeding');
console.log('3. Test the application thoroughly');
console.log('4. Set up monitoring and backups'); 