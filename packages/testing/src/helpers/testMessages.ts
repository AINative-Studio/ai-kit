/**
 * Helper functions for creating test messages
 */

import type { Message, CreateTestMessageOptions } from '../types';

/**
 * Create a test message with sensible defaults
 */
export function createTestMessage(
  options: CreateTestMessageOptions = {}
): Message {
  const {
    role = 'user',
    content = 'Test message content',
    id,
    timestamp,
    toolCalls,
    toolCallId,
    name,
  } = options;

  const message: Message = {
    id: id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: timestamp || Date.now(),
  };

  if (toolCalls) {
    message.toolCalls = toolCalls;
  }

  if (toolCallId) {
    message.toolCallId = toolCallId;
  }

  if (name) {
    message.name = name;
  }

  return message;
}

/**
 * Create a user message
 */
export function createUserMessage(content: string, options?: Partial<CreateTestMessageOptions>): Message {
  return createTestMessage({
    ...options,
    role: 'user',
    content,
  });
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(
  content: string,
  options?: Partial<CreateTestMessageOptions>
): Message {
  return createTestMessage({
    ...options,
    role: 'assistant',
    content,
  });
}

/**
 * Create a system message
 */
export function createSystemMessage(content: string, options?: Partial<CreateTestMessageOptions>): Message {
  return createTestMessage({
    ...options,
    role: 'system',
    content,
  });
}

/**
 * Create a tool message
 */
export function createToolMessage(
  toolCallId: string,
  toolName: string,
  content: string,
  options?: Partial<CreateTestMessageOptions>
): Message {
  return createTestMessage({
    ...options,
    role: 'tool',
    content,
    toolCallId,
    name: toolName,
  });
}

/**
 * Create a conversation (array of messages)
 */
export function createTestConversation(messages: Array<{
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}>): Message[] {
  return messages.map((msg) =>
    createTestMessage({
      role: msg.role,
      content: msg.content,
      toolCallId: msg.toolCallId,
      name: msg.name,
    })
  );
}
