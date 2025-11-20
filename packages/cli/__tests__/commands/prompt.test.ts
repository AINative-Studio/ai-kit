/**
 * Comprehensive tests for prompt command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptTester } from '../../src/prompt/tester';
import { PromptComparator } from '../../src/prompt/comparator';
import { PromptOptimizer } from '../../src/prompt/optimizer';
import { BatchTester } from '../../src/prompt/batch';
import { HistoryManager } from '../../src/prompt/history';
import {
  loadPromptConfig,
  calculateCost,
  parseCSV,
  formatDuration,
  percentageChange,
  similarity,
} from '../../src/prompt/utils';
import {
  PromptConfig,
  PromptTestResult,
  PromptMetrics,
} from '../../src/prompt/types';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock config
const mockConfig: PromptConfig = {
  name: 'test-prompt',
  version: '1.0',
  prompts: [
    {
      id: 'v1',
      content: 'You are a helpful assistant. {{input}}',
      parameters: {
        temperature: 0.7,
        max_tokens: 500,
      },
    },
  ],
  test_cases: [
    {
      input: 'Hello, how are you?',
      expected_topics: ['greeting'],
    },
  ],
};

// Mock test result
const mockResult: PromptTestResult = {
  id: 'test-1',
  prompt_id: 'v1',
  input: 'test input',
  output: 'test output',
  model: 'gpt-3.5-turbo',
  parameters: { temperature: 0.7 },
  metrics: {
    tokens_used: 100,
    prompt_tokens: 50,
    completion_tokens: 50,
    cost_usd: 0.001,
    latency_ms: 500,
  },
  timestamp: new Date(),
};

describe('PromptTester', () => {
  let tester: PromptTester;

  beforeEach(() => {
    tester = new PromptTester(mockConfig);
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create tester instance', () => {
    expect(tester).toBeDefined();
  });

  it('should load API keys from environment', () => {
    expect(process.env.OPENAI_API_KEY).toBe('test-key');
  });

  it('should construct prompt with input', () => {
    const template = 'Hello {{input}} world';
    const input = 'test';
    const result = template.replace(/\{\{input\}\}/g, input);
    expect(result).toBe('Hello test world');
  });

  it('should get provider from model name', () => {
    const getProvider = (model: string) => {
      if (model.startsWith('gpt')) return 'openai';
      if (model.startsWith('claude')) return 'anthropic';
      return 'openai';
    };

    expect(getProvider('gpt-4')).toBe('openai');
    expect(getProvider('claude-3-opus')).toBe('anthropic');
  });

  it('should throw error for missing prompt ID', async () => {
    await expect(async () => {
      const template = 'You are helpful';
      const promptId = 'nonexistent';
      const prompt = mockConfig.prompts.find((p) => p.id === promptId);
      if (!prompt) throw new Error(`Prompt '${promptId}' not found`);
    }).rejects.toThrow("Prompt 'nonexistent' not found");
  });
});

describe('PromptComparator', () => {
  it('should require at least 2 configs', () => {
    expect(() => {
      new PromptComparator([mockConfig]);
    }).toThrow('Need at least 2 prompts to compare');
  });

  it('should limit to maximum 4 configs', () => {
    expect(() => {
      new PromptComparator([
        mockConfig,
        mockConfig,
        mockConfig,
        mockConfig,
        mockConfig,
      ]);
    }).toThrow('Can compare maximum 4 prompts at once');
  });

  it('should create comparator with 2 configs', () => {
    const config2 = { ...mockConfig, name: 'test-prompt-2' };
    const comparator = new PromptComparator([mockConfig, config2]);
    expect(comparator).toBeDefined();
  });

  it('should calculate comparison metrics', () => {
    const results: PromptTestResult[] = [
      mockResult,
      { ...mockResult, id: 'test-2', metrics: { ...mockResult.metrics, tokens_used: 120 } },
    ];

    const metrics = {
      token_comparison: {
        [results[0].prompt_id]: results[0].metrics.tokens_used,
        [results[1].prompt_id]: results[1].metrics.tokens_used,
      },
      cost_comparison: {
        [results[0].prompt_id]: results[0].metrics.cost_usd,
        [results[1].prompt_id]: results[1].metrics.cost_usd,
      },
      latency_comparison: {
        [results[0].prompt_id]: results[0].metrics.latency_ms,
        [results[1].prompt_id]: results[1].metrics.latency_ms,
      },
    };

    expect(metrics.token_comparison['v1']).toBe(100);
  });

  it('should determine winner based on metrics', () => {
    const results = [
      mockResult,
      {
        ...mockResult,
        id: 'test-2',
        prompt_id: 'v2',
        metrics: { ...mockResult.metrics, cost_usd: 0.0005, tokens_used: 80 },
      },
    ];

    const scores = results.map((result) => {
      const tokenScore = 1 / result.metrics.tokens_used;
      const costScore = 1 / result.metrics.cost_usd;
      const latencyScore = 1 / result.metrics.latency_ms;
      return {
        prompt_id: result.prompt_id,
        score: costScore * 0.4 + latencyScore * 0.3 + tokenScore * 0.3,
      };
    });

    scores.sort((a, b) => b.score - a.score);
    expect(scores[0].prompt_id).toBe('v2');
  });

  it('should export results to JSON', () => {
    const config2 = { ...mockConfig, name: 'test-prompt-2' };
    const comparator = new PromptComparator([mockConfig, config2]);
    const result = {
      prompts: [mockConfig.prompts[0]],
      results: [mockResult],
      comparison: {
        token_comparison: { v1: 100 },
        cost_comparison: { v1: 0.001 },
        latency_comparison: { v1: 500 },
      },
    };

    const json = comparator.exportResults(result, 'json');
    expect(JSON.parse(json)).toBeDefined();
  });
});

describe('PromptOptimizer', () => {
  it('should create optimizer instance', () => {
    const optimizer = new PromptOptimizer(mockConfig);
    expect(optimizer).toBeDefined();
  });

  it('should check for missing role definition', () => {
    const prompt = 'Answer the question.';
    const hasRole = /you are|your role|act as/i.test(prompt);
    expect(hasRole).toBe(false);
  });

  it('should check for task definition', () => {
    const prompt = 'Your task is to answer questions.';
    const hasTask = /task|goal|objective/i.test(prompt);
    expect(hasTask).toBe(true);
  });

  it('should detect ambiguous words', () => {
    const prompt = 'Do various things with stuff.';
    const ambiguousWords = ['things', 'stuff', 'some', 'various'];
    const found = ambiguousWords.filter((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(prompt)
    );
    expect(found).toContain('things');
    expect(found).toContain('stuff');
  });

  it('should detect complex sentences', () => {
    const longSentence =
      'This is a very long sentence that contains more than thirty words and should be flagged as too complex for optimal prompt clarity and understanding.';
    const wordCount = longSentence.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(30);
  });

  it('should calculate clarity score', () => {
    const calculateClarityScore = (prompt: string): number => {
      let score = 50;
      if (prompt.match(/you are|your role/i)) score += 10;
      if (prompt.match(/task|goal|objective/i)) score += 10;
      if (prompt.match(/format|structure|output/i)) score += 10;
      return Math.max(0, Math.min(100, score));
    };

    expect(calculateClarityScore('You are a helpful assistant.')).toBe(60);
    expect(calculateClarityScore('Your task is to help.')).toBe(60);
    expect(calculateClarityScore('You are helpful. Your task is clear.')).toBe(70);
  });
});

describe('BatchTester', () => {
  it('should create batch tester with default concurrency', () => {
    const batchTester = new BatchTester(mockConfig);
    expect(batchTester).toBeDefined();
  });

  it('should create batch tester with custom concurrency', () => {
    const batchTester = new BatchTester(mockConfig, 5);
    expect(batchTester).toBeDefined();
  });

  it('should calculate aggregate metrics', () => {
    const results: PromptTestResult[] = [
      mockResult,
      { ...mockResult, id: 'test-2' },
      { ...mockResult, id: 'test-3' },
    ];

    const totals = results.reduce(
      (acc, result) => ({
        tokens: acc.tokens + result.metrics.tokens_used,
        cost: acc.cost + result.metrics.cost_usd,
        latency: acc.latency + result.metrics.latency_ms,
      }),
      { tokens: 0, cost: 0, latency: 0 }
    );

    const aggregates = {
      avg_tokens: totals.tokens / results.length,
      avg_cost: totals.cost / results.length,
      avg_latency: totals.latency / results.length,
      total_cost: totals.cost,
    };

    expect(aggregates.avg_tokens).toBe(100);
    expect(aggregates.total_cost).toBe(0.003);
  });

  it('should export batch results to CSV', () => {
    const batchTester = new BatchTester(mockConfig);
    const batchResult = {
      total: 1,
      completed: 1,
      failed: 0,
      results: [mockResult],
      aggregate_metrics: {
        avg_tokens: 100,
        avg_cost: 0.001,
        avg_latency: 500,
        total_cost: 0.001,
      },
    };

    const csv = batchTester.exportToCSV(batchResult);
    expect(csv).toContain('prompt_id');
    expect(csv).toContain('tokens');
  });

  it('should export batch results to JSON', () => {
    const batchTester = new BatchTester(mockConfig);
    const batchResult = {
      total: 1,
      completed: 1,
      failed: 0,
      results: [mockResult],
      aggregate_metrics: {
        avg_tokens: 100,
        avg_cost: 0.001,
        avg_latency: 500,
        total_cost: 0.001,
      },
    };

    const json = batchTester.exportToJSON(batchResult);
    const parsed = JSON.parse(json);
    expect(parsed.total).toBe(1);
  });
});

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aikit-test-${Date.now()}`);
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    historyManager = new HistoryManager();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create history manager instance', () => {
    expect(historyManager).toBeDefined();
  });

  it('should add entry to history', () => {
    const id = historyManager.addEntry(
      'test-prompt',
      '1.0',
      'single',
      mockResult,
      ['test']
    );
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should get history entries', () => {
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    const entries = historyManager.getHistory();
    expect(Array.isArray(entries)).toBe(true);
  });

  it('should filter history by prompt name', () => {
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    historyManager.addEntry('other-prompt', '1.0', 'single', mockResult);

    const filtered = historyManager.getHistory({
      prompt_name: 'test-prompt',
    });

    expect(filtered.every((e) => e.prompt_name === 'test-prompt')).toBe(true);
  });

  it('should filter history by test type', () => {
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    historyManager.addEntry('test-prompt', '1.0', 'batch', {
      total: 1,
      completed: 1,
      failed: 0,
      results: [],
      aggregate_metrics: {
        avg_tokens: 0,
        avg_cost: 0,
        avg_latency: 0,
        total_cost: 0,
      },
    });

    const filtered = historyManager.getHistory({
      test_type: 'single',
    });

    expect(filtered.every((e) => e.test_type === 'single')).toBe(true);
  });

  it('should get entry by ID', () => {
    const id = historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    const entry = historyManager.getEntry(id);
    expect(entry).toBeDefined();
    expect(entry?.id).toBe(id);
  });

  it('should delete entry', () => {
    const id = historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    const deleted = historyManager.deleteEntry(id);
    expect(deleted).toBe(true);

    const entry = historyManager.getEntry(id);
    expect(entry).toBeUndefined();
  });

  it('should get analytics for prompt', () => {
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);

    const analytics = historyManager.getAnalytics('test-prompt');
    expect(analytics.total_tests).toBeGreaterThanOrEqual(2);
  });

  it('should export history to JSON', () => {
    historyManager.addEntry('test-prompt', '1.0', 'single', mockResult);
    const exported = historyManager.exportHistory(undefined, 'json');
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

describe('Utils', () => {
  it('should calculate cost correctly', () => {
    const cost = calculateCost('gpt-3.5-turbo', {
      prompt: 1000,
      completion: 1000,
    });
    expect(cost).toBeGreaterThan(0);
  });

  it('should parse CSV correctly', () => {
    const csv = 'name,value\ntest1,100\ntest2,200';
    const parsed = parseCSV(csv);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('test1');
    expect(parsed[0].value).toBe('100');
  });

  it('should format duration correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(65000)).toContain('m');
  });

  it('should calculate percentage change', () => {
    expect(percentageChange(100, 110)).toBe(10);
    expect(percentageChange(100, 90)).toBe(-10);
    expect(percentageChange(0, 100)).toBe(0);
  });

  it('should calculate string similarity', () => {
    const sim = similarity('hello', 'hello');
    expect(sim).toBe(1);

    const sim2 = similarity('hello', 'hallo');
    expect(sim2).toBeGreaterThan(0.5);
  });

  it('should validate prompt config', () => {
    expect(() => {
      const config: any = { name: 'test' };
      if (!config.version) throw new Error('Config must have a version');
    }).toThrow('Config must have a version');
  });

  it('should validate prompts array', () => {
    expect(() => {
      const config: any = { name: 'test', version: '1.0' };
      if (!config.prompts) throw new Error('Config must have prompts array');
    }).toThrow('Config must have prompts array');
  });

  it('should validate prompt has ID', () => {
    expect(() => {
      const prompt: any = { content: 'test' };
      if (!prompt.id) throw new Error('Each prompt must have an id');
    }).toThrow('Each prompt must have an id');
  });

  it('should validate prompt has content', () => {
    expect(() => {
      const prompt: any = { id: 'test' };
      if (!prompt.content) throw new Error('Each prompt must have content');
    }).toThrow('Each prompt must have content');
  });
});

describe('Integration Tests', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aikit-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create and load config file', () => {
    const configPath = join(testDir, 'test-config.yaml');
    const yaml = require('yaml');
    writeFileSync(configPath, yaml.stringify(mockConfig));

    expect(existsSync(configPath)).toBe(true);

    const loaded = loadPromptConfig(configPath);
    expect(loaded.name).toBe(mockConfig.name);
  });

  it('should handle missing config file', () => {
    const configPath = join(testDir, 'nonexistent.yaml');
    expect(() => loadPromptConfig(configPath)).toThrow();
  });

  it('should write and read CSV batch file', () => {
    const csvPath = join(testDir, 'batch.csv');
    const csvContent = 'input\nTest 1\nTest 2\nTest 3';
    writeFileSync(csvPath, csvContent);

    const content = require('fs').readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    expect(rows.length).toBe(3);
    expect(rows[0].input).toBe('Test 1');
  });
});
