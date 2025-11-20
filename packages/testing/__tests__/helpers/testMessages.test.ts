/**
 * Tests for test message helpers
 */

import { describe, it, expect } from 'vitest';
import {
  createTestMessage,
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createToolMessage,
  createTestConversation,
} from '../../src/helpers/testMessages';

describe('Test Message Helpers', () => {
  describe('createTestMessage', () => {
    it('should create a message with defaults', () => {
      const message = createTestMessage();

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Test message content');
    });

    it('should create a message with custom options', () => {
      const message = createTestMessage({
        role: 'assistant',
        content: 'Custom content',
        id: 'custom-id',
        timestamp: 12345,
      });

      expect(message.id).toBe('custom-id');
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Custom content');
      expect(message.timestamp).toBe(12345);
    });

    it('should include tool calls when provided', () => {
      const toolCalls = [
        {
          id: 'call-1',
          name: 'test_tool',
          parameters: { key: 'value' },
        },
      ];

      const message = createTestMessage({
        role: 'assistant',
        toolCalls,
      });

      expect(message.toolCalls).toEqual(toolCalls);
    });

    it('should include tool call ID and name for tool messages', () => {
      const message = createTestMessage({
        role: 'tool',
        toolCallId: 'call-123',
        name: 'get_weather',
      });

      expect(message.toolCallId).toBe('call-123');
      expect(message.name).toBe('get_weather');
    });
  });

  describe('createUserMessage', () => {
    it('should create a user message', () => {
      const message = createUserMessage('Hello!');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello!');
    });

    it('should accept options', () => {
      const message = createUserMessage('Hello!', { id: 'user-1' });

      expect(message.id).toBe('user-1');
    });
  });

  describe('createAssistantMessage', () => {
    it('should create an assistant message', () => {
      const message = createAssistantMessage('Hi there!');

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hi there!');
    });

    it('should accept options with tool calls', () => {
      const toolCalls = [
        {
          id: 'call-1',
          name: 'test',
          parameters: {},
        },
      ];

      const message = createAssistantMessage('Using tools', {
        toolCalls,
      });

      expect(message.toolCalls).toEqual(toolCalls);
    });
  });

  describe('createSystemMessage', () => {
    it('should create a system message', () => {
      const message = createSystemMessage('You are a helpful assistant');

      expect(message.role).toBe('system');
      expect(message.content).toBe('You are a helpful assistant');
    });
  });

  describe('createToolMessage', () => {
    it('should create a tool message', () => {
      const message = createToolMessage(
        'call-123',
        'get_weather',
        JSON.stringify({ temp: 72 })
      );

      expect(message.role).toBe('tool');
      expect(message.toolCallId).toBe('call-123');
      expect(message.name).toBe('get_weather');
      expect(message.content).toBe(JSON.stringify({ temp: 72 }));
    });
  });

  describe('createTestConversation', () => {
    it('should create a conversation from message configs', () => {
      const conversation = createTestConversation([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'How are you?' },
      ]);

      expect(conversation).toHaveLength(3);
      expect(conversation[0].role).toBe('user');
      expect(conversation[1].role).toBe('assistant');
      expect(conversation[2].role).toBe('user');
    });

    it('should handle tool messages in conversation', () => {
      const conversation = createTestConversation([
        { role: 'user', content: 'What is the weather?' },
        { role: 'tool', content: '{"temp": 72}', toolCallId: 'call-1', name: 'get_weather' },
      ]);

      expect(conversation).toHaveLength(2);
      expect(conversation[1].role).toBe('tool');
      expect(conversation[1].toolCallId).toBe('call-1');
      expect(conversation[1].name).toBe('get_weather');
    });
  });
});
