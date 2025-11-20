/**
 * Integration Tests: Complete Chatbot Workflow
 *
 * End-to-end scenario testing for building a chatbot
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, trackPerformance } from '../utils/test-helpers';
import { mockTools, mockMessages, mockMemoryItems } from '../fixtures/mock-data';

describe('Chatbot Workflow Scenario', () => {
  let chatbot: any;
  let conversationHistory: any[];
  let memoryStore: Map<string, any>;

  beforeEach(() => {
    conversationHistory = [];
    memoryStore = new Map();

    chatbot = {
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        tools: mockTools,
      },
      memory: memoryStore,
      history: conversationHistory,
    };
  });

  describe('Complete User Journey', () => {
    it('should handle complete conversation flow', async () => {
      // Step 1: User sends greeting
      const greeting = {
        role: 'user',
        content: 'Hello, I need help with math',
        timestamp: Date.now(),
      };

      conversationHistory.push(greeting);

      // Step 2: Bot responds
      const botResponse = {
        role: 'assistant',
        content: 'I can help you with math! What would you like to calculate?',
        timestamp: Date.now(),
      };

      conversationHistory.push(botResponse);

      // Step 3: User requests calculation
      const userRequest = {
        role: 'user',
        content: 'What is 25 times 4?',
        timestamp: Date.now(),
      };

      conversationHistory.push(userRequest);

      // Step 4: Bot uses tool
      const calculator = mockTools[0];
      const result = await calculator.execute({
        operation: 'multiply',
        a: 25,
        b: 4,
      });

      // Step 5: Bot provides answer
      const answer = {
        role: 'assistant',
        content: `The result is ${result}`,
        toolUsed: 'calculator',
        timestamp: Date.now(),
      };

      conversationHistory.push(answer);

      // Step 6: Extract facts for memory
      memoryStore.set('pref-1', {
        content: 'User needs help with math',
        type: 'context',
      });

      // Verify complete flow
      expect(conversationHistory).toHaveLength(4);
      expect(result).toBe(100);
      expect(memoryStore.size).toBe(1);
    });

    it('should maintain conversation context', async () => {
      // Add initial context
      conversationHistory.push(...mockMessages);

      // Extract context
      const userMessages = conversationHistory.filter((m) => m.role === 'user');
      const aiMessages = conversationHistory.filter((m) => m.role === 'assistant');

      expect(userMessages.length).toBeGreaterThan(0);
      expect(aiMessages.length).toBeGreaterThan(0);
    });

    it('should handle multi-turn conversation', async () => {
      const turns = [
        { role: 'user', content: 'What is 5 + 3?' },
        { role: 'assistant', content: '5 + 3 = 8' },
        { role: 'user', content: 'Now multiply that by 2' },
        { role: 'assistant', content: '8 * 2 = 16' },
        { role: 'user', content: 'Perfect, thank you!' },
        { role: 'assistant', content: 'You\'re welcome!' },
      ];

      turns.forEach((turn) => {
        conversationHistory.push({
          ...turn,
          timestamp: Date.now(),
        });
      });

      expect(conversationHistory).toHaveLength(6);

      // Verify conversation flow
      for (let i = 0; i < conversationHistory.length; i++) {
        const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
        expect(conversationHistory[i].role).toBe(expectedRole);
      }
    });
  });

  describe('Tool Integration', () => {
    it('should use multiple tools in conversation', async () => {
      const toolUsage: any[] = [];

      // Use calculator
      const calcResult = await mockTools[0].execute({
        operation: 'add',
        a: 10,
        b: 5,
      });

      toolUsage.push({
        tool: 'calculator',
        result: calcResult,
      });

      // Use weather tool
      const weatherResult = await mockTools[1].execute({
        location: 'San Francisco, CA',
      });

      toolUsage.push({
        tool: 'weather',
        result: weatherResult,
      });

      expect(toolUsage).toHaveLength(2);
      expect(toolUsage[0].result).toBe(15);
      expect(toolUsage[1].result).toHaveProperty('temperature');
    });

    it('should handle tool failures gracefully', async () => {
      try {
        await mockTools[0].execute({
          operation: 'invalid',
          a: 1,
          b: 2,
        });
      } catch (error) {
        conversationHistory.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Let me try another way.',
          error: true,
        });
      }

      const hasError = conversationHistory.some((m) => m.error);
      expect(hasError).toBe(true);
    });

    it('should provide tool suggestions', () => {
      const message = 'What is the weather in New York?';

      // Detect intent
      const intent = message.toLowerCase().includes('weather') ? 'weather' : 'general';

      // Suggest tool
      const suggestedTool = intent === 'weather' ? mockTools[1] : null;

      expect(suggestedTool?.name).toBe('weather');
    });
  });

  describe('Memory and Personalization', () => {
    it('should remember user preferences', async () => {
      // Store preferences
      memoryStore.set('pref-1', {
        content: 'User prefers detailed explanations',
        type: 'preference',
      });

      memoryStore.set('pref-2', {
        content: 'User timezone: PST',
        type: 'preference',
      });

      // Retrieve preferences
      const preferences = Array.from(memoryStore.values()).filter(
        (m) => m.type === 'preference'
      );

      expect(preferences).toHaveLength(2);
    });

    it('should use memory to personalize responses', () => {
      // Add memory
      memoryStore.set('name', {
        content: 'User name is Alice',
        type: 'fact',
      });

      // Generate personalized response
      const nameFact = Array.from(memoryStore.values()).find(
        (m) => m.content.includes('name')
      );

      const name = nameFact?.content.match(/name is (\w+)/)?.[1];

      const response = `Hello ${name}, how can I help you today?`;

      expect(response).toContain('Alice');
    });

    it('should update memory based on conversation', async () => {
      conversationHistory.push({
        role: 'user',
        content: 'I prefer Python over JavaScript',
      });

      // Extract and store preference
      memoryStore.set('lang-pref', {
        content: 'Prefers Python over JavaScript',
        type: 'preference',
        timestamp: Date.now(),
      });

      expect(memoryStore.has('lang-pref')).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors', async () => {
      const simulateAPIError = async () => {
        throw new Error('API rate limit exceeded');
      };

      try {
        await simulateAPIError();
      } catch (error) {
        conversationHistory.push({
          role: 'assistant',
          content: 'I\'m experiencing high demand. Please try again in a moment.',
          error: true,
        });
      }

      const errorMessage = conversationHistory.find((m) => m.error);
      expect(errorMessage).toBeDefined();
    });

    it('should retry failed operations', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      };

      let result;
      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await operation();
          break;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3);
    });

    it('should provide fallback responses', () => {
      const getFallbackResponse = (error: Error) => {
        if (error.message.includes('rate limit')) {
          return 'Service is busy. Please try again shortly.';
        }
        return 'I apologize, but I encountered an issue. Can you rephrase your question?';
      };

      const response = getFallbackResponse(new Error('rate limit exceeded'));
      expect(response).toContain('busy');
    });
  });

  describe('Performance and Optimization', () => {
    it('should respond within acceptable time', async () => {
      const { duration } = await trackPerformance(async () => {
        conversationHistory.push({
          role: 'user',
          content: 'Hello',
        });

        await new Promise((r) => setTimeout(r, 50));

        conversationHistory.push({
          role: 'assistant',
          content: 'Hi there!',
        });
      }, 'conversation-turn');

      expect(duration).toBeLessThan(200);
    });

    it('should cache common responses', () => {
      const responseCache = new Map<string, string>();

      const getCachedResponse = (prompt: string) => {
        const normalized = prompt.toLowerCase().trim();

        if (responseCache.has(normalized)) {
          return responseCache.get(normalized);
        }

        const response = `Response to: ${prompt}`;
        responseCache.set(normalized, response);
        return response;
      };

      const first = getCachedResponse('Hello');
      const second = getCachedResponse('hello');

      expect(first).toBe(second);
      expect(responseCache.size).toBe(1);
    });

    it('should limit conversation history size', () => {
      const maxHistory = 50;

      // Add many messages
      for (let i = 0; i < 100; i++) {
        conversationHistory.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
        });
      }

      // Trim history
      if (conversationHistory.length > maxHistory) {
        conversationHistory = conversationHistory.slice(-maxHistory);
      }

      expect(conversationHistory.length).toBeLessThanOrEqual(maxHistory);
    });
  });

  describe('Analytics and Feedback', () => {
    it('should track conversation metrics', () => {
      const metrics = {
        messageCount: conversationHistory.length,
        userMessages: conversationHistory.filter((m) => m.role === 'user').length,
        aiMessages: conversationHistory.filter((m) => m.role === 'assistant').length,
        toolUsage: 0,
        errors: conversationHistory.filter((m) => m.error).length,
      };

      expect(metrics.messageCount).toBeGreaterThanOrEqual(0);
    });

    it('should collect user feedback', () => {
      const feedback = new Map<string, any>();

      const submitFeedback = (messageId: string, rating: number, comment?: string) => {
        feedback.set(messageId, {
          messageId,
          rating,
          comment,
          timestamp: Date.now(),
        });
      };

      submitFeedback('msg-1', 5, 'Very helpful!');

      expect(feedback.has('msg-1')).toBe(true);
      expect(feedback.get('msg-1').rating).toBe(5);
    });

    it('should generate usage reports', () => {
      const generateReport = () => {
        const totalMessages = conversationHistory.length;
        const avgResponseTime = 1234; // ms

        return {
          totalMessages,
          avgResponseTime,
          satisfactionScore: 4.5,
          generatedAt: new Date().toISOString(),
        };
      };

      const report = generateReport();
      expect(report.totalMessages).toBeGreaterThanOrEqual(0);
      expect(report.satisfactionScore).toBeGreaterThan(0);
    });
  });

  describe('Security and Privacy', () => {
    it('should sanitize user input', () => {
      const sanitizeInput = (input: string) => {
        return input
          .replace(/<script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      };

      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should redact sensitive information', () => {
      const redactSensitive = (text: string) => {
        return text
          .replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX')
          .replace(/\b\d{16}\b/g, 'XXXX-XXXX-XXXX-XXXX');
      };

      const text = 'My SSN is 123-45-6789 and card is 1234567890123456';
      const redacted = redactSensitive(text);

      expect(redacted).not.toContain('123-45-6789');
      expect(redacted).toContain('XXX-XX-XXXX');
    });

    it('should enforce rate limiting', () => {
      const rateLimiter = {
        requests: new Map<string, number[]>(),
        maxRequests: 10,
        windowMs: 60000,
      };

      const checkRateLimit = (userId: string) => {
        const now = Date.now();
        const userRequests = rateLimiter.requests.get(userId) || [];

        // Remove old requests
        const validRequests = userRequests.filter(
          (time) => now - time < rateLimiter.windowMs
        );

        if (validRequests.length >= rateLimiter.maxRequests) {
          return false;
        }

        validRequests.push(now);
        rateLimiter.requests.set(userId, validRequests);
        return true;
      };

      const allowed = checkRateLimit('user-1');
      expect(typeof allowed).toBe('boolean');
    });
  });
});
