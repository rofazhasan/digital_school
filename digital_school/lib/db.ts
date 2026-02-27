// lib/db.ts
import { PrismaClient } from '@prisma/client';

// This prevents multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Enhanced Prisma Client with connection pooling and timeout settings
const createPrismaClient = () => {
    const url = process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/builddb';
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL is missing. Using dummy connection string for build.');
    }
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
        // Connection pooling settings for better performance
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    // NOTE: Sentry Prisma instrumentation is automatically enabled via @sentry/nextjs
    // if the prisma package is installed.

    return prisma;
};

// Create a singleton instance
const prismadb = globalThis.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismadb;

// Enhanced database client with connection management
export class DatabaseClient {
    // Return the singleton instance directly
    static async getInstance(): Promise<PrismaClient> {
        return prismadb;
    }

    // Keep the timeout utility as it's useful
    static async executeWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number = 30000
    ): Promise<T> {
        return Promise.race([
            operation(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
            )
        ]);
    }
}

// Export the enhanced client
export default prismadb;
