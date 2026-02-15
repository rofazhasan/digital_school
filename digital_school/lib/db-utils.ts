// lib/db-utils.ts
import { DatabaseClient } from './db';
import { NextResponse } from 'next/server';

// Enhanced error handling for database operations
export class DatabaseError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public isRetryable: boolean = true
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

// Database operation wrapper with timeout and retry logic
export async function withDatabaseTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 25000, // 25 seconds default
    maxRetries: number = 2
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const db = await DatabaseClient.getInstance();

            return await DatabaseClient.executeWithTimeout(
                async () => {
                    try {
                        return await operation();
                    } catch (error) {
                        // Check if it's a connection error
                        if (error instanceof Error &&
                            (error.message.includes('connection') ||
                                error.message.includes('timeout') ||
                                error.message.includes('ECONNRESET'))) {
                            throw new DatabaseError(
                                'Database connection lost. Please try again.',
                                503,
                                true
                            );
                        }
                        throw error;
                    }
                },
                timeoutMs
            );
        } catch (error) {
            lastError = error as Error;
            console.error(`Database operation attempt ${attempt} failed:`, error);

            // If it's the last attempt or a non-retryable error, throw
            if (attempt === maxRetries ||
                (error instanceof DatabaseError && !error.isRetryable)) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Database operation failed');
}

// Common database operations with error handling
export async function safeDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation'
): Promise<T> {
    try {
        return await withDatabaseTimeout(operation);
    } catch (error) {
        console.error(`${operationName} failed:`, error);

        if (error instanceof DatabaseError) {
            throw error;
        }

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                throw new DatabaseError(
                    'Request timed out. Please try again.',
                    408,
                    true
                );
            }
            if (error.message.includes('connection')) {
                throw new DatabaseError(
                    'Database connection failed. Please try again.',
                    503,
                    true
                );
            }
        }

        throw new DatabaseError(
            `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500,
            false
        );
    }
}

// Health check for database
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
        await withDatabaseTimeout(
            async () => {
                const db = await DatabaseClient.getInstance();
                await db.$queryRaw`SELECT 1`;
            },
            5000 // 5 second timeout for health check
        );

        return { healthy: true, message: 'Database is healthy' };
    } catch (error) {
        return {
            healthy: false,
            message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Cache management with Stale-While-Revalidate support
export class DatabaseCache {
    private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    static set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs
        });
    }

    // New: Stale-While-Revalidate pattern
    // Returns { data: any, isStale: boolean } or null
    static getSWR(key: string): { data: any; isStale: boolean } | null {
        const item = this.cache.get(key);
        if (!item) return null;

        const age = Date.now() - item.timestamp;
        const isStale = age > item.ttl;

        // If data is older than 2x TTL, consider it completely expired (evict)
        if (age > item.ttl * 2) {
            this.cache.delete(key);
            return null;
        }

        return { data: item.data, isStale };
    }

    static get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    static clear(): void {
        this.cache.clear();
    }

    static invalidate(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

// Enhanced API response wrapper with HTTP Caching headers
export function createApiResponse<T>(
    data: T | null,
    error?: string,
    statusCode: number = 200,
    options: { cacheControl?: string } = {}
): NextResponse {
    if (error) {
        return NextResponse.json(
            {
                error,
                timestamp: new Date().toISOString(),
                statusCode
            },
            { status: statusCode }
        );
    }

    const headers: HeadersInit = {};
    if (options.cacheControl) {
        headers['Cache-Control'] = options.cacheControl;
    }

    return NextResponse.json({
        data,
        timestamp: new Date().toISOString(),
        statusCode
    }, {
        status: statusCode,
        headers
    });
} 