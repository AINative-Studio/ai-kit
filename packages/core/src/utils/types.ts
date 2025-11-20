/**
 * Rate limiting types and interfaces for AI Kit
 */

/**
 * Supported rate limiting algorithms
 */
export enum RateLimitAlgorithm {
  /** Token bucket algorithm - smooth rate limiting with burst capacity */
  TOKEN_BUCKET = 'token_bucket',
  /** Fixed window counter - simple time-based windows */
  FIXED_WINDOW = 'fixed_window',
  /** Sliding window log - precise rate limiting with historical tracking */
  SLIDING_WINDOW = 'sliding_window',
  /** Leaky bucket - consistent output rate */
  LEAKY_BUCKET = 'leaky_bucket',
  /** Cost-based limiting - track usage by cost (tokens, dollars) */
  COST_BASED = 'cost_based',
}

/**
 * Time window options for rate limiting
 */
export enum TimeWindow {
  SECOND = 1000,
  MINUTE = 60000,
  HOUR = 3600000,
  DAY = 86400000,
}

/**
 * Storage backend types
 */
export enum StorageBackend {
  MEMORY = 'memory',
  REDIS = 'redis',
}

/**
 * Rate limit scope types
 */
export enum RateLimitScope {
  USER = 'user',
  IP = 'ip',
  GLOBAL = 'global',
  API_KEY = 'api_key',
}

/**
 * Actions to take when rate limit is exceeded
 */
export enum RateLimitAction {
  /** Reject the request */
  REJECT = 'reject',
  /** Queue the request */
  QUEUE = 'queue',
  /** Allow with warning */
  WARN = 'warn',
}

/**
 * Configuration for a rate limit rule
 */
export interface RateLimitRule {
  /** Algorithm to use */
  algorithm: RateLimitAlgorithm;
  /** Maximum requests/tokens allowed */
  limit: number;
  /** Time window in milliseconds */
  window: TimeWindow | number;
  /** Burst capacity (for token bucket) */
  burst?: number;
  /** Refill rate (tokens per second for leaky bucket) */
  refillRate?: number;
  /** Cost per request (for cost-based limiting) */
  costPerRequest?: number;
  /** Action to take when limit exceeded */
  action?: RateLimitAction;
}

/**
 * Configuration for the rate limiter
 */
export interface RateLimiterConfig {
  /** Storage backend to use */
  storage?: StorageBackend;
  /** Redis connection options (if using Redis backend) */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  /** Rate limit rules by scope */
  rules: {
    [key in RateLimitScope]?: RateLimitRule[];
  };
  /** Key prefix for storage */
  keyPrefix?: string;
  /** Enable detailed logging */
  debug?: boolean;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current limit for this scope */
  limit: number;
  /** Remaining requests/tokens */
  remaining: number;
  /** Time until reset (milliseconds) */
  resetAt: number;
  /** Retry after (milliseconds) - only set when not allowed */
  retryAfter?: number;
  /** Total requests made in current window */
  totalRequests?: number;
  /** Cost consumed (for cost-based limiting) */
  costConsumed?: number;
  /** Action taken */
  action?: RateLimitAction;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Cost information for a request
 */
export interface RequestCost {
  /** Input tokens used */
  inputTokens?: number;
  /** Output tokens used */
  outputTokens?: number;
  /** Total tokens used */
  totalTokens?: number;
  /** Monetary cost in dollars */
  cost?: number;
  /** Custom cost metric */
  customCost?: number;
}

/**
 * Internal storage interface for rate limit data
 */
export interface RateLimitStorage {
  /** Get value for a key */
  get(key: string): Promise<any>;
  /** Set value for a key with optional TTL */
  set(key: string, value: any, ttl?: number): Promise<void>;
  /** Increment a counter */
  increment(key: string, amount?: number): Promise<number>;
  /** Delete a key */
  delete(key: string): Promise<void>;
  /** Get multiple keys */
  mget(keys: string[]): Promise<any[]>;
  /** Set multiple keys */
  mset(entries: Array<[string, any]>, ttl?: number): Promise<void>;
  /** Add to a list */
  lpush(key: string, value: any): Promise<number>;
  /** Get list range */
  lrange(key: string, start: number, stop: number): Promise<any[]>;
  /** Remove list items */
  lrem(key: string, count: number, value: any): Promise<number>;
  /** Get list length */
  llen(key: string): Promise<number>;
  /** Set expiry on a key */
  expire(key: string, ttl: number): Promise<void>;
}

/**
 * Rate limit check options
 */
export interface RateLimitCheckOptions {
  /** Identifier for the entity (user ID, IP, etc.) */
  identifier: string;
  /** Scope of the rate limit */
  scope: RateLimitScope;
  /** Cost of this request (for cost-based limiting) */
  cost?: RequestCost;
  /** Number of tokens to consume (for token bucket) */
  tokens?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Rate limiter statistics
 */
export interface RateLimiterStats {
  /** Total requests processed */
  totalRequests: number;
  /** Requests allowed */
  allowed: number;
  /** Requests blocked */
  blocked: number;
  /** Requests queued */
  queued: number;
  /** Average response time */
  avgResponseTime?: number;
  /** Top limited identifiers */
  topLimited?: Array<{ identifier: string; count: number }>;
}
