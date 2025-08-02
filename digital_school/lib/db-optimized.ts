// lib/db-optimized.ts
import { PrismaClient } from '@prisma/client';

// This prevents multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Enhanced Prisma Client with minimal logging for development
const createPrismaClient = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        // Minimal logging - only errors and warnings
        log: ['error', 'warn'],
    });
};

// Create a singleton instance
const prismadb = globalThis.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismadb;

export default prismadb; 