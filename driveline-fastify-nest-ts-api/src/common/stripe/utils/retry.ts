import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryCondition: () => true,
};

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}, logger?: Logger): Promise<T> {
  const config = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = config.delayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxAttempts || !config.retryCondition(error)) {
        throw error;
      }

      logger?.warn(
        `Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms...`,
        error instanceof Error ? error.message : 'Unknown error',
      );

      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors, rate limits, etc.)
 */
export function isRetryableStripeError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const stripeError = error as { type?: string; statusCode?: number };

  // Retry on rate limits
  if (stripeError.statusCode === 429) {
    return true;
  }

  // Retry on server errors
  if (stripeError.statusCode && stripeError.statusCode >= 500) {
    return true;
  }

  // Retry on specific Stripe error types
  const retryableTypes = ['StripeConnectionError', 'StripeAPIError', 'StripeRateLimitError'];

  if (stripeError.type && retryableTypes.includes(stripeError.type)) {
    return true;
  }

  return false;
}
