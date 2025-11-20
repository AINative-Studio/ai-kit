/**
 * Shared logging utilities for agent applications
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  agentName?: string;
}

export class Logger {
  private minLevel: LogLevel;
  private agentName?: string;
  private logs: LogEntry[] = [];

  constructor(options?: { minLevel?: LogLevel; agentName?: string }) {
    this.minLevel = options?.minLevel ?? LogLevel.INFO;
    this.agentName = options?.agentName;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata,
      agentName: this.agentName,
    };

    this.logs.push(entry);

    const levelStr = LogLevel[level];
    const prefix = this.agentName ? `[${this.agentName}]` : '';
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';

    console.log(`[${entry.timestamp.toISOString()}] ${levelStr} ${prefix} ${message}${metaStr}`);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export function createLogger(agentName: string): Logger {
  return new Logger({ agentName });
}
