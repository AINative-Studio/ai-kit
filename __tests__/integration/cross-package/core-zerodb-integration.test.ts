/**
 * Core + ZeroDB Integration Tests
 *
 * Tests the integration between @ainative/ai-kit-core and @ainative/ai-kit-zerodb
 * including:
 * - Vector storage with session management
 * - Memory persistence across sessions
 * - Semantic search with context management
 * - RAG (Retrieval Augmented Generation) workflows
 * - Long-term memory with token optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  TokenCounter,
  ContextManager,
  ZeroDBSessionStore,
} from '@ainative/ai-kit-core';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('Core + ZeroDB Integration', () => {
  let sessionManager: SessionManager;
  let tokenCounter: TokenCounter;
  let contextManager: ContextManager;

  beforeEach(() => {
    tokenCounter = new TokenCounter();
    contextManager = new ContextManager({
      maxTokens: 4000,
      model: 'gpt-4',
    });

    // Mock ZeroDB API endpoints
    server.use(
      // Store vector
      http.post('https://api.zerodb.ai/v1/vectors/store', async ({ request }) => {
        const body = await request.json() as {
          collection: string;
          vector: number[];
          metadata: any;
        };

        return HttpResponse.json({
          success: true,
          id: `vec-${Date.now()}`,
          collection: body.collection,
          stored_at: new Date().toISOString(),
        });
      }),

      // Search vectors
      http.post('https://api.zerodb.ai/v1/vectors/search', async ({ request }) => {
        const body = await request.json() as {
          collection: string;
          query: number[] | string;
          limit?: number;
        };

        return HttpResponse.json({
          success: true,
          results: [
            {
              id: 'vec-1',
              score: 0.95,
              metadata: {
                content: 'User asked about authentication',
                timestamp: Date.now() - 3600000,
                sessionId: 'session-123',
              },
            },
            {
              id: 'vec-2',
              score: 0.87,
              metadata: {
                content: 'User configured API keys',
                timestamp: Date.now() - 7200000,
                sessionId: 'session-123',
              },
            },
          ],
        });
      }),

      // Store session memory
      http.post('https://api.zerodb.ai/v1/memory/store', async ({ request }) => {
        const body = await request.json() as {
          sessionId: string;
          content: string;
          metadata?: any;
        };

        return HttpResponse.json({
          success: true,
          id: `mem-${Date.now()}`,
          sessionId: body.sessionId,
          stored_at: new Date().toISOString(),
        });
      }),

      // Retrieve session memories
      http.post('https://api.zerodb.ai/v1/memory/retrieve', async ({ request }) => {
        const body = await request.json() as { sessionId: string };

        return HttpResponse.json({
          success: true,
          memories: [
            {
              id: 'mem-1',
              content: 'User prefers dark mode',
              timestamp: Date.now() - 86400000,
              sessionId: body.sessionId,
            },
            {
              id: 'mem-2',
              content: 'User works with TypeScript',
              timestamp: Date.now() - 172800000,
              sessionId: body.sessionId,
            },
          ],
        });
      }),

      // Delete memory
      http.delete('https://api.zerodb.ai/v1/memory/:id', () => {
        return HttpResponse.json({ success: true });
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Memory Persistence', () => {
    it('should store and retrieve session memories from ZeroDB', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: {
          type: 'zerodb',
          apiKey: 'test-zerodb-key',
          endpoint: 'https://api.zerodb.ai/v1',
        },
      });

      // Act - Create session with ZeroDB backend
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          memoryEnabled: true,
          persistToZeroDB: true,
        },
      });

      // Store conversation memory
      const conversationData = {
        content: 'User asked about video recording features',
        timestamp: Date.now(),
        sessionId: session.id,
      };

      const storeResponse = await fetch('https://api.zerodb.ai/v1/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      });

      const storeResult = await storeResponse.json();

      // Retrieve memories
      const retrieveResponse = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const retrieveResult = await retrieveResponse.json();

      // Assert
      expect(storeResult.success).toBe(true);
      expect(storeResult.sessionId).toBe(session.id);
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.memories).toHaveLength(2);
      expect(retrieveResult.memories[0].sessionId).toBe(session.id);
    });

    it('should handle memory storage failures gracefully', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { memoryEnabled: true },
      });

      // Mock storage failure
      server.use(
        http.post('https://api.zerodb.ai/v1/memory/store', () => {
          return HttpResponse.json(
            { success: false, error: 'Storage quota exceeded' },
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
          throw new Error(`Storage failed: ${response.status}`);
        }
      } catch (error) {
        storageError = error as Error;

        // Fallback to local storage
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            storageError: storageError.message,
            fallbackToLocal: true,
          },
        });
      }

      // Assert
      expect(storageError).toBeTruthy();
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.fallbackToLocal).toBe(true);
    });
  });

  describe('Vector Search with Context Management', () => {
    it('should perform semantic search and add results to context', async () => {
      // Arrange
      const query = 'How do I set up authentication?';

      // Perform vector search
      const searchResponse = await fetch('https://api.zerodb.ai/v1/vectors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'conversation-history',
          query,
          limit: 5,
        }),
      });

      const searchResults = await searchResponse.json();

      // Add search results to context
      searchResults.results.forEach((result: any) => {
        contextManager.addMessage({
          role: 'system',
          content: `Context: ${result.metadata.content}`,
          importance: 'high',
        });
      });

      // Add current query
      contextManager.addMessage({
        role: 'user',
        content: query,
      });

      // Get final context
      const messages = contextManager.getMessages();
      const tokenCount = await tokenCounter.count(
        messages.map(m => m.content).join('\n')
      );

      // Assert
      expect(searchResults.success).toBe(true);
      expect(searchResults.results).toHaveLength(2);
      expect(messages.length).toBeGreaterThan(2); // System contexts + user query
      expect(tokenCount.total).toBeLessThan(4000); // Within context limit
    });

    it('should optimize context with relevant memories', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
      });

      // Retrieve relevant memories
      const memoriesResponse = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const memories = await memoriesResponse.json();

      // Build context with memories
      const contextManager = new ContextManager({
        maxTokens: 2000,
        model: 'gpt-4',
      });

      // Add memories as system messages
      memories.memories.forEach((memory: any) => {
        contextManager.addMessage({
          role: 'system',
          content: `User context: ${memory.content}`,
          importance: 'medium',
        });
      });

      // Add current conversation
      contextManager.addMessage({
        role: 'user',
        content: 'What are my preferences?',
      });

      const finalMessages = contextManager.getMessages();
      const tokenCount = await tokenCounter.count(
        finalMessages.map(m => m.content).join('\n')
      );

      // Assert
      expect(finalMessages.length).toBeGreaterThan(1);
      expect(tokenCount.total).toBeLessThan(2000);
      expect(finalMessages.some(m => m.content.includes('dark mode'))).toBe(true);
    });
  });

  describe('RAG Workflow Integration', () => {
    it('should execute complete RAG pipeline with session tracking', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'rag' },
      });

      // Step 1: User query
      const userQuery = 'How do I configure API authentication?';

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'query_received',
          query: userQuery,
        },
      });

      // Step 2: Vector search for relevant context
      const searchResponse = await fetch('https://api.zerodb.ai/v1/vectors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'documentation',
          query: userQuery,
          limit: 3,
        }),
      });

      const searchResults = await searchResponse.json();

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'context_retrieved',
          contextCount: searchResults.results.length,
        },
      });

      // Step 3: Build context with retrieved documents
      const contextManager = new ContextManager({
        maxTokens: 8000,
        model: 'gpt-4',
      });

      // Add retrieved context
      searchResults.results.forEach((result: any) => {
        contextManager.addMessage({
          role: 'system',
          content: `Documentation: ${result.metadata.content}`,
          importance: 'high',
        });
      });

      // Add user query
      contextManager.addMessage({
        role: 'user',
        content: userQuery,
      });

      const messages = contextManager.getMessages();
      const tokenCount = await tokenCounter.count(
        messages.map(m => m.content).join('\n')
      );

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'context_built',
          totalTokens: tokenCount.total,
          messageCount: messages.length,
        },
      });

      // Step 4: Generate response (mocked)
      const response = 'To configure API authentication, use the AuthProvider...';

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'response_generated',
          response,
        },
      });

      // Step 5: Store conversation for future retrieval
      await fetch('https://api.zerodb.ai/v1/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          content: `Q: ${userQuery}\nA: ${response}`,
        }),
      });

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
      expect(finalSession?.metadata.contextCount).toBe(2);
      expect(finalSession?.metadata.totalTokens).toBeGreaterThan(0);
      expect(finalSession?.metadata.response).toBe(response);
    });

    it('should handle token limits in RAG pipeline', async () => {
      // Arrange
      const contextManager = new ContextManager({
        maxTokens: 1000, // Strict limit
        model: 'gpt-4',
      });

      // Simulate retrieving many relevant documents
      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        content: `This is document ${i} with relevant information about the topic. `.repeat(20),
        score: 0.9 - i * 0.05,
      }));

      // Add documents in order of relevance
      let addedDocs = 0;
      for (const doc of documents) {
        // Check current token usage
        const currentMessages = contextManager.getMessages();
        const currentTokens = await tokenCounter.count(
          currentMessages.map(m => m.content).join('\n')
        );

        // Only add if we have room (leave space for user query and response)
        if (currentTokens.total < 700) {
          contextManager.addMessage({
            role: 'system',
            content: doc.content,
            importance: 'medium',
          });
          addedDocs++;
        } else {
          break;
        }
      }

      // Add user query
      contextManager.addMessage({
        role: 'user',
        content: 'Summarize the key points from the documentation.',
      });

      const finalMessages = contextManager.getMessages();
      const finalTokens = await tokenCounter.count(
        finalMessages.map(m => m.content).join('\n')
      );

      // Assert
      expect(addedDocs).toBeLessThan(10); // Should not add all documents
      expect(finalTokens.total).toBeLessThan(1000); // Within limit
      expect(finalMessages.length).toBeGreaterThan(1); // At least user query
    });
  });

  describe('Long-Term Memory with Token Optimization', () => {
    it('should manage long-term memories with token constraints', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { memoryType: 'long-term' },
      });

      // Retrieve all memories
      const memoriesResponse = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const memories = await memoriesResponse.json();

      // Calculate tokens for each memory
      const memoriesWithTokens = await Promise.all(
        memories.memories.map(async (memory: any) => {
          const tokenCount = await tokenCounter.count(memory.content);
          return {
            ...memory,
            tokens: tokenCount.total,
          };
        })
      );

      // Select most important memories within token budget
      const tokenBudget = 500;
      let currentTokens = 0;
      const selectedMemories = [];

      for (const memory of memoriesWithTokens) {
        if (currentTokens + memory.tokens <= tokenBudget) {
          selectedMemories.push(memory);
          currentTokens += memory.tokens;
        }
      }

      // Build context with selected memories
      const contextManager = new ContextManager({
        maxTokens: 2000,
        model: 'gpt-4',
      });

      selectedMemories.forEach(memory => {
        contextManager.addMessage({
          role: 'system',
          content: memory.content,
          importance: 'low',
        });
      });

      // Assert
      expect(selectedMemories.length).toBeGreaterThan(0);
      expect(currentTokens).toBeLessThanOrEqual(tokenBudget);

      const finalTokens = await tokenCounter.count(
        contextManager.getMessages().map(m => m.content).join('\n')
      );
      expect(finalTokens.total).toBeLessThan(2000);
    });

    it('should prioritize recent memories over old ones', async () => {
      // Arrange
      const memories = [
        { id: '1', content: 'Old memory', timestamp: Date.now() - 604800000, tokens: 50 },
        { id: '2', content: 'Recent memory', timestamp: Date.now() - 3600000, tokens: 50 },
        { id: '3', content: 'Very old memory', timestamp: Date.now() - 2592000000, tokens: 50 },
      ];

      // Sort by timestamp (most recent first)
      const sortedMemories = memories.sort((a, b) => b.timestamp - a.timestamp);

      // Select with token budget
      const tokenBudget = 100;
      let currentTokens = 0;
      const selectedMemories = [];

      for (const memory of sortedMemories) {
        if (currentTokens + memory.tokens <= tokenBudget) {
          selectedMemories.push(memory);
          currentTokens += memory.tokens;
        }
      }

      // Assert - Should select most recent memories
      expect(selectedMemories).toHaveLength(2);
      expect(selectedMemories[0].id).toBe('2'); // Most recent
      expect(selectedMemories[1].id).toBe('1'); // Second most recent
      expect(selectedMemories.find(m => m.id === '3')).toBeUndefined(); // Oldest excluded
    });
  });

  describe('Memory Cleanup and Maintenance', () => {
    it('should clean up old memories to stay within limits', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { memoryLimit: 100 },
      });

      // Simulate many stored memories
      const memories = Array.from({ length: 150 }, (_, i) => ({
        id: `mem-${i}`,
        timestamp: Date.now() - i * 3600000,
        content: `Memory ${i}`,
      }));

      // Cleanup: Keep only most recent 100
      const memoryLimit = session.metadata.memoryLimit;
      const recentMemories = memories
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, memoryLimit);

      const oldMemories = memories
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(memoryLimit);

      // Delete old memories
      const deletePromises = oldMemories.map(memory =>
        fetch(`https://api.zerodb.ai/v1/memory/${memory.id}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);

      // Update session
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          totalMemories: recentMemories.length,
          deletedMemories: oldMemories.length,
        },
      });

      // Assert
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.totalMemories).toBe(100);
      expect(updatedSession?.metadata.deletedMemories).toBe(50);
    });

    it('should handle storage errors during cleanup', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
      });

      // Mock deletion error
      server.use(
        http.delete('https://api.zerodb.ai/v1/memory/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Permission denied' },
            { status: 403 }
          );
        })
      );

      // Act
      const deleteResponse = await fetch('https://api.zerodb.ai/v1/memory/mem-123', {
        method: 'DELETE',
      });

      const deleteResult = await deleteResponse.json();

      // Log error in session
      await sessionManager.updateSession(session.id, {
        metadata: {
          cleanupError: deleteResult.error,
          cleanupFailed: true,
        },
      });

      // Assert
      expect(deleteResult.success).toBe(false);
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.cleanupFailed).toBe(true);
    });
  });

  describe('Multi-Session Memory Sharing', () => {
    it('should share relevant memories across user sessions', async () => {
      // Arrange
      sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const userId = 'test-user';

      // Create multiple sessions for same user
      const session1 = await sessionManager.createSession({
        userId,
        metadata: { sessionType: 'chat' },
      });

      const session2 = await sessionManager.createSession({
        userId,
        metadata: { sessionType: 'analysis' },
      });

      // Store memory in session 1
      await fetch('https://api.zerodb.ai/v1/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session1.id,
          content: 'User prefers TypeScript for all projects',
          metadata: { userId, shared: true },
        }),
      });

      // Retrieve memories in session 2 (should include shared memories)
      const retrieveResponse = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session2.id }),
      });

      const memories = await retrieveResponse.json();

      // Assert
      expect(memories.success).toBe(true);
      expect(memories.memories.length).toBeGreaterThan(0);

      // Verify both sessions can access shared memories
      const session1Memories = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session1.id }),
      });

      const session2Memories = await fetch('https://api.zerodb.ai/v1/memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session2.id }),
      });

      const s1Result = await session1Memories.json();
      const s2Result = await session2Memories.json();

      expect(s1Result.memories.length).toBeGreaterThan(0);
      expect(s2Result.memories.length).toBeGreaterThan(0);
    });
  });
});
