import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withRateLimit,
  withTieredRateLimit,
} from '../../src/middleware/withRateLimit';
import { MemoryRateLimitStore } from '../../src/middleware/types';

describe('withRateLimit', () => {
  const createRequest = (
    pathname: string = '/',
    headers?: Record<string, string>
  ): NextRequest => {
    const request = new NextRequest(new URL(pathname, 'http://localhost:3000'));
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within rate limit', async () => {
    const middleware = withRateLimit({
      limit: 10,
      window: 60000,
    });

    const request = createRequest();
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it('should block requests exceeding rate limit', async () => {
    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 2,
      window: 60000,
      store,
    });

    const request = createRequest();

    // First request - OK
    const response1 = await middleware(request);
    expect(response1.status).toBe(200);
    expect(response1.headers.get('X-RateLimit-Remaining')).toBe('1');

    // Second request - OK
    const response2 = await middleware(request);
    expect(response2.status).toBe(200);
    expect(response2.headers.get('X-RateLimit-Remaining')).toBe('0');

    // Third request - Rate limited
    const response3 = await middleware(request);
    expect(response3.status).toBe(429);
    expect(response3.headers.has('Retry-After')).toBe(true);

    const body = await response3.json();
    expect(body.error).toBe('Too Many Requests');
  });

  it('should use custom key generator', async () => {
    const keyGenerator = vi.fn((req: NextRequest) => {
      return req.headers.get('x-api-key') || 'anonymous';
    });

    const middleware = withRateLimit({
      limit: 2,
      window: 60000,
      keyGenerator,
    });

    const request1 = createRequest('/', { 'x-api-key': 'key1' });
    await middleware(request1);

    const request2 = createRequest('/', { 'x-api-key': 'key2' });
    await middleware(request2);

    expect(keyGenerator).toHaveBeenCalledTimes(2);
  });

  it('should use custom error handler when limit exceeded', async () => {
    const onLimitExceeded = vi.fn(() => {
      return new NextResponse('Custom rate limit error', { status: 429 });
    });

    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
      onLimitExceeded,
    });

    const request = createRequest();

    await middleware(request);
    const response = await middleware(request);

    expect(onLimitExceeded).toHaveBeenCalled();
    expect(response.status).toBe(429);
  });

  it('should exclude specified paths', async () => {
    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
      exclude: ['/health', '/metrics'],
    });

    const healthRequest = createRequest('/health');
    const response1 = await middleware(healthRequest);
    const response2 = await middleware(healthRequest);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.headers.has('X-RateLimit-Limit')).toBe(false);
  });

  it('should support wildcard path exclusions', async () => {
    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
      exclude: ['/public/*'],
    });

    const request = createRequest('/public/image.png');
    const response1 = await middleware(request);
    const response2 = await middleware(request);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it('should skip rate limiting based on custom logic', async () => {
    const skip = vi.fn((req: NextRequest) => {
      return req.headers.get('x-bypass') === 'secret';
    });

    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
      skip,
    });

    const request = createRequest('/', { 'x-bypass': 'secret' });
    const response1 = await middleware(request);
    const response2 = await middleware(request);

    expect(skip).toHaveBeenCalled();
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it('should reset count after window expires', async () => {
    const store = new MemoryRateLimitStore(100); // 100ms window

    const middleware = withRateLimit({
      limit: 1,
      window: 100,
      store,
    });

    const request = createRequest();

    // First request - OK
    const response1 = await middleware(request);
    expect(response1.status).toBe(200);

    // Second request - Rate limited
    const response2 = await middleware(request);
    expect(response2.status).toBe(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Third request after reset - OK
    const response3 = await middleware(request);
    expect(response3.status).toBe(200);
  });

  it('should handle different IPs separately', async () => {
    const store = new MemoryRateLimitStore(60000);
    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
    });

    const request1 = createRequest('/', { 'x-forwarded-for': '1.1.1.1' });
    const request2 = createRequest('/', { 'x-forwarded-for': '2.2.2.2' });

    const response1 = await middleware(request1);
    const response2 = await middleware(request2);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it('should fail open on store errors', async () => {
    const store = {
      increment: vi.fn(async () => {
        throw new Error('Store error');
      }),
      reset: vi.fn(),
      get: vi.fn(),
    };

    const middleware = withRateLimit({
      limit: 1,
      window: 60000,
      store,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = createRequest();
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('withTieredRateLimit', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should apply different rate limits to different paths', async () => {
    const middleware = withTieredRateLimit([
      {
        paths: ['/api/public/*'],
        limit: 10,
        window: 60000,
      },
      {
        paths: ['/api/premium/*'],
        limit: 100,
        window: 60000,
      },
    ]);

    const publicRequest = createRequest('/api/public/data');
    const publicResponse = await middleware(publicRequest);

    expect(publicResponse.headers.get('X-RateLimit-Limit')).toBe('10');

    const premiumRequest = createRequest('/api/premium/data');
    const premiumResponse = await middleware(premiumRequest);

    expect(premiumResponse.headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('should use matcher function for tier selection', async () => {
    const middleware = withTieredRateLimit([
      {
        matcher: (req) => req.headers.get('x-tier') === 'premium',
        limit: 100,
        window: 60000,
      },
      {
        matcher: (req) => req.headers.get('x-tier') === 'free',
        limit: 10,
        window: 60000,
      },
    ]);

    const premiumRequest = new NextRequest(
      new URL('/api/data', 'http://localhost:3000')
    );
    premiumRequest.headers.set('x-tier', 'premium');
    const premiumResponse = await middleware(premiumRequest);

    expect(premiumResponse.headers.get('X-RateLimit-Limit')).toBe('100');

    const freeRequest = new NextRequest(
      new URL('/api/data', 'http://localhost:3000')
    );
    freeRequest.headers.set('x-tier', 'free');
    const freeResponse = await middleware(freeRequest);

    expect(freeResponse.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('should allow requests that do not match any tier', async () => {
    const middleware = withTieredRateLimit([
      {
        paths: ['/api/*'],
        limit: 10,
        window: 60000,
      },
    ]);

    const request = createRequest('/other');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.has('X-RateLimit-Limit')).toBe(false);
  });
});

describe('MemoryRateLimitStore', () => {
  it('should increment count within window', async () => {
    const store = new MemoryRateLimitStore(60000);

    const result1 = await store.increment('test-key');
    expect(result1.count).toBe(1);

    const result2 = await store.increment('test-key');
    expect(result2.count).toBe(2);
  });

  it('should reset count after window expires', async () => {
    const store = new MemoryRateLimitStore(100);

    const result1 = await store.increment('test-key');
    expect(result1.count).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result2 = await store.increment('test-key');
    expect(result2.count).toBe(1);
  });

  it('should handle multiple keys separately', async () => {
    const store = new MemoryRateLimitStore(60000);

    const result1 = await store.increment('key1');
    const result2 = await store.increment('key2');

    expect(result1.count).toBe(1);
    expect(result2.count).toBe(1);
  });

  it('should get current count', async () => {
    const store = new MemoryRateLimitStore(60000);

    await store.increment('test-key');
    await store.increment('test-key');

    const result = await store.get('test-key');
    expect(result?.count).toBe(2);
  });

  it('should return null for non-existent key', async () => {
    const store = new MemoryRateLimitStore(60000);

    const result = await store.get('non-existent');
    expect(result).toBeNull();
  });

  it('should return null for expired key', async () => {
    const store = new MemoryRateLimitStore(100);

    await store.increment('test-key');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = await store.get('test-key');
    expect(result).toBeNull();
  });

  it('should reset count', async () => {
    const store = new MemoryRateLimitStore(60000);

    await store.increment('test-key');
    await store.reset('test-key');

    const result = await store.get('test-key');
    expect(result).toBeNull();
  });
});
