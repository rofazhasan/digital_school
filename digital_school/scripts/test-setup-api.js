#!/usr/bin/env node

/**
 * Test script for the setup API endpoint
 * This script tests the /api/setup/super-user endpoint
 */

const https = require('https');
const http = require('http');

async function testSetupAPI() {
  console.log('🧪 Testing Setup API Endpoint...\n');
  
  const baseUrl = process.env.TEST_URL || 'https://digitalsch.netlify.app';
  const apiUrl = `${baseUrl}/api/setup/super-user`;
  
  console.log(`Testing API endpoint: ${apiUrl}`);
  
  const testData = {
    name: 'Test Super User',
    email: 'test@example.com',
    password: 'testpassword123',
    institute: {
      name: 'Test Institute',
      email: 'institute@test.com',
      phone: '+1234567890',
      address: 'Test Address',
      website: 'https://test.com'
    }
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: new URL(baseUrl).hostname,
    port: new URL(baseUrl).port || (new URL(baseUrl).protocol === 'https:' ? 443 : 80),
    path: '/api/setup/super-user',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const client = new URL(baseUrl).protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ API endpoint is working correctly');
          } else if (res.statusCode === 400) {
            console.log('⚠️  API endpoint is working but returned validation error (expected if super user exists)');
          } else if (res.statusCode === 500) {
            console.log('❌ API endpoint returned server error');
            console.log('💡 Check environment variables and database connection');
          } else {
            console.log(`⚠️  API endpoint returned unexpected status: ${res.statusCode}`);
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          console.log('Raw response:', data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testEnvironmentVariables() {
  console.log('🔍 Testing Environment Variables...\n');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function main() {
  console.log('🚀 Setup API Test Tool\n');
  
  await testEnvironmentVariables();
  await testSetupAPI();
  
  console.log('\n📋 Summary:');
  console.log('- If the API returns 200: Setup is working correctly');
  console.log('- If the API returns 400: Super user already exists (expected)');
  console.log('- If the API returns 500: Check environment variables and database');
  console.log('- If the request fails: Check network connectivity and URL');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSetupAPI, testEnvironmentVariables }; 