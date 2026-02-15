import { PrismaClient } from '@prisma/client';

let prismadb: PrismaClient;

// This prevents multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/builddb',
    },
  },
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = globalThis.prisma || new PrismaClient(prismaClientOptions);
  prismadb = globalThis.prisma;
} else {
  prismadb = new PrismaClient(prismaClientOptions);
}

/**
 * Get database client with better error handling
 */
export async function getDatabaseClient() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    await prismadb.$connect();
    return prismadb;
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        throw new Error('Database URL not configured. Please set DATABASE_URL environment variable.');
      }
      if (error.message.includes('connection')) {
        throw new Error('Unable to connect to database. Please check your database URL and ensure the database is accessible.');
      }
    }

    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default prismadb; 