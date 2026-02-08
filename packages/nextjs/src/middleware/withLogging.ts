import { NextRequest, NextResponse } from 'next/server';
import type { LoggingConfig, NextMiddleware, LogInfo } from './types';

/**
 * Create logging middleware
 *
 * Logs request and response information for monitoring and debugging.
 * Edge runtime compatible with customizable logging output.
 *
 * @param config - Logging configuration
 * @returns Logging middleware
 *
 * @example
 * ```ts
 * // Basic logging
 * const middleware = withLogging({
 *   logRequest: true,
 *   logResponse: true
 * });
 * ```
 *
 * @example
 * ```ts
 * // Custom logger with detailed information
 * const middleware = withLogging({
 *   logRequest: true,
 *   logResponse: true,
 *   logHeaders: true,
 *   logger: async (info) => {
 *     // Send to external logging service
 *     await fetch('https://logs.example.com', {
 *       method: 'POST',
 *       body: JSON.stringify(info)
 *     });
 *   },
 *   exclude: ['/health', '/_next/*']
 * });
 * ```
 *
 * @example
 * ```ts
 * // Conditional logging
 * const middleware = withLogging({
 *   logRequest: true,
 *   skip: (req) => req.headers.get('x-skip-logging') === 'true'
 * });
 * ```
 */
export function withLogging(config: LoggingConfig = {}): NextMiddleware {
  const {
    logRequest = true,
    logResponse = true,
    logBody = false,
    logHeaders = false,
    logger = defaultLogger,
    exclude,
    skip,
  } = config;

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // Check if path should be excluded
    if (exclude) {
      const shouldExclude =
        typeof exclude === 'function'
          ? exclude(pathname)
          : exclude.some((pattern) => matchPath(pathname, pattern));

      if (shouldExclude) {
        return NextResponse.next();
      }
    }

    // Check if logging should be skipped
    if (skip && skip(request)) {
      return NextResponse.next();
    }

    const startTime = Date.now();

    // Build log info
    const logInfo: LogInfo = {
      method: request.method,
      url: request.url,
      pathname,
      timestamp: new Date().toISOString(),
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Add headers if requested
    if (logHeaders) {
      logInfo.headers = headersToObject(request.headers);
    }

    // Log request
    if (logRequest) {
      try {
        await logger({
          ...logInfo,
        });
      } catch (error) {
        console.error('Logging error:', error);
      }
    }

    // Process request
    let response: NextResponse;
    try {
      response = NextResponse.next();
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      await Promise.resolve(logger({
        ...logInfo,
        status: 500,
        duration,
      })).catch(console.error);

      throw error;
    }

    // Log response
    if (logResponse) {
      const duration = Date.now() - startTime;

      try {
        await logger({
          ...logInfo,
          status: response.status,
          duration,
          responseHeaders: logHeaders ? headersToObject(response.headers) : undefined,
        });
      } catch (error) {
        console.error('Logging error:', error);
      }
    }

    return response;
  };
}

/**
 * Default logger - logs to console
 */
function defaultLogger(info: LogInfo): void {
  const { method, pathname, status, duration, ip } = info;

  const statusColor = status
    ? status >= 500
      ? '\x1b[31m' // Red for 5xx
      : status >= 400
      ? '\x1b[33m' // Yellow for 4xx
      : status >= 300
      ? '\x1b[36m' // Cyan for 3xx
      : '\x1b[32m' // Green for 2xx
    : '\x1b[0m'; // No color

  const reset = '\x1b[0m';

  const logMessage = [
    `[${info.timestamp}]`,
    `${method} ${pathname}`,
    status ? `${statusColor}${status}${reset}` : '',
    duration ? `${duration}ms` : '',
    ip ? `(${ip})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  console.log(logMessage);
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    undefined
  );
}

/**
 * Convert Headers to plain object
 */
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * Match a pathname against a pattern
 */
function matchPath(pathname: string, pattern: string): boolean {
  if (pattern === pathname) return true;

  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
    );
    return regex.test(pathname);
  }

  return false;
}

/**
 * Create structured logging middleware
 *
 * Logs in structured JSON format suitable for log aggregation services.
 *
 * @param config - Logging configuration
 * @returns Structured logging middleware
 *
 * @example
 * ```ts
 * const middleware = withStructuredLogging({
 *   logger: async (info) => {
 *     console.log(JSON.stringify(info));
 *   }
 * });
 * ```
 */
export function withStructuredLogging(
  config: Omit<LoggingConfig, 'logger'> & {
    logger?: (info: StructuredLogInfo) => void | Promise<void>;
  } = {}
): NextMiddleware {
  const { logger = structuredLogger, ...restConfig } = config;

  return withLogging({
    ...restConfig,
    logger: async (info) => {
      const structured: StructuredLogInfo = {
        timestamp: info.timestamp,
        level: info.status
          ? info.status >= 500
            ? 'error'
            : info.status >= 400
            ? 'warn'
            : 'info'
          : 'info',
        message: `${info.method} ${info.pathname}`,
        http: {
          method: info.method,
          url: info.url,
          pathname: info.pathname,
          status: info.status,
          userAgent: info.userAgent,
        },
        request: {
          headers: info.headers,
        },
        response: {
          headers: info.responseHeaders,
          duration: info.duration,
        },
        client: {
          ip: info.ip,
        },
      };

      await logger(structured);
    },
  });
}

/**
 * Structured log information
 */
interface StructuredLogInfo {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  http: {
    method: string;
    url: string;
    pathname: string;
    status?: number;
    userAgent?: string;
  };
  request: {
    headers?: Record<string, string>;
  };
  response: {
    headers?: Record<string, string>;
    duration?: number;
  };
  client: {
    ip?: string;
  };
}

/**
 * Default structured logger
 */
function structuredLogger(info: StructuredLogInfo): void {
  console.log(JSON.stringify(info));
}

/**
 * Create performance monitoring middleware
 *
 * Logs slow requests that exceed a duration threshold.
 *
 * @param threshold - Duration threshold in milliseconds
 * @param config - Logging configuration
 * @returns Performance monitoring middleware
 *
 * @example
 * ```ts
 * const middleware = withPerformanceLogging(1000, {
 *   logger: (info) => {
 *     console.warn(`Slow request: ${info.pathname} took ${info.duration}ms`);
 *   }
 * });
 * ```
 */
export function withPerformanceLogging(
  threshold: number,
  config: Omit<LoggingConfig, 'logRequest'> = {}
): NextMiddleware {
  return withLogging({
    ...config,
    logRequest: false,
    logResponse: true,
    logger: async (info) => {
      if (info.duration && info.duration > threshold) {
        if (config.logger) {
          await config.logger(info);
        } else {
          console.warn(
            `[Performance] ${info.method} ${info.pathname} took ${info.duration}ms (threshold: ${threshold}ms)`
          );
        }
      }
    },
  });
}
