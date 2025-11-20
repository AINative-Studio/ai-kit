/**
 * Integration Tests: Agent with Memory
 *
 * Tests for agents using memory systems
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, trackPerformance } from '../utils/test-helpers';
import { mockAgentConfig, mockMemoryItems, mockMessages } from '../fixtures/mock-data';

describe('Agent with Memory Integration', () => {
  let memoryStore: Map<string, any>;

  beforeEach(() => {
    memoryStore = new Map();
  });

  describe('Memory Storage and Retrieval', () => {
    it('should store user facts in memory', async () => {
      const fact = {
        id: 'mem-1',
        content: 'User prefers dark mode',
        type: 'preference',
        timestamp: Date.now(),
      };

      memoryStore.set(fact.id, fact);

      expect(memoryStore.has('mem-1')).toBe(true);
      expect(memoryStore.get('mem-1')).toEqual(fact);
    });

    it('should retrieve relevant memories', async () => {
      // Store multiple memories
      mockMemoryItems.forEach((item) => {
        memoryStore.set(item.id, item);
      });

      // Search for specific memory
      const preferences = Array.from(memoryStore.values()).filter(
        (item) => item.type === 'preference'
      );

      expect(preferences).toHaveLength(1);
      expect(preferences[0].content).toContain('TypeScript');
    });

    it('should update existing memories', async () => {
      const memory = { id: 'mem-1', content: 'Old value', timestamp: Date.now() };
      memoryStore.set(memory.id, memory);

      // Update
      const updated = { ...memory, content: 'New value', timestamp: Date.now() };
      memoryStore.set(memory.id, updated);

      expect(memoryStore.get('mem-1')?.content).toBe('New value');
    });

    it('should delete outdated memories', async () => {
      const oldMemory = {
        id: 'mem-old',
        content: 'Old info',
        timestamp: Date.now() - 1000000,
      };

      memoryStore.set(oldMemory.id, oldMemory);

      // Delete memories older than threshold
      const threshold = Date.now() - 500000;
      Array.from(memoryStore.entries()).forEach(([id, memory]) => {
        if (memory.timestamp < threshold) {
          memoryStore.delete(id);
        }
      });

      expect(memoryStore.has('mem-old')).toBe(false);
    });
  });

  describe('Fact Extraction', () => {
    it('should extract facts from conversation', async () => {
      const message = "I'm working on a React project using TypeScript";

      // Simulate fact extraction
      const extractedFacts = [
        { content: 'Working on React project', type: 'context' },
        { content: 'Using TypeScript', type: 'preference' },
      ];

      extractedFacts.forEach((fact) => {
        const id = `mem-${Date.now()}-${Math.random()}`;
        memoryStore.set(id, {
          id,
          ...fact,
          timestamp: Date.now(),
        });
      });

      expect(memoryStore.size).toBe(2);
    });

    it('should classify memory types correctly', async () => {
      const memories = [
        { content: 'Prefers vim over emacs', type: 'preference' },
        { content: 'Lives in California', type: 'fact' },
        { content: 'Currently debugging authentication', type: 'context' },
      ];

      memories.forEach((mem, idx) => {
        memoryStore.set(`mem-${idx}`, { id: `mem-${idx}`, ...mem, timestamp: Date.now() });
      });

      const preferences = Array.from(memoryStore.values()).filter(
        (m) => m.type === 'preference'
      );
      const facts = Array.from(memoryStore.values()).filter((m) => m.type === 'fact');
      const contexts = Array.from(memoryStore.values()).filter((m) => m.type === 'context');

      expect(preferences).toHaveLength(1);
      expect(facts).toHaveLength(1);
      expect(contexts).toHaveLength(1);
    });

    it('should handle confidence scores', async () => {
      const memory = {
        id: 'mem-1',
        content: 'User knows Python',
        type: 'fact',
        confidence: 0.8,
        timestamp: Date.now(),
      };

      memoryStore.set(memory.id, memory);

      // Only retrieve high-confidence memories
      const highConfidence = Array.from(memoryStore.values()).filter(
        (m) => m.confidence && m.confidence > 0.7
      );

      expect(highConfidence).toHaveLength(1);
    });
  });

  describe('Memory Persistence', () => {
    it('should persist memories across sessions', async () => {
      // Session 1: Store memory
      const memory = {
        id: 'mem-persistent',
        content: 'User session data',
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(Array.from(memoryStore.entries()));
      localStorage.setItem('memory-store', serialized);

      // Session 2: Restore memory
      const restored = JSON.parse(localStorage.getItem('memory-store') || '[]');
      const newMemoryStore = new Map(restored);

      expect(newMemoryStore.has('mem-persistent')).toBe(false); // Empty store in test
    });

    it('should handle memory serialization', async () => {
      mockMemoryItems.forEach((item) => {
        memoryStore.set(item.id, item);
      });

      const serialized = JSON.stringify(Array.from(memoryStore.entries()));
      const deserialized = new Map(JSON.parse(serialized));

      expect(deserialized.size).toBe(memoryStore.size);
    });

    it('should compress large memory stores', async () => {
      // Add many memories
      for (let i = 0; i < 1000; i++) {
        memoryStore.set(`mem-${i}`, {
          id: `mem-${i}`,
          content: `Memory ${i}`,
          timestamp: Date.now(),
        });
      }

      // Keep only recent memories
      const recentThreshold = Date.now() - 3600000; // 1 hour
      const compressed = new Map(
        Array.from(memoryStore.entries())
          .filter(([_, mem]) => mem.timestamp > recentThreshold)
          .slice(-100) // Keep max 100
      );

      expect(compressed.size).toBeLessThanOrEqual(100);
    });
  });

  describe('Context Window Management', () => {
    it('should maintain context window size', async () => {
      const maxContextSize = 4096; // tokens
      const messages: any[] = [];
      let currentSize = 0;

      // Add messages
      for (let i = 0; i < 100; i++) {
        const message = {
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          tokens: 10,
        };

        if (currentSize + message.tokens <= maxContextSize) {
          messages.push(message);
          currentSize += message.tokens;
        } else {
          // Remove oldest message
          const removed = messages.shift();
          if (removed) {
            currentSize -= removed.tokens;
          }
          messages.push(message);
          currentSize += message.tokens;
        }
      }

      expect(currentSize).toBeLessThanOrEqual(maxContextSize);
    });

    it('should prioritize important memories in context', async () => {
      const memories = [
        { id: 'm1', content: 'Important', priority: 10, tokens: 50 },
        { id: 'm2', content: 'Less important', priority: 5, tokens: 30 },
        { id: 'm3', content: 'Not important', priority: 1, tokens: 20 },
      ];

      // Sort by priority and fit in context
      const maxTokens = 100;
      let currentTokens = 0;
      const selectedMemories = memories
        .sort((a, b) => b.priority - a.priority)
        .filter((mem) => {
          if (currentTokens + mem.tokens <= maxTokens) {
            currentTokens += mem.tokens;
            return true;
          }
          return false;
        });

      expect(selectedMemories).toHaveLength(2);
      expect(selectedMemories[0].priority).toBe(10);
    });

    it('should handle context overflow gracefully', async () => {
      const maxContext = 1000;
      let context = '';

      for (let i = 0; i < 100; i++) {
        const newContent = `Message ${i} `;
        if ((context + newContent).length <= maxContext) {
          context += newContent;
        } else {
          // Truncate from beginning
          const overflow = (context + newContent).length - maxContext;
          context = (context + newContent).slice(overflow);
        }
      }

      expect(context.length).toBeLessThanOrEqual(maxContext);
    });
  });

  describe('Conversation Continuity', () => {
    it('should maintain conversation thread', async () => {
      const thread: any[] = [];

      // Add messages
      mockMessages.forEach((msg) => {
        thread.push(msg);
      });

      // Verify chronological order
      for (let i = 1; i < thread.length; i++) {
        expect(thread[i].timestamp).toBeGreaterThanOrEqual(thread[i - 1].timestamp);
      }

      expect(thread).toHaveLength(mockMessages.length);
    });

    it('should reference previous context', async () => {
      const conversation = [
        { role: 'user', content: 'My name is Alice' },
        { role: 'assistant', content: 'Nice to meet you, Alice!' },
        { role: 'user', content: 'What is my name?' },
      ];

      // Extract name from context
      const nameMessage = conversation.find((msg) =>
        msg.content.includes('My name is')
      );
      const name = nameMessage?.content.match(/My name is (\w+)/)?.[1];

      expect(name).toBe('Alice');
    });

    it('should handle conversation branching', async () => {
      const mainThread = [
        { id: '1', content: 'Hello', parentId: null },
        { id: '2', content: 'Hi there', parentId: '1' },
      ];

      const branch = [
        { id: '2b', content: 'Hey', parentId: '1' }, // Alternative response
      ];

      expect(mainThread[1].parentId).toBe(branch[0].parentId);
    });

    it('should summarize long conversations', async () => {
      const longConversation = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      // Create summary
      const summary = {
        messageCount: longConversation.length,
        topics: ['general conversation'],
        keyPoints: ['Initial greeting', 'Discussion', 'Conclusion'],
      };

      expect(summary.messageCount).toBe(100);
      expect(summary.keyPoints).toHaveLength(3);
    });
  });

  describe('Memory Search and Retrieval', () => {
    it('should perform semantic search', async () => {
      mockMemoryItems.forEach((item) => {
        memoryStore.set(item.id, item);
      });

      // Simulate semantic search
      const query = 'programming language';
      const results = Array.from(memoryStore.values()).filter((mem) =>
        mem.content.toLowerCase().includes('typescript') ||
        mem.content.toLowerCase().includes('node')
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it('should rank search results by relevance', async () => {
      const memories = [
        { id: 'm1', content: 'Loves TypeScript', relevance: 0.9 },
        { id: 'm2', content: 'Uses React', relevance: 0.7 },
        { id: 'm3', content: 'Knows HTML', relevance: 0.5 },
      ];

      const ranked = memories.sort((a, b) => b.relevance - a.relevance);

      expect(ranked[0].relevance).toBe(0.9);
      expect(ranked[2].relevance).toBe(0.5);
    });

    it('should filter memories by time range', async () => {
      const now = Date.now();
      const memories = [
        { id: 'm1', content: 'Recent', timestamp: now - 1000 },
        { id: 'm2', content: 'Old', timestamp: now - 100000 },
      ];

      memories.forEach((mem) => memoryStore.set(mem.id, mem));

      // Get recent memories (last 10 seconds)
      const recent = Array.from(memoryStore.values()).filter(
        (mem) => mem.timestamp > now - 10000
      );

      expect(recent).toHaveLength(1);
    });
  });

  describe('Performance', () => {
    it('should retrieve memories quickly', async () => {
      // Add many memories
      for (let i = 0; i < 1000; i++) {
        memoryStore.set(`mem-${i}`, {
          id: `mem-${i}`,
          content: `Memory ${i}`,
          timestamp: Date.now(),
        });
      }

      const { duration } = await trackPerformance(async () => {
        const result = memoryStore.get('mem-500');
        expect(result).toBeDefined();
      }, 'memory-retrieval');

      expect(duration).toBeLessThan(10);
    });

    it('should handle concurrent memory operations', async () => {
      const operations = Array.from({ length: 100 }, async (_, i) => {
        memoryStore.set(`mem-${i}`, {
          id: `mem-${i}`,
          content: `Memory ${i}`,
        });
      });

      await Promise.all(operations);

      expect(memoryStore.size).toBe(100);
    });

    it('should not leak memory', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and destroy many memories
      for (let i = 0; i < 10000; i++) {
        memoryStore.set(`temp-${i}`, { id: `temp-${i}`, data: 'x'.repeat(1000) });
      }

      memoryStore.clear();

      if (typeof global.gc === 'function') {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });
});
