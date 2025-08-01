// lib/db-optimized.ts
import { PrismaClient } from '@prisma/client';

// Serverless-optimized database connection manager
class ServerlessDatabaseManager {
    private static instance: PrismaClient | null = null;
    private static connectionCount = 0;
    private static maxConnections = 5; // Conservative limit for serverless
    private static connectionTimeout = 10000; // 10 seconds
    private static lastConnectionTime = 0;
    private static connectionCooldown = 1000; // 1 second between connections

    static async getConnection(): Promise<PrismaClient> {
        const now = Date.now();
        
        // Rate limiting to prevent connection spam
        if (now - this.lastConnectionTime < this.connectionCooldown) {
            await new Promise(resolve => 
                setTimeout(resolve, this.connectionCooldown - (now - this.lastConnectionTime))
            );
        }

        // If we have an existing connection and it's recent, reuse it
        if (this.instance && this.connectionCount < this.maxConnections) {
            this.connectionCount++;
            this.lastConnectionTime = now;
            return this.instance;
        }

        // Create new connection if needed
        if (!this.instance) {
            this.instance = new PrismaClient({
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL,
                    },
                },
                log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
            });
        }

        this.connectionCount++;
        this.lastConnectionTime = now;
        
        return this.instance;
    }

    static async releaseConnection(): Promise<void> {
        if (this.connectionCount > 0) {
            this.connectionCount--;
        }
        
        // If no active connections, close the instance after a delay
        if (this.connectionCount === 0) {
            setTimeout(async () => {
                if (this.connectionCount === 0 && this.instance) {
                    try {
                        await this.instance.$disconnect();
                        this.instance = null;
                    } catch (error) {
                        console.error('Error disconnecting database:', error);
                    }
                }
            }, 5000); // Wait 5 seconds before closing
        }
    }

    static async executeWithConnection<T>(
        operation: (db: PrismaClient) => Promise<T>,
        timeoutMs: number = 25000
    ): Promise<T> {
        const db = await this.getConnection();
        
        try {
            return await Promise.race([
                operation(db),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
                )
            ]);
        } finally {
            await this.releaseConnection();
        }
    }

    static async healthCheck(): Promise<{ healthy: boolean; message: string }> {
        try {
            await this.executeWithConnection(async (db) => {
                await db.$queryRaw`SELECT 1`;
            }, 5000);
            
            return { healthy: true, message: 'Database is healthy' };
        } catch (error) {
            return { 
                healthy: false, 
                message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }
}

// Export the optimized database manager
export default ServerlessDatabaseManager; 