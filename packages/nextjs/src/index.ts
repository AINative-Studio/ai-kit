/**
 * @ainative/ai-kit-nextjs
 * Next.js adapter for AI Kit - Route helpers, middleware, and utilities
 */

// Export route helpers
export {
  createStreamingRoute,
  createAPIRoute,
  createSSEStream,
  sendSSEMessage,
  formatSSE,
  parseRequestBody,
  createErrorResponse,
  createSuccessResponse,
} from './route-helpers'

// Export types and SSEEventType enum
export {
  SSEEventType,
} from './types'

export type {
  CORSConfig,
  ValidationSchema,
  RouteConfig,
  StreamingRouteConfig,
  AppRouterContext,
  PagesRouterContext,
  StreamingRouteHandler,
  APIRouteHandler,
  RouteHandler,
  ErrorResponse,
  SuccessResponse,
  SSEMessage,
  TokenEvent,
  UsageEvent,
  ErrorEvent,
  MetadataEvent,
  RequestParseOptions,
  ResponseFormatOptions,
} from './types'
