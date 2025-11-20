/**
 * Prompt comparison tool for side-by-side testing
 */

import chalk from 'chalk';
import { PromptTester } from './tester.js';
import {
  PromptConfig,
  PromptTestResult,
  ComparisonResult,
  ComparisonMetrics,
} from './types.js';
import { percentageChange, formatPercentage, truncate } from './utils.js';

export class PromptComparator {
  private configs: PromptConfig[];
  private testers: PromptTester[];

  constructor(configs: PromptConfig[]) {
    if (configs.length < 2) {
      throw new Error('Need at least 2 prompts to compare');
    }
    if (configs.length > 4) {
      throw new Error('Can compare maximum 4 prompts at once');
    }

    this.configs = configs;
    this.testers = configs.map((config) => new PromptTester(config));
  }

  /**
   * Compare prompts with the same input
   */
  async compare(
    input: string,
    model?: string
  ): Promise<ComparisonResult> {
    console.log(chalk.bold.cyan(`\n🔍 Comparing ${this.configs.length} prompts\n`));

    const results: PromptTestResult[] = [];

    // Test each prompt
    for (let i = 0; i < this.configs.length; i++) {
      const config = this.configs[i];
      const tester = this.testers[i];

      console.log(chalk.bold(`\nTesting: ${config.name} (v${config.version})`));

      // Test first prompt variant
      const promptId = config.prompts[0].id;
      const result = await tester.testPrompt(promptId, input, model);
      results.push(result);
    }

    // Calculate comparison metrics
    const comparison = this.calculateComparison(results);

    // Display comparison
    this.displayComparison(results, comparison);

    // Determine winner
    const winner = this.determineWinner(results);

    return {
      prompts: this.configs.map((c) => c.prompts[0]),
      results,
      comparison,
      winner,
    };
  }

  /**
   * Compare multiple test cases
   */
  async compareTestCases(testCases: string[], model?: string): Promise<ComparisonResult[]> {
    const allResults: ComparisonResult[] = [];

    console.log(
      chalk.bold.cyan(
        `\n🔍 Comparing ${this.configs.length} prompts across ${testCases.length} test cases\n`
      )
    );

    for (let i = 0; i < testCases.length; i++) {
      console.log(
        chalk.bold.yellow(`\n📝 Test Case ${i + 1}/${testCases.length}`)
      );
      console.log(chalk.dim(`Input: ${truncate(testCases[i], 80)}\n`));

      const result = await this.compare(testCases[i], model);
      allResults.push(result);
    }

    // Display aggregate summary
    this.displayAggregateSummary(allResults);

    return allResults;
  }

  /**
   * Calculate comparison metrics
   */
  private calculateComparison(results: PromptTestResult[]): ComparisonMetrics {
    const tokenComparison: Record<string, number> = {};
    const costComparison: Record<string, number> = {};
    const latencyComparison: Record<string, number> = {};

    for (const result of results) {
      tokenComparison[result.prompt_id] = result.metrics.tokens_used;
      costComparison[result.prompt_id] = result.metrics.cost_usd;
      latencyComparison[result.prompt_id] = result.metrics.latency_ms;
    }

    return {
      token_comparison: tokenComparison,
      cost_comparison: costComparison,
      latency_comparison: latencyComparison,
    };
  }

  /**
   * Display comparison table
   */
  private displayComparison(
    results: PromptTestResult[],
    comparison: ComparisonMetrics
  ): void {
    console.log(chalk.bold.cyan('\n📊 Comparison Results\n'));
    console.log(chalk.dim('═'.repeat(80)));

    // Header
    const headers = ['Metric', ...results.map((r) => r.prompt_id)];
    console.log(
      headers.map((h, i) => chalk.bold(h.padEnd(i === 0 ? 20 : 18))).join(' │ ')
    );
    console.log(chalk.dim('─'.repeat(80)));

    // Tokens
    const baseTokens = results[0].metrics.tokens_used;
    const tokenRow = [
      'Tokens',
      ...results.map((r) => {
        const tokens = r.metrics.tokens_used.toLocaleString();
        const change = percentageChange(baseTokens, r.metrics.tokens_used);
        const changeStr = r === results[0] ? '' : ` (${formatPercentage(change, true)})`;
        return `${tokens}${changeStr}`;
      }),
    ];
    console.log(tokenRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    // Cost
    const baseCost = results[0].metrics.cost_usd;
    const costRow = [
      'Cost',
      ...results.map((r) => {
        const cost = `$${r.metrics.cost_usd.toFixed(4)}`;
        const change = percentageChange(baseCost, r.metrics.cost_usd);
        const changeStr = r === results[0] ? '' : ` (${formatPercentage(change, true)})`;
        return `${cost}${changeStr}`;
      }),
    ];
    console.log(costRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    // Latency
    const baseLatency = results[0].metrics.latency_ms;
    const latencyRow = [
      'Latency',
      ...results.map((r) => {
        const latency = `${r.metrics.latency_ms}ms`;
        const change = percentageChange(baseLatency, r.metrics.latency_ms);
        const changeStr = r === results[0] ? '' : ` (${formatPercentage(change, true)})`;
        return `${latency}${changeStr}`;
      }),
    ];
    console.log(latencyRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    console.log(chalk.dim('═'.repeat(80)));
    console.log();

    // Display outputs
    console.log(chalk.bold.cyan('📝 Outputs\n'));
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(chalk.bold.yellow(`${result.prompt_id}:`));
      console.log(chalk.white(truncate(result.output, 200)));
      console.log();
    }
  }

  /**
   * Determine winner based on metrics
   */
  private determineWinner(results: PromptTestResult[]): string {
    // Score based on: cost (40%), latency (30%), tokens (30%)
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
    return scores[0].prompt_id;
  }

  /**
   * Display aggregate summary across multiple test cases
   */
  private displayAggregateSummary(results: ComparisonResult[]): void {
    console.log(chalk.bold.cyan('\n📊 Aggregate Summary\n'));
    console.log(chalk.dim('═'.repeat(80)));

    const promptIds = results[0].results.map((r) => r.prompt_id);
    const aggregates: Record<
      string,
      { tokens: number; cost: number; latency: number; wins: number }
    > = {};

    // Initialize
    for (const id of promptIds) {
      aggregates[id] = { tokens: 0, cost: 0, latency: 0, wins: 0 };
    }

    // Accumulate
    for (const result of results) {
      for (const testResult of result.results) {
        aggregates[testResult.prompt_id].tokens += testResult.metrics.tokens_used;
        aggregates[testResult.prompt_id].cost += testResult.metrics.cost_usd;
        aggregates[testResult.prompt_id].latency += testResult.metrics.latency_ms;
      }

      if (result.winner) {
        aggregates[result.winner].wins++;
      }
    }

    // Display
    const headers = ['Metric', ...promptIds];
    console.log(
      headers.map((h, i) => chalk.bold(h.padEnd(i === 0 ? 20 : 18))).join(' │ ')
    );
    console.log(chalk.dim('─'.repeat(80)));

    // Average tokens
    const avgTokensRow = [
      'Avg Tokens',
      ...promptIds.map((id) => {
        const avg = aggregates[id].tokens / results.length;
        return avg.toLocaleString(undefined, { maximumFractionDigits: 0 });
      }),
    ];
    console.log(avgTokensRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    // Total cost
    const totalCostRow = [
      'Total Cost',
      ...promptIds.map((id) => `$${aggregates[id].cost.toFixed(4)}`),
    ];
    console.log(totalCostRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    // Average latency
    const avgLatencyRow = [
      'Avg Latency',
      ...promptIds.map((id) => {
        const avg = aggregates[id].latency / results.length;
        return `${Math.round(avg)}ms`;
      }),
    ];
    console.log(avgLatencyRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    // Wins
    const winsRow = [
      'Wins',
      ...promptIds.map((id) => aggregates[id].wins.toString()),
    ];
    console.log(winsRow.map((v, i) => v.padEnd(i === 0 ? 20 : 18)).join(' │ '));

    console.log(chalk.dim('═'.repeat(80)));

    // Declare overall winner
    const overallWinner = promptIds.reduce((winner, id) =>
      aggregates[id].wins > aggregates[winner].wins ? id : winner
    );

    console.log();
    console.log(
      chalk.bold.green(
        `🏆 Overall Winner: ${overallWinner} (${aggregates[overallWinner].wins}/${results.length} wins)`
      )
    );
    console.log();
  }

  /**
   * Export comparison results
   */
  exportResults(result: ComparisonResult, format: 'json' | 'csv' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
      case 'csv':
        return this.exportCSV(result);
      case 'markdown':
        return this.exportMarkdown(result);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export as CSV
   */
  private exportCSV(result: ComparisonResult): string {
    const headers = [
      'prompt_id',
      'tokens',
      'cost',
      'latency_ms',
      'output_preview',
    ];
    const rows = result.results.map((r) => [
      r.prompt_id,
      r.metrics.tokens_used,
      r.metrics.cost_usd.toFixed(4),
      r.metrics.latency_ms,
      truncate(r.output.replace(/\n/g, ' '), 100),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export as Markdown
   */
  private exportMarkdown(result: ComparisonResult): string {
    let md = '# Prompt Comparison Results\n\n';
    md += '## Metrics\n\n';
    md += '| Prompt ID | Tokens | Cost | Latency |\n';
    md += '|-----------|--------|------|----------|\n';

    for (const r of result.results) {
      md += `| ${r.prompt_id} | ${r.metrics.tokens_used} | $${r.metrics.cost_usd.toFixed(
        4
      )} | ${r.metrics.latency_ms}ms |\n`;
    }

    md += '\n## Outputs\n\n';
    for (const r of result.results) {
      md += `### ${r.prompt_id}\n\n`;
      md += `${r.output}\n\n`;
    }

    if (result.winner) {
      md += `## Winner\n\n`;
      md += `🏆 **${result.winner}**\n`;
    }

    return md;
  }
}
