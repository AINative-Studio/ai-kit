/**
 * Rate Limiter for AI Kit
 * Implements multiple rate limiting algorithms with flexible storage backends
 */

import type {
  RateLimiterConfig,
  RateLimitCheckOptions,
  RateLimitResult,
  RateLimitStorage,
  RateLimitRule,
  RequestCost,
  RateLimiterStats,
} from './types';
import {
  RateLimitAlgorithm,
  RateLimitScope,
  RateLimitAction,
  StorageBackend,
} from './types';

/**
 * In-memory storage implementation
 */
class MemoryStorage implements RateLimitStorage {
  private store: Map<string, { value: any; expiry?: number }> = new Map();
  private lists: Map<string, any[]> = new Map();

  async get(key: string): Promise<any> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl : undefined;
    this.store.set(key, { value, expiry });
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = (await this.get(key)) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.lists.delete(key);
  }

  async mget(keys: string[]): Promise<any[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async mset(entries: Array<[string, any]>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  async lpush(key: string, value: any): Promise<number> {
    const list = this.lists.get(key) || [];
    list.unshift(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    const list = this.lists.get(key) || [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async lrem(key: string, count: number, value: any): Promise<number> {
    const list = this.lists.get(key) || [];
    let removed = 0;
    const newList = list.filter((item) => {
      if (removed < Math.abs(count) && item === value) {
        removed++;
        return false;
      }
      return true;
    });
    this.lists.set(key, newList);
    return removed;
  }

  async llen(key: string): Promise<number> {
    const list = this.lists.get(key) || [];
    return list.length;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiry = Date.now() + ttl;
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis storage implementation (optional)
 */
class RedisStorage implements RateLimitStorage {
  // @ts-ignore - Reserved for future Redis client implementation
  // @ts-ignore - Reserved for future Redis client
  private _client: any;

  // @ts-ignore - Stub implementation parameter intentionally unused
  constructor(_options: { host: string; port: number; password?: string; db?: number }) {
    // This would be implemented with an actual Redis client
    // For now, we'll throw an error to indicate Redis support needs to be added
    throw new Error(
      'Redis storage backend not yet implemented. Please use MEMORY backend or contribute Redis support.'
    );
  }

  // @ts-ignore - Stub implementation parameter intentionally unused
  async get(_key: string): Promise<any> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async set(_key: string, _value: any, _ttl?: number): Promise<void> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async increment(_key: string, _amount?: number): Promise<number> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameter intentionally unused
  async delete(_key: string): Promise<void> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameter intentionally unused
  async mget(_keys: string[]): Promise<any[]> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async mset(_entries: Array<[string, any]>, _ttl?: number): Promise<void> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async lpush(_key: string, _value: any): Promise<number> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async lrange(_key: string, _start: number, _stop: number): Promise<any[]> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async lrem(_key: string, _count: number, _value: any): Promise<number> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameter intentionally unused
  async llen(_key: string): Promise<number> {
    throw new Error('Not implemented');
  }

  // @ts-ignore - Stub implementation parameters intentionally unused
  async expire(_key: string, _ttl: number): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * Main RateLimiter class
 */
export class RateLimiter {
  private storage: RateLimitStorage;
  private config: RateLimiterConfig;
  private keyPrefix: string;
  private stats: RateLimiterStats;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.keyPrefix = config.keyPrefix || 'ratelimit';

    // Initialize storage backend
    if (config.storage === StorageBackend.REDIS) {
      if (!config.redis) {
        throw new Error('Redis configuration required when using Redis backend');
      }
      this.storage = new RedisStorage(config.redis);
    } else {
      this.storage = new MemoryStorage();
      // Setup cleanup for memory storage
      this.cleanupInterval = setInterval(() => {
        if (this.storage instanceof MemoryStorage) {
          this.storage.cleanup();
        }
      }, 60000); // Cleanup every minute
    }

    // Initialize stats
    this.stats = {
      totalRequests: 0,
      allowed: 0,
      blocked: 0,
      queued: 0,
    };
  }

  /**
   * Check if a request should be allowed
   */
  async check(options: RateLimitCheckOptions): Promise<RateLimitResult> {
    this.stats.totalRequests++;

    const rules = this.config.rules[options.scope] || [];
    if (rules.length === 0) {
      // No rules, allow by default
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        resetAt: 0,
      };
    }

    // Check all rules and return the most restrictive result
    const results = await Promise.all(
      rules.map((rule) => this.checkRule(options, rule))
    );

    // Find the most restrictive result (first one that blocks)
    const blockedResult = results.find((r) => !r.allowed);
    if (blockedResult) {
      this.stats.blocked++;
      return blockedResult;
    }

    // All rules passed, return the most restrictive allowed result
    this.stats.allowed++;
    const mostRestrictive = results.reduce((min, curr) =>
      curr.remaining < min.remaining ? curr : min
    );
    return mostRestrictive;
  }

  /**
   * Check a single rule
   */
  private async checkRule(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    switch (rule.algorithm) {
      case RateLimitAlgorithm.TOKEN_BUCKET:
        return this.checkTokenBucket(options, rule);
      case RateLimitAlgorithm.FIXED_WINDOW:
        return this.checkFixedWindow(options, rule);
      case RateLimitAlgorithm.SLIDING_WINDOW:
        return this.checkSlidingWindow(options, rule);
      case RateLimitAlgorithm.LEAKY_BUCKET:
        return this.checkLeakyBucket(options, rule);
      case RateLimitAlgorithm.COST_BASED:
        return this.checkCostBased(options, rule);
      default:
        throw new Error(`Unknown algorithm: ${rule.algorithm}`);
    }
  }

  /**
   * Token bucket algorithm
   * Allows bursts up to bucket capacity, refills at a steady rate
   */
  private async checkTokenBucket(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const key = this.getKey(options.scope, options.identifier, 'token_bucket');
    const tokens = options.tokens || 1;
    const capacity = rule.burst || rule.limit;
    const refillRate = rule.refillRate || rule.limit / (rule.window / 1000);

    // Get current bucket state
    const bucketData = await this.storage.get(key);
    const now = Date.now();

    let currentTokens: number;
    let lastRefill: number;

    if (!bucketData) {
      currentTokens = capacity;
      lastRefill = now;
    } else {
      const { tokens: storedTokens, lastRefill: storedLastRefill } = JSON.parse(bucketData);
      const timePassed = (now - storedLastRefill) / 1000;
      const tokensToAdd = timePassed * refillRate;
      currentTokens = Math.min(capacity, storedTokens + tokensToAdd);
      lastRefill = now;
    }

    if (currentTokens >= tokens) {
      // Allow request
      const newTokens = currentTokens - tokens;
      await this.storage.set(
        key,
        JSON.stringify({ tokens: newTokens, lastRefill }),
        rule.window
      );

      return {
        allowed: true,
        limit: capacity,
        remaining: Math.floor(newTokens),
        resetAt: now + (capacity - newTokens) / refillRate * 1000,
      };
    } else {
      // Reject request
      const retryAfter = ((tokens - currentTokens) / refillRate) * 1000;
      return {
        allowed: false,
        limit: capacity,
        remaining: Math.floor(currentTokens),
        resetAt: now + retryAfter,
        retryAfter: Math.ceil(retryAfter),
        action: rule.action || RateLimitAction.REJECT,
      };
    }
  }

  /**
   * Fixed window counter
   * Simple time-based windows with reset at window boundaries
   */
  private async checkFixedWindow(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / rule.window) * rule.window;
    const windowEnd = windowStart + rule.window;
    const key = this.getKey(options.scope, options.identifier, `fixed_${windowStart}`);

    const current = (await this.storage.get(key)) || 0;

    if (current < rule.limit) {
      // Allow request
      const newCount = await this.storage.increment(key);
      await this.storage.expire(key, rule.window);

      return {
        allowed: true,
        limit: rule.limit,
        remaining: rule.limit - newCount,
        resetAt: windowEnd,
        totalRequests: newCount,
      };
    } else {
      // Reject request
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter: windowEnd - now,
        totalRequests: current,
        action: rule.action || RateLimitAction.REJECT,
      };
    }
  }

  /**
   * Sliding window log
   * Maintains a log of timestamps for precise rate limiting
   */
  private async checkSlidingWindow(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const key = this.getKey(options.scope, options.identifier, 'sliding_window');
    const now = Date.now();
    const windowStart = now - rule.window;

    // Get all timestamps in the current window
    const timestamps = await this.storage.lrange(key, 0, -1);

    // Filter out old timestamps
    const validTimestamps = timestamps.filter((ts: number) => ts > windowStart);

    if (validTimestamps.length < rule.limit) {
      // Allow request
      await this.storage.lpush(key, now);
      await this.storage.expire(key, rule.window);

      // Clean up old entries periodically
      if (timestamps.length > rule.limit * 2) {
        for (const ts of timestamps) {
          if (ts <= windowStart) {
            await this.storage.lrem(key, 1, ts);
          }
        }
      }

      const oldestTimestamp = validTimestamps.length > 0
        ? Math.min(...validTimestamps)
        : now;

      return {
        allowed: true,
        limit: rule.limit,
        remaining: rule.limit - validTimestamps.length - 1,
        resetAt: oldestTimestamp + rule.window,
        totalRequests: validTimestamps.length + 1,
      };
    } else {
      // Reject request
      const oldestTimestamp = Math.min(...validTimestamps);
      const retryAfter = oldestTimestamp + rule.window - now;

      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        resetAt: oldestTimestamp + rule.window,
        retryAfter: Math.ceil(retryAfter),
        totalRequests: validTimestamps.length,
        action: rule.action || RateLimitAction.REJECT,
      };
    }
  }

  /**
   * Leaky bucket algorithm
   * Processes requests at a constant rate
   */
  private async checkLeakyBucket(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const key = this.getKey(options.scope, options.identifier, 'leaky_bucket');
    const now = Date.now();
    const capacity = rule.limit;
    const leakRate = rule.refillRate || rule.limit / (rule.window / 1000);

    // Get current bucket state
    const bucketData = await this.storage.get(key);

    let currentLevel: number;
    let lastLeak: number;

    if (!bucketData) {
      currentLevel = 0;
      lastLeak = now;
    } else {
      const { level, lastLeak: storedLastLeak } = JSON.parse(bucketData);
      const timePassed = (now - storedLastLeak) / 1000;
      const leaked = timePassed * leakRate;
      currentLevel = Math.max(0, level - leaked);
      lastLeak = now;
    }

    if (currentLevel < capacity) {
      // Allow request
      const newLevel = currentLevel + 1;
      await this.storage.set(
        key,
        JSON.stringify({ level: newLevel, lastLeak }),
        rule.window
      );

      return {
        allowed: true,
        limit: capacity,
        remaining: Math.floor(capacity - newLevel),
        resetAt: now + (newLevel / leakRate) * 1000,
      };
    } else {
      // Reject request
      const retryAfter = ((currentLevel - capacity + 1) / leakRate) * 1000;
      return {
        allowed: false,
        limit: capacity,
        remaining: 0,
        resetAt: now + (currentLevel / leakRate) * 1000,
        retryAfter: Math.ceil(retryAfter),
        action: rule.action || RateLimitAction.REJECT,
      };
    }
  }

  /**
   * Cost-based rate limiting
   * Tracks usage by cost (tokens, dollars, etc.)
   */
  private async checkCostBased(
    options: RateLimitCheckOptions,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const key = this.getKey(options.scope, options.identifier, 'cost_based');
    const now = Date.now();
    const windowStart = Math.floor(now / rule.window) * rule.window;
    const windowEnd = windowStart + rule.window;

    // Calculate cost of this request
    const cost = this.calculateCost(options.cost, rule.costPerRequest);

    const currentCost = (await this.storage.get(key)) || 0;

    if (currentCost + cost <= rule.limit) {
      // Allow request
      const newCost = currentCost + cost;
      await this.storage.set(key, newCost, rule.window);

      return {
        allowed: true,
        limit: rule.limit,
        remaining: rule.limit - newCost,
        resetAt: windowEnd,
        costConsumed: newCost,
        metadata: options.cost,
      };
    } else {
      // Reject request
      return {
        allowed: false,
        limit: rule.limit,
        remaining: rule.limit - currentCost,
        resetAt: windowEnd,
        retryAfter: windowEnd - now,
        costConsumed: currentCost,
        metadata: options.cost,
        action: rule.action || RateLimitAction.REJECT,
      };
    }
  }

  /**
   * Calculate cost from RequestCost object
   */
  private calculateCost(requestCost?: RequestCost, costPerRequest: number = 1): number {
    if (!requestCost) return costPerRequest;

    // Prioritize custom cost, then monetary cost, then token count
    if (requestCost.customCost !== undefined) return requestCost.customCost;
    if (requestCost.cost !== undefined) return requestCost.cost;
    if (requestCost.totalTokens !== undefined) return requestCost.totalTokens;
    if (requestCost.inputTokens !== undefined && requestCost.outputTokens !== undefined) {
      return requestCost.inputTokens + requestCost.outputTokens;
    }

    return costPerRequest;
  }

  /**
   * Generate storage key
   */
  private getKey(scope: RateLimitScope, identifier: string, suffix: string): string {
    return `${this.keyPrefix}:${scope}:${identifier}:${suffix}`;
  }

  /**
   * Reset rate limits for an identifier
   */
  async reset(scope: RateLimitScope, identifier: string): Promise<void> {
    const patterns = [
      'token_bucket',
      'fixed_*',
      'sliding_window',
      'leaky_bucket',
      'cost_based',
    ];

    for (const pattern of patterns) {
      const key = this.getKey(scope, identifier, pattern);
      await this.storage.delete(key);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): RateLimiterStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      allowed: 0,
      blocked: 0,
      queued: 0,
    };
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Get remaining limit for an identifier
   */
  async getRemaining(
    scope: RateLimitScope,
    identifier: string,
    algorithm: RateLimitAlgorithm = RateLimitAlgorithm.FIXED_WINDOW
  ): Promise<number> {
    const rules = this.config.rules[scope] || [];
    const rule = rules.find((r) => r.algorithm === algorithm);

    if (!rule) return Infinity;

    const result = await this.checkRule({ identifier, scope }, rule);
    return result.remaining;
  }
}

// Export for convenience
export * from './types';
