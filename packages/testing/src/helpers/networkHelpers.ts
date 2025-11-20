/**
 * Helper functions for simulating network errors and conditions
 */

import type { NetworkErrorOptions } from '../types';

/**
 * Simulate various network errors
 */
export function simulateNetworkError(options: NetworkErrorOptions): Error {
  const { type, message, statusCode, retryAfter, metadata } = options;

  let error: Error;

  switch (type) {
    case 'timeout':
      error = new Error(message || 'Request timeout');
      error.name = 'TimeoutError';
      break;

    case 'connection_refused':
      error = new Error(message || 'Connection refused');
      error.name = 'ConnectionRefusedError';
      (error as any).code = 'ECONNREFUSED';
      break;

    case 'dns_failure':
      error = new Error(message || 'DNS lookup failed');
      error.name = 'DNSError';
      (error as any).code = 'ENOTFOUND';
      break;

    case 'ssl_error':
      error = new Error(message || 'SSL certificate error');
      error.name = 'SSLError';
      (error as any).code = 'CERT_HAS_EXPIRED';
      break;

    case 'rate_limit':
      error = new Error(message || 'Rate limit exceeded');
      error.name = 'RateLimitError';
      (error as any).statusCode = statusCode || 429;
      if (retryAfter) {
        (error as any).retryAfter = retryAfter;
      }
      break;

    case 'server_error':
      error = new Error(message || 'Internal server error');
      error.name = 'ServerError';
      (error as any).statusCode = statusCode || 500;
      break;

    case 'network_unreachable':
      error = new Error(message || 'Network is unreachable');
      error.name = 'NetworkError';
      (error as any).code = 'ENETUNREACH';
      break;

    default:
      error = new Error(message || 'Unknown network error');
      error.name = 'NetworkError';
  }

  // Add metadata if provided
  if (metadata) {
    Object.assign(error, metadata);
  }

  return error;
}

/**
 * Create a mock fetch that fails with network error
 */
export function createFailingFetch(errorOptions: NetworkErrorOptions): typeof fetch {
  return async () => {
    throw simulateNetworkError(errorOptions);
  };
}

/**
 * Create a mock fetch that succeeds after N retries
 */
export function createRetryableFetch(
  failCount: number,
  errorOptions: NetworkErrorOptions,
  successResponse?: Response
): typeof fetch {
  let attemptCount = 0;

  return async (_input: RequestInfo | URL, _init?: RequestInit) => {
    attemptCount++;

    if (attemptCount <= failCount) {
      throw simulateNetworkError(errorOptions);
    }

    return (
      successResponse ||
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  };
}

/**
 * Create a mock fetch with latency
 */
export function createSlowFetch(
  latencyMs: number,
  response?: Response
): typeof fetch {
  return async (_input: RequestInfo | URL, _init?: RequestInit) => {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));

    return (
      response ||
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  };
}

/**
 * Create a mock fetch that returns specific status codes
 */
export function createStatusCodeFetch(
  statusCode: number,
  body?: any,
  headers?: Record<string, string>
): typeof fetch {
  return async () => {
    return new Response(
      body ? JSON.stringify(body) : null,
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );
  };
}

/**
 * Simulate network latency with jitter
 */
export async function simulateNetworkLatency(
  baseMs: number,
  jitterMs: number = 0
): Promise<void> {
  const jitter = jitterMs > 0 ? Math.random() * jitterMs : 0;
  const totalDelay = baseMs + jitter;
  await new Promise((resolve) => setTimeout(resolve, totalDelay));
}

/**
 * Create a function that simulates flaky network (randomly fails)
 */
export function createFlakyOperation<T>(
  fn: () => Promise<T>,
  failureRate: number = 0.3,
  errorOptions?: NetworkErrorOptions
): () => Promise<T> {
  return async () => {
    if (Math.random() < failureRate) {
      throw simulateNetworkError(
        errorOptions || { type: 'network_unreachable' }
      );
    }
    return fn();
  };
}
