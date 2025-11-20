import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  compose,
  chain,
  conditional,
  forPaths,
  excludePaths,
} from '../../src/middleware/compose';
import type { NextMiddleware } from '../../src/middleware/types';

describe('compose', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should compose multiple middleware in order', async () => {
    const order: number[] = [];

    const middleware1: NextMiddleware = async (req) => {
      order.push(1);
      return NextResponse.next();
    };

    const middleware2: NextMiddleware = async (req) => {
      order.push(2);
      return NextResponse.next();
    };

    const middleware3: NextMiddleware = async (req) => {
      order.push(3);
      return NextResponse.next();
    };

    const composed = compose([middleware1, middleware2, middleware3]);
    const request = createRequest();

    await composed(request);

    expect(order).toEqual([1, 2, 3]);
  });

  it('should short-circuit on error response', async () => {
    const order: number[] = [];

    const middleware1: NextMiddleware = async (req) => {
      order.push(1);
      return NextResponse.next();
    };

    const middleware2: NextMiddleware = async (req) => {
      order.push(2);
      return new NextResponse('Unauthorized', { status: 401 });
    };

    const middleware3: NextMiddleware = async (req) => {
      order.push(3);
      return NextResponse.next();
    };

    const composed = compose([middleware1, middleware2, middleware3]);
    const request = createRequest();

    const response = await composed(request);

    expect(order).toEqual([1, 2]);
    expect(response.status).toBe(401);
  });

  it('should short-circuit on redirect response', async () => {
    const order: number[] = [];

    const middleware1: NextMiddleware = async (req) => {
      order.push(1);
      return NextResponse.next();
    };

    const middleware2: NextMiddleware = async (req) => {
      order.push(2);
      return NextResponse.redirect(new URL('/login', req.url));
    };

    const middleware3: NextMiddleware = async (req) => {
      order.push(3);
      return NextResponse.next();
    };

    const composed = compose([middleware1, middleware2, middleware3]);
    const request = createRequest();

    const response = await composed(request);

    expect(order).toEqual([1, 2]);
    expect(response.status).toBe(307);
  });

  it('should handle middleware errors with default handler', async () => {
    const middleware1: NextMiddleware = async (req) => {
      throw new Error('Test error');
    };

    const composed = compose([middleware1]);
    const request = createRequest();

    const response = await composed(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Middleware Error');
    expect(body.message).toBe('Test error');
  });

  it('should continue on error if continueOnError is true', async () => {
    const order: number[] = [];

    const middleware1: NextMiddleware = async (req) => {
      order.push(1);
      throw new Error('Test error');
    };

    const middleware2: NextMiddleware = async (req) => {
      order.push(2);
      return NextResponse.next();
    };

    const composed = compose([middleware1, middleware2], {
      continueOnError: true,
    });
    const request = createRequest();

    await composed(request);

    expect(order).toEqual([1, 2]);
  });

  it('should use custom error handler', async () => {
    const middleware1: NextMiddleware = async (req) => {
      throw new Error('Test error');
    };

    const onError = vi.fn((error: Error, req: NextRequest) => {
      return new NextResponse('Custom error', { status: 503 });
    });

    const composed = compose([middleware1], { onError });
    const request = createRequest();

    const response = await composed(request);

    expect(onError).toHaveBeenCalled();
    expect(response.status).toBe(503);
  });

  it('should return last response if all middleware succeed', async () => {
    const middleware1: NextMiddleware = async (req) => {
      const response = NextResponse.next();
      response.headers.set('X-Middleware-1', 'true');
      return response;
    };

    const middleware2: NextMiddleware = async (req) => {
      const response = NextResponse.next();
      response.headers.set('X-Middleware-2', 'true');
      return response;
    };

    const composed = compose([middleware1, middleware2]);
    const request = createRequest();

    const response = await composed(request);

    expect(response.headers.get('X-Middleware-2')).toBe('true');
  });
});

describe('chain', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should chain middleware using spread syntax', async () => {
    const order: number[] = [];

    const middleware1: NextMiddleware = async (req) => {
      order.push(1);
      return NextResponse.next();
    };

    const middleware2: NextMiddleware = async (req) => {
      order.push(2);
      return NextResponse.next();
    };

    const chained = chain(middleware1, middleware2);
    const request = createRequest();

    await chained(request);

    expect(order).toEqual([1, 2]);
  });
});

describe('conditional', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should apply middleware when predicate is true', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const conditionalMiddleware = conditional(
      (req) => req.nextUrl.pathname === '/api',
      middleware
    );

    const request = createRequest('/api');
    await conditionalMiddleware(request);

    expect(applied).toBe(true);
  });

  it('should skip middleware when predicate is false', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const conditionalMiddleware = conditional(
      (req) => req.nextUrl.pathname === '/api',
      middleware
    );

    const request = createRequest('/other');
    await conditionalMiddleware(request);

    expect(applied).toBe(false);
  });

  it('should support async predicates', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const conditionalMiddleware = conditional(
      async (req) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
      },
      middleware
    );

    const request = createRequest();
    await conditionalMiddleware(request);

    expect(applied).toBe(true);
  });
});

describe('forPaths', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should apply middleware for matching exact path', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const pathMiddleware = forPaths(['/api'], middleware);

    const request = createRequest('/api');
    await pathMiddleware(request);

    expect(applied).toBe(true);
  });

  it('should skip middleware for non-matching path', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const pathMiddleware = forPaths(['/api'], middleware);

    const request = createRequest('/other');
    await pathMiddleware(request);

    expect(applied).toBe(false);
  });

  it('should support wildcard patterns', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const pathMiddleware = forPaths(['/api/*'], middleware);

    const request = createRequest('/api/users');
    await pathMiddleware(request);

    expect(applied).toBe(true);
  });

  it('should support multiple path patterns', async () => {
    const appliedPaths: string[] = [];

    const middleware: NextMiddleware = async (req) => {
      appliedPaths.push(req.nextUrl.pathname);
      return NextResponse.next();
    };

    const pathMiddleware = forPaths(['/api/*', '/admin/*'], middleware);

    await pathMiddleware(createRequest('/api/users'));
    await pathMiddleware(createRequest('/admin/settings'));
    await pathMiddleware(createRequest('/public'));

    expect(appliedPaths).toEqual(['/api/users', '/admin/settings']);
  });
});

describe('excludePaths', () => {
  const createRequest = (pathname: string = '/'): NextRequest => {
    return new NextRequest(new URL(pathname, 'http://localhost:3000'));
  };

  it('should skip middleware for excluded exact path', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const excludeMiddleware = excludePaths(['/health'], middleware);

    const request = createRequest('/health');
    await excludeMiddleware(request);

    expect(applied).toBe(false);
  });

  it('should apply middleware for non-excluded paths', async () => {
    let applied = false;

    const middleware: NextMiddleware = async (req) => {
      applied = true;
      return NextResponse.next();
    };

    const excludeMiddleware = excludePaths(['/health'], middleware);

    const request = createRequest('/api');
    await excludeMiddleware(request);

    expect(applied).toBe(true);
  });

  it('should support wildcard exclusions', async () => {
    const appliedPaths: string[] = [];

    const middleware: NextMiddleware = async (req) => {
      appliedPaths.push(req.nextUrl.pathname);
      return NextResponse.next();
    };

    const excludeMiddleware = excludePaths(['/public/*', '/health'], middleware);

    await excludeMiddleware(createRequest('/api/users'));
    await excludeMiddleware(createRequest('/public/image.png'));
    await excludeMiddleware(createRequest('/health'));

    expect(appliedPaths).toEqual(['/api/users']);
  });
});
