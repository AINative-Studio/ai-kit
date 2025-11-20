/**
 * Batch prompt testing with parallel execution
 */

import chalk from 'chalk';
import ora from 'ora';
import { PromptTester } from './tester.js';
import {
  PromptConfig,
  PromptTestResult,
  BatchTestResult,
} from './types.js';
import { parseCSV, formatDuration } from './utils.js';
import { readFileSync } from 'fs';

export class BatchTester {
  private tester: PromptTester;
  private config: PromptConfig;
  private concurrency: number;

  constructor(config: PromptConfig, concurrency: number = 3) {
    this.config = config;
    this.tester = new PromptTester(config);
    this.concurrency = concurrency;
  }

  /**
   * Run batch tests from CSV file
   */
  async runBatchFromCSV(
    csvPath: string,
    inputColumn: string = 'input',
    promptId?: string
  ): Promise<BatchTestResult> {
    const content = readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    const inputs = rows.map((row) => row[inputColumn]);
    if (inputs.some((input) => !input)) {
      throw new Error(`Column "${inputColumn}" not found in CSV`);
    }

    return await this.runBatch(inputs, promptId);
  }

  /**
   * Run batch tests with array of inputs
   */
  async runBatch(
    inputs: string[],
    promptId?: string
  ): Promise<BatchTestResult> {
    const startTime = Date.now();
    const promptToTest =
      promptId || this.config.prompts[0].id;

    console.log(
      chalk.bold.cyan(
        `\n🔄 Running batch test with ${inputs.length} inputs...\n`
      )
    );

    const results: PromptTestResult[] = [];
    const failed: string[] = [];
    let completed = 0;

    const spinner = ora({
      text: `Processing: 0/${inputs.length}`,
      spinner: 'dots',
    }).start();

    // Process in batches with concurrency limit
    for (let i = 0; i < inputs.length; i += this.concurrency) {
      const batch = inputs.slice(i, i + this.concurrency);
      const promises = batch.map((input, idx) =>
        this.testWithRetry(promptToTest, input, i + idx)
      );

      const batchResults = await Promise.allSettled(promises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          completed++;
        } else {
          failed.push(result.reason?.message || 'Unknown error');
        }

        spinner.text = `Processing: ${completed}/${inputs.length} (${failed.length} failed)`;
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    spinner.succeed(
      chalk.green(
        `Completed ${completed}/${inputs.length} tests in ${formatDuration(
          duration
        )}`
      )
    );

    // Calculate aggregate metrics
    const aggregateMetrics = this.calculateAggregateMetrics(results);

    // Display results
    this.displayBatchResults(results, failed.length, duration);

    return {
      total: inputs.length,
      completed,
      failed: failed.length,
      results,
      aggregate_metrics: aggregateMetrics,
    };
  }

  /**
   * Test with retry logic
   */
  private async testWithRetry(
    promptId: string,
    input: string,
    index: number,
    maxRetries: number = 2
  ): Promise<PromptTestResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.tester.testPrompt(
          promptId,
          input,
          this.config.defaults?.model
        );
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new Error(
      `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Calculate aggregate metrics
   */
  private calculateAggregateMetrics(results: PromptTestResult[]): {
    avg_tokens: number;
    avg_cost: number;
    avg_latency: number;
    total_cost: number;
  } {
    if (results.length === 0) {
      return { avg_tokens: 0, avg_cost: 0, avg_latency: 0, total_cost: 0 };
    }

    const totals = results.reduce(
      (acc, result) => ({
        tokens: acc.tokens + result.metrics.tokens_used,
        cost: acc.cost + result.metrics.cost_usd,
        latency: acc.latency + result.metrics.latency_ms,
      }),
      { tokens: 0, cost: 0, latency: 0 }
    );

    return {
      avg_tokens: totals.tokens / results.length,
      avg_cost: totals.cost / results.length,
      avg_latency: totals.latency / results.length,
      total_cost: totals.cost,
    };
  }

  /**
   * Display batch results
   */
  private displayBatchResults(
    results: PromptTestResult[],
    failedCount: number,
    duration: number
  ): void {
    console.log();
    console.log(chalk.bold.cyan('📊 Batch Test Results\n'));
    console.log(chalk.dim('═'.repeat(60)));

    const metrics = this.calculateAggregateMetrics(results);

    console.log(
      chalk.white('Total Tests:'),
      chalk.yellow(results.length + failedCount)
    );
    console.log(
      chalk.white('Successful:'),
      chalk.green(results.length)
    );
    if (failedCount > 0) {
      console.log(chalk.white('Failed:'), chalk.red(failedCount));
    }
    console.log(
      chalk.white('Duration:'),
      chalk.blue(formatDuration(duration))
    );
    console.log(chalk.dim('─'.repeat(60)));

    console.log(
      chalk.white('Avg Tokens:'),
      chalk.yellow(Math.round(metrics.avg_tokens).toLocaleString())
    );
    console.log(
      chalk.white('Avg Cost:'),
      chalk.green(`$${metrics.avg_cost.toFixed(4)}`)
    );
    console.log(
      chalk.white('Avg Latency:'),
      chalk.blue(`${Math.round(metrics.avg_latency)}ms`)
    );
    console.log(chalk.dim('─'.repeat(60)));

    console.log(
      chalk.white('Total Cost:'),
      chalk.bold.green(`$${metrics.total_cost.toFixed(4)}`)
    );
    console.log(chalk.dim('═'.repeat(60)));
    console.log();
  }

  /**
   * Export batch results to CSV
   */
  exportToCSV(result: BatchTestResult): string {
    const headers = [
      'index',
      'prompt_id',
      'input',
      'output',
      'tokens',
      'cost',
      'latency_ms',
      'timestamp',
    ];

    const rows = result.results.map((r, i) => [
      i + 1,
      r.prompt_id,
      r.input.replace(/\n/g, ' ').replace(/,/g, ';'),
      r.output.replace(/\n/g, ' ').replace(/,/g, ';'),
      r.metrics.tokens_used,
      r.metrics.cost_usd.toFixed(4),
      r.metrics.latency_ms,
      r.timestamp.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export batch results to JSON
   */
  exportToJSON(result: BatchTestResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate batch report
   */
  generateReport(result: BatchTestResult): string {
    let report = '# Batch Test Report\n\n';

    report += `## Summary\n\n`;
    report += `- Total Tests: ${result.total}\n`;
    report += `- Completed: ${result.completed}\n`;
    report += `- Failed: ${result.failed}\n`;
    report += `- Success Rate: ${(
      (result.completed / result.total) *
      100
    ).toFixed(1)}%\n\n`;

    report += `## Aggregate Metrics\n\n`;
    report += `- Average Tokens: ${Math.round(
      result.aggregate_metrics.avg_tokens
    ).toLocaleString()}\n`;
    report += `- Average Cost: $${result.aggregate_metrics.avg_cost.toFixed(
      4
    )}\n`;
    report += `- Average Latency: ${Math.round(
      result.aggregate_metrics.avg_latency
    )}ms\n`;
    report += `- Total Cost: $${result.aggregate_metrics.total_cost.toFixed(
      4
    )}\n\n`;

    report += `## Individual Results\n\n`;

    for (let i = 0; i < Math.min(10, result.results.length); i++) {
      const r = result.results[i];
      report += `### Test ${i + 1}\n\n`;
      report += `- Input: ${r.input.slice(0, 100)}${
        r.input.length > 100 ? '...' : ''
      }\n`;
      report += `- Tokens: ${r.metrics.tokens_used}\n`;
      report += `- Cost: $${r.metrics.cost_usd.toFixed(4)}\n`;
      report += `- Latency: ${r.metrics.latency_ms}ms\n\n`;
    }

    if (result.results.length > 10) {
      report += `\n_Showing first 10 of ${result.results.length} results_\n`;
    }

    return report;
  }

  /**
   * Run batch test with progress callback
   */
  async runBatchWithProgress(
    inputs: string[],
    promptId: string | undefined,
    onProgress: (completed: number, total: number) => void
  ): Promise<BatchTestResult> {
    const results: PromptTestResult[] = [];
    const failed: string[] = [];
    let completed = 0;

    for (let i = 0; i < inputs.length; i += this.concurrency) {
      const batch = inputs.slice(i, i + this.concurrency);
      const promises = batch.map((input, idx) =>
        this.testWithRetry(promptId || this.config.prompts[0].id, input, i + idx)
      );

      const batchResults = await Promise.allSettled(promises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          completed++;
        } else {
          failed.push(result.reason?.message || 'Unknown error');
        }

        onProgress(completed, inputs.length);
      }
    }

    return {
      total: inputs.length,
      completed,
      failed: failed.length,
      results,
      aggregate_metrics: this.calculateAggregateMetrics(results),
    };
  }
}
