import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWebSearchTool,
  WebSearchClient,
  WebSearchConfig,
  WebSearchError,
  RateLimitError,
  InvalidAPIKeyError,
  webSearchParametersSchema,
} from '../src/web-search';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock Brave API response
const createBraveResponse = (results: any[] = []) => ({
  web: {
    results: results.map((r) => ({
      title: r.title || 'Test Title',
      url: r.url || 'https://example.com',
      description: r.description || 'Test description',
      thumbnail: r.thumbnail ? { src: r.thumbnail } : undefined,
      age: r.age,
    })),
  },
  query: {
    original: 'test query',
  },
});

// ============================================================================
// Tests
// ============================================================================

describe('WebSearchClient', () => {
  let config: WebSearchConfig;

  beforeEach(() => {
    config = {
      provider: 'brave',
      apiKey: 'test-api-key',
      maxResults: 10,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1000,
      },
      timeoutMs: 5000,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Search', () => {
    it('should perform a successful search with Brave API', async () => {
      const mockResults = [
        {
          title: 'Result 1',
          url: 'https://example1.com',
          description: 'Description 1',
        },
        {
          title: 'Result 2',
          url: 'https://example2.com',
          description: 'Description 2',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse(mockResults),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      const result = await client.search('test query');

      expect(result.query).toBe('test query');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('Result 1');
      expect(result.results[0].url).toBe('https://example1.com');
      expect(result.results[0].snippet).toBe('Description 1');
      expect(result.provider).toBe('brave');
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should limit results to maxResults parameter', async () => {
      const mockResults = Array.from({ length: 15 }, (_, i) => ({
        title: `Result ${i + 1}`,
        url: `https://example${i + 1}.com`,
        description: `Description ${i + 1}`,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse(mockResults),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      const result = await client.search('test query', { maxResults: 5 });

      expect(result.results).toHaveLength(5);
    });

    it('should include optional fields when available', async () => {
      const mockResults = [
        {
          title: 'Result with extras',
          url: 'https://example.com',
          description: 'Description',
          thumbnail: 'https://example.com/thumb.jpg',
          age: '2 days ago',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse(mockResults),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      const result = await client.search('test query');

      expect(result.results[0].thumbnail).toBe('https://example.com/thumb.jpg');
      expect(result.results[0].publishedDate).toBe('2 days ago');
    });

    it('should return empty results when no results found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      const result = await client.search('nonexistent query');

      expect(result.results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw InvalidAPIKeyError on 401 response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);

      await expect(client.search('test query')).rejects.toThrow(InvalidAPIKeyError);
      await expect(client.search('test query')).rejects.toThrow('Invalid API key for brave');
    });

    it('should throw InvalidAPIKeyError on 403 response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);

      await expect(client.search('test query')).rejects.toThrow(InvalidAPIKeyError);
    });

    it('should throw RateLimitError on 429 response', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 60;
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'X-RateLimit-Reset': resetTime.toString(),
        }),
      });

      const client = new WebSearchClient(config);

      const error = await client.search('test query').catch((e) => e);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Brave API rate limit exceeded');
    });

    it('should throw WebSearchError on 500 server error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);

      const error = await client.search('test query').catch((e) => e);
      expect(error).toBeInstanceOf(WebSearchError);
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should throw timeout error when request takes too long', async () => {
      (global.fetch as any).mockImplementation(
        (_url: string, options: any) => {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve({
                ok: true,
                json: async () => createBraveResponse([]),
                headers: new Headers(),
              });
            }, 10000);

            // Simulate abort
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                clearTimeout(timer);
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                reject(abortError);
              });
            }
          });
        }
      );

      const client = new WebSearchClient({ ...config, timeoutMs: 100 });

      await expect(client.search('test query')).rejects.toThrow('Search request timed out');
    }, 10000);

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const client = new WebSearchClient(config);

      await expect(client.search('test query')).rejects.toThrow('Search failed');
    });

    it('should throw error for unsupported provider', async () => {
      const invalidConfig = { ...config, provider: 'google' as const };
      const client = new WebSearchClient(invalidConfig);

      await expect(client.search('test query')).rejects.toThrow('Google Search provider not yet implemented');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', async () => {
      const limitedConfig = {
        ...config,
        rateLimit: {
          requestsPerMinute: 2,
          requestsPerDay: 10,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(limitedConfig);

      // First two requests should succeed
      await client.search('query 1');
      await client.search('query 2');

      // Third request should fail with rate limit error
      await expect(client.search('query 3')).rejects.toThrow(RateLimitError);
    });

    it('should include rate limit info in response metadata', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      const result = await client.search('test query');

      expect(result.metadata.rateLimit).toBeDefined();
      expect(result.metadata.rateLimit?.remaining).toBeGreaterThanOrEqual(0);
      expect(result.metadata.rateLimit?.reset).toBeGreaterThan(Date.now());
    });

    it('should track request count correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);

      expect(client.getRequestCount()).toBe(0);
      await client.search('query 1');
      expect(client.getRequestCount()).toBe(1);
      await client.search('query 2');
      expect(client.getRequestCount()).toBe(2);
    });

    it('should reset request count when resetRequestCount is called', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);

      await client.search('query 1');
      expect(client.getRequestCount()).toBe(1);

      client.resetRequestCount();
      expect(client.getRequestCount()).toBe(0);
    });
  });

  describe('Custom Endpoint', () => {
    it('should use custom endpoint when provided', async () => {
      const customConfig = {
        ...config,
        endpoint: 'https://custom-api.example.com/search',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(customConfig);
      await client.search('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom-api.example.com/search'),
        expect.any(Object)
      );
    });
  });

  describe('Request Headers', () => {
    it('should include correct headers in API request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createBraveResponse([]),
        headers: new Headers(),
      });

      const client = new WebSearchClient(config);
      await client.search('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': 'test-api-key',
          },
        })
      );
    });
  });
});

describe('createWebSearchTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a valid tool definition', () => {
    const config: WebSearchConfig = {
      provider: 'brave',
      apiKey: 'test-api-key',
    };

    const tool = createWebSearchTool(config);

    expect(tool.name).toBe('web_search');
    expect(tool.description).toContain('Search the web');
    expect(tool.description).toContain('brave');
    expect(tool.parameters).toBe(webSearchParametersSchema);
    expect(tool.execute).toBeInstanceOf(Function);
    expect(tool.retry).toEqual({
      maxAttempts: 3,
      backoffMs: 1000,
    });
    expect(tool.timeoutMs).toBe(10000);
    expect(tool.metadata).toEqual({
      category: 'search',
      provider: 'brave',
      version: '1.0.0',
    });
  });

  it('should execute search when tool is called', async () => {
    const config: WebSearchConfig = {
      provider: 'brave',
      apiKey: 'test-api-key',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => createBraveResponse([
        { title: 'Result', url: 'https://example.com', description: 'Description' },
      ]),
      headers: new Headers(),
    });

    const tool = createWebSearchTool(config);
    const result = await tool.execute({ query: 'test query', maxResults: 10 });

    expect(result.query).toBe('test query');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('Result');
  });

  it('should use custom timeout from config', () => {
    const config: WebSearchConfig = {
      provider: 'brave',
      apiKey: 'test-api-key',
      timeoutMs: 5000,
    };

    const tool = createWebSearchTool(config);

    expect(tool.timeoutMs).toBe(5000);
  });
});

describe('webSearchParametersSchema', () => {
  it('should validate valid parameters', () => {
    const validParams = {
      query: 'test query',
      maxResults: 5,
    };

    const result = webSearchParametersSchema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should use default maxResults when not provided', () => {
    const params = {
      query: 'test query',
    };

    const result = webSearchParametersSchema.parse(params);
    expect(result.maxResults).toBe(10);
  });

  it('should reject empty query', () => {
    const invalidParams = {
      query: '',
    };

    const result = webSearchParametersSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject query longer than 500 characters', () => {
    const invalidParams = {
      query: 'a'.repeat(501),
    };

    const result = webSearchParametersSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject maxResults less than 1', () => {
    const invalidParams = {
      query: 'test query',
      maxResults: 0,
    };

    const result = webSearchParametersSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject maxResults greater than 20', () => {
    const invalidParams = {
      query: 'test query',
      maxResults: 21,
    };

    const result = webSearchParametersSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer maxResults', () => {
    const invalidParams = {
      query: 'test query',
      maxResults: 5.5,
    };

    const result = webSearchParametersSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('Error Classes', () => {
  it('should create WebSearchError with correct properties', () => {
    const error = new WebSearchError('Test error', 'TEST_CODE', 'brave', 500, true);

    expect(error.name).toBe('WebSearchError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.provider).toBe('brave');
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
  });

  it('should create RateLimitError with correct properties', () => {
    const resetAt = Date.now() + 60000;
    const error = new RateLimitError('Rate limited', 'brave', resetAt);

    expect(error.name).toBe('RateLimitError');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.provider).toBe('brave');
    expect(error.statusCode).toBe(429);
    expect(error.retryable).toBe(true);
    expect(error.resetAt).toBe(resetAt);
  });

  it('should create InvalidAPIKeyError with correct properties', () => {
    const error = new InvalidAPIKeyError('brave');

    expect(error.name).toBe('InvalidAPIKeyError');
    expect(error.code).toBe('INVALID_API_KEY');
    expect(error.provider).toBe('brave');
    expect(error.statusCode).toBe(401);
    expect(error.retryable).toBe(false);
  });
});
