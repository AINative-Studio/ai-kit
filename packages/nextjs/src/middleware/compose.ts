import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware, ComposeOptions } from './types';

/**
 * Compose multiple middleware functions into a single middleware
 *
 * Middleware are executed in order, with each middleware able to:
 * - Modify the request
 * - Short-circuit the chain by returning a response
 * - Pass control to the next middleware
 *
 * @param middlewares - Array of middleware functions to compose
 * @param options - Composition options
 * @returns Composed middleware function
 *
 * @example
 * ```ts
 * import { compose } from '@ainative/ai-kit-nextjs/middleware';
 * import { withAuth, withRateLimit, withLogging } from '@ainative/ai-kit-nextjs/middleware';
 *
 * export const middleware = compose([
 *   withLogging(),
 *   withRateLimit({ limit: 100, window: 60000 }),
 *   withAuth({ verify: async (req) => !!req.cookies.get('session') })
 * ]);
 * ```
 */
export function compose(
  middlewares: NextMiddleware[],
  options: ComposeOptions = {}
): NextMiddleware {
  const { continueOnError = false, onError } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    let response: NextResponse | null = null;

    for (const middleware of middlewares) {
      try {
        // Execute middleware
        const result = await middleware(request);

        // If middleware returns a response, it may be:
        // 1. A final response (like an error or redirect)
        // 2. A modified "pass-through" response
        if (result) {
          response = result;

          // Check if this is a terminal response (error, redirect, etc.)
          // Terminal responses have status codes that indicate the request should not continue
          const isTerminal =
            result.status >= 400 || // Client/server errors
            result.status === 301 || // Permanent redirect
            result.status === 302 || // Temporary redirect
            result.status === 303 || // See other
            result.status === 307 || // Temporary redirect (preserve method)
            result.status === 308; // Permanent redirect (preserve method)

          if (isTerminal) {
            return result;
          }

          // For non-terminal responses, continue to next middleware
          // This allows middleware to modify headers, cookies, etc.
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Handle error based on configuration
        if (onError) {
          const errorResponse = onError(err, request);
          return errorResponse;
        }

        if (!continueOnError) {
          // Return error response
          return new NextResponse(
            JSON.stringify({
              error: 'Middleware Error',
              message: err.message,
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Continue to next middleware if continueOnError is true
      }
    }

    // Return the last response or continue to the route
    return response || NextResponse.next();
  };
}

/**
 * Chain middleware functions (alias for compose)
 *
 * @param middlewares - Middleware functions to chain
 * @returns Composed middleware function
 *
 * @example
 * ```ts
 * export const middleware = chain(
 *   withLogging(),
 *   withAuth(),
 *   withRateLimit()
 * );
 * ```
 */
export function chain(...middlewares: NextMiddleware[]): NextMiddleware {
  return compose(middlewares);
}

/**
 * Conditionally apply middleware based on a predicate
 *
 * @param predicate - Function to determine if middleware should run
 * @param middleware - Middleware to conditionally apply
 * @returns Middleware that conditionally executes
 *
 * @example
 * ```ts
 * const authMiddleware = conditional(
 *   (req) => req.nextUrl.pathname.startsWith('/api'),
 *   withAuth({ verify: verifyToken })
 * );
 * ```
 */
export function conditional(
  predicate: (request: NextRequest) => boolean | Promise<boolean>,
  middleware: NextMiddleware
): NextMiddleware {
  return async (request: NextRequest): Promise<NextResponse> => {
    const shouldApply = await predicate(request);

    if (shouldApply) {
      return middleware(request);
    }

    return NextResponse.next();
  };
}

/**
 * Apply middleware only to specific paths
 *
 * @param paths - Path patterns to match (supports wildcards)
 * @param middleware - Middleware to apply
 * @returns Path-specific middleware
 *
 * @example
 * ```ts
 * const apiAuth = forPaths(['/api/*', '/admin/*'], withAuth());
 * ```
 */
export function forPaths(
  paths: string[],
  middleware: NextMiddleware
): NextMiddleware {
  return conditional((request) => {
    const { pathname } = request.nextUrl;
    return paths.some((path) => matchPath(pathname, path));
  }, middleware);
}

/**
 * Match a pathname against a pattern
 * Supports wildcards (*) and exact matches
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Exact match
  if (pattern === pathname) return true;

  // Wildcard match
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
    );
    return regex.test(pathname);
  }

  return false;
}

/**
 * Exclude paths from middleware
 *
 * @param paths - Paths to exclude
 * @param middleware - Middleware to apply
 * @returns Middleware that skips excluded paths
 *
 * @example
 * ```ts
 * const middleware = excludePaths(
 *   ['/public/*', '/health'],
 *   withAuth()
 * );
 * ```
 */
export function excludePaths(
  paths: string[],
  middleware: NextMiddleware
): NextMiddleware {
  return conditional((request) => {
    const { pathname } = request.nextUrl;
    return !paths.some((path) => matchPath(pathname, path));
  }, middleware);
}
