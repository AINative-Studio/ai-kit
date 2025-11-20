/**
 * Test usage record fixtures
 */

import type { UsageRecord } from '../types';

/**
 * Successful OpenAI GPT-4 request
 */
export const gpt4SuccessRecord: UsageRecord = {
  id: 'usage-001',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  provider: 'openai',
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
  durationMs: 1200,
  success: true,
  cost: {
    promptCost: 0.003,
    completionCost: 0.003,
    totalCost: 0.006,
    currency: 'USD',
  },
  userId: 'user-123',
  conversationId: 'conv-456',
};

/**
 * Successful Anthropic Claude request
 */
export const claudeSuccessRecord: UsageRecord = {
  id: 'usage-002',
  timestamp: new Date('2024-01-15T10:05:00Z'),
  provider: 'anthropic',
  model: 'claude-3-opus',
  promptTokens: 200,
  completionTokens: 100,
  totalTokens: 300,
  durationMs: 1500,
  success: true,
  cost: {
    promptCost: 0.003,
    completionCost: 0.0075,
    totalCost: 0.0105,
    currency: 'USD',
  },
  userId: 'user-123',
  conversationId: 'conv-457',
};

/**
 * Failed request (rate limit)
 */
export const rateLimitErrorRecord: UsageRecord = {
  id: 'usage-003',
  timestamp: new Date('2024-01-15T10:10:00Z'),
  provider: 'openai',
  model: 'gpt-4',
  promptTokens: 50,
  completionTokens: 0,
  totalTokens: 50,
  durationMs: 100,
  success: false,
  error: 'Rate limit exceeded',
  cost: {
    promptCost: 0,
    completionCost: 0,
    totalCost: 0,
    currency: 'USD',
  },
  userId: 'user-456',
  conversationId: 'conv-458',
  metadata: {
    errorCode: 429,
    retryAfter: 60,
  },
};

/**
 * Failed request (timeout)
 */
export const timeoutErrorRecord: UsageRecord = {
  id: 'usage-004',
  timestamp: new Date('2024-01-15T10:15:00Z'),
  provider: 'anthropic',
  model: 'claude-3-sonnet',
  promptTokens: 150,
  completionTokens: 0,
  totalTokens: 150,
  durationMs: 30000,
  success: false,
  error: 'Request timeout',
  cost: {
    promptCost: 0,
    completionCost: 0,
    totalCost: 0,
    currency: 'USD',
  },
  userId: 'user-789',
};

/**
 * Large request (GPT-4)
 */
export const largeRequestRecord: UsageRecord = {
  id: 'usage-005',
  timestamp: new Date('2024-01-15T10:20:00Z'),
  provider: 'openai',
  model: 'gpt-4',
  promptTokens: 5000,
  completionTokens: 2000,
  totalTokens: 7000,
  durationMs: 8000,
  success: true,
  cost: {
    promptCost: 0.15,
    completionCost: 0.12,
    totalCost: 0.27,
    currency: 'USD',
  },
  userId: 'user-123',
  conversationId: 'conv-459',
  metadata: {
    contextWindow: 'large',
    cacheHit: false,
  },
};

/**
 * Batch of mixed usage records
 */
export const mixedUsageRecords: UsageRecord[] = [
  gpt4SuccessRecord,
  claudeSuccessRecord,
  rateLimitErrorRecord,
  timeoutErrorRecord,
  largeRequestRecord,
  {
    id: 'usage-006',
    timestamp: new Date('2024-01-15T10:25:00Z'),
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    promptTokens: 80,
    completionTokens: 40,
    totalTokens: 120,
    durationMs: 600,
    success: true,
    cost: {
      promptCost: 0.00008,
      completionCost: 0.00006,
      totalCost: 0.00014,
      currency: 'USD',
    },
    userId: 'user-456',
    conversationId: 'conv-460',
  },
];

/**
 * All usage record fixtures
 */
export const usageRecordFixtures = {
  gpt4Success: gpt4SuccessRecord,
  claudeSuccess: claudeSuccessRecord,
  rateLimitError: rateLimitErrorRecord,
  timeoutError: timeoutErrorRecord,
  largeRequest: largeRequestRecord,
  mixed: mixedUsageRecords,
};
