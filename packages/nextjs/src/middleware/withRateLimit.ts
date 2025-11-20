import { NextRequest, NextResponse } from 'next/server';
import type { RateLimitConfig, NextMiddleware, MemoryRateLimitStore } from './types';
import { MemoryRateLimitStore as DefaultStore } from './types';

/**
 * Create rate limiting middleware
 *
 * Limits the number of requests from a client within a time window.
 * Uses in-memory storage by default, but supports custom stores for distributed systems.
 *
 * @param config - Rate limit configuration
 * @returns Rate limiting middleware
 *
 * @example
 * ```ts
 * // Basic rate limiting
 * const middleware = withRateLimit({
 *   limit: 100,
 *   window: 60000, // 1 minute
 * });
 * ```
 *
 * @example
 * ```ts
 * // Custom key generator and error response
 * const middleware = withRateLimit({
 *   limit: 10,
 *   window: 60000,
 *   keyGenerator: (req) => {
 *     // Use API key from header
 *     return req.headers.get('x-api-key') || 'anonymous';
 *   },
 *   onLimitExceeded: (req) => {
 *     return new NextResponse('Too many requests', {
 *       status: 429,
 *       headers: {
 *         'Retry-After': '60'
 *       }
 *     });
 *   }
 * });
 * ```
 *
 * @example
 * ```ts
 * // Exclude paths and skip based on condition
 * const middleware = withRateLimit({
 *   limit: 100,
 *   window: 60000,
 *   exclude: ['/health', '/metrics'],
 *   skip: (req) => req.headers.get('x-bypass-rate-limit') === 'secret'
 * });
 * ```
 */
export function withRateLimit(config: RateLimitConfig): NextMiddleware {
  const {
    limit,
    window,
    keyGenerator,
    store,
    onLimitExceeded,
    exclude,
    skip,
  } = config;

  // Initialize store
  const rateLimitStore = store || new DefaultStore(window);

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // Check if path should be excluded
    if (exclude) {
      const shouldExclude =
        typeof exclude === 'function'
          ? exclude(pathname)
          : exclude.some((pattern) => matchPath(pathname, pattern));

      if (shouldExclude) {
        return NextResponse.next();
      }
    }

    // Check if rate limiting should be skipped
    if (skip) {
      const shouldSkip = await skip(request);
      if (shouldSkip) {
        return NextResponse.next();
      }
    }

    try {
      // Generate rate limit key
      const key = keyGenerator
        ? await keyGenerator(request)
        : getDefaultKey(request);

      // Increment counter
      const result = await rateLimitStore.increment(key);

      // Check if limit exceeded
      const isLimitExceeded = result.count > limit;

      // Create response with rate limit headers
      const response = isLimitExceeded
        ? onLimitExceeded
          ? onLimitExceeded(request)
          : createLimitExceededResponse(result.resetAt)
        : NextResponse.next();

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(limit));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - result.count)));
      response.headers.set('X-RateLimit-Reset', String(result.resetAt));

      if (isLimitExceeded) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        response.headers.set('Retry-After', String(retryAfter));
      }

      return response;
    } catch (error) {
      // On error, allow request to proceed (fail open)
      console.error('Rate limit error:', error);
      return NextResponse.next();
    }
  };
}

/**
 * Get default rate limit key based on IP address
 */
function getDefaultKey(request: NextRequest): string {
  // Try to get IP from various headers (in order of preference)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('true-client-ip') || // Cloudflare Enterprise
    request.headers.get('x-client-ip') ||
    'unknown';

  return `ratelimit:${ip}`;
}

/**
 * Create default rate limit exceeded response
 */
function createLimitExceededResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new NextResponse(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Match a pathname against a pattern
 */
function matchPath(pathname: string, pattern: string): boolean {
  if (pattern === pathname) return true;

  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
    );
    return regex.test(pathname);
  }

  return false;
}

/**
 * Create tiered rate limiting middleware
 *
 * Different rate limits for different paths or user types.
 *
 * @param tiers - Rate limit tiers
 * @returns Tiered rate limiting middleware
 *
 * @example
 * ```ts
 * const middleware = withTieredRateLimit([
 *   {
 *     paths: ['/api/public/*'],
 *     limit: 10,
 *     window: 60000
 *   },
 *   {
 *     paths: ['/api/premium/*'],
 *     limit: 100,
 *     window: 60000
 *   }
 * ]);
 * ```
 */
export function withTieredRateLimit(
  tiers: Array<{
    paths?: string[];
    matcher?: (request: NextRequest) => boolean;
    limit: number;
    window: number;
    keyGenerator?: (request: NextRequest) => string | Promise<string>;
  }>
): NextMiddleware {
  // Create middleware for each tier
  const tierMiddlewares = tiers.map((tier) => {
    const middleware = withRateLimit({
      limit: tier.limit,
      window: tier.window,
      keyGenerator: tier.keyGenerator,
    });

    // Wrap with path/matcher filter
    return async (request: NextRequest): Promise<NextResponse> => {
      const { pathname } = request.nextUrl;

      // Check if this tier applies
      if (tier.paths) {
        const matches = tier.paths.some((pattern) =>
          matchPath(pathname, pattern)
        );
        if (!matches) {
          return NextResponse.next();
        }
      }

      if (tier.matcher && !tier.matcher(request)) {
        return NextResponse.next();
      }

      return middleware(request);
    };
  });

  // Return composed middleware that tries each tier
  return async (request: NextRequest): Promise<NextResponse> => {
    for (const middleware of tierMiddlewares) {
      const response = await middleware(request);

      // If middleware returned an error response, return it
      if (response.status >= 400) {
        return response;
      }

      // If middleware applied rate limiting (has headers), return response
      if (response.headers.has('X-RateLimit-Limit')) {
        return response;
      }
    }

    // No tier matched, allow request
    return NextResponse.next();
  };
}
