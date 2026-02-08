/**
 * Logger Utility - Issue #135
 *
 * Comprehensive logging for video recording operations
 * Provides structured logging, event emission, and performance tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type LogEventType =
  | 'recording_started'
  | 'recording_stopped'
  | 'recording_paused'
  | 'recording_resumed'
  | 'recording_failed'
  | 'encoding_complete'
  | 'performance_metrics'
  | 'memory_usage'
  | 'cpu_usage'
  | 'browser_compatibility'
  | string;

export interface LoggerConfig {
  enabled?: boolean;
  level?: LogLevel;
  includeTimestamp?: boolean;
  includeStackTrace?: boolean;
}

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  data: Record<string, any>;
  timestamp: number;
}

type LogEventHandler = (event: LogEvent) => void;

/**
 * Logger class for comprehensive observability instrumentation
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private eventHandlers: Map<string, Set<LogEventHandler>>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      level: config.level ?? LogLevel.INFO,
      includeTimestamp: config.includeTimestamp ?? true,
      includeStackTrace: config.includeStackTrace ?? false,
    };

    this.eventHandlers = new Map();
  }

  /**
   * Log debug message
   */
  debug(event: LogEventType, data: Record<string, any> = {}): void {
    this.log(LogLevel.DEBUG, 'debug', event, data);
  }

  /**
   * Log info message
   */
  info(event: LogEventType, data: Record<string, any> = {}): void {
    this.log(LogLevel.INFO, 'info', event, data);
  }

  /**
   * Log warning message
   */
  warn(event: LogEventType, data: Record<string, any> = {}): void {
    this.log(LogLevel.WARN, 'warn', event, data);
  }

  /**
   * Log error message
   */
  error(event: LogEventType, data: Record<string, any> = {}): void {
    this.log(LogLevel.ERROR, 'error', event, data);
  }

  /**
   * Register event handler for external monitoring
   */
  on(eventType: 'log', handler: LogEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: 'log', handler: LogEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    levelName: 'debug' | 'info' | 'warn' | 'error',
    event: string,
    data: Record<string, any>
  ): void {
    // Check if logging is enabled
    if (!this.config.enabled) {
      return;
    }

    // Check log level
    if (level < this.config.level) {
      return;
    }

    // Prepare log data
    const logData = { ...data };

    // Add timestamp if configured
    if (this.config.includeTimestamp && !logData.timestamp) {
      logData.timestamp = Date.now();
    }

    // Format log message
    const levelTag = `[${levelName.toUpperCase()}]`;
    const eventTag = event;

    // Output to console
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(levelTag, eventTag, logData);
        break;
      case LogLevel.WARN:
        console.warn(levelTag, eventTag, logData);
        break;
      case LogLevel.ERROR:
        console.error(levelTag, eventTag, logData);
        break;
    }

    // Emit event for external monitoring
    this.emitLogEvent({
      level: levelName,
      event,
      data: logData,
      timestamp: logData.timestamp || Date.now(),
    });
  }

  /**
   * Emit log event to registered handlers
   */
  private emitLogEvent(event: LogEvent): void {
    const handlers = this.eventHandlers.get('log');
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          // Prevent handler errors from breaking logging
          console.error('Error in log event handler:', error);
        }
      });
    }
  }

  /**
   * Create a correlation ID for request tracking
   */
  static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a recording ID
   */
  static generateRecordingId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a custom logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}
