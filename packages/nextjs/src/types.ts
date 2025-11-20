/**
 * Types for Next.js route helpers
 */

import type { NextRequest } from 'next/server'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * CORS configuration for route handlers
 */
export interface CORSConfig {
  /** Allowed origins (e.g., ['https://example.com', 'http://localhost:3000']) */
  allowedOrigins?: string[] | '*'
  /** Allowed HTTP methods */
  allowedMethods?: string[]
  /** Allowed headers */
  allowedHeaders?: string[]
  /** Exposed headers */
  exposedHeaders?: string[]
  /** Max age for preflight cache (in seconds) */
  maxAge?: number
  /** Allow credentials */
  credentials?: boolean
}

/**
 * Validation schema for request body
 */
export interface ValidationSchema {
  /** Required fields in the request body */
  required?: string[]
  /** Optional fields with their types */
  optional?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
  /** Custom validation function */
  validate?: (data: any) => { valid: boolean; error?: string }
}

/**
 * Route configuration for Next.js routes
 */
export interface RouteConfig {
  /** CORS configuration */
  cors?: CORSConfig
  /** Request body validation schema */
  validation?: ValidationSchema
  /** Custom headers to include in response */
  headers?: Record<string, string>
  /** Rate limiting configuration */
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  /** Timeout in milliseconds */
  timeout?: number
  /** Enable request logging */
  logging?: boolean
  /** Edge runtime configuration */
  runtime?: 'nodejs' | 'edge'
}

/**
 * Streaming route configuration (extends RouteConfig)
 */
export interface StreamingRouteConfig extends RouteConfig {
  /** Enable heartbeat to keep connection alive */
  enableHeartbeat?: boolean
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number
  /** Custom error handler for streaming */
  onError?: (error: Error) => void
  /** Custom metadata to include in stream start event */
  metadata?: Record<string, any>
}

/**
 * Request context for App Router (Next.js 13+)
 */
export interface AppRouterContext {
  /** The incoming request */
  request: NextRequest
  /** Route parameters */
  params?: Record<string, string | string[]>
  /** Parsed request body */
  body?: any
}

/**
 * Request context for Pages Router (Next.js < 13)
 */
export interface PagesRouterContext {
  /** The incoming request */
  req: NextApiRequest
  /** The outgoing response */
  res: NextApiResponse
  /** Parsed request body */
  body?: any
}

/**
 * Streaming handler for App Router
 */
export type StreamingRouteHandler = (
  context: AppRouterContext
) => Promise<ReadableStream<Uint8Array> | Response>

/**
 * API route handler for Pages Router
 */
export type APIRouteHandler = (
  context: PagesRouterContext
) => Promise<void> | void

/**
 * Generic route handler (can be either App Router or Pages Router)
 */
export type RouteHandler = StreamingRouteHandler | APIRouteHandler

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string
  code?: string
  statusCode: number
  details?: any
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  data: T
  statusCode?: number
  metadata?: Record<string, any>
}

/**
 * SSE event types for streaming
 */
export enum SSEEventType {
  START = 'start',
  TOKEN = 'token',
  USAGE = 'usage',
  ERROR = 'error',
  METADATA = 'metadata',
  DONE = 'done',
}

/**
 * SSE message structure
 */
export interface SSEMessage {
  event?: SSEEventType | string
  data: any
  id?: string
  retry?: number
}

/**
 * Token event data
 */
export interface TokenEvent {
  token: string
  index?: number
}

/**
 * Usage event data
 */
export interface UsageEvent {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost?: number
}

/**
 * Error event data
 */
export interface ErrorEvent {
  error: string
  code?: string
  details?: any
}

/**
 * Metadata event data
 */
export interface MetadataEvent {
  [key: string]: any
}

/**
 * Request parsing options
 */
export interface RequestParseOptions {
  /** Maximum body size in bytes */
  maxBodySize?: number
  /** Allowed content types */
  allowedContentTypes?: string[]
}

/**
 * Response formatting options
 */
export interface ResponseFormatOptions {
  /** Status code */
  status?: number
  /** Response headers */
  headers?: Record<string, string>
  /** Pretty print JSON */
  pretty?: boolean
}
