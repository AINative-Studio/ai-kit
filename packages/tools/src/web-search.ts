/**
 * Web Search Tool for AI Kit
 *
 * Provides web search capabilities using Brave Search API (recommended)
 * with fallback support for other search providers.
 *
 * Features:
 * - Structured search results (title, snippet, URL)
 * - Rate limiting with token bucket algorithm
 * - Comprehensive error handling
 * - Type-safe with Zod schemas
 * - Multiple search provider support
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tool definition interface - matches ai-kit-core agent types
 */
export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  parameters: z.ZodObject<any> | z.ZodType<any>;
  execute: (params: TParams) => Promise<TResult>;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Individual search result
 */
export interface SearchResult {
  /**
   * Title of the search result
   */
  title: string;

  /**
   * URL of the search result
   */
  url: string;

  /**
   * Text snippet/description from the page
   */
  snippet: string;

  /**
   * Optional thumbnail image URL
   */
  thumbnail?: string;

  /**
   * Optional publication/last modified date
   */
  publishedDate?: string;

  /**
   * Optional relevance score (0-1)
   */
  score?: number;
}

/**
 * Web search response
 */
export interface WebSearchResponse {
  /**
   * Search query that was executed
   */
  query: string;

  /**
   * Array of search results
   */
  results: SearchResult[];

  /**
   * Total number of results available
   */
  totalResults?: number;

  /**
   * Search provider used
   */
  provider: string;

  /**
   * Metadata about the search
   */
  metadata: {
    /**
     * Time taken for the search in milliseconds
     */
    durationMs: number;

    /**
     * Timestamp of the search
     */
    timestamp: string;

    /**
     * Whether results were cached
     */
    cached?: boolean;

    /**
     * Rate limit information
     */
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

/**
 * Configuration for web search
 */
export interface WebSearchConfig {
  /**
   * Search provider to use
   */
  provider: 'brave' | 'google' | 'bing';

  /**
   * API key for the search provider
   */
  apiKey: string;

  /**
   * Maximum number of results to return (default: 10)
   */
  maxResults?: number;

  /**
   * Rate limit configuration
   */
  rateLimit?: {
    /**
     * Maximum requests per minute (default: 60)
     */
    requestsPerMinute?: number;

    /**
     * Maximum requests per day (default: 1000)
     */
    requestsPerDay?: number;
  };

  /**
   * Timeout in milliseconds (default: 10000)
   */
  timeoutMs?: number;

  /**
   * Custom endpoint URL (for testing or custom providers)
   */
  endpoint?: string;
}

/**
 * Brave Search API response types
 */
interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  thumbnail?: {
    src: string;
  };
  age?: string;
  page_age?: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[];
  };
  query?: {
    original: string;
  };
}

// ============================================================================
// Error Classes
// ============================================================================

export class WebSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'WebSearchError';
  }
}

export class RateLimitError extends WebSearchError {
  constructor(
    message: string,
    provider: string,
    public resetAt: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider, 429, true);
    this.name = 'RateLimitError';
  }
}

export class InvalidAPIKeyError extends WebSearchError {
  constructor(provider: string) {
    super(
      `Invalid API key for ${provider}`,
      'INVALID_API_KEY',
      provider,
      401,
      false
    );
    this.name = 'InvalidAPIKeyError';
  }
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

/**
 * Token bucket rate limiter
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private dailyCount: number;
  private dailyResetTime: number;

  constructor(
    private requestsPerMinute: number,
    private requestsPerDay: number
  ) {
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.dailyCount = 0;
    this.dailyResetTime = this.getNextMidnight();
  }

  private getNextMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Attempt to consume a token
   * @returns true if allowed, false if rate limited
   */
  tryConsume(): { allowed: boolean; resetAt?: number } {
    const now = Date.now();

    // Reset daily counter if needed
    if (now >= this.dailyResetTime) {
      this.dailyCount = 0;
      this.dailyResetTime = this.getNextMidnight();
    }

    // Check daily limit
    if (this.dailyCount >= this.requestsPerDay) {
      return {
        allowed: false,
        resetAt: this.dailyResetTime,
      };
    }

    // Refill tokens based on time passed
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 60000) * this.requestsPerMinute;
    this.tokens = Math.min(this.requestsPerMinute, this.tokens + tokensToAdd);
    this.lastRefill = now;

    // Check if we have tokens available
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.dailyCount += 1;
      return { allowed: true };
    }

    // Calculate when next token will be available
    const timeUntilNextToken = (1 - this.tokens) * (60000 / this.requestsPerMinute);
    return {
      allowed: false,
      resetAt: now + timeUntilNextToken,
    };
  }

  getRemainingTokens(): number {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 60000) * this.requestsPerMinute;
    return Math.min(this.requestsPerMinute, this.tokens + tokensToAdd);
  }
}

// ============================================================================
// Web Search Client
// ============================================================================

export class WebSearchClient {
  private rateLimiter: RateLimiter;
  private requestCount = 0;

  constructor(private config: WebSearchConfig) {
    const requestsPerMinute = config.rateLimit?.requestsPerMinute || 60;
    const requestsPerDay = config.rateLimit?.requestsPerDay || 1000;
    this.rateLimiter = new RateLimiter(requestsPerMinute, requestsPerDay);
  }

  /**
   * Perform a web search
   */
  async search(query: string, options?: { maxResults?: number }): Promise<WebSearchResponse> {
    const startTime = Date.now();

    // Check rate limit
    const rateLimitCheck = this.rateLimiter.tryConsume();
    if (!rateLimitCheck.allowed) {
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        this.config.provider,
        rateLimitCheck.resetAt!
      );
    }

    const maxResults = options?.maxResults || this.config.maxResults || 10;

    try {
      let results: SearchResult[];
      let totalResults: number | undefined;

      switch (this.config.provider) {
        case 'brave':
          ({ results, totalResults } = await this.searchBrave(query, maxResults));
          break;
        case 'google':
          throw new WebSearchError(
            'Google Search provider not yet implemented',
            'NOT_IMPLEMENTED',
            'google'
          );
        case 'bing':
          throw new WebSearchError(
            'Bing Search provider not yet implemented',
            'NOT_IMPLEMENTED',
            'bing'
          );
        default:
          throw new WebSearchError(
            `Unknown search provider: ${this.config.provider}`,
            'UNKNOWN_PROVIDER',
            this.config.provider
          );
      }

      const durationMs = Date.now() - startTime;
      this.requestCount++;

      return {
        query,
        results,
        totalResults,
        provider: this.config.provider,
        metadata: {
          durationMs,
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: Math.floor(this.rateLimiter.getRemainingTokens()),
            reset: Date.now() + 60000,
          },
        },
      };
    } catch (error) {
      if (error instanceof WebSearchError) {
        throw error;
      }

      throw new WebSearchError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_FAILED',
        this.config.provider,
        undefined,
        true
      );
    }
  }

  /**
   * Search using Brave Search API
   */
  private async searchBrave(query: string, maxResults: number): Promise<{
    results: SearchResult[];
    totalResults?: number;
  }> {
    const endpoint = this.config.endpoint || 'https://api.search.brave.com/res/v1/web/search';
    const url = new URL(endpoint);
    url.searchParams.set('q', query);
    url.searchParams.set('count', Math.min(maxResults, 20).toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 10000);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.config.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new InvalidAPIKeyError('brave');
        }

        if (response.status === 429) {
          const resetHeader = response.headers.get('X-RateLimit-Reset');
          const resetAt = resetHeader ? parseInt(resetHeader) * 1000 : Date.now() + 60000;
          throw new RateLimitError(
            'Brave API rate limit exceeded',
            'brave',
            resetAt
          );
        }

        throw new WebSearchError(
          `Brave API error: ${response.statusText}`,
          'API_ERROR',
          'brave',
          response.status,
          response.status >= 500
        );
      }

      const data: BraveSearchResponse = await response.json();

      if (!data.web?.results || data.web.results.length === 0) {
        return { results: [] };
      }

      const results: SearchResult[] = data.web.results.slice(0, maxResults).map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.description,
        thumbnail: item.thumbnail?.src,
        publishedDate: item.age || item.page_age,
      }));

      return { results };
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof WebSearchError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new WebSearchError(
          'Search request timed out',
          'TIMEOUT',
          'brave',
          undefined,
          true
        );
      }

      throw error;
    }
  }

  /**
   * Get current request count
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request count (useful for testing)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Zod schema for web search parameters
 */
export const webSearchParametersSchema = z.object({
  query: z.string().min(1).max(500).describe('The search query'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Maximum number of results to return (default: 10)'),
});

export type WebSearchParams = z.infer<typeof webSearchParametersSchema>;

/**
 * Create a web search tool
 */
export function createWebSearchTool(config: WebSearchConfig): any { // ToolDefinition<WebSearchParams, WebSearchResponse> {
  const client = new WebSearchClient(config);

  return {
    name: 'web_search',
    description: `Search the web for information using ${config.provider} search API. Returns structured results with titles, URLs, and snippets. Use this when you need current information from the internet.`,
    parameters: webSearchParametersSchema,
    execute: async (params: WebSearchParams) => {
      return await client.search(params.query, {
        maxResults: params.maxResults,
      });
    },
    retry: {
      maxAttempts: 3,
      backoffMs: 1000,
    },
    timeoutMs: config.timeoutMs || 10000,
    metadata: {
      category: 'search',
      provider: config.provider,
      version: '1.0.0',
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  webSearchParametersSchema as schema,
};
export type { WebSearchParams as Params };
export type { WebSearchResponse as Result };
