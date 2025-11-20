/**
 * Tests for test fixtures
 */

import { describe, it, expect } from 'vitest';
import {
  conversationFixtures,
  usageRecordFixtures,
} from '../../src/fixtures';

describe('Test Fixtures', () => {
  describe('Conversation Fixtures', () => {
    it('should provide simple Q&A conversation', () => {
      const conv = conversationFixtures.simpleQA;

      expect(conv).toHaveProperty('id');
      expect(conv).toHaveProperty('messages');
      expect(conv).toHaveProperty('usage');
      expect(conv.messages).toHaveLength(2);
      expect(conv.messages[0].role).toBe('user');
      expect(conv.messages[1].role).toBe('assistant');
    });

    it('should provide multi-turn conversation', () => {
      const conv = conversationFixtures.multiTurn;

      expect(conv.messages).toHaveLength(5);
      expect(conv.messages[0].role).toBe('system');
      expect(conv.messages[1].role).toBe('user');
      expect(conv.messages[2].role).toBe('assistant');
    });

    it('should provide tool call conversation', () => {
      const conv = conversationFixtures.toolCall;

      const toolCallMessage = conv.messages.find(
        (m) => m.toolCalls && m.toolCalls.length > 0
      );
      const toolMessage = conv.messages.find((m) => m.role === 'tool');

      expect(toolCallMessage).toBeDefined();
      expect(toolMessage).toBeDefined();
      expect(toolCallMessage?.toolCalls?.[0].name).toBe('get_weather');
    });

    it('should provide error conversation', () => {
      const conv = conversationFixtures.error;

      expect(conv.metadata?.error).toBeDefined();
      expect(conv.usage.completionTokens).toBe(0);
    });

    it('should provide long conversation', () => {
      const conv = conversationFixtures.long;

      expect(conv.messages.length).toBe(20);
      expect(conv.usage.totalTokens).toBeGreaterThan(500);
    });
  });

  describe('Usage Record Fixtures', () => {
    it('should provide GPT-4 success record', () => {
      const record = usageRecordFixtures.gpt4Success;

      expect(record.provider).toBe('openai');
      expect(record.model).toBe('gpt-4');
      expect(record.success).toBe(true);
      expect(record.cost.totalCost).toBeGreaterThan(0);
    });

    it('should provide Claude success record', () => {
      const record = usageRecordFixtures.claudeSuccess;

      expect(record.provider).toBe('anthropic');
      expect(record.model).toBe('claude-3-opus');
      expect(record.success).toBe(true);
    });

    it('should provide rate limit error record', () => {
      const record = usageRecordFixtures.rateLimitError;

      expect(record.success).toBe(false);
      expect(record.error).toBe('Rate limit exceeded');
      expect(record.metadata?.errorCode).toBe(429);
    });

    it('should provide timeout error record', () => {
      const record = usageRecordFixtures.timeoutError;

      expect(record.success).toBe(false);
      expect(record.error).toBe('Request timeout');
      expect(record.durationMs).toBe(30000);
    });

    it('should provide large request record', () => {
      const record = usageRecordFixtures.largeRequest;

      expect(record.promptTokens).toBeGreaterThan(1000);
      expect(record.completionTokens).toBeGreaterThan(1000);
      expect(record.cost.totalCost).toBeGreaterThan(0.1);
    });

    it('should provide mixed usage records array', () => {
      const records = usageRecordFixtures.mixed;

      expect(records.length).toBeGreaterThan(5);
      expect(records.some((r) => r.success)).toBe(true);
      expect(records.some((r) => !r.success)).toBe(true);
    });
  });
});
