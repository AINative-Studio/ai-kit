/**
 * Utility functions for prompt testing
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { PromptConfig, PromptMetrics } from './types.js';

/**
 * Model pricing per 1K tokens (input, output)
 */
const MODEL_PRICING: Record<
  string,
  { input: number; output: number }
> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'gemini-pro': { input: 0.00025, output: 0.0005 },
};

/**
 * Calculate cost based on token usage
 */
export function calculateCost(
  model: string,
  tokens: { prompt: number; completion: number }
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
  const promptCost = (tokens.prompt / 1000) * pricing.input;
  const completionCost = (tokens.completion / 1000) * pricing.output;
  return promptCost + completionCost;
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: PromptMetrics): string {
  return `
Tokens: ${metrics.tokens_used.toLocaleString()}
Cost: $${metrics.cost_usd.toFixed(4)}
Latency: ${metrics.latency_ms}ms
  `.trim();
}

/**
 * Load prompt config from YAML file
 */
export function loadPromptConfig(path: string): PromptConfig {
  try {
    const content = readFileSync(path, 'utf-8');
    const config = parse(content) as PromptConfig;
    validateConfig(config);
    return config;
  } catch (error: any) {
    throw new Error(`Failed to load prompt config: ${error.message}`);
  }
}

/**
 * Validate prompt config
 */
function validateConfig(config: any): void {
  if (!config.name) {
    throw new Error('Config must have a name');
  }
  if (!config.version) {
    throw new Error('Config must have a version');
  }
  if (!config.prompts || !Array.isArray(config.prompts)) {
    throw new Error('Config must have prompts array');
  }
  if (config.prompts.length === 0) {
    throw new Error('Config must have at least one prompt');
  }

  for (const prompt of config.prompts) {
    if (!prompt.id) {
      throw new Error('Each prompt must have an id');
    }
    if (!prompt.content) {
      throw new Error('Each prompt must have content');
    }
  }
}

/**
 * Parse CSV input file
 */
export function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }

    results.push(row);
  }

  return results;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format percentage with color
 */
export function formatPercentage(
  value: number,
  inverse: boolean = false
): string {
  const chalk = require('chalk');
  const sign = value >= 0 ? '+' : '';
  const color = inverse
    ? value <= 0
      ? chalk.green
      : chalk.red
    : value >= 0
    ? chalk.green
    : chalk.red;

  return color(`${sign}${value.toFixed(1)}%`);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9-_]/gi, '_')
    .toLowerCase()
    .replace(/_+/g, '_');
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
export function similarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen;
}
