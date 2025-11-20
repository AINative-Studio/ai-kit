/**
 * Logger Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Logger, LogLevel, createLogger } from '../src/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ minLevel: LogLevel.DEBUG, agentName: 'TestAgent' });
  });

  it('should create logger with name', () => {
    const namedLogger = createLogger('MyAgent');
    expect(namedLogger).toBeInstanceOf(Logger);
  });

  it('should log debug messages', () => {
    logger.debug('Debug message');
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.DEBUG);
  });

  it('should log info messages', () => {
    logger.info('Info message');
    const logs = logger.getLogs();
    expect(logs[0].level).toBe(LogLevel.INFO);
  });

  it('should log warnings', () => {
    logger.warn('Warning message');
    const logs = logger.getLogs();
    expect(logs[0].level).toBe(LogLevel.WARN);
  });

  it('should log errors', () => {
    logger.error('Error message');
    const logs = logger.getLogs();
    expect(logs[0].level).toBe(LogLevel.ERROR);
  });

  it('should include metadata', () => {
    logger.info('Message with metadata', { key: 'value' });
    const logs = logger.getLogs();
    expect(logs[0].metadata).toEqual({ key: 'value' });
  });

  it('should respect minimum log level', () => {
    const warnLogger = new Logger({ minLevel: LogLevel.WARN });
    warnLogger.debug('Debug');
    warnLogger.info('Info');
    warnLogger.warn('Warn');

    const logs = warnLogger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.WARN);
  });

  it('should clear logs', () => {
    logger.info('Message 1');
    logger.info('Message 2');
    logger.clearLogs();
    expect(logger.getLogs().length).toBe(0);
  });
});
