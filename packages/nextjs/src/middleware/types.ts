import type { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware function type
 */
export type NextMiddleware = (
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Enhanced middleware with configuration
 */
export type MiddlewareFactory<TConfig = unknown> = (
  config?: TConfig
) => NextMiddleware;

/**
 * Middleware context for passing data between middleware
 */
export interface MiddlewareContext {
  [key: string]: unknown;
}

/**
 * Request with attached context
 */
export interface RequestWithContext extends NextRequest {
  context?: MiddlewareContext;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /**
   * Callback to verify authentication token/session
   */
  verify: (request: NextRequest) => Promise<boolean> | boolean;

  /**
   * Paths to exclude from authentication
   */
  exclude?: string[] | ((pathname: string) => boolean);

  /**
   * Redirect URL for unauthenticated requests
   */
  redirectTo?: string;

  /**
   * Custom error response for unauthenticated requests
   */
  onError?: (request: NextRequest) => NextResponse;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  window: number;

  /**
   * Key generator for identifying clients
   * Default: uses IP address
   */
  keyGenerator?: (request: NextRequest) => string | Promise<string>;

  /**
   * Storage backend for rate limit data
   */
  store?: RateLimitStore;

  /**
   * Custom error response when limit exceeded
   */
  onLimitExceeded?: (request: NextRequest) => NextResponse;

  /**
   * Paths to exclude from rate limiting
   */
  exclude?: string[] | ((pathname: string) => boolean);

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>;
}

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
  /**
   * Increment the count for a key
   * @returns Current count and reset timestamp
   */
  increment(key: string): Promise<RateLimitResult>;

  /**
   * Reset the count for a key
   */
  reset(key: string): Promise<void>;

  /**
   * Get current count for a key
   */
  get(key: string): Promise<RateLimitResult | null>;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Current request count
   */
  count: number;

  /**
   * Timestamp when the count resets (ms)
   */
  resetAt: number;
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private data: Map<string, RateLimitResult> = new Map();
  private window: number;

  constructor(window: number) {
    this.window = window;
  }

  async increment(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.data.get(key);

    if (existing && existing.resetAt > now) {
      // Within window, increment count
      existing.count++;
      return existing;
    }

    // New window
    const result: RateLimitResult = {
      count: 1,
      resetAt: now + this.window,
    };
    this.data.set(key, result);
    return result;
  }

  async reset(key: string): Promise<void> {
    this.data.delete(key);
  }

  async get(key: string): Promise<RateLimitResult | null> {
    const result = this.data.get(key);
    if (!result) return null;

    const now = Date.now();
    if (result.resetAt <= now) {
      this.data.delete(key);
      return null;
    }

    return result;
  }
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /**
   * Log request details
   */
  logRequest?: boolean;

  /**
   * Log response details
   */
  logResponse?: boolean;

  /**
   * Log request body (careful with sensitive data)
   */
  logBody?: boolean;

  /**
   * Log headers
   */
  logHeaders?: boolean;

  /**
   * Custom logger function
   */
  logger?: (info: LogInfo) => void | Promise<void>;

  /**
   * Paths to exclude from logging
   */
  exclude?: string[] | ((pathname: string) => boolean);

  /**
   * Skip logging for certain requests
   */
  skip?: (request: NextRequest) => boolean;
}

/**
 * Log information
 */
export interface LogInfo {
  /**
   * Request method
   */
  method: string;

  /**
   * Request URL
   */
  url: string;

  /**
   * Request pathname
   */
  pathname: string;

  /**
   * Response status code
   */
  status?: number;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Response headers
   */
  responseHeaders?: Record<string, string>;

  /**
   * Request processing time in ms
   */
  duration?: number;

  /**
   * Request timestamp
   */
  timestamp: string;

  /**
   * Client IP
   */
  ip?: string;

  /**
   * User agent
   */
  userAgent?: string;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  /**
   * Allowed origins
   * Use '*' for all origins or provide specific origins
   */
  origin?: string | string[] | ((origin: string) => boolean);

  /**
   * Allowed HTTP methods
   */
  methods?: string[];

  /**
   * Allowed headers
   */
  allowedHeaders?: string[];

  /**
   * Exposed headers
   */
  exposedHeaders?: string[];

  /**
   * Allow credentials
   */
  credentials?: boolean;

  /**
   * Max age for preflight cache (seconds)
   */
  maxAge?: number;

  /**
   * Paths to exclude from CORS
   */
  exclude?: string[] | ((pathname: string) => boolean);
}

/**
 * Composed middleware options
 */
export interface ComposeOptions {
  /**
   * Continue to next middleware even if current throws error
   */
  continueOnError?: boolean;

  /**
   * Error handler for middleware errors
   */
  onError?: (error: Error, request: NextRequest) => NextResponse;
}
