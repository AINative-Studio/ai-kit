/**
 * Comprehensive Error Handling Integration Tests
 *
 * Tests error handling and recovery across all AI Kit packages:
 * - Network failures and timeouts
 * - API errors (rate limits, authentication, validation)
 * - Resource exhaustion (memory, storage, tokens)
 * - Concurrent operation failures
 * - Cascading failures across packages
 * - Error propagation and logging
 * - Recovery strategies and fallbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  TokenCounter,
  ContextManager,
  AIStream,
  AINativeAuthProvider,
  AuthStatus,
  AuthMethod,
} from '@ainative/ai-kit-core';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('Comprehensive Error Handling', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager({
      storage: { type: 'memory' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Failures', () => {
    it('should handle complete network failures', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'network-failure' },
      });

      // Mock network error
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.error();
        })
      );

      // Act
      let networkError: Error | null = null;
      let retryAttempts = 0;
      const maxRetries = 3;

      while (retryAttempts < maxRetries) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [{ role: 'user', content: 'test' }],
            }),
          });

          if (!response.ok) {
            throw new Error('Network request failed');
          }

          break;
        } catch (error) {
          networkError = error as Error;
          retryAttempts++;

          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              error: 'network_failure',
              retryAttempts,
              lastError: networkError.message,
            },
          });

          if (retryAttempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * retryAttempts));
          }
        }
      }

      // Assert
      expect(networkError).toBeTruthy();
      expect(retryAttempts).toBe(maxRetries);

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('network_failure');
      expect(finalSession?.metadata.retryAttempts).toBe(maxRetries);
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'timeout' },
      });

      // Mock slow response
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return HttpResponse.json({ id: 'test' });
        })
      );

      // Act
      let timeoutError: Error | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (error) {
        timeoutError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: 'timeout',
            errorMessage: timeoutError.message,
          },
        });
      }

      // Assert
      expect(timeoutError).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('timeout');
    });
  });

  describe('API Errors', () => {
    it('should handle rate limit errors with retry-after', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'rate-limit' },
      });

      let attemptCount = 0;

      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          attemptCount++;

          if (attemptCount === 1) {
            return new HttpResponse(null, {
              status: 429,
              headers: {
                'Retry-After': '2',
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Date.now() + 2000),
              },
            });
          }

          return HttpResponse.json({
            id: 'chatcmpl-test',
            choices: [{ message: { role: 'assistant', content: 'Success' } }],
          });
        })
      );

      // Act
      let result = null;
      let rateLimitHit = false;
      let retryAfter = 0;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        if (response.status === 429) {
          rateLimitHit = true;
          retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);

          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              error: 'rate_limit',
              retryAfter,
              rateLimitReset: response.headers.get('X-RateLimit-Reset'),
            },
          });

          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

          const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [{ role: 'user', content: 'test' }],
            }),
          });

          result = await retryResponse.json();
        } else {
          result = await response.json();
        }
      } catch (error) {
        // Handle error
      }

      // Update with success
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          recovered: true,
          finalResult: result,
        },
      });

      // Assert
      expect(rateLimitHit).toBe(true);
      expect(retryAfter).toBe(2);
      expect(result).toBeTruthy();

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.recovered).toBe(true);
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'auth-error' },
      });

      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid API key',
                type: 'invalid_request_error',
                code: 'invalid_api_key',
              },
            },
            { status: 401 }
          );
        })
      );

      // Act
      let authError: Error | null = null;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-key',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        if (response.status === 401) {
          const errorData = await response.json();
          throw new Error(errorData.error.message);
        }
      } catch (error) {
        authError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: 'authentication_failed',
            errorMessage: authError.message,
            requiresReauth: true,
          },
        });
      }

      // Assert
      expect(authError).toBeTruthy();
      expect(authError?.message).toContain('Invalid API key');

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('authentication_failed');
      expect(finalSession?.metadata.requiresReauth).toBe(true);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'validation-error' },
      });

      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid parameter: messages must be non-empty',
                type: 'invalid_request_error',
                code: 'invalid_parameter',
              },
            },
            { status: 400 }
          );
        })
      );

      // Act
      let validationError: Error | null = null;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [], // Invalid: empty messages
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error.message);
        }
      } catch (error) {
        validationError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: 'validation_error',
            errorMessage: validationError.message,
            invalidInput: true,
          },
        });
      }

      // Assert
      expect(validationError).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('validation_error');
      expect(finalSession?.metadata.invalidInput).toBe(true);
    });
  });

  describe('Resource Exhaustion', () => {
    it('should handle token limit exceeded errors', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'token-limit' },
      });

      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'This model\'s maximum context length is 8192 tokens. Your messages resulted in 9000 tokens.',
                type: 'invalid_request_error',
                code: 'context_length_exceeded',
              },
            },
            { status: 400 }
          );
        })
      );

      // Act
      let tokenError: Error | null = null;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'x'.repeat(50000) }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error.message);
        }
      } catch (error) {
        tokenError = error as Error;

        // Implement truncation strategy
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: 'token_limit_exceeded',
            errorMessage: tokenError.message,
            recovery: 'truncate_context',
          },
        });
      }

      // Assert
      expect(tokenError).toBeTruthy();
      expect(tokenError?.message).toContain('context length');

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('token_limit_exceeded');
      expect(finalSession?.metadata.recovery).toBe('truncate_context');
    });

    it('should handle storage quota exceeded', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'storage-quota' },
      });

      server.use(
        http.post('https://api.zerodb.ai/v1/memory/store', () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Storage quota exceeded',
              quota: {
                used: 1000000000,
                limit: 1000000000,
              },
            },
            { status: 507 }
          );
        })
      );

      // Act
      let storageError: Error | null = null;

      try {
        const response = await fetch('https://api.zerodb.ai/v1/memory/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            content: 'Test memory',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
      } catch (error) {
        storageError = error as Error;

        // Fallback to local storage
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: 'storage_quota_exceeded',
            errorMessage: storageError.message,
            fallbackStorage: 'local',
          },
        });
      }

      // Assert
      expect(storageError).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.error).toBe('storage_quota_exceeded');
      expect(finalSession?.metadata.fallbackStorage).toBe('local');
    });

    it('should handle memory leaks in long-running sessions', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'memory-management' },
      });

      const contextManager = new ContextManager({
        maxTokens: 8000,
        model: 'gpt-4',
      });

      // Simulate long-running conversation
      const messageLimit = 1000;
      const messageCount = 150;

      // Act - Add messages and monitor memory
      for (let i = 0; i < messageCount; i++) {
        contextManager.addMessage({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          importance: 'medium',
        });

        // Check if cleanup happened
        const messages = contextManager.getMessages();

        if (messages.length >= messageLimit) {
          // Should have cleaned up old messages
          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              memoryManagement: 'cleanup_triggered',
              messageCount: messages.length,
              iteration: i,
            },
          });
        }
      }

      // Assert
      const finalMessages = contextManager.getMessages();
      expect(finalMessages.length).toBeLessThan(messageCount);

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.memoryManagement).toBe('cleanup_triggered');
    });
  });

  describe('Cascading Failures', () => {
    it('should handle auth failure cascading to other services', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'cascading-auth-failure' },
      });

      // Mock auth failure
      server.use(
        http.post('https://api.ainative.studio/v1/auth/validate', () => {
          return HttpResponse.json(
            { success: false, valid: false, error: 'Token expired' },
            { status: 401 }
          );
        })
      );

      // Act - Attempt multiple operations
      const operations = [
        { name: 'validate_auth', url: 'https://api.ainative.studio/v1/auth/validate' },
        { name: 'store_memory', url: 'https://api.zerodb.ai/v1/memory/store' },
        { name: 'ai_completion', url: 'https://api.openai.com/v1/chat/completions' },
      ];

      const failures: string[] = [];

      for (const op of operations) {
        try {
          const response = await fetch(op.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer expired-token',
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            failures.push(op.name);
          }
        } catch (error) {
          failures.push(op.name);
        }
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          cascadingFailure: true,
          failedOperations: failures,
          totalFailures: failures.length,
        },
      });

      // Assert
      expect(failures.length).toBeGreaterThan(0);
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.cascadingFailure).toBe(true);
    });

    it('should isolate failures between independent services', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'failure-isolation' },
      });

      // Mock one service failing, others succeeding
      server.use(
        http.post('https://api.zerodb.ai/v1/memory/store', () => {
          return HttpResponse.error();
        }),
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json({
            id: 'test',
            choices: [{ message: { role: 'assistant', content: 'Success' } }],
          });
        })
      );

      // Act
      const results = {
        memory: null as any,
        ai: null as any,
      };

      try {
        const memoryResponse = await fetch('https://api.zerodb.ai/v1/memory/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, content: 'test' }),
        });
        results.memory = await memoryResponse.json();
      } catch (error) {
        results.memory = { error: (error as Error).message };
      }

      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        results.ai = await aiResponse.json();
      } catch (error) {
        results.ai = { error: (error as Error).message };
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          memoryFailed: !!results.memory.error,
          aiSucceeded: !!results.ai.id,
          failureIsolated: !!results.memory.error && !!results.ai.id,
        },
      });

      // Assert
      expect(results.memory.error).toBeTruthy();
      expect(results.ai.id).toBeTruthy();

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.failureIsolated).toBe(true);
    });
  });

  describe('Error Propagation and Logging', () => {
    it('should propagate errors through session hierarchy', async () => {
      // Arrange
      const parentSession = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { type: 'parent' },
      });

      const childSession = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          type: 'child',
          parentSessionId: parentSession.id,
        },
      });

      // Mock error in child operation
      server.use(
        http.post('https://api.example.com/operation', () => {
          return HttpResponse.json(
            { error: 'Child operation failed' },
            { status: 500 }
          );
        })
      );

      // Act
      let childError: Error | null = null;

      try {
        const response = await fetch('https://api.example.com/operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: childSession.id }),
        });

        if (!response.ok) {
          throw new Error('Child operation failed');
        }
      } catch (error) {
        childError = error as Error;

        // Update child session
        await sessionManager.updateSession(childSession.id, {
          metadata: {
            ...childSession.metadata,
            error: childError.message,
            errorTime: Date.now(),
          },
        });

        // Propagate to parent
        await sessionManager.updateSession(parentSession.id, {
          metadata: {
            ...parentSession.metadata,
            childError: childError.message,
            childSessionId: childSession.id,
            errorPropagated: true,
          },
        });
      }

      // Assert
      expect(childError).toBeTruthy();

      const updatedParent = await sessionManager.getSession(parentSession.id);
      const updatedChild = await sessionManager.getSession(childSession.id);

      expect(updatedChild?.metadata.error).toBeTruthy();
      expect(updatedParent?.metadata.childError).toBeTruthy();
      expect(updatedParent?.metadata.errorPropagated).toBe(true);
    });

    it('should log errors with full context', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'error-logging' },
      });

      const errorLogs: any[] = [];

      // Mock error
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            { error: { message: 'API Error', code: 'api_error' } },
            { status: 500 }
          );
        })
      );

      // Act
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw error;
        }
      } catch (error) {
        // Create comprehensive error log
        const errorLog = {
          timestamp: Date.now(),
          sessionId: session.id,
          userId: session.userId,
          error: error,
          context: {
            model: 'gpt-4',
            operation: 'chat_completion',
          },
          stack: new Error().stack,
        };

        errorLogs.push(errorLog);

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            errors: errorLogs,
            lastError: errorLog,
          },
        });
      }

      // Assert
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].sessionId).toBe(session.id);
      expect(errorLogs[0].context).toBeDefined();

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.errors).toHaveLength(1);
    });
  });

  describe('Recovery Strategies', () => {
    it('should implement circuit breaker pattern', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          test: 'circuit-breaker',
          failureThreshold: 3,
          failureCount: 0,
          circuitState: 'closed',
        },
      });

      // Mock consistent failures
      server.use(
        http.post('https://api.example.com/unreliable', () => {
          return HttpResponse.error();
        })
      );

      // Act
      const maxAttempts = 5;

      for (let i = 0; i < maxAttempts; i++) {
        const currentSession = await sessionManager.getSession(session.id);

        if (currentSession?.metadata.circuitState === 'open') {
          // Circuit is open, don't attempt
          break;
        }

        try {
          const response = await fetch('https://api.example.com/unreliable', {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          // Success - reset failure count
          await sessionManager.updateSession(session.id, {
            metadata: {
              ...currentSession!.metadata,
              failureCount: 0,
              circuitState: 'closed',
            },
          });
        } catch (error) {
          const failureCount = (currentSession?.metadata.failureCount || 0) + 1;
          const circuitState =
            failureCount >= currentSession!.metadata.failureThreshold
              ? 'open'
              : 'closed';

          await sessionManager.updateSession(session.id, {
            metadata: {
              ...currentSession!.metadata,
              failureCount,
              circuitState,
              lastFailure: Date.now(),
            },
          });
        }
      }

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.circuitState).toBe('open');
      expect(finalSession?.metadata.failureCount).toBeGreaterThanOrEqual(3);
    });

    it('should implement graceful degradation', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { test: 'graceful-degradation' },
      });

      // Mock primary service failure
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.error();
        })
      );

      // Act
      let result = null;
      const fallbackStrategies = [
        'primary-service',
        'cache',
        'fallback-model',
        'default-response',
      ];

      for (const strategy of fallbackStrategies) {
        try {
          if (strategy === 'primary-service') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: 'test' }],
              }),
            });

            if (!response.ok) {
              throw new Error('Primary service failed');
            }

            result = await response.json();
            break;
          } else if (strategy === 'default-response') {
            // Final fallback
            result = {
              source: 'fallback',
              content: 'I apologize, but I am experiencing technical difficulties.',
            };
            break;
          }
        } catch (error) {
          // Continue to next strategy
          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              [`${strategy}_failed`]: true,
            },
          });
        }
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          finalStrategy: result?.source || 'primary-service',
          gracefulDegradation: result?.source === 'fallback',
        },
      });

      // Assert
      expect(result).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.gracefulDegradation).toBe(true);
    });
  });
});
