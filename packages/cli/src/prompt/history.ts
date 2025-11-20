/**
 * History and analytics storage for prompt tests
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import {
  HistoryEntry,
  HistoryFilter,
  PromptTestResult,
  ComparisonResult,
  OptimizationResult,
  BatchTestResult,
} from './types.js';
import { generateId, formatDuration, truncate } from './utils.js';

export class HistoryManager {
  private historyDir: string;
  private historyFile: string;

  constructor() {
    this.historyDir = join(homedir(), '.aikit', 'prompt-history');
    this.historyFile = join(this.historyDir, 'history.json');
    this.ensureHistoryDir();
  }

  /**
   * Ensure history directory exists
   */
  private ensureHistoryDir(): void {
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Load history from file
   */
  private loadHistory(): HistoryEntry[] {
    if (!existsSync(this.historyFile)) {
      return [];
    }

    try {
      const content = readFileSync(this.historyFile, 'utf-8');
      const entries = JSON.parse(content);

      // Parse dates
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error(chalk.yellow('Warning: Failed to load history'));
      return [];
    }
  }

  /**
   * Save history to file
   */
  private saveHistory(entries: HistoryEntry[]): void {
    try {
      writeFileSync(this.historyFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save history'));
    }
  }

  /**
   * Add entry to history
   */
  addEntry(
    promptName: string,
    promptVersion: string,
    testType: 'single' | 'compare' | 'optimize' | 'batch',
    results:
      | PromptTestResult
      | ComparisonResult
      | OptimizationResult
      | BatchTestResult,
    tags?: string[]
  ): string {
    const entry: HistoryEntry = {
      id: generateId(),
      prompt_name: promptName,
      prompt_version: promptVersion,
      test_type: testType,
      results,
      timestamp: new Date(),
      tags,
    };

    const history = this.loadHistory();
    history.unshift(entry); // Add to beginning

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(1000);
    }

    this.saveHistory(history);

    return entry.id;
  }

  /**
   * Get history entries with filtering
   */
  getHistory(filter?: HistoryFilter): HistoryEntry[] {
    let entries = this.loadHistory();

    if (!filter) {
      return entries;
    }

    // Apply filters
    if (filter.prompt_name) {
      entries = entries.filter((e) =>
        e.prompt_name.toLowerCase().includes(filter.prompt_name!.toLowerCase())
      );
    }

    if (filter.test_type) {
      entries = entries.filter((e) => e.test_type === filter.test_type);
    }

    if (filter.date_from) {
      entries = entries.filter((e) => e.timestamp >= filter.date_from!);
    }

    if (filter.date_to) {
      entries = entries.filter((e) => e.timestamp <= filter.date_to!);
    }

    if (filter.tags && filter.tags.length > 0) {
      entries = entries.filter((e) =>
        e.tags?.some((tag) => filter.tags!.includes(tag))
      );
    }

    // Apply limit
    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  /**
   * Get entry by ID
   */
  getEntry(id: string): HistoryEntry | undefined {
    const history = this.loadHistory();
    return history.find((e) => e.id === id);
  }

  /**
   * Delete entry
   */
  deleteEntry(id: string): boolean {
    const history = this.loadHistory();
    const index = history.findIndex((e) => e.id === id);

    if (index === -1) {
      return false;
    }

    history.splice(index, 1);
    this.saveHistory(history);

    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.saveHistory([]);
  }

  /**
   * Display history
   */
  displayHistory(filter?: HistoryFilter): void {
    const entries = this.getHistory(filter);

    if (entries.length === 0) {
      console.log(chalk.yellow('\nNo history entries found\n'));
      return;
    }

    console.log(
      chalk.bold.cyan(`\n📜 History (${entries.length} entries)\n`)
    );
    console.log(chalk.dim('═'.repeat(80)));

    for (const entry of entries) {
      this.displayEntry(entry);
      console.log(chalk.dim('─'.repeat(80)));
    }

    console.log();
  }

  /**
   * Display single entry
   */
  private displayEntry(entry: HistoryEntry): void {
    const timestamp = entry.timestamp.toLocaleString();
    const typeColor =
      entry.test_type === 'single'
        ? chalk.blue
        : entry.test_type === 'compare'
        ? chalk.yellow
        : entry.test_type === 'optimize'
        ? chalk.green
        : chalk.magenta;

    console.log(
      chalk.bold(`${entry.prompt_name}`),
      chalk.dim(`v${entry.prompt_version}`)
    );
    console.log(
      typeColor(`[${entry.test_type}]`),
      chalk.dim(`ID: ${entry.id}`)
    );
    console.log(chalk.dim(`Time: ${timestamp}`));

    if (entry.tags && entry.tags.length > 0) {
      console.log(
        chalk.dim('Tags:'),
        entry.tags.map((t) => chalk.cyan(`#${t}`)).join(' ')
      );
    }

    // Display result summary based on type
    this.displayResultSummary(entry);
  }

  /**
   * Display result summary
   */
  private displayResultSummary(entry: HistoryEntry): void {
    switch (entry.test_type) {
      case 'single': {
        const result = entry.results as PromptTestResult;
        console.log(
          chalk.white('Tokens:'),
          chalk.yellow(result.metrics.tokens_used.toLocaleString()),
          chalk.dim('|'),
          chalk.white('Cost:'),
          chalk.green(`$${result.metrics.cost_usd.toFixed(4)}`),
          chalk.dim('|'),
          chalk.white('Latency:'),
          chalk.blue(`${result.metrics.latency_ms}ms`)
        );
        break;
      }

      case 'compare': {
        const result = entry.results as ComparisonResult;
        console.log(
          chalk.white('Compared:'),
          chalk.yellow(`${result.prompts.length} prompts`),
          chalk.dim('|'),
          chalk.white('Winner:'),
          result.winner ? chalk.green(result.winner) : chalk.dim('N/A')
        );
        break;
      }

      case 'optimize': {
        const result = entry.results as OptimizationResult;
        console.log(
          chalk.white('Suggestions:'),
          chalk.yellow(result.suggestions.length)
        );
        if (result.improvement_metrics) {
          console.log(
            chalk.white('Token Reduction:'),
            chalk.green(
              `${result.improvement_metrics.estimated_token_reduction}`
            )
          );
        }
        break;
      }

      case 'batch': {
        const result = entry.results as BatchTestResult;
        console.log(
          chalk.white('Tests:'),
          chalk.yellow(`${result.completed}/${result.total}`),
          chalk.dim('|'),
          chalk.white('Total Cost:'),
          chalk.green(`$${result.aggregate_metrics.total_cost.toFixed(4)}`)
        );
        break;
      }
    }
  }

  /**
   * Get analytics for a prompt
   */
  getAnalytics(promptName: string): {
    total_tests: number;
    total_cost: number;
    avg_tokens: number;
    avg_latency: number;
    test_types: Record<string, number>;
    timeline: Array<{ date: string; count: number }>;
  } {
    const entries = this.getHistory({ prompt_name: promptName });

    let totalCost = 0;
    let totalTokens = 0;
    let totalLatency = 0;
    let testCount = 0;

    const testTypes: Record<string, number> = {};
    const dateGroups: Record<string, number> = {};

    for (const entry of entries) {
      // Count test types
      testTypes[entry.test_type] = (testTypes[entry.test_type] || 0) + 1;

      // Group by date
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;

      // Accumulate metrics
      if (entry.test_type === 'single') {
        const result = entry.results as PromptTestResult;
        totalCost += result.metrics.cost_usd;
        totalTokens += result.metrics.tokens_used;
        totalLatency += result.metrics.latency_ms;
        testCount++;
      } else if (entry.test_type === 'batch') {
        const result = entry.results as BatchTestResult;
        totalCost += result.aggregate_metrics.total_cost;
        totalTokens += result.aggregate_metrics.avg_tokens * result.completed;
        totalLatency += result.aggregate_metrics.avg_latency * result.completed;
        testCount += result.completed;
      }
    }

    const timeline = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_tests: entries.length,
      total_cost: totalCost,
      avg_tokens: testCount > 0 ? totalTokens / testCount : 0,
      avg_latency: testCount > 0 ? totalLatency / testCount : 0,
      test_types: testTypes,
      timeline,
    };
  }

  /**
   * Display analytics
   */
  displayAnalytics(promptName: string): void {
    const analytics = this.getAnalytics(promptName);

    console.log(chalk.bold.cyan(`\n📊 Analytics for "${promptName}"\n`));
    console.log(chalk.dim('═'.repeat(60)));

    console.log(
      chalk.white('Total Tests:'),
      chalk.yellow(analytics.total_tests)
    );
    console.log(
      chalk.white('Total Cost:'),
      chalk.green(`$${analytics.total_cost.toFixed(4)}`)
    );
    console.log(
      chalk.white('Avg Tokens:'),
      chalk.yellow(Math.round(analytics.avg_tokens).toLocaleString())
    );
    console.log(
      chalk.white('Avg Latency:'),
      chalk.blue(`${Math.round(analytics.avg_latency)}ms`)
    );

    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.bold.white('\nTest Types:'));

    for (const [type, count] of Object.entries(analytics.test_types)) {
      const percentage = ((count / analytics.total_tests) * 100).toFixed(1);
      console.log(`  ${type.padEnd(10)} : ${count} (${percentage}%)`);
    }

    if (analytics.timeline.length > 0) {
      console.log(chalk.dim('─'.repeat(60)));
      console.log(chalk.bold.white('\nRecent Activity:'));

      const recent = analytics.timeline.slice(-7);
      for (const item of recent) {
        const bar = '█'.repeat(Math.ceil(item.count / 2));
        console.log(`  ${item.date}  ${bar} ${item.count}`);
      }
    }

    console.log(chalk.dim('═'.repeat(60)));
    console.log();
  }

  /**
   * Export history
   */
  exportHistory(
    filter?: HistoryFilter,
    format: 'json' | 'csv' = 'json'
  ): string {
    const entries = this.getHistory(filter);

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    // CSV format
    const headers = [
      'id',
      'prompt_name',
      'version',
      'test_type',
      'timestamp',
      'tags',
    ];

    const rows = entries.map((e) => [
      e.id,
      e.prompt_name,
      e.prompt_version,
      e.test_type,
      e.timestamp.toISOString(),
      (e.tags || []).join(';'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
