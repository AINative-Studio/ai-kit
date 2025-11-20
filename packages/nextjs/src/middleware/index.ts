/**
 * Next.js Middleware Helpers
 *
 * Common middleware patterns for AI applications including:
 * - Authentication
 * - Rate limiting
 * - Request/response logging
 * - CORS configuration
 * - Middleware composition
 *
 * @packageDocumentation
 */

// Composition utilities
export {
  compose,
  chain,
  conditional,
  forPaths,
  excludePaths,
} from './compose';

// Authentication middleware
export { withAuth, withRoleAuth } from './withAuth';

// Rate limiting middleware
export { withRateLimit, withTieredRateLimit } from './withRateLimit';

// Logging middleware
export {
  withLogging,
  withStructuredLogging,
  withPerformanceLogging,
} from './withLogging';

// CORS middleware
export {
  withCORS,
  withStrictCORS,
  withDevCORS,
  withAPICORS,
} from './withCORS';

// Types
export type {
  NextMiddleware,
  MiddlewareFactory,
  MiddlewareContext,
  RequestWithContext,
  AuthConfig,
  RateLimitConfig,
  RateLimitStore,
  RateLimitResult,
  LoggingConfig,
  LogInfo,
  CORSConfig,
  ComposeOptions,
} from './types';

// Export store implementation
export { MemoryRateLimitStore } from './types';
