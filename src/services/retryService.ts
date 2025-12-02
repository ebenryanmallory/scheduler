/**
 * RetryService - Implements retry logic with exponential backoff
 * 
 * Implements AC3: Retry logic with exponential backoff
 * Implements AC8: Retry up to 3 times before showing error
 */

import { errorService, isRetryableError, AppError } from './errorService';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  jitterFactor: 0.1, // ±10% jitter
};

/**
 * Calculate delay with exponential backoff and jitter
 * Attempt 1: ~1000ms, Attempt 2: ~2000ms, Attempt 3: ~4000ms
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * Only retries for retryable errors (network, timeout, server errors)
 * Non-retryable errors (401, 403, 404) fail immediately
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: Record<string, unknown>
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = attempt <= finalConfig.maxAttempts && isRetryableError(error);

      if (!shouldRetry) {
        // Non-retryable error or max attempts reached
        throw errorService.handleError(error, {
          ...context,
          attempts: attempt,
          maxAttempts: finalConfig.maxAttempts + 1,
        });
      }

      // Log retry attempt
      const delay = calculateDelay(attempt, finalConfig);
      
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This shouldn't be reached, but TypeScript needs it
  throw errorService.handleError(lastError, {
    ...context,
    attempts: finalConfig.maxAttempts + 1,
  });
}

/**
 * Creates a retryable version of a fetch request
 * Wraps fetch with retry logic
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const response = await withRetry(
    async () => {
      const res = await fetch(input, init);
      
      // Throw on non-ok responses so they can be caught and potentially retried
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
        (error as Error & { status: number }).status = res.status;
        throw error;
      }
      
      return res;
    },
    retryConfig,
    { url: input.toString(), method: init?.method || 'GET' }
  );

  return response;
}

/**
 * Type for async functions that can be retried
 */
export type RetryableFunction<T> = () => Promise<T>;

/**
 * Creates a retryable wrapper for any async function
 */
export function createRetryable<T>(
  fn: RetryableFunction<T>,
  config?: Partial<RetryConfig>
): RetryableFunction<T> {
  return () => withRetry(fn, config);
}

export const retryService = {
  withRetry,
  fetchWithRetry,
  createRetryable,
  calculateDelay,
};

