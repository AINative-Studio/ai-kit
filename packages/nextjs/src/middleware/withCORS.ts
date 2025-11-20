import { NextRequest, NextResponse } from 'next/server';
import type { CORSConfig, NextMiddleware } from './types';

/**
 * Create CORS middleware
 *
 * Handles Cross-Origin Resource Sharing (CORS) for API routes.
 * Supports preflight requests and customizable CORS policies.
 *
 * @param config - CORS configuration
 * @returns CORS middleware
 *
 * @example
 * ```ts
 * // Allow all origins
 * const middleware = withCORS({
 *   origin: '*'
 * });
 * ```
 *
 * @example
 * ```ts
 * // Specific origins with credentials
 * const middleware = withCORS({
 *   origin: ['https://app.example.com', 'https://admin.example.com'],
 *   credentials: true,
 *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   allowedHeaders: ['Content-Type', 'Authorization']
 * });
 * ```
 *
 * @example
 * ```ts
 * // Dynamic origin validation
 * const middleware = withCORS({
 *   origin: (origin) => {
 *     return origin.endsWith('.example.com');
 *   },
 *   credentials: true
 * });
 * ```
 */
export function withCORS(config: CORSConfig = {}): NextMiddleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders,
    exposedHeaders,
    credentials = false,
    maxAge = 86400, // 24 hours
    exclude,
  } = config;

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

    // Get request origin
    const requestOrigin = request.headers.get('origin') || '';

    // Determine if origin is allowed
    const allowedOrigin = getAllowedOrigin(requestOrigin, origin);

    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, {
        allowedOrigin,
        methods,
        allowedHeaders,
        exposedHeaders,
        credentials,
        maxAge,
      });
    }

    // Handle actual request
    const response = NextResponse.next();

    // Set CORS headers
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);

      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      if (exposedHeaders && exposedHeaders.length > 0) {
        response.headers.set(
          'Access-Control-Expose-Headers',
          exposedHeaders.join(', ')
        );
      }

      // Add Vary header to prevent cache issues
      response.headers.set('Vary', 'Origin');
    }

    return response;
  };
}

/**
 * Determine allowed origin based on configuration
 */
function getAllowedOrigin(
  requestOrigin: string,
  config: string | string[] | ((origin: string) => boolean) | undefined
): string | null {
  // No origin in request
  if (!requestOrigin) {
    return null;
  }

  // Allow all origins
  if (config === '*') {
    return '*';
  }

  // Array of allowed origins
  if (Array.isArray(config)) {
    return config.includes(requestOrigin) ? requestOrigin : null;
  }

  // Function to determine if origin is allowed
  if (typeof config === 'function') {
    return config(requestOrigin) ? requestOrigin : null;
  }

  // Single origin string
  if (typeof config === 'string') {
    return config === requestOrigin ? requestOrigin : null;
  }

  return null;
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(
  request: NextRequest,
  config: {
    allowedOrigin: string | null;
    methods: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials: boolean;
    maxAge: number;
  }
): NextResponse {
  const {
    allowedOrigin,
    methods,
    allowedHeaders,
    exposedHeaders,
    credentials,
    maxAge,
  } = config;

  // Create preflight response
  const response = new NextResponse(null, { status: 204 });

  // Set CORS headers
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);

    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));

    // Handle allowed headers
    if (allowedHeaders && allowedHeaders.length > 0) {
      response.headers.set(
        'Access-Control-Allow-Headers',
        allowedHeaders.join(', ')
      );
    } else {
      // Echo the requested headers
      const requestedHeaders = request.headers.get(
        'access-control-request-headers'
      );
      if (requestedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', requestedHeaders);
      }
    }

    if (exposedHeaders && exposedHeaders.length > 0) {
      response.headers.set(
        'Access-Control-Expose-Headers',
        exposedHeaders.join(', ')
      );
    }

    response.headers.set('Access-Control-Max-Age', String(maxAge));

    // Add Vary header
    response.headers.set('Vary', 'Origin');
  } else {
    // Origin not allowed - return 403
    return new NextResponse('Origin not allowed', { status: 403 });
  }

  return response;
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
 * Create CORS middleware with strict security defaults
 *
 * More restrictive defaults for production use.
 *
 * @param origins - Allowed origins
 * @param options - Additional CORS options
 * @returns Strict CORS middleware
 *
 * @example
 * ```ts
 * const middleware = withStrictCORS(
 *   ['https://app.example.com'],
 *   {
 *     methods: ['GET', 'POST'],
 *     credentials: true
 *   }
 * );
 * ```
 */
export function withStrictCORS(
  origins: string[],
  options: Omit<CORSConfig, 'origin'> = {}
): NextMiddleware {
  return withCORS({
    origin: origins,
    methods: ['GET', 'POST'],
    credentials: false,
    maxAge: 3600, // 1 hour
    ...options,
  });
}

/**
 * Create CORS middleware for development
 *
 * Permissive settings for local development.
 *
 * @param options - Additional CORS options
 * @returns Development CORS middleware
 *
 * @example
 * ```ts
 * const middleware = withDevCORS();
 * ```
 */
export function withDevCORS(options: CORSConfig = {}): NextMiddleware {
  return withCORS({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'],
    ...options,
  });
}

/**
 * Create CORS middleware for API routes only
 *
 * @param config - CORS configuration
 * @returns API-specific CORS middleware
 *
 * @example
 * ```ts
 * const middleware = withAPICORS({
 *   origin: ['https://app.example.com']
 * });
 * ```
 */
export function withAPICORS(config: CORSConfig = {}): NextMiddleware {
  const corsMiddleware = withCORS(config);

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // Only apply to /api routes
    if (!pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    return corsMiddleware(request);
  };
}
