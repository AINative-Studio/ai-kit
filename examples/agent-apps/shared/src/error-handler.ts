/**
 * Shared error handling utilities for agent applications
 */

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly agentName?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class RetryableError extends AgentError {
  constructor(
    message: string,
    code: string,
    agentName?: string,
    context?: Record<string, unknown>
  ) {
    super(message, code, agentName, context);
    this.name = 'RetryableError';
  }
}

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs, backoff = 'exponential', onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!(error instanceof RetryableError)) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = backoff === 'exponential' ? delayMs * Math.pow(2, attempt - 1) : delayMs * attempt;

      onRetry?.(attempt, error);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export interface ErrorRecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: (error: Error) => Promise<void>;
}

export class ErrorHandler {
  private strategies: ErrorRecoveryStrategy[] = [];

  addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  async handle(error: Error): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error);
          return true;
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }

    return false;
  }
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof RetryableError) {
    return true;
  }

  // Network errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
    return true;
  }

  // Rate limiting
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    return true;
  }

  return false;
}
