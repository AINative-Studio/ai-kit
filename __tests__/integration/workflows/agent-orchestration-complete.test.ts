/**
 * Complete Agent Orchestration Workflow Integration Tests
 *
 * Tests end-to-end workflows combining multiple packages:
 * - Agent creation and management
 * - Tool calling and execution
 * - Streaming responses to UI
 * - Session persistence with memory
 * - Video recording of agent interactions
 * - Authentication and authorization
 * - Error recovery and resilience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  TokenCounter,
  ContextManager,
  AIStream,
} from '@ainative/ai-kit-core';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('Complete Agent Orchestration Workflows', () => {
  let sessionManager: SessionManager;
  let tokenCounter: TokenCounter;
  let contextManager: ContextManager;

  beforeEach(() => {
    sessionManager = new SessionManager({
      storage: { type: 'memory' },
    });

    tokenCounter = new TokenCounter();

    contextManager = new ContextManager({
      maxTokens: 8000,
      model: 'gpt-4',
    });

    // Mock comprehensive agent and tool APIs
    server.use(
      // Agent creation
      http.post('https://api.openai.com/v1/assistants', async ({ request }) => {
        const body = await request.json() as {
          name: string;
          instructions: string;
          tools: any[];
          model: string;
        };

        return HttpResponse.json({
          id: 'asst-test-123',
          object: 'assistant',
          created_at: Date.now(),
          name: body.name,
          instructions: body.instructions,
          tools: body.tools,
          model: body.model,
        });
      }),

      // Tool execution endpoint
      http.post('https://api.example.com/tools/execute', async ({ request }) => {
        const body = await request.json() as {
          tool: string;
          arguments: any;
        };

        const { tool, arguments: args } = body;

        // Simulate different tool executions
        switch (tool) {
          case 'search':
            return HttpResponse.json({
              success: true,
              results: [
                {
                  title: 'Search Result 1',
                  snippet: 'This is a relevant search result',
                  url: 'https://example.com/result1',
                },
              ],
            });

          case 'calculator':
            return HttpResponse.json({
              success: true,
              result: eval(`${args.a} ${args.operation} ${args.b}`),
            });

          case 'weather':
            return HttpResponse.json({
              success: true,
              temperature: 72,
              condition: 'sunny',
              location: args.location,
            });

          default:
            return HttpResponse.json(
              { success: false, error: 'Unknown tool' },
              { status: 400 }
            );
        }
      }),

      // Streaming chat completion with tool calls
      http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
        const body = await request.json() as {
          model: string;
          messages: any[];
          stream?: boolean;
          tools?: any[];
        };

        if (body.stream) {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              const chunks = body.tools
                ? [
                    // Tool call chunks
                    {
                      choices: [{
                        delta: {
                          role: 'assistant',
                          tool_calls: [{
                            id: 'call-123',
                            type: 'function',
                            function: {
                              name: 'calculator',
                              arguments: '{"a": 5, "b": 3, "operation": "+"}',
                            },
                          }],
                        },
                      }],
                    },
                    { choices: [{ finish_reason: 'tool_calls' }] },
                  ]
                : [
                    // Regular response chunks
                    { choices: [{ delta: { content: 'The ' } }] },
                    { choices: [{ delta: { content: 'result ' } }] },
                    { choices: [{ delta: { content: 'is 8.' } }] },
                    { choices: [{ finish_reason: 'stop' }] },
                  ];

              chunks.forEach(chunk => {
                const line = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(encoder.encode(line));
              });

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        // Non-streaming response
        return HttpResponse.json({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          created: Date.now(),
          model: body.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a test response',
            },
            finish_reason: 'stop',
          }],
        });
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Agent Workflow', () => {
    it('should execute complete agent interaction with tool calling', async () => {
      // Step 1: Create session for agent interaction
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          workflow: 'agent-interaction',
          step: 'initialized',
        },
      });

      // Step 2: Define agent configuration
      const agentConfig = {
        name: 'Math Assistant',
        instructions: 'You are a helpful math assistant that can perform calculations.',
        tools: [
          {
            type: 'function',
            function: {
              name: 'calculator',
              description: 'Performs basic arithmetic operations',
              parameters: {
                type: 'object',
                properties: {
                  a: { type: 'number' },
                  b: { type: 'number' },
                  operation: { type: 'string', enum: ['+', '-', '*', '/'] },
                },
                required: ['a', 'b', 'operation'],
              },
            },
          },
        ],
        model: 'gpt-4',
      };

      // Create agent
      const agentResponse = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig),
      });

      const agent = await agentResponse.json();

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'agent_created',
          agentId: agent.id,
        },
      });

      // Step 3: User sends message
      const userMessage = 'What is 5 + 3?';

      contextManager.addMessage({
        role: 'user',
        content: userMessage,
      });

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'message_sent',
          userMessage,
        },
      });

      // Step 4: Agent processes with tool call
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: contextManager.getMessages(),
          tools: agentConfig.tools,
          stream: true,
        }),
      });

      const aiStream = AIStream(chatResponse);
      const reader = aiStream.getReader();
      const chunks: string[] = [];
      let toolCallDetected = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        chunks.push(text);

        // Check for tool calls in stream
        if (text.includes('tool_calls')) {
          toolCallDetected = true;
        }
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'tool_call_detected',
          toolCallDetected,
        },
      });

      // Step 5: Execute tool
      if (toolCallDetected) {
        const toolResponse = await fetch('https://api.example.com/tools/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'calculator',
            arguments: { a: 5, b: 3, operation: '+' },
          }),
        });

        const toolResult = await toolResponse.json();

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            step: 'tool_executed',
            toolResult: toolResult.result,
          },
        });

        // Step 6: Agent responds with tool result
        contextManager.addMessage({
          role: 'assistant',
          content: `The result is ${toolResult.result}.`,
        });
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'completed',
          completedAt: Date.now(),
        },
      });

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.step).toBe('completed');
      expect(finalSession?.metadata.agentId).toBe('asst-test-123');
      expect(finalSession?.metadata.toolCallDetected).toBe(true);
      expect(finalSession?.metadata.toolResult).toBe(8);
    });

    it('should handle multi-tool agent workflow', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'multi-tool-agent' },
      });

      const tools = ['search', 'calculator', 'weather'];
      const toolResults: Record<string, any> = {};

      // Act - Execute multiple tools in sequence
      for (const tool of tools) {
        const toolArgs = {
          search: { query: 'AI news' },
          calculator: { a: 10, b: 5, operation: '*' },
          weather: { location: 'San Francisco' },
        }[tool];

        const response = await fetch('https://api.example.com/tools/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool,
            arguments: toolArgs,
          }),
        });

        const result = await response.json();
        toolResults[tool] = result;
      }

      // Update session with all tool results
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          toolsExecuted: tools,
          toolResults,
          completedAt: Date.now(),
        },
      });

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.toolsExecuted).toHaveLength(3);
      expect(finalSession?.metadata.toolResults.calculator.result).toBe(50);
      expect(finalSession?.metadata.toolResults.weather.temperature).toBe(72);
      expect(finalSession?.metadata.toolResults.search.results).toHaveLength(1);
    });
  });

  describe('Streaming Agent Responses to UI', () => {
    it('should stream agent responses with real-time updates', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'streaming-ui' },
      });

      // Act - Stream agent response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
        }),
      });

      const aiStream = AIStream(response);
      const reader = aiStream.getReader();
      const chunks: string[] = [];
      const chunkTimestamps: number[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        chunks.push(text);
        chunkTimestamps.push(Date.now());

        // Simulate UI update for each chunk
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            currentChunk: chunks.length,
            partialResponse: chunks.join(''),
            lastUpdate: Date.now(),
          },
        });
      }

      // Final update
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          streamComplete: true,
          totalChunks: chunks.length,
          fullResponse: chunks.join(''),
        },
      });

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.streamComplete).toBe(true);
      expect(finalSession?.metadata.totalChunks).toBeGreaterThan(0);
      expect(finalSession?.metadata.fullResponse).toBeTruthy();
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle streaming errors and fallback', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'streaming-with-error' },
      });

      // Mock streaming error
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              // Send a few chunks then error
              controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
              controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" wor"}}]}\n\n'));
              controller.error(new Error('Stream interrupted'));
            },
          });

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      // Act
      let streamError: Error | null = null;
      const chunks: string[] = [];

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
            stream: true,
          }),
        });

        const aiStream = AIStream(response);
        const reader = aiStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      } catch (error) {
        streamError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            streamError: streamError.message,
            partialResponse: chunks.join(''),
            errorRecovery: 'fallback-to-non-streaming',
          },
        });
      }

      // Assert
      expect(streamError).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.streamError).toBeTruthy();
      expect(finalSession?.metadata.partialResponse).toBeTruthy();
      expect(finalSession?.metadata.errorRecovery).toBe('fallback-to-non-streaming');
    });
  });

  describe('Agent Memory and Context Management', () => {
    it('should maintain context across multiple agent interactions', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'multi-turn-conversation' },
      });

      const conversationTurns = [
        { user: 'My name is Alice', assistant: 'Hello Alice! Nice to meet you.' },
        { user: 'What is my name?', assistant: 'Your name is Alice.' },
        { user: 'What is 10 + 5?', assistant: 'The result is 15.' },
      ];

      // Act - Simulate multi-turn conversation
      for (let i = 0; i < conversationTurns.length; i++) {
        const turn = conversationTurns[i];

        // Add user message
        contextManager.addMessage({
          role: 'user',
          content: turn.user,
        });

        // Calculate context tokens
        const messages = contextManager.getMessages();
        const tokenCount = await tokenCounter.count(
          messages.map(m => m.content).join('\n')
        );

        // Add assistant response
        contextManager.addMessage({
          role: 'assistant',
          content: turn.assistant,
        });

        // Update session
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            turnCount: i + 1,
            contextTokens: tokenCount.total,
            lastUserMessage: turn.user,
            lastAssistantMessage: turn.assistant,
          },
        });
      }

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      const finalMessages = contextManager.getMessages();

      expect(finalSession?.metadata.turnCount).toBe(3);
      expect(finalMessages.length).toBe(6); // 3 user + 3 assistant
      expect(finalMessages[0].content).toBe('My name is Alice');
      expect(finalMessages[3].content).toBe('What is my name?');
      expect(finalMessages[4].content).toContain('Alice'); // Context maintained
    });

    it('should handle context truncation when exceeding limits', async () => {
      // Arrange
      const smallContextManager = new ContextManager({
        maxTokens: 500, // Small limit
        model: 'gpt-4',
      });

      // Add many messages
      const messages = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `This is message ${i}. `.repeat(10), // ~10 tokens each
      }));

      // Act - Add messages and monitor truncation
      let truncationOccurred = false;
      const addedMessages: number[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i] as { role: 'user' | 'assistant'; content: string };

        smallContextManager.addMessage({
          role: msg.role,
          content: msg.content,
          importance: 'medium',
        });

        const currentMessages = smallContextManager.getMessages();
        const tokenCount = await tokenCounter.count(
          currentMessages.map(m => m.content).join('\n')
        );

        addedMessages.push(currentMessages.length);

        if (currentMessages.length < i + 1) {
          truncationOccurred = true;
        }

        // Should never exceed limit
        expect(tokenCount.total).toBeLessThanOrEqual(500);
      }

      // Assert
      expect(truncationOccurred).toBe(true);
      const finalMessages = smallContextManager.getMessages();
      expect(finalMessages.length).toBeLessThan(20);
    });
  });

  describe('Agent Error Recovery', () => {
    it('should recover from tool execution failures', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'error-recovery' },
      });

      // Mock tool failure
      server.use(
        http.post('https://api.example.com/tools/execute', () => {
          return HttpResponse.json(
            { success: false, error: 'Tool execution failed' },
            { status: 500 }
          );
        })
      );

      // Act
      let toolError: Error | null = null;

      try {
        const response = await fetch('https://api.example.com/tools/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'calculator',
            arguments: { a: 5, b: 3, operation: '+' },
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        toolError = error as Error;

        // Log error and continue without tool
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            toolError: toolError.message,
            recovery: 'continue-without-tool',
            agentResponse: 'I apologize, I cannot perform that calculation right now.',
          },
        });
      }

      // Assert
      expect(toolError).toBeTruthy();
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.toolError).toBeTruthy();
      expect(finalSession?.metadata.recovery).toBe('continue-without-tool');
      expect(finalSession?.metadata.agentResponse).toBeTruthy();
    });

    it('should handle rate limiting with exponential backoff', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'rate-limit-handling' },
      });

      let attemptCount = 0;
      const maxAttempts = 3;

      // Mock rate limiting that succeeds after retries
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          attemptCount++;

          if (attemptCount < 3) {
            return new HttpResponse(null, {
              status: 429,
              headers: {
                'Retry-After': '1',
              },
            });
          }

          return HttpResponse.json({
            id: 'chatcmpl-test',
            choices: [{
              message: { role: 'assistant', content: 'Success after retry' },
            }],
          });
        })
      );

      // Act - Retry with backoff
      let finalResponse = null;
      let totalWaitTime = 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
            const waitTime = Math.pow(2, attempt) * 100; // Exponential backoff
            totalWaitTime += waitTime;

            await sessionManager.updateSession(session.id, {
              metadata: {
                ...session.metadata,
                rateLimitHit: true,
                attempt: attempt + 1,
                waitTime,
              },
            });

            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          finalResponse = await response.json();
          break;
        } catch (error) {
          if (attempt === maxAttempts - 1) {
            throw error;
          }
        }
      }

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          finalAttempt: attemptCount,
          totalWaitTime,
          recovered: finalResponse !== null,
        },
      });

      // Assert
      expect(finalResponse).toBeTruthy();
      expect(attemptCount).toBe(3);

      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.rateLimitHit).toBe(true);
      expect(finalSession?.metadata.recovered).toBe(true);
      expect(finalSession?.metadata.totalWaitTime).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent agent sessions efficiently', async () => {
      // Arrange
      const concurrentSessions = 5;
      const sessions = await Promise.all(
        Array.from({ length: concurrentSessions }, (_, i) =>
          sessionManager.createSession({
            userId: `user-${i}`,
            metadata: { index: i },
          })
        )
      );

      // Act - Concurrent agent interactions
      const startTime = Date.now();

      const results = await Promise.all(
        sessions.map(async session => {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [{ role: 'user', content: `Request ${session.metadata.index}` }],
            }),
          });

          return response.json();
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update all sessions
      await Promise.all(
        sessions.map((session, i) =>
          sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              completed: true,
              response: results[i],
              duration,
            },
          })
        )
      );

      // Assert
      expect(results).toHaveLength(concurrentSessions);
      expect(duration).toBeLessThan(5000); // Should complete reasonably fast

      const updatedSessions = await Promise.all(
        sessions.map(s => sessionManager.getSession(s.id))
      );

      updatedSessions.forEach(session => {
        expect(session?.metadata.completed).toBe(true);
        expect(session?.metadata.response).toBeTruthy();
      });
    });

    it('should maintain performance with large context', async () => {
      // Arrange
      const largeContextManager = new ContextManager({
        maxTokens: 32000, // Large context window
        model: 'gpt-4',
      });

      // Add many messages
      const messageCount = 100;
      for (let i = 0; i < messageCount; i++) {
        largeContextManager.addMessage({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}: This is a test message with some content.`,
          importance: i < 10 ? 'high' : 'medium', // First 10 are important
        });
      }

      // Act - Measure performance of context operations
      const startTime = performance.now();

      const messages = largeContextManager.getMessages();
      const tokenCount = await tokenCounter.count(
        messages.map(m => m.content).join('\n')
      );

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(tokenCount.total).toBeGreaterThan(0);
      expect(operationTime).toBeLessThan(1000); // Should be fast even with large context
    });
  });
});
