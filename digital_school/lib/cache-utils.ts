import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Higher-order function to cache database queries using Next.js unstable_cache.
 *
 * @param fn The async function to cache
 * @param keyParts Unique keys for the cache entry
 * @param tags Revalidation tags used to invalidate this cache
 * @param revalidate TTL in seconds (default: 1 hour)
 */
export async function withCache<T>(
    fn: () => Promise<T>,
    keyParts: string[],
    tags: string[],
    revalidate: number = 3600
): Promise<T> {
    return unstable_cache(
        async () => {
            return await fn();
        },
        keyParts,
        {
            revalidate,
            tags,
        }
    )();
}

/**
 * Revalidate a specific cache tag, clearing all cached data associated with it.
 *
 * @param tag The tag to revalidate
 */
export function invalidateCache(tag: string): void {
    revalidateTag(tag);
}

// Common Cache Tags — use these across the app for consistent cache invalidation
export const CACHE_TAGS = {
    SETTINGS: 'settings',
    INSTITUTE: 'institute',
    NOTICES: 'notices',
    ANALYTICS: 'analytics',
    QUESTIONS: 'questions',
    EXAMS: 'exams',
} as const;
