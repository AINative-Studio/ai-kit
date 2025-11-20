import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoleAuth } from '../../src/middleware/withAuth';

describe('withAuth', () => {
  const createRequest = (pathname: string = '/', headers?: Record<string, string>): NextRequest => {
    const request = new NextRequest(new URL(pathname, 'http://localhost:3000'));
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request.headers.set(key, value);
      });
    }
    return request;
  };

  it('should allow authenticated requests', async () => {
    const verify = vi.fn(async () => true);
    const middleware = withAuth({ verify });

    const request = createRequest('/api/protected');
    const response = await middleware(request);

    expect(verify).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
  });

  it('should block unauthenticated requests with 401', async () => {
    const verify = vi.fn(async () => false);
    const middleware = withAuth({ verify });

    const request = createRequest('/api/protected');
    const response = await middleware(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should redirect unauthenticated requests when redirectTo is provided', async () => {
    const verify = vi.fn(async () => false);
    const middleware = withAuth({
      verify,
      redirectTo: '/login',
    });

    const request = createRequest('/api/protected');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('from=%2Fapi%2Fprotected');
  });

  it('should exclude specified paths from authentication', async () => {
    const verify = vi.fn(async () => false);
    const middleware = withAuth({
      verify,
      exclude: ['/public', '/health'],
    });

    const publicRequest = createRequest('/public');
    const publicResponse = await middleware(publicRequest);

    expect(verify).not.toHaveBeenCalled();
    expect(publicResponse.status).toBe(200);

    const healthRequest = createRequest('/health');
    const healthResponse = await middleware(healthRequest);

    expect(verify).not.toHaveBeenCalled();
    expect(healthResponse.status).toBe(200);
  });

  it('should support wildcard exclusions', async () => {
    const verify = vi.fn(async () => false);
    const middleware = withAuth({
      verify,
      exclude: ['/public/*', '/_next/*'],
    });

    const request = createRequest('/public/image.png');
    const response = await middleware(request);

    expect(verify).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('should support function-based exclusions', async () => {
    const verify = vi.fn(async () => false);
    const middleware = withAuth({
      verify,
      exclude: (pathname) => pathname.startsWith('/public'),
    });

    const request = createRequest('/public/anything');
    const response = await middleware(request);

    expect(verify).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('should use custom error handler', async () => {
    const verify = vi.fn(async () => false);
    const onError = vi.fn(() => new NextResponse('Custom error', { status: 403 }));
    const middleware = withAuth({
      verify,
      onError,
    });

    const request = createRequest('/api/protected');
    const response = await middleware(request);

    expect(onError).toHaveBeenCalledWith(request);
    expect(response.status).toBe(403);
  });

  it('should handle verification errors', async () => {
    const verify = vi.fn(async () => {
      throw new Error('Verification failed');
    });
    const middleware = withAuth({ verify });

    const request = createRequest('/api/protected');
    const response = await middleware(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Authentication Error');
    expect(body.message).toBe('Verification failed');
  });

  it('should work with JWT token verification', async () => {
    const verify = async (req: NextRequest) => {
      const auth = req.headers.get('authorization');
      if (!auth || !auth.startsWith('Bearer ')) return false;
      const token = auth.split(' ')[1];
      return token === 'valid-token';
    };

    const middleware = withAuth({ verify });

    const validRequest = createRequest('/api/protected', {
      authorization: 'Bearer valid-token',
    });
    const validResponse = await middleware(validRequest);
    expect(validResponse.status).toBe(200);

    const invalidRequest = createRequest('/api/protected', {
      authorization: 'Bearer invalid-token',
    });
    const invalidResponse = await middleware(invalidRequest);
    expect(invalidResponse.status).toBe(401);
  });
});

describe('withRoleAuth', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  interface User {
    id: string;
    roles: string[];
  }

  it('should allow users with required roles', async () => {
    const verify = vi.fn(async (): Promise<User | null> => ({
      id: '1',
      roles: ['admin', 'editor'],
    }));

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user.roles,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('should block users without required roles', async () => {
    const verify = vi.fn(async (): Promise<User | null> => ({
      id: '1',
      roles: ['user'],
    }));

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user.roles,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });

  it('should return 401 for unauthenticated users', async () => {
    const verify = vi.fn(async () => null);

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user!.roles,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('should support single role string', async () => {
    const verify = vi.fn(async (): Promise<User | null> => ({
      id: '1',
      roles: ['editor'],
    }));

    const middleware = withRoleAuth({
      verify,
      roles: ['editor'],
      getRoles: (user) => 'editor',
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('should allow any of the required roles', async () => {
    const verify = vi.fn(async (): Promise<User | null> => ({
      id: '1',
      roles: ['editor'],
    }));

    const middleware = withRoleAuth({
      verify,
      roles: ['admin', 'editor', 'moderator'],
      getRoles: (user) => user.roles,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('should support path exclusions', async () => {
    const verify = vi.fn(async () => null);

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user!.roles,
      exclude: ['/public'],
    });

    const request = createRequest('/public');
    const response = await middleware(request);

    expect(verify).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('should use custom error handler', async () => {
    const verify = vi.fn(async (): Promise<User | null> => ({
      id: '1',
      roles: ['user'],
    }));

    const onError = vi.fn(() => new NextResponse('Access denied', { status: 403 }));

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user.roles,
      onError,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(onError).toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('should redirect when redirectTo is provided', async () => {
    const verify = vi.fn(async () => null);

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user!.roles,
      redirectTo: '/login',
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('should handle verification errors', async () => {
    const verify = vi.fn(async () => {
      throw new Error('Database error');
    });

    const middleware = withRoleAuth({
      verify,
      roles: ['admin'],
      getRoles: (user) => user!.roles,
    });

    const request = createRequest('/admin');
    const response = await middleware(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe('Database error');
  });
});
