#!/usr/bin/env node

/**
 * Appwrite Setup Script for Digital School Exam System
 * 
 * This script helps set up the required Appwrite resources for storing exam images.
 * 
 * Prerequisites:
 * 1. Appwrite project must be created
 * 2. Appwrite CLI must be installed and configured
 * 3. Environment variables must be set
 * 
 * Usage:
 * node scripts/setup-appwrite.js
 */

const { Client, Storage, Databases, ID } = require('appwrite');

// Configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68aa7b51002070dd9a73';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // This should be a server API key with write permissions

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  console.log('Please set APPWRITE_API_KEY with a server API key that has write permissions');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);

async function setupAppwrite() {
  try {
    console.log('🚀 Setting up Appwrite for Digital School Exam System...\n');

    // 1. Create storage bucket for exam images
    console.log('📦 Creating storage bucket for exam images...');
    try {
      const bucket = await storage.createBucket(
        'exam-images',
        'Exam Images',
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        true, // Public bucket
        10 * 1024 * 1024, // 10MB max file size
        true, // Enabled
        true  // File security enabled
      );
      console.log('✅ Storage bucket created successfully:', bucket.name);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Storage bucket already exists');
      } else {
        console.error('❌ Failed to create storage bucket:', error.message);
        throw error;
      }
    }

    // 2. Create database for exam image metadata (optional but recommended)
    console.log('\n🗄️  Creating database for exam image metadata...');
    try {
      const database = await databases.create(
        'exam_images_db',
        'Exam Images Database',
        true // Enabled
      );
      console.log('✅ Database created successfully:', database.name);

      // Create collection for storing image metadata
      console.log('📋 Creating collection for image metadata...');
      try {
        const collection = await databases.createCollection(
          'exam_images_db',
          'exam_images',
          'Exam Images',
          [
            // Permission to read/write for authenticated users
            'create("users")',
            'read("users")',
            'update("users")',
            'delete("users")'
          ],
          true // Enabled
        );
        console.log('✅ Collection created successfully:', collection.name);

        // Create attributes for the collection
        console.log('🔧 Creating collection attributes...');
        
        // Question ID attribute
        await databases.createStringAttribute(
          'exam_images_db',
          'exam_images',
          'questionId',
          255,
          true, // Required
          '', // Default value
          false // Array
        );

        // Exam ID attribute
        await databases.createStringAttribute(
          'exam_images_db',
          'exam_images',
          'examId',
          255,
          true, // Required
          '', // Default value
          false // Array
        );

        // Student ID attribute
        await databases.createStringAttribute(
          'exam_images_db',
          'exam_images',
          'studentId',
          255,
          true, // Required
          '', // Default value
          false // Array
        );

        // File ID attribute
        await databases.createStringAttribute(
          'exam_images_db',
          'exam_images',
          'fileId',
          255,
          true, // Required
          '', // Default value
          false // Array
        );

        // Question type attribute
        await databases.createStringAttribute(
          'exam_images_db',
          'exam_images',
          'questionType',
          10,
          true, // Required
          '', // Default value
          false // Array
        );

        // Timestamp attribute
        await databases.createDatetimeAttribute(
          'exam_images_db',
          'exam_images',
          'timestamp',
          true, // Required
          '', // Default value
          false // Array
        );

        console.log('✅ Collection attributes created successfully');

      } catch (error) {
        if (error.code === 409) {
          console.log('ℹ️  Collection already exists');
        } else {
          console.error('❌ Failed to create collection:', error.message);
        }
      }

    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        console.error('❌ Failed to create database:', error.message);
      }
    }

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Storage bucket: exam-images');
    console.log('   ✅ Database: exam_images_db');
    console.log('   ✅ Collection: exam_images');
    console.log('\n🔧 Next steps:');
    console.log('   1. Ensure your app has the correct environment variables');
    console.log('   2. Test image upload functionality');
    console.log('   3. Monitor storage usage in Appwrite console');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check your Appwrite API key permissions');
    console.error('   2. Verify your project ID and endpoint');
    console.error('   3. Ensure your Appwrite instance is running');
    process.exit(1);
  }
}

// Run setup
setupAppwrite(); 