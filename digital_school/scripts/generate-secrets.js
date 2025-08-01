#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for Netlify deployment...\n');

// Generate NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET:');
console.log(nextAuthSecret);
console.log('');

// Generate JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// Generate a random string for other secrets
const randomSecret = crypto.randomBytes(16).toString('hex');
console.log('Random Secret (for other uses):');
console.log(randomSecret);
console.log('');

console.log('📋 Copy these values to your Netlify environment variables:');
console.log('1. Go to your Netlify site settings');
console.log('2. Navigate to Environment variables');
console.log('3. Add each variable with its corresponding value');
console.log('');

console.log('⚠️  Important:');
console.log('- Keep these secrets secure and never commit them to Git');
console.log('- Use different secrets for development and production');
console.log('- Rotate secrets periodically for security');
console.log('');

console.log('🔗 Next steps:');
console.log('1. Set up your PostgreSQL database (Supabase, Railway, or Neon)');
console.log('2. Get your DATABASE_URL from your database provider');
console.log('3. Update your Netlify environment variables with the actual values');
console.log('4. Deploy your application'); 