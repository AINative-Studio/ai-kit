import { NextRequest, NextResponse } from 'next/server';
import type { AuthConfig, NextMiddleware } from './types';

/**
 * Create authentication middleware
 *
 * Verifies that requests are authenticated before allowing them to proceed.
 * Supports flexible verification logic and path exclusions.
 *
 * @param config - Authentication configuration
 * @returns Authentication middleware
 *
 * @example
 * ```ts
 * // JWT token verification
 * const middleware = withAuth({
 *   verify: async (req) => {
 *     const token = req.headers.get('authorization')?.split(' ')[1];
 *     if (!token) return false;
 *     try {
 *       await verifyJWT(token);
 *       return true;
 *     } catch {
 *       return false;
 *     }
 *   },
 *   exclude: ['/login', '/register', '/public/*']
 * });
 * ```
 *
 * @example
 * ```ts
 * // Session cookie verification
 * const middleware = withAuth({
 *   verify: async (req) => {
 *     const session = req.cookies.get('session');
 *     return !!session && await validateSession(session.value);
 *   },
 *   redirectTo: '/login'
 * });
 * ```
 */
export function withAuth(config: AuthConfig): NextMiddleware {
  const { verify, exclude, redirectTo, onError } = config;

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // Check if path should be excluded from authentication
    if (exclude) {
      const shouldExclude =
        typeof exclude === 'function'
          ? exclude(pathname)
          : exclude.some((pattern) => matchPath(pathname, pattern));

      if (shouldExclude) {
        return NextResponse.next();
      }
    }

    try {
      // Verify authentication
      const isAuthenticated = await verify(request);

      if (!isAuthenticated) {
        // Handle unauthenticated request
        if (onError) {
          return onError(request);
        }

        if (redirectTo) {
          // Redirect to login page
          const url = new URL(redirectTo, request.url);
          // Add return URL as query parameter
          url.searchParams.set('from', pathname);
          return NextResponse.redirect(url);
        }

        // Return 401 Unauthorized
        return new NextResponse(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Authentication successful, continue
      return NextResponse.next();
    } catch (error) {
      // Handle verification error
      const err = error instanceof Error ? error : new Error(String(error));

      return new NextResponse(
        JSON.stringify({
          error: 'Authentication Error',
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
  };
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
 * Create authentication middleware with role-based access control
 *
 * @param config - Authentication configuration with role extraction
 * @returns Role-based authentication middleware
 *
 * @example
 * ```ts
 * const middleware = withRoleAuth({
 *   verify: async (req) => {
 *     const user = await getCurrentUser(req);
 *     return user;
 *   },
 *   roles: ['admin', 'editor'],
 *   getRoles: (user) => user.roles,
 *   onError: (req) => new NextResponse('Forbidden', { status: 403 })
 * });
 * ```
 */
export function withRoleAuth<TUser = unknown>(config: {
  verify: (request: NextRequest) => Promise<TUser | null> | TUser | null;
  roles: string[];
  getRoles: (user: TUser) => string[] | string;
  exclude?: string[] | ((pathname: string) => boolean);
  redirectTo?: string;
  onError?: (request: NextRequest) => NextResponse;
}): NextMiddleware {
  const { verify, roles, getRoles, exclude, redirectTo, onError } = config;

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

    try {
      // Verify user
      const user = await verify(request);

      if (!user) {
        // Not authenticated
        if (onError) {
          return onError(request);
        }

        if (redirectTo) {
          const url = new URL(redirectTo, request.url);
          url.searchParams.set('from', pathname);
          return NextResponse.redirect(url);
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Check roles
      const userRoles = getRoles(user);
      const userRoleArray = Array.isArray(userRoles) ? userRoles : [userRoles];
      const hasRequiredRole = roles.some((role) => userRoleArray.includes(role));

      if (!hasRequiredRole) {
        // Insufficient permissions
        if (onError) {
          return onError(request);
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Authentication and authorization successful
      return NextResponse.next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      return new NextResponse(
        JSON.stringify({
          error: 'Authentication Error',
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
  };
}
