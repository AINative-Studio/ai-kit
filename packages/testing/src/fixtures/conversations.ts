/**
 * Test conversation fixtures
 */

import type { TestConversation } from '../types';

/**
 * Simple Q&A conversation
 */
export const simpleQAConversation: TestConversation = {
  id: 'conv-qa-001',
  messages: [
    {
      id: 'msg-001',
      role: 'user',
      content: 'What is the capital of France?',
      timestamp: Date.now() - 2000,
    },
    {
      id: 'msg-002',
      role: 'assistant',
      content: 'The capital of France is Paris.',
      timestamp: Date.now() - 1000,
    },
  ],
  usage: {
    promptTokens: 10,
    completionTokens: 8,
    totalTokens: 18,
    estimatedCost: 0.0001,
  },
};

/**
 * Multi-turn conversation
 */
export const multiTurnConversation: TestConversation = {
  id: 'conv-multi-001',
  messages: [
    {
      id: 'msg-001',
      role: 'system',
      content: 'You are a helpful assistant.',
      timestamp: Date.now() - 10000,
    },
    {
      id: 'msg-002',
      role: 'user',
      content: 'Tell me about TypeScript.',
      timestamp: Date.now() - 8000,
    },
    {
      id: 'msg-003',
      role: 'assistant',
      content:
        'TypeScript is a strongly typed programming language that builds on JavaScript.',
      timestamp: Date.now() - 6000,
    },
    {
      id: 'msg-004',
      role: 'user',
      content: 'What are its main benefits?',
      timestamp: Date.now() - 4000,
    },
    {
      id: 'msg-005',
      role: 'assistant',
      content:
        'Main benefits include: 1) Static typing, 2) Better IDE support, 3) Enhanced code quality, 4) Easier refactoring.',
      timestamp: Date.now() - 2000,
    },
  ],
  usage: {
    promptTokens: 120,
    completionTokens: 85,
    totalTokens: 205,
    estimatedCost: 0.002,
  },
};

/**
 * Conversation with tool calls
 */
export const toolCallConversation: TestConversation = {
  id: 'conv-tool-001',
  messages: [
    {
      id: 'msg-001',
      role: 'user',
      content: 'What is the weather in San Francisco?',
      timestamp: Date.now() - 5000,
    },
    {
      id: 'msg-002',
      role: 'assistant',
      content: '',
      timestamp: Date.now() - 4000,
      toolCalls: [
        {
          id: 'call-001',
          name: 'get_weather',
          parameters: {
            location: 'San Francisco, CA',
            unit: 'fahrenheit',
          },
        },
      ],
    },
    {
      id: 'msg-003',
      role: 'tool',
      content: JSON.stringify({
        temperature: 65,
        condition: 'Partly cloudy',
        humidity: 70,
      }),
      name: 'get_weather',
      toolCallId: 'call-001',
      timestamp: Date.now() - 3000,
    },
    {
      id: 'msg-004',
      role: 'assistant',
      content:
        'The weather in San Francisco is currently 65°F and partly cloudy with 70% humidity.',
      timestamp: Date.now() - 1000,
    },
  ],
  usage: {
    promptTokens: 45,
    completionTokens: 32,
    totalTokens: 77,
    estimatedCost: 0.0008,
  },
};

/**
 * Error conversation
 */
export const errorConversation: TestConversation = {
  id: 'conv-error-001',
  messages: [
    {
      id: 'msg-001',
      role: 'user',
      content: 'Explain quantum computing',
      timestamp: Date.now() - 2000,
    },
  ],
  usage: {
    promptTokens: 5,
    completionTokens: 0,
    totalTokens: 5,
    estimatedCost: 0,
  },
  metadata: {
    error: 'Rate limit exceeded',
    errorCode: 429,
  },
};

/**
 * Long conversation
 */
export const longConversation: TestConversation = {
  id: 'conv-long-001',
  messages: Array.from({ length: 20 }, (_, i) => ({
    id: `msg-${i + 1}`,
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i + 1} content`,
    timestamp: Date.now() - (20 - i) * 1000,
  })),
  usage: {
    promptTokens: 500,
    completionTokens: 400,
    totalTokens: 900,
    estimatedCost: 0.009,
  },
};

/**
 * All conversation fixtures
 */
export const conversationFixtures = {
  simpleQA: simpleQAConversation,
  multiTurn: multiTurnConversation,
  toolCall: toolCallConversation,
  error: errorConversation,
  long: longConversation,
};
