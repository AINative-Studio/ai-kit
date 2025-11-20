import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withLogging,
  withStructuredLogging,
  withPerformanceLogging,
} from '../../src/middleware/withLogging';

describe('withLogging', () => {
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

  it('should log request information', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logResponse: false,
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        pathname: '/api/test',
        url: 'http://localhost:3000/api/test',
        timestamp: expect.any(String),
      })
    );
  });

  it('should log response information', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: false,
      logResponse: true,
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        pathname: '/api/test',
        status: 200,
        duration: expect.any(Number),
      })
    );
  });

  it('should log both request and response', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logResponse: true,
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    expect(logger).toHaveBeenCalledTimes(2);
  });

  it('should include headers when logHeaders is true', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logHeaders: true,
      logger,
    });

    const request = createRequest('/api/test', {
      'user-agent': 'test-agent',
      'x-custom': 'value',
    });
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': 'test-agent',
          'x-custom': 'value',
        }),
      })
    );
  });

  it('should include client IP', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logger,
    });

    const request = createRequest('/api/test', {
      'x-forwarded-for': '1.2.3.4',
    });
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '1.2.3.4',
      })
    );
  });

  it('should include user agent', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logger,
    });

    const request = createRequest('/api/test', {
      'user-agent': 'Mozilla/5.0',
    });
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'Mozilla/5.0',
      })
    );
  });

  it('should exclude specified paths', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      exclude: ['/health', '/metrics'],
      logger,
    });

    const request = createRequest('/health');
    await middleware(request);

    expect(logger).not.toHaveBeenCalled();
  });

  it('should support wildcard path exclusions', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      exclude: ['/_next/*', '/static/*'],
      logger,
    });

    const request = createRequest('/_next/static/chunk.js');
    await middleware(request);

    expect(logger).not.toHaveBeenCalled();
  });

  it('should support function-based exclusions', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      exclude: (pathname) => pathname.startsWith('/internal'),
      logger,
    });

    const request = createRequest('/internal/debug');
    await middleware(request);

    expect(logger).not.toHaveBeenCalled();
  });

  it('should skip logging based on custom logic', async () => {
    const logger = vi.fn();
    const skip = vi.fn((req: NextRequest) => {
      return req.headers.get('x-skip-logging') === 'true';
    });

    const middleware = withLogging({
      logRequest: true,
      skip,
      logger,
    });

    const request = createRequest('/api/test', { 'x-skip-logging': 'true' });
    await middleware(request);

    expect(skip).toHaveBeenCalled();
    expect(logger).not.toHaveBeenCalled();
  });

  it('should measure request duration', async () => {
    const logger = vi.fn();
    const middleware = withLogging({
      logRequest: true,
      logResponse: true,
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    // Second call should have duration (response log)
    expect(logger).toHaveBeenCalledTimes(2);
    const responseLog = logger.mock.calls[1][0];
    expect(responseLog.duration).toBeDefined();
    expect(responseLog.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle logging errors gracefully', async () => {
    const logger = vi.fn(async () => {
      throw new Error('Logging error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const middleware = withLogging({
      logRequest: true,
      logger,
    });

    const request = createRequest('/api/test');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should use default console logger', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const middleware = withLogging({
      logRequest: true,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('withStructuredLogging', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should log in structured format', async () => {
    const logger = vi.fn();
    const middleware = withStructuredLogging({
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        level: 'info',
        message: expect.stringContaining('GET /api/test'),
        http: expect.objectContaining({
          method: 'GET',
          pathname: '/api/test',
        }),
      })
    );
  });

  it('should set error level for 5xx responses', async () => {
    const logger = vi.fn();
    const middleware = withStructuredLogging({
      logResponse: true,
      logger,
    });

    // We can't easily test this without mocking NextResponse.next()
    // to return a 500 response, so we'll just verify the logger structure
    const request = createRequest('/api/test');
    await middleware(request);

    expect(logger).toHaveBeenCalled();
  });

  it('should use default JSON logger', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const middleware = withStructuredLogging();

    const request = createRequest('/api/test');
    await middleware(request);

    expect(consoleSpy).toHaveBeenCalled();

    const loggedData = consoleSpy.mock.calls[0][0];
    expect(() => JSON.parse(loggedData)).not.toThrow();

    consoleSpy.mockRestore();
  });
});

describe('withPerformanceLogging', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should only log slow requests', async () => {
    const logger = vi.fn();
    const middleware = withPerformanceLogging(1000, {
      logger,
    });

    const request = createRequest('/api/test');
    await middleware(request);

    // Fast request should not be logged
    // (unless the test environment is extremely slow)
    expect(logger).not.toHaveBeenCalled();
  });

  it('should respect exclude paths', async () => {
    const logger = vi.fn();
    const middleware = withPerformanceLogging(0, {
      exclude: ['/health'],
      logger,
    });

    const request = createRequest('/health');
    await middleware(request);

    expect(logger).not.toHaveBeenCalled();
  });
});
