/**
 * Tests for UsageTracker
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsageTracker } from '../../src/tracking/UsageTracker';
import { InMemoryStorage } from '../../src/tracking/InMemoryStorage';
import { FileStorage } from '../../src/tracking/FileStorage';
import { calculateCost, detectProvider } from '../../src/tracking/pricing';
import { aggregateRecords, filterRecords, exportToFormat } from '../../src/tracking/utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker({
      enabled: true,
      storage: 'memory',
    });
  });

  afterEach(() => {
    tracker.destroy();
  });

  describe('Basic tracking', () => {
    it('should track a successful API call', async () => {
      const record = await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
      });

      expect(record.id).toBeDefined();
      expect(record.timestamp).toBeInstanceOf(Date);
      expect(record.provider).toBe('openai');
      expect(record.model).toBe('gpt-4');
      expect(record.promptTokens).toBe(100);
      expect(record.completionTokens).toBe(50);
      expect(record.totalTokens).toBe(150);
      expect(record.durationMs).toBe(1000);
      expect(record.success).toBe(true);
      expect(record.cost.totalCost).toBeGreaterThan(0);
    });

    it('should track a failed API call', async () => {
      const record = await tracker.trackFailure({
        model: 'claude-3-opus',
        promptTokens: 200,
        completionTokens: 0,
        durationMs: 500,
        error: 'API rate limit exceeded',
      });

      expect(record.success).toBe(false);
      expect(record.error).toBe('API rate limit exceeded');
      expect(record.provider).toBe('anthropic');
    });

    it('should track with user and conversation IDs', async () => {
      const record = await tracker.trackSuccess({
        model: 'gpt-3.5-turbo',
        promptTokens: 50,
        completionTokens: 25,
        durationMs: 300,
        userId: 'user-123',
        conversationId: 'conv-456',
      });

      expect(record.userId).toBe('user-123');
      expect(record.conversationId).toBe('conv-456');
    });

    it('should track with metadata', async () => {
      const record = await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
        metadata: { endpoint: '/api/chat', version: '1.0' },
      });

      expect(record.metadata).toEqual({ endpoint: '/api/chat', version: '1.0' });
    });

    it('should auto-detect provider from model name', async () => {
      const gptRecord = await tracker.trackSuccess({
        model: 'gpt-4-turbo',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
      });

      const claudeRecord = await tracker.trackSuccess({
        model: 'claude-3-sonnet',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
      });

      expect(gptRecord.provider).toBe('openai');
      expect(claudeRecord.provider).toBe('anthropic');
    });
  });

  describe('Retrieving records', () => {
    beforeEach(async () => {
      // Add some test records
      await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
        userId: 'user-1',
        conversationId: 'conv-1',
      });

      await tracker.trackSuccess({
        model: 'gpt-3.5-turbo',
        promptTokens: 50,
        completionTokens: 25,
        durationMs: 500,
        userId: 'user-1',
        conversationId: 'conv-1',
      });

      await tracker.trackSuccess({
        model: 'claude-3-opus',
        promptTokens: 200,
        completionTokens: 100,
        durationMs: 1500,
        userId: 'user-2',
        conversationId: 'conv-2',
      });

      await tracker.trackFailure({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 0,
        durationMs: 100,
        error: 'Timeout',
        userId: 'user-1',
      });
    });

    it('should retrieve all records', async () => {
      const records = await tracker.getRecords();
      expect(records).toHaveLength(4);
    });

    it('should filter by user ID', async () => {
      const records = await tracker.getRecords({ userId: 'user-1' });
      expect(records).toHaveLength(3);
      expect(records.every((r) => r.userId === 'user-1')).toBe(true);
    });

    it('should filter by conversation ID', async () => {
      const records = await tracker.getRecords({ conversationId: 'conv-1' });
      expect(records).toHaveLength(2);
      expect(records.every((r) => r.conversationId === 'conv-1')).toBe(true);
    });

    it('should filter by provider', async () => {
      const records = await tracker.getRecords({ provider: 'openai' });
      expect(records).toHaveLength(3);
      expect(records.every((r) => r.provider === 'openai')).toBe(true);
    });

    it('should filter by model', async () => {
      const records = await tracker.getRecords({ model: 'gpt-4' });
      expect(records).toHaveLength(2);
      expect(records.every((r) => r.model === 'gpt-4')).toBe(true);
    });

    it('should filter by success status', async () => {
      const successRecords = await tracker.getRecords({ success: true });
      const failureRecords = await tracker.getRecords({ success: false });

      expect(successRecords).toHaveLength(3);
      expect(failureRecords).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const records = await tracker.getRecords({
        startDate: yesterday,
        endDate: tomorrow,
      });

      expect(records).toHaveLength(4);
    });
  });

  describe('Aggregated statistics', () => {
    beforeEach(async () => {
      // Add test records
      await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
        userId: 'user-1',
      });

      await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 200,
        completionTokens: 100,
        durationMs: 2000,
        userId: 'user-1',
      });

      await tracker.trackSuccess({
        model: 'gpt-3.5-turbo',
        promptTokens: 50,
        completionTokens: 25,
        durationMs: 500,
        userId: 'user-2',
      });

      await tracker.trackFailure({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 0,
        durationMs: 100,
        error: 'Timeout',
      });
    });

    it('should aggregate total statistics', async () => {
      const stats = await tracker.getAggregated();

      expect(stats.totalRequests).toBe(4);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(1);
      expect(stats.totalPromptTokens).toBe(450);
      expect(stats.totalCompletionTokens).toBe(175);
      expect(stats.totalTokens).toBe(625);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.avgCostPerRequest).toBeGreaterThan(0);
      expect(stats.avgDurationMs).toBeGreaterThan(0);
    });

    it('should aggregate by provider', async () => {
      const stats = await tracker.getAggregated();

      expect(stats.byProvider.openai.totalRequests).toBe(4);
      expect(stats.byProvider.anthropic.totalRequests).toBe(0);
      expect(stats.byProvider.openai.successfulRequests).toBe(3);
      expect(stats.byProvider.openai.failedRequests).toBe(1);
    });

    it('should aggregate by model', async () => {
      const stats = await tracker.getAggregated();

      expect(stats.byModel['gpt-4'].totalRequests).toBe(3);
      expect(stats.byModel['gpt-3.5-turbo'].totalRequests).toBe(1);
      expect(stats.byModel['gpt-4'].successfulRequests).toBe(2);
      expect(stats.byModel['gpt-4'].failedRequests).toBe(1);
    });

    it('should aggregate by user', async () => {
      const stats = await tracker.getAggregated();

      expect(stats.byUser).toBeDefined();
      expect(stats.byUser!['user-1'].totalRequests).toBe(2);
      expect(stats.byUser!['user-2'].totalRequests).toBe(1);
    });

    it('should aggregate by date', async () => {
      const stats = await tracker.getAggregated();

      expect(stats.byDate).toBeDefined();
      const dates = Object.keys(stats.byDate!);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Export functionality', () => {
    beforeEach(async () => {
      await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
      });

      await tracker.trackSuccess({
        model: 'gpt-3.5-turbo',
        promptTokens: 50,
        completionTokens: 25,
        durationMs: 500,
      });
    });

    it('should export as JSON', async () => {
      const json = await tracker.export('json');
      const records = JSON.parse(json);

      expect(Array.isArray(records)).toBe(true);
      expect(records).toHaveLength(2);
    });

    it('should export as JSON Lines', async () => {
      const jsonl = await tracker.export('jsonl');
      const lines = jsonl.trim().split('\n');

      expect(lines).toHaveLength(2);
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });

    it('should export as CSV', async () => {
      const csv = await tracker.export('csv');
      const lines = csv.split('\n');

      expect(lines.length).toBeGreaterThan(2); // Header + 2 records
      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('model');
      expect(lines[0]).toContain('promptTokens');
    });
  });

  describe('Clear functionality', () => {
    it('should clear all records', async () => {
      await tracker.trackSuccess({
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        durationMs: 1000,
      });

      let records = await tracker.getRecords();
      expect(records).toHaveLength(1);

      await tracker.clear();

      records = await tracker.getRecords();
      expect(records).toHaveLength(0);
    });
  });

  describe('Wrap functionality', () => {
    it('should wrap a successful API call', async () => {
      const mockApiCall = async () => {
        return {
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
          },
          content: 'Test response',
        };
      };

      const result = await tracker.wrap(mockApiCall, {
        model: 'gpt-4',
        extractTokens: (r) => ({
          promptTokens: r.usage.prompt_tokens,
          completionTokens: r.usage.completion_tokens,
        }),
      });

      expect(result.content).toBe('Test response');

      const records = await tracker.getRecords();
      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(true);
      expect(records[0].promptTokens).toBe(100);
      expect(records[0].completionTokens).toBe(50);
    });

    it('should wrap a failed API call', async () => {
      const mockApiCall = async () => {
        throw new Error('API Error');
      };

      await expect(
        tracker.wrap(mockApiCall, {
          model: 'gpt-4',
          extractTokens: (r: any) => ({
            promptTokens: 0,
            completionTokens: 0,
          }),
        })
      ).rejects.toThrow('API Error');

      const records = await tracker.getRecords();
      expect(records).toHaveLength(1);
      expect(records[0].success).toBe(false);
      expect(records[0].error).toBe('API Error');
    });
  });
});

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage(100);
  });

  it('should store and retrieve records', async () => {
    const record = {
      id: '1',
      timestamp: new Date(),
      provider: 'openai' as const,
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD' as const,
      },
    };

    await storage.store(record);

    const records = await storage.getAll();
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual(record);
  });

  it('should respect max records limit', async () => {
    const smallStorage = new InMemoryStorage(2);

    await smallStorage.store({
      id: '1',
      timestamp: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD',
      },
    });

    await smallStorage.store({
      id: '2',
      timestamp: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD',
      },
    });

    await smallStorage.store({
      id: '3',
      timestamp: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD',
      },
    });

    const records = await smallStorage.getAll();
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe('2'); // First record should be evicted
  });
});

describe('FileStorage', () => {
  let storage: FileStorage;
  let testFilePath: string;

  beforeEach(() => {
    testFilePath = path.join(tmpdir(), `usage-test-${Date.now()}.jsonl`);
    storage = new FileStorage(testFilePath);
  });

  afterEach(async () => {
    try {
      await fs.unlink(testFilePath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it('should store and retrieve records from file', async () => {
    const record = {
      id: '1',
      timestamp: new Date(),
      provider: 'openai' as const,
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD' as const,
      },
    };

    await storage.store(record);

    const records = await storage.getAll();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('1');
    expect(records[0].model).toBe('gpt-4');
  });

  it('should persist records across instances', async () => {
    const record = {
      id: '1',
      timestamp: new Date(),
      provider: 'openai' as const,
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD' as const,
      },
    };

    await storage.store(record);

    // Create new instance with same file
    const storage2 = new FileStorage(testFilePath);
    const records = await storage2.getAll();

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('1');
  });

  it('should clear file', async () => {
    const record = {
      id: '1',
      timestamp: new Date(),
      provider: 'openai' as const,
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      durationMs: 1000,
      success: true,
      cost: {
        promptCost: 0.003,
        completionCost: 0.003,
        totalCost: 0.006,
        currency: 'USD' as const,
      },
    };

    await storage.store(record);
    await storage.clear();

    const records = await storage.getAll();
    expect(records).toHaveLength(0);
  });
});

describe('Pricing', () => {
  it('should calculate cost for GPT-4', () => {
    const cost = calculateCost('gpt-4', 'openai', 1000, 1000);

    expect(cost.promptCost).toBe(0.03);
    expect(cost.completionCost).toBe(0.06);
    expect(cost.totalCost).toBe(0.09);
    expect(cost.currency).toBe('USD');
  });

  it('should calculate cost for GPT-3.5-turbo', () => {
    const cost = calculateCost('gpt-3.5-turbo', 'openai', 1000, 1000);

    expect(cost.promptCost).toBe(0.0005);
    expect(cost.completionCost).toBe(0.0015);
    expect(cost.totalCost).toBe(0.002);
  });

  it('should calculate cost for Claude', () => {
    const cost = calculateCost('claude-3-opus', 'anthropic', 1000, 1000);

    expect(cost.promptCost).toBe(0.015);
    expect(cost.completionCost).toBe(0.075);
    expect(cost.totalCost).toBe(0.09);
  });

  it('should return zero cost for unknown model', () => {
    const cost = calculateCost('unknown-model', 'unknown', 1000, 1000);

    expect(cost.totalCost).toBe(0);
  });

  it('should detect OpenAI provider', () => {
    expect(detectProvider('gpt-4')).toBe('openai');
    expect(detectProvider('gpt-3.5-turbo')).toBe('openai');
    expect(detectProvider('text-embedding-ada-002')).toBe('openai');
  });

  it('should detect Anthropic provider', () => {
    expect(detectProvider('claude-3-opus')).toBe('anthropic');
    expect(detectProvider('claude-3-sonnet')).toBe('anthropic');
  });

  it('should return unknown for unrecognized models', () => {
    expect(detectProvider('some-random-model')).toBe('unknown');
  });
});

describe('Utility functions', () => {
  const createMockRecord = (overrides: any = {}) => ({
    id: '1',
    timestamp: new Date(),
    provider: 'openai' as const,
    model: 'gpt-4',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    durationMs: 1000,
    success: true,
    cost: {
      promptCost: 0.003,
      completionCost: 0.003,
      totalCost: 0.006,
      currency: 'USD' as const,
    },
    ...overrides,
  });

  describe('filterRecords', () => {
    it('should filter by userId', () => {
      const records = [
        createMockRecord({ userId: 'user-1' }),
        createMockRecord({ userId: 'user-2' }),
      ];

      const filtered = filterRecords(records, { userId: 'user-1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].userId).toBe('user-1');
    });

    it('should filter by model', () => {
      const records = [
        createMockRecord({ model: 'gpt-4' }),
        createMockRecord({ model: 'gpt-3.5-turbo' }),
      ];

      const filtered = filterRecords(records, { model: 'gpt-4' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].model).toBe('gpt-4');
    });
  });

  describe('aggregateRecords', () => {
    it('should aggregate empty array', () => {
      const stats = aggregateRecords([]);

      expect(stats.totalRequests).toBe(0);
      expect(stats.totalCost).toBe(0);
    });

    it('should aggregate multiple records', () => {
      const records = [
        createMockRecord({ promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
        createMockRecord({ promptTokens: 200, completionTokens: 100, totalTokens: 300 }),
      ];

      const stats = aggregateRecords(records);

      expect(stats.totalRequests).toBe(2);
      expect(stats.totalPromptTokens).toBe(300);
      expect(stats.totalCompletionTokens).toBe(150);
      expect(stats.totalTokens).toBe(450);
    });
  });

  describe('exportToFormat', () => {
    it('should export to JSON', () => {
      const records = [createMockRecord()];
      const json = exportToFormat(records, 'json');

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export to JSONL', () => {
      const records = [createMockRecord(), createMockRecord({ id: '2' })];
      const jsonl = exportToFormat(records, 'jsonl');

      const lines = jsonl.split('\n');
      expect(lines).toHaveLength(2);
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });

    it('should export to CSV', () => {
      const records = [createMockRecord()];
      const csv = exportToFormat(records, 'csv');

      expect(csv).toContain('id');
      expect(csv).toContain('model');
      expect(csv).toContain('promptTokens');
    });
  });
});
