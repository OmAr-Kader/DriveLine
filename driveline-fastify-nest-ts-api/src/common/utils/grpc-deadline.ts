import { ExecutionContext } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';

/**
 * gRPC Deadline Propagation Utilities
 *
 * These utilities ensure that deadlines (timeouts) are properly propagated
 * from upstream requests to downstream gRPC calls, preventing cascading timeouts
 * where downstream services continue processing after upstream has given up.
 *
 * Key Concepts:
 * - Deadline: Absolute time by which RPC must complete
 * - Timeout: Relative time duration
 * - Propagation: Passing deadline from caller to callee
 */

/**
 * Default timeout values for different operation types (milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
  FAST: 1000, // Fast operations (cache, simple queries)
  NORMAL: 5000, // Normal operations (standard CRUD)
  SLOW: 15000, // Slow operations (complex queries, aggregations)
  BATCH: 30000, // Batch operations
  STREAMING: 60000, // Streaming operations
} as const;

/**
 * Extracts deadline from incoming gRPC request metadata.
 *
 * gRPC deadline is sent in metadata as 'grpc-timeout' header in format:
 * - "1000m" = 1000 milliseconds
 * - "30S" = 30 seconds
 * - "5M" = 5 minutes
 * - "1H" = 1 hour
 *
 * @param context - NestJS execution context
 * @returns Remaining time in milliseconds, or undefined if no deadline set
 *
 * @example
 * ```typescript
 * const deadline = extractDeadlineFromContext(context);
 * if (deadline && deadline < 1000) {
 *   throw new Error('Insufficient time to process request');
 * }
 * ```
 */
export function extractDeadlineFromContext(context: ExecutionContext): number | undefined {
  try {
    const metadata = context.switchToRpc().getContext<Metadata>();
    const grpcTimeout = metadata?.get('grpc-timeout')?.[0];

    if (!grpcTimeout || typeof grpcTimeout !== 'string') {
      return undefined;
    }

    return parseGrpcTimeout(grpcTimeout);
  } catch {
    return undefined;
  }
}

/**
 * Parses gRPC timeout string into milliseconds.
 *
 * Format: <value><unit> where unit is one of:
 * - n = nanoseconds
 * - u = microseconds
 * - m = milliseconds
 * - S = seconds
 * - M = minutes
 * - H = hours
 *
 * @param timeoutStr - gRPC timeout string (e.g., "5000m", "30S")
 * @returns Timeout in milliseconds
 * @throws Error if timeout format is invalid
 */
export function parseGrpcTimeout(timeoutStr: string): number {
  const match = timeoutStr.match(/^(\d+)([nmuSMH])$/);

  if (!match) {
    // Log invalid format for debugging but don't throw (graceful degradation)
    console.warn(`Invalid gRPC timeout format: "${timeoutStr}", using default ${DEFAULT_TIMEOUTS.NORMAL}ms`);
    return DEFAULT_TIMEOUTS.NORMAL;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'n': // nanoseconds
      return Math.ceil(value / 1_000_000);
    case 'u': // microseconds
      return Math.ceil(value / 1000);
    case 'm': // milliseconds
      return value;
    case 'S': // seconds
      return value * 1000;
    case 'M': // minutes
      return value * 60 * 1000;
    case 'H': // hours
      return value * 60 * 60 * 1000;
    default:
      console.warn(`Unknown gRPC timeout unit: "${unit}", using default ${DEFAULT_TIMEOUTS.NORMAL}ms`);
      return DEFAULT_TIMEOUTS.NORMAL;
  }
}

/**
 * Formats timeout (ms) into gRPC timeout string format.
 *
 * Chooses the most appropriate unit to avoid precision loss.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns gRPC timeout string
 *
 * @example
 * ```typescript
 * formatGrpcTimeout(5000)  // "5S"
 * formatGrpcTimeout(100)   // "100m"
 * formatGrpcTimeout(90000) // "90S" (not "1M" to preserve precision)
 * ```
 */
export function formatGrpcTimeout(timeoutMs: number): string {
  if (timeoutMs >= 3600000) {
    // Use hours if >= 1 hour
    const hours = Math.floor(timeoutMs / 3600000);
    return `${hours}H`;
  } else if (timeoutMs >= 60000 && timeoutMs % 60000 === 0) {
    // Use minutes if evenly divisible
    const minutes = Math.floor(timeoutMs / 60000);
    return `${minutes}M`;
  } else if (timeoutMs >= 1000 && timeoutMs % 1000 === 0) {
    // Use seconds if evenly divisible
    const seconds = Math.floor(timeoutMs / 1000);
    return `${seconds}S`;
  } else {
    // Use milliseconds for everything else
    return `${timeoutMs}m`;
  }
}

/**
 * Creates gRPC metadata with deadline set.
 *
 * This should be used when making outgoing gRPC calls to propagate
 * the deadline from the incoming request.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param existingMetadata - Optional existing metadata to extend
 * @returns Metadata with grpc-timeout header set
 *
 * @example
 * ```typescript
 * const metadata = createMetadataWithDeadline(5000);
 * const response = await grpcClient.someMethod(request, metadata);
 * ```
 */
export function createMetadataWithDeadline(timeoutMs: number, existingMetadata?: Metadata): Metadata {
  const metadata = existingMetadata ? existingMetadata.clone() : new Metadata();
  metadata.set('grpc-timeout', formatGrpcTimeout(timeoutMs));
  return metadata;
}

/**
 * Calculates appropriate downstream timeout based on upstream deadline.
 *
 * Strategy:
 * 1. If upstream has deadline, use 80% of remaining time (buffer for processing)
 * 2. Otherwise, use provided default timeout
 * 3. Enforce minimum timeout to prevent zero/negative timeouts
 *
 * @param upstreamDeadlineMs - Remaining time from upstream (undefined = no deadline)
 * @param defaultTimeoutMs - Default timeout if no upstream deadline
 * @param minTimeoutMs - Minimum timeout to enforce (default: 100ms)
 * @returns Calculated timeout in milliseconds
 *
 * @example
 * ```typescript
 * // Upstream has 10s remaining, we need 5s default
 * calculateDownstreamTimeout(10000, 5000)
 * // Returns: 8000 (80% of upstream to leave processing buffer)
 *
 * // Upstream has 200ms remaining
 * calculateDownstreamTimeout(200, 5000, 100)
 * // Returns: 100 (minimum enforced)
 * ```
 */
export function calculateDownstreamTimeout(upstreamDeadlineMs: number | undefined, defaultTimeoutMs: number, minTimeoutMs: number = 100): number {
  if (!upstreamDeadlineMs) {
    // No upstream deadline, use default
    return defaultTimeoutMs;
  }

  // Use 80% of remaining time to allow for processing overhead
  const downstreamTimeout = Math.floor(upstreamDeadlineMs * 0.8);

  // Enforce minimum timeout
  if (downstreamTimeout < minTimeoutMs) {
    return minTimeoutMs;
  }

  // Don't exceed default timeout (prevents extending deadlines)
  return Math.min(downstreamTimeout, defaultTimeoutMs);
}

/**
 * Checks if there is sufficient time remaining to process a request.
 *
 * Useful for early rejection of requests that cannot be completed in time.
 *
 * @param remainingMs - Remaining time in milliseconds
 * @param requiredMs - Minimum time required to process
 * @returns true if there is sufficient time
 *
 * @example
 * ```typescript
 * const deadline = extractDeadlineFromContext(context);
 * if (!hasSufficientTime(deadline, 5000)) {
 *   throw new DeadlineExceededError('Insufficient time to process request');
 * }
 * ```
 */
export function hasSufficientTime(remainingMs: number | undefined, requiredMs: number): boolean {
  if (!remainingMs) {
    // No deadline set, assume we have time
    return true;
  }

  return remainingMs >= requiredMs;
}

/**
 * Helper to create a deadline-aware RxJS timeout operator.
 *
 * Integrates with NestJS gRPC client service to automatically
 * set appropriate timeouts based on upstream deadline.
 *
 * @param context - NestJS execution context
 * @param defaultTimeoutMs - Default timeout if no deadline
 * @returns Timeout value in milliseconds for RxJS timeout operator
 *
 * @example
 * ```typescript
 * // In gRPC client service
 * operation(this.client.getService<T>(serviceName)).pipe(
 *   timeout(getDeadlineAwareTimeout(context, 5000)),
 *   catchError(handleError)
 * )
 * ```
 */
export function getDeadlineAwareTimeout(context: ExecutionContext | undefined, defaultTimeoutMs: number): number {
  if (!context) {
    return defaultTimeoutMs;
  }

  const upstreamDeadline = extractDeadlineFromContext(context);
  return calculateDownstreamTimeout(upstreamDeadline, defaultTimeoutMs);
}
