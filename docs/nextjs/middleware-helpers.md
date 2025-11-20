# Next.js Middleware Helpers

Comprehensive middleware helpers for building secure, performant AI applications with Next.js. These helpers are fully compatible with Next.js 13+ App Router and Edge Runtime.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Middleware Composition](#middleware-composition)
- [Authentication Middleware](#authentication-middleware)
- [Rate Limiting Middleware](#rate-limiting-middleware)
- [Logging Middleware](#logging-middleware)
- [CORS Middleware](#cors-middleware)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Installation

```bash
npm install @ainative/ai-kit-nextjs
# or
pnpm add @ainative/ai-kit-nextjs
# or
yarn add @ainative/ai-kit-nextjs
```

## Quick Start

Create a `middleware.ts` file in your Next.js project root:

```typescript
import { compose, withAuth, withRateLimit, withLogging } from '@ainative/ai-kit-nextjs/middleware';

export const middleware = compose([
  withLogging(),
  withRateLimit({ limit: 100, window: 60000 }),
  withAuth({
    verify: async (req) => {
      const token = req.cookies.get('session');
      return !!token;
    },
    exclude: ['/login', '/register', '/public/*']
  })
]);

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
};
```

## Middleware Composition

### `compose()`

Compose multiple middleware functions into a single middleware pipeline.

```typescript
import { compose } from '@ainative/ai-kit-nextjs/middleware';

const middleware = compose([
  middleware1,
  middleware2,
  middleware3
]);
```

**Features:**
- Executes middleware in order
- Short-circuits on error or redirect responses
- Supports custom error handling
- Type-safe composition

**Options:**

```typescript
interface ComposeOptions {
  continueOnError?: boolean;  // Continue to next middleware on error
  onError?: (error: Error, request: NextRequest) => NextResponse;
}

const middleware = compose([...], {
  continueOnError: false,
  onError: (error, req) => {
    console.error('Middleware error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
});
```

### `chain()`

Alias for `compose()` with spread syntax:

```typescript
import { chain } from '@ainative/ai-kit-nextjs/middleware';

export const middleware = chain(
  withLogging(),
  withAuth(),
  withRateLimit()
);
```

### `conditional()`

Apply middleware conditionally based on a predicate:

```typescript
import { conditional } from '@ainative/ai-kit-nextjs/middleware';

const middleware = conditional(
  (req) => req.nextUrl.pathname.startsWith('/api'),
  withAuth({ ... })
);
```

### `forPaths()`

Apply middleware only to specific paths:

```typescript
import { forPaths } from '@ainative/ai-kit-nextjs/middleware';

const apiAuth = forPaths(
  ['/api/*', '/admin/*'],
  withAuth({ ... })
);
```

### `excludePaths()`

Exclude specific paths from middleware:

```typescript
import { excludePaths } from '@ainative/ai-kit-nextjs/middleware';

const middleware = excludePaths(
  ['/public/*', '/health'],
  withAuth({ ... })
);
```

## Authentication Middleware

### `withAuth()`

Verify authentication before allowing requests to proceed.

```typescript
import { withAuth } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withAuth({
  verify: async (req) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return false;

    try {
      await verifyJWT(token);
      return true;
    } catch {
      return false;
    }
  },
  exclude: ['/login', '/register', '/public/*'],
  redirectTo: '/login'
});
```

**Configuration:**

```typescript
interface AuthConfig {
  verify: (request: NextRequest) => Promise<boolean> | boolean;
  exclude?: string[] | ((pathname: string) => boolean);
  redirectTo?: string;
  onError?: (request: NextRequest) => NextResponse;
}
```

**Examples:**

```typescript
// JWT Token Authentication
const jwtAuth = withAuth({
  verify: async (req) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return false;
    return await verifyJWT(token);
  }
});

// Cookie-based Session
const sessionAuth = withAuth({
  verify: async (req) => {
    const session = req.cookies.get('session');
    if (!session) return false;
    return await validateSession(session.value);
  },
  redirectTo: '/login'
});

// Custom Error Handler
const customAuth = withAuth({
  verify: async (req) => { /* ... */ },
  onError: (req) => {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' }}
    );
  }
});
```

### `withRoleAuth()`

Role-based access control with authentication:

```typescript
import { withRoleAuth } from '@ainative/ai-kit-nextjs/middleware';

const adminMiddleware = withRoleAuth({
  verify: async (req) => {
    const user = await getCurrentUser(req);
    return user;
  },
  roles: ['admin', 'moderator'],
  getRoles: (user) => user.roles,
  exclude: ['/public/*']
});
```

**Configuration:**

```typescript
interface RoleAuthConfig<TUser> {
  verify: (request: NextRequest) => Promise<TUser | null> | TUser | null;
  roles: string[];
  getRoles: (user: TUser) => string[] | string;
  exclude?: string[] | ((pathname: string) => boolean);
  redirectTo?: string;
  onError?: (request: NextRequest) => NextResponse;
}
```

## Rate Limiting Middleware

### `withRateLimit()`

Limit the number of requests from a client within a time window.

```typescript
import { withRateLimit } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withRateLimit({
  limit: 100,           // Max requests
  window: 60000,        // Time window (ms)
});
```

**Configuration:**

```typescript
interface RateLimitConfig {
  limit: number;
  window: number;
  keyGenerator?: (request: NextRequest) => string | Promise<string>;
  store?: RateLimitStore;
  onLimitExceeded?: (request: NextRequest) => NextResponse;
  exclude?: string[] | ((pathname: string) => boolean);
  skip?: (request: NextRequest) => boolean | Promise<boolean>;
}
```

**Examples:**

```typescript
// Basic Rate Limiting
const basicRateLimit = withRateLimit({
  limit: 100,
  window: 60000  // 1 minute
});

// Custom Key Generator (API Key)
const apiKeyRateLimit = withRateLimit({
  limit: 1000,
  window: 3600000,  // 1 hour
  keyGenerator: (req) => {
    return req.headers.get('x-api-key') || 'anonymous';
  }
});

// Custom Error Response
const customRateLimit = withRateLimit({
  limit: 10,
  window: 60000,
  onLimitExceeded: (req) => {
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: 60
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }
});

// Skip Rate Limiting
const skipableRateLimit = withRateLimit({
  limit: 100,
  window: 60000,
  skip: (req) => req.headers.get('x-bypass-ratelimit') === 'secret'
});
```

### `withTieredRateLimit()`

Different rate limits for different paths or user types:

```typescript
import { withTieredRateLimit } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withTieredRateLimit([
  {
    paths: ['/api/public/*'],
    limit: 10,
    window: 60000
  },
  {
    paths: ['/api/premium/*'],
    limit: 100,
    window: 60000
  },
  {
    matcher: (req) => req.headers.get('x-tier') === 'enterprise',
    limit: 1000,
    window: 60000
  }
]);
```

### Custom Rate Limit Store

Implement a custom store for distributed rate limiting:

```typescript
import { RateLimitStore } from '@ainative/ai-kit-nextjs/middleware';

class RedisRateLimitStore implements RateLimitStore {
  async increment(key: string) {
    // Redis implementation
    return { count: 1, resetAt: Date.now() + 60000 };
  }

  async reset(key: string) {
    // Redis implementation
  }

  async get(key: string) {
    // Redis implementation
    return null;
  }
}

const middleware = withRateLimit({
  limit: 100,
  window: 60000,
  store: new RedisRateLimitStore()
});
```

## Logging Middleware

### `withLogging()`

Log request and response information:

```typescript
import { withLogging } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withLogging({
  logRequest: true,
  logResponse: true,
  logHeaders: true
});
```

**Configuration:**

```typescript
interface LoggingConfig {
  logRequest?: boolean;
  logResponse?: boolean;
  logBody?: boolean;
  logHeaders?: boolean;
  logger?: (info: LogInfo) => void | Promise<void>;
  exclude?: string[] | ((pathname: string) => boolean);
  skip?: (request: NextRequest) => boolean;
}
```

**Examples:**

```typescript
// Basic Logging
const basicLogging = withLogging({
  logRequest: true,
  logResponse: true
});

// Custom Logger
const customLogging = withLogging({
  logRequest: true,
  logResponse: true,
  logger: async (info) => {
    // Send to external service
    await fetch('https://logs.example.com/ingest', {
      method: 'POST',
      body: JSON.stringify(info)
    });
  }
});

// Exclude Paths
const selectiveLogging = withLogging({
  logRequest: true,
  exclude: ['/health', '/_next/*', '/static/*']
});

// Skip Based on Header
const conditionalLogging = withLogging({
  logRequest: true,
  skip: (req) => req.headers.get('x-skip-logging') === 'true'
});
```

### `withStructuredLogging()`

Structured JSON logging for log aggregation:

```typescript
import { withStructuredLogging } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withStructuredLogging({
  logger: async (info) => {
    console.log(JSON.stringify(info));
    // Or send to logging service
  }
});
```

**Structured Log Format:**

```json
{
  "timestamp": "2024-11-19T10:30:00.000Z",
  "level": "info",
  "message": "GET /api/users",
  "http": {
    "method": "GET",
    "url": "https://example.com/api/users",
    "pathname": "/api/users",
    "status": 200,
    "userAgent": "Mozilla/5.0..."
  },
  "request": {
    "headers": { ... }
  },
  "response": {
    "headers": { ... },
    "duration": 45
  },
  "client": {
    "ip": "1.2.3.4"
  }
}
```

### `withPerformanceLogging()`

Log only slow requests:

```typescript
import { withPerformanceLogging } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withPerformanceLogging(1000, {  // Log requests > 1s
  logger: (info) => {
    console.warn(`Slow request: ${info.pathname} took ${info.duration}ms`);
  }
});
```

## CORS Middleware

### `withCORS()`

Configure Cross-Origin Resource Sharing:

```typescript
import { withCORS } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withCORS({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
});
```

**Configuration:**

```typescript
interface CORSConfig {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  exclude?: string[] | ((pathname: string) => boolean);
}
```

**Examples:**

```typescript
// Allow All Origins
const openCORS = withCORS({
  origin: '*'
});

// Specific Origins
const restrictedCORS = withCORS({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Dynamic Origin Validation
const dynamicCORS = withCORS({
  origin: (origin) => {
    return origin.endsWith('.example.com');
  },
  credentials: true
});

// Custom Headers
const customCORS = withCORS({
  origin: '*',
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  maxAge: 86400  // 24 hours
});
```

### `withStrictCORS()`

Strict CORS with security defaults:

```typescript
import { withStrictCORS } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withStrictCORS(
  ['https://app.example.com'],
  {
    credentials: true,
    methods: ['GET', 'POST']
  }
);
```

### `withDevCORS()`

Permissive CORS for development:

```typescript
import { withDevCORS } from '@ainative/ai-kit-nextjs/middleware';

const middleware = process.env.NODE_ENV === 'development'
  ? withDevCORS()
  : withStrictCORS(['https://app.example.com']);
```

### `withAPICORS()`

Apply CORS only to API routes:

```typescript
import { withAPICORS } from '@ainative/ai-kit-nextjs/middleware';

const middleware = withAPICORS({
  origin: ['https://app.example.com']
});
```

## Advanced Patterns

### Multi-Tier Authentication

Different authentication for different routes:

```typescript
import { compose, forPaths, withAuth, withRoleAuth } from '@ainative/ai-kit-nextjs/middleware';

export const middleware = compose([
  // Public API - No auth
  // Protected API - Basic auth
  forPaths(
    ['/api/protected/*'],
    withAuth({ verify: verifyToken })
  ),
  // Admin API - Role-based auth
  forPaths(
    ['/api/admin/*'],
    withRoleAuth({
      verify: getUser,
      roles: ['admin'],
      getRoles: (user) => user.roles
    })
  )
]);
```

### Combined Rate Limiting

Different limits for authenticated vs anonymous users:

```typescript
import { compose, conditional, withRateLimit } from '@ainative/ai-kit-nextjs/middleware';

export const middleware = compose([
  // Authenticated users - high limit
  conditional(
    async (req) => await isAuthenticated(req),
    withRateLimit({ limit: 1000, window: 60000 })
  ),
  // Anonymous users - low limit
  conditional(
    async (req) => !(await isAuthenticated(req)),
    withRateLimit({ limit: 10, window: 60000 })
  )
]);
```

### Request Context

Share data between middleware:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { compose } from '@ainative/ai-kit-nextjs/middleware';

const addUserContext = async (req: NextRequest) => {
  const user = await getCurrentUser(req);
  const response = NextResponse.next();

  // Add user to headers for downstream middleware
  if (user) {
    response.headers.set('x-user-id', user.id);
  }

  return response;
};

export const middleware = compose([
  addUserContext,
  withLogging({
    logger: (info) => {
      console.log('User:', info.headers?.['x-user-id']);
    }
  })
]);
```

### Environment-Based Configuration

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const middleware = compose([
  // Development: permissive CORS
  // Production: strict CORS
  isDevelopment
    ? withDevCORS()
    : withStrictCORS(['https://app.example.com']),

  // Development: verbose logging
  // Production: error logging only
  isDevelopment
    ? withLogging({ logRequest: true, logResponse: true, logHeaders: true })
    : withPerformanceLogging(1000),

  // Rate limiting
  withRateLimit({
    limit: isDevelopment ? 1000 : 100,
    window: 60000
  })
]);
```

## Best Practices

### 1. Order Matters

Place middleware in the correct order:

```typescript
// GOOD: Logging first, auth second, rate limit last
compose([
  withLogging(),      // Log all requests
  withAuth(),         // Authenticate
  withRateLimit()     // Rate limit authenticated users
]);

// BAD: Rate limiting before auth
compose([
  withRateLimit(),    // Unauthenticated users share same limit
  withAuth()
]);
```

### 2. Fail Open for Non-Critical Middleware

Rate limiting and logging should fail open:

```typescript
withRateLimit({
  limit: 100,
  window: 60000,
  // If store fails, allow request through
  // (default behavior)
});
```

### 3. Use Path Exclusions

Exclude health checks and static assets:

```typescript
const middleware = compose([
  withLogging({ exclude: ['/health', '/_next/*', '/static/*'] }),
  withAuth({ exclude: ['/login', '/register', '/public/*'] })
]);
```

### 4. Type-Safe Configuration

Use TypeScript for type safety:

```typescript
import type { AuthConfig } from '@ainative/ai-kit-nextjs/middleware';

const authConfig: AuthConfig = {
  verify: async (req) => {
    // TypeScript ensures correct return type
    return true;
  }
};

const middleware = withAuth(authConfig);
```

### 5. Error Handling

Always handle errors gracefully:

```typescript
withAuth({
  verify: async (req) => {
    try {
      const token = req.headers.get('authorization');
      return await verifyToken(token);
    } catch (error) {
      console.error('Auth error:', error);
      return false;
    }
  },
  onError: (req) => {
    // Custom error response
    return new NextResponse('Authentication failed', { status: 401 });
  }
});
```

### 6. Use Matcher for Performance

Configure the matcher to only run middleware on necessary paths:

```typescript
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
```

## API Reference

### Composition

- `compose(middlewares: NextMiddleware[], options?: ComposeOptions): NextMiddleware`
- `chain(...middlewares: NextMiddleware[]): NextMiddleware`
- `conditional(predicate, middleware): NextMiddleware`
- `forPaths(paths: string[], middleware): NextMiddleware`
- `excludePaths(paths: string[], middleware): NextMiddleware`

### Authentication

- `withAuth(config: AuthConfig): NextMiddleware`
- `withRoleAuth<TUser>(config: RoleAuthConfig<TUser>): NextMiddleware`

### Rate Limiting

- `withRateLimit(config: RateLimitConfig): NextMiddleware`
- `withTieredRateLimit(tiers): NextMiddleware`
- `MemoryRateLimitStore(window: number): RateLimitStore`

### Logging

- `withLogging(config?: LoggingConfig): NextMiddleware`
- `withStructuredLogging(config?): NextMiddleware`
- `withPerformanceLogging(threshold: number, config?): NextMiddleware`

### CORS

- `withCORS(config?: CORSConfig): NextMiddleware`
- `withStrictCORS(origins: string[], options?): NextMiddleware`
- `withDevCORS(options?: CORSConfig): NextMiddleware`
- `withAPICORS(config?: CORSConfig): NextMiddleware`

## Edge Runtime Compatibility

All middleware helpers are fully compatible with Next.js Edge Runtime:

```typescript
export const runtime = 'edge';

export const middleware = compose([
  withLogging(),
  withAuth({ ... }),
  withRateLimit({ ... })
]);
```

## License

MIT
