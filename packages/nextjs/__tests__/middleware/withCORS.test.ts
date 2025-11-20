import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withCORS,
  withStrictCORS,
  withDevCORS,
  withAPICORS,
} from '../../src/middleware/withCORS';

describe('withCORS', () => {
  const createRequest = (
    method: string = 'GET',
    pathname: string = '/',
    headers?: Record<string, string>
  ): NextRequest => {
    const request = new NextRequest(
      new URL(pathname, 'http://localhost:3000'),
      { method }
    );
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  it('should allow all origins with wildcard', async () => {
    const middleware = withCORS({
      origin: '*',
    });

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should allow specific origin', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );
  });

  it('should block non-allowed origin', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('GET', '/', {
      origin: 'https://evil.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should allow multiple origins', async () => {
    const middleware = withCORS({
      origin: ['https://example.com', 'https://app.example.com'],
    });

    const request1 = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response1 = await middleware(request1);
    expect(response1.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );

    const request2 = createRequest('GET', '/', {
      origin: 'https://app.example.com',
    });
    const response2 = await middleware(request2);
    expect(response2.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://app.example.com'
    );
  });

  it('should use function to validate origin', async () => {
    const middleware = withCORS({
      origin: (origin) => origin.endsWith('.example.com'),
    });

    const request1 = createRequest('GET', '/', {
      origin: 'https://app.example.com',
    });
    const response1 = await middleware(request1);
    expect(response1.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://app.example.com'
    );

    const request2 = createRequest('GET', '/', {
      origin: 'https://evil.com',
    });
    const response2 = await middleware(request2);
    expect(response2.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should set credentials header when enabled', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      credentials: true,
    });

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
  });

  it('should set exposed headers', async () => {
    const middleware = withCORS({
      origin: '*',
      exposedHeaders: ['X-Custom-Header', 'X-Another-Header'],
    });

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Expose-Headers')).toBe(
      'X-Custom-Header, X-Another-Header'
    );
  });

  it('should set Vary header', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Vary')).toBe('Origin');
  });

  it('should handle preflight OPTIONS request', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      methods: ['GET', 'POST', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://example.com',
      'access-control-request-method': 'POST',
    });
    const response = await middleware(request);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
      'POST'
    );
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
      'Content-Type'
    );
  });

  it('should echo requested headers in preflight if not specified', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://example.com',
      'access-control-request-headers': 'X-Custom-Header, Content-Type',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'X-Custom-Header, Content-Type'
    );
  });

  it('should set max age in preflight', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      maxAge: 3600,
    });

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Max-Age')).toBe('3600');
  });

  it('should reject preflight from non-allowed origin', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://evil.com',
    });
    const response = await middleware(request);

    expect(response.status).toBe(403);
  });

  it('should exclude specified paths', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      exclude: ['/internal', '/private'],
    });

    const request = createRequest('GET', '/internal', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  it('should support wildcard path exclusions', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      exclude: ['/internal/*'],
    });

    const request = createRequest('GET', '/internal/secret', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  it('should support function-based path exclusions', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
      exclude: (pathname) => pathname.startsWith('/admin'),
    });

    const request = createRequest('GET', '/admin/users', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  it('should handle requests without origin header', async () => {
    const middleware = withCORS({
      origin: 'https://example.com',
    });

    const request = createRequest('GET', '/');
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('withStrictCORS', () => {
  const createRequest = (
    method: string = 'GET',
    pathname: string = '/',
    headers?: Record<string, string>
  ): NextRequest => {
    const request = new NextRequest(
      new URL(pathname, 'http://localhost:3000'),
      { method }
    );
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  it('should use strict defaults', async () => {
    const middleware = withStrictCORS(['https://example.com']);

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );
  });

  it('should block non-whitelisted origins', async () => {
    const middleware = withStrictCORS(['https://example.com']);

    const request = createRequest('GET', '/', {
      origin: 'https://evil.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should allow overriding defaults', async () => {
    const middleware = withStrictCORS(['https://example.com'], {
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    });

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
      'DELETE'
    );
  });
});

describe('withDevCORS', () => {
  const createRequest = (
    method: string = 'GET',
    pathname: string = '/',
    headers?: Record<string, string>
  ): NextRequest => {
    const request = new NextRequest(
      new URL(pathname, 'http://localhost:3000'),
      { method }
    );
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  it('should allow all origins', async () => {
    const middleware = withDevCORS();

    const request = createRequest('GET', '/', {
      origin: 'https://any-origin.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should allow credentials', async () => {
    const middleware = withDevCORS();

    const request = createRequest('GET', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
  });

  it('should allow all common methods', async () => {
    const middleware = withDevCORS();

    const request = createRequest('OPTIONS', '/', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    const methods = response.headers.get('Access-Control-Allow-Methods');
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');
    expect(methods).toContain('PATCH');
  });
});

describe('withAPICORS', () => {
  const createRequest = (
    method: string = 'GET',
    pathname: string = '/',
    headers?: Record<string, string>
  ): NextRequest => {
    const request = new NextRequest(
      new URL(pathname, 'http://localhost:3000'),
      { method }
    );
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  it('should only apply to /api routes', async () => {
    const middleware = withAPICORS({
      origin: 'https://example.com',
    });

    const apiRequest = createRequest('GET', '/api/users', {
      origin: 'https://example.com',
    });
    const apiResponse = await middleware(apiRequest);
    expect(apiResponse.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );

    const otherRequest = createRequest('GET', '/other', {
      origin: 'https://example.com',
    });
    const otherResponse = await middleware(otherRequest);
    expect(otherResponse.headers.has('Access-Control-Allow-Origin')).toBe(
      false
    );
  });

  it('should work with nested API routes', async () => {
    const middleware = withAPICORS({
      origin: 'https://example.com',
    });

    const request = createRequest('GET', '/api/v1/users/123', {
      origin: 'https://example.com',
    });
    const response = await middleware(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com'
    );
  });
});
