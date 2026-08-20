/**
 * OMR Retry Queue with Exponential Backoff & Jitter
 * 
 * Calculates backoff intervals: min(60s, 2^retryCount * 1000ms + jitter)
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffFactor: 2
};

export class RetryQueue {
  /**
   * Computes the exponential delay with randomized jitter for a given retry attempt.
   */
  public static calculateDelay(
    attempt: number,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): number {
    if (attempt <= 0) return 0;

    const baseDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1);
    const cappedDelay = Math.min(baseDelay, config.maxDelayMs);

    // Full jitter (0 to 25% of capped delay)
    const jitter = Math.random() * (cappedDelay * 0.25);
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Executes a task with automatic exponential retries.
   */
  public static async executeWithRetry<T>(
    task: (attempt: number) => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    onRetry?: (attempt: number, delayMs: number, error: any) => void
  ): Promise<T> {
    let attempt = 1;

    while (attempt <= config.maxRetries) {
      try {
        return await task(attempt);
      } catch (error: any) {
        if (attempt === config.maxRetries) {
          throw error;
        }

        const delay = this.calculateDelay(attempt, config);
        if (onRetry) {
          onRetry(attempt, delay, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new Error(`Max retry attempts (${config.maxRetries}) exceeded.`);
  }
}
