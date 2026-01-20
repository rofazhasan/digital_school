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
    return new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
        // Connection pooling settings for better performance
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
};

// Create a singleton instance
const prismadb = globalThis.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismadb;

// Enhanced database client with connection management
export class DatabaseClient {
    private static instance: PrismaClient;
    private static isConnecting = false;
    private static connectionPromise: Promise<PrismaClient> | null = null;

    static async getInstance(): Promise<PrismaClient> {
        if (this.instance && this.isConnected()) {
            return this.instance;
        }

        if (this.isConnecting && this.connectionPromise) {
            return this.connectionPromise;
        }

        this.isConnecting = true;
        this.connectionPromise = this.connectWithRetry();

        try {
            this.instance = await this.connectionPromise;
            return this.instance;
        } finally {
            this.isConnecting = false;
            this.connectionPromise = null;
        }
    }

    private static async connectWithRetry(maxRetries = 3): Promise<PrismaClient> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Test the connection
                await prismadb.$connect();

                // Verify connection with a simple query
                await prismadb.$queryRaw`SELECT 1`;

                console.log(`✅ Database connected successfully (attempt ${attempt})`);
                return prismadb;
            } catch (error) {
                lastError = error as Error;
                console.error(`❌ Database connection attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`Database connection failed after ${maxRetries} attempts: ${lastError?.message}`);
    }

    private static isConnected(): boolean {
        try {
            // Quick check if the client is connected
            return prismadb !== null && typeof prismadb === 'object';
        } catch {
            return false;
        }
    }

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
