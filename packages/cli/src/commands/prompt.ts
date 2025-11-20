/**
 * Prompt testing and optimization CLI commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PromptTester } from '../prompt/tester.js';
import { PromptComparator } from '../prompt/comparator.js';
import { PromptOptimizer } from '../prompt/optimizer.js';
import { BatchTester } from '../prompt/batch.js';
import { HistoryManager } from '../prompt/history.js';
import { loadPromptConfig } from '../prompt/utils.js';
import { PromptConfig, StreamOptions } from '../prompt/types.js';

export const promptCommand = new Command('prompt')
  .description('Test, compare, and optimize AI prompts')
  .addCommand(createTestCommand())
  .addCommand(createCompareCommand())
  .addCommand(createOptimizeCommand())
  .addCommand(createBatchCommand())
  .addCommand(createHistoryCommand());

/**
 * Test command
 */
function createTestCommand(): Command {
  return new Command('test')
    .description('Test a single prompt with real-time feedback')
    .argument('<config>', 'Path to prompt configuration file (YAML)')
    .option('-p, --prompt <id>', 'Specific prompt ID to test')
    .option('-i, --input <text>', 'Input text for the prompt')
    .option('-m, --model <name>', 'Model to use (e.g., gpt-4, claude-3-sonnet)')
    .option('--stream', 'Enable streaming output', true)
    .option('--test-cases', 'Run all test cases from config')
    .option('--save', 'Save results to history')
    .action(async (configPath: string, options: any) => {
      try {
        await runTest(configPath, options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Test failed:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Compare command
 */
function createCompareCommand(): Command {
  return new Command('compare')
    .description('Compare multiple prompts side-by-side')
    .argument('<configs...>', 'Paths to 2-4 prompt configuration files')
    .option('-i, --input <text>', 'Input text to test all prompts')
    .option('-m, --model <name>', 'Model to use for all prompts')
    .option('-t, --test-cases <file>', 'File with test cases (one per line)')
    .option('-o, --output <file>', 'Export comparison results')
    .option('-f, --format <type>', 'Output format (json, csv, markdown)', 'json')
    .option('--save', 'Save results to history')
    .action(async (configPaths: string[], options: any) => {
      try {
        await runCompare(configPaths, options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Comparison failed:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Optimize command
 */
function createOptimizeCommand(): Command {
  return new Command('optimize')
    .description('AI-powered prompt optimization')
    .argument('<config>', 'Path to prompt configuration file')
    .option('--auto-test', 'Automatically test optimization')
    .option('-o, --output <file>', 'Save optimized prompt to file')
    .option('--save', 'Save results to history')
    .action(async (configPath: string, options: any) => {
      try {
        await runOptimize(configPath, options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Optimization failed:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Batch command
 */
function createBatchCommand(): Command {
  return new Command('batch')
    .description('Test prompts in batch mode')
    .argument('<config>', 'Path to prompt configuration file')
    .option('--input <file>', 'CSV file with test inputs (required)')
    .option('--column <name>', 'Column name for inputs', 'input')
    .option('-p, --prompt <id>', 'Specific prompt ID to test')
    .option('-c, --concurrency <number>', 'Number of parallel requests', '3')
    .option('-o, --output <file>', 'Export results to file')
    .option('-f, --format <type>', 'Output format (json, csv)', 'json')
    .option('--save', 'Save results to history')
    .action(async (configPath: string, options: any) => {
      try {
        await runBatch(configPath, options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Batch test failed:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * History command
 */
function createHistoryCommand(): Command {
  const historyCmd = new Command('history')
    .description('View and manage test history');

  historyCmd
    .command('list')
    .description('List test history')
    .option('-f, --filter <name>', 'Filter by prompt name')
    .option('-t, --type <type>', 'Filter by test type (single, compare, optimize, batch)')
    .option('-l, --last <number>', 'Show last N entries', '10')
    .action(async (options: any) => {
      try {
        await runHistoryList(options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
      }
    });

  historyCmd
    .command('show <id>')
    .description('Show detailed history entry')
    .action(async (id: string) => {
      try {
        await runHistoryShow(id);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
      }
    });

  historyCmd
    .command('analytics <name>')
    .description('Show analytics for a prompt')
    .action(async (name: string) => {
      try {
        await runHistoryAnalytics(name);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
      }
    });

  historyCmd
    .command('export')
    .description('Export history')
    .option('-o, --output <file>', 'Output file')
    .option('-f, --format <type>', 'Format (json, csv)', 'json')
    .action(async (options: any) => {
      try {
        await runHistoryExport(options);
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
      }
    });

  historyCmd
    .command('clear')
    .description('Clear all history')
    .action(async () => {
      try {
        await runHistoryClear();
      } catch (error: any) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
      }
    });

  return historyCmd;
}

/**
 * Run test command
 */
async function runTest(configPath: string, options: any): Promise<void> {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const config = loadPromptConfig(configPath);
  const tester = new PromptTester(config);

  console.log(
    chalk.bold.cyan('\n🧪 Testing Prompt\n'),
    chalk.dim(`Config: ${configPath}`)
  );

  // Run test cases if requested
  if (options.testCases) {
    const results = await tester.runTestCases(options.prompt);

    if (options.save) {
      const history = new HistoryManager();
      history.addEntry(config.name, config.version, 'batch', {
        total: results.length,
        completed: results.length,
        failed: 0,
        results,
        aggregate_metrics: {
          avg_tokens: results.reduce((sum, r) => sum + r.metrics.tokens_used, 0) / results.length,
          avg_cost: results.reduce((sum, r) => sum + r.metrics.cost_usd, 0) / results.length,
          avg_latency: results.reduce((sum, r) => sum + r.metrics.latency_ms, 0) / results.length,
          total_cost: results.reduce((sum, r) => sum + r.metrics.cost_usd, 0),
        },
      });
    }

    return;
  }

  // Get input
  let input = options.input;
  if (!input) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Enter input text:',
        validate: (value) => value.length > 0 || 'Input is required',
      },
    ]);
    input = answer.input;
  }

  // Determine prompt ID
  const promptId = options.prompt || config.prompts[0].id;

  // Set up streaming if enabled
  const streamOptions: StreamOptions | undefined = options.stream
    ? {
        onToken: (token: string) => {
          process.stdout.write(chalk.white(token));
        },
        onComplete: () => {
          console.log('\n');
        },
      }
    : undefined;

  // Run test
  const result = await tester.testPrompt(
    promptId,
    input,
    options.model,
    streamOptions
  );

  // Display output if not streaming
  if (!options.stream) {
    console.log(chalk.bold.cyan('\n📝 Output:\n'));
    console.log(chalk.white(result.output));
    console.log();
  }

  // Save to history
  if (options.save) {
    const history = new HistoryManager();
    const id = history.addEntry(config.name, config.version, 'single', result);
    console.log(chalk.dim(`Saved to history: ${id}`));
  }
}

/**
 * Run compare command
 */
async function runCompare(configPaths: string[], options: any): Promise<void> {
  if (configPaths.length < 2 || configPaths.length > 4) {
    throw new Error('Provide 2-4 configuration files to compare');
  }

  // Load configs
  const configs = configPaths.map((path) => {
    if (!existsSync(path)) {
      throw new Error(`Config file not found: ${path}`);
    }
    return loadPromptConfig(path);
  });

  const comparator = new PromptComparator(configs);

  // Get input
  let input = options.input;
  if (!input) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Enter input text:',
        validate: (value) => value.length > 0 || 'Input is required',
      },
    ]);
    input = answer.input;
  }

  // Run comparison
  const result = await comparator.compare(input, options.model);

  // Export if requested
  if (options.output) {
    const exported = comparator.exportResults(result, options.format);
    writeFileSync(options.output, exported);
    console.log(chalk.green(`\n✅ Results exported to ${options.output}\n`));
  }

  // Save to history
  if (options.save) {
    const history = new HistoryManager();
    history.addEntry(configs[0].name, configs[0].version, 'compare', result);
  }
}

/**
 * Run optimize command
 */
async function runOptimize(configPath: string, options: any): Promise<void> {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const config = loadPromptConfig(configPath);
  const optimizer = new PromptOptimizer(config);

  const result = await optimizer.optimize(options.autoTest);

  // Display optimized prompt
  console.log(chalk.bold.cyan('\n✨ Optimized Prompt:\n'));
  console.log(chalk.white(result.optimized_prompt));
  console.log();

  // Save if requested
  if (options.output) {
    const outputConfig = {
      ...config,
      prompts: [
        {
          ...config.prompts[0],
          id: `${config.prompts[0].id}-optimized`,
          content: result.optimized_prompt,
        },
      ],
    };

    const yaml = require('yaml');
    writeFileSync(options.output, yaml.stringify(outputConfig));
    console.log(chalk.green(`✅ Saved optimized prompt to ${options.output}\n`));
  }

  // Save to history
  if (options.save) {
    const history = new HistoryManager();
    history.addEntry(config.name, config.version, 'optimize', result);
  }
}

/**
 * Run batch command
 */
async function runBatch(configPath: string, options: any): Promise<void> {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  if (!options.input) {
    throw new Error('--input <file> is required for batch testing');
  }

  if (!existsSync(options.input)) {
    throw new Error(`Input file not found: ${options.input}`);
  }

  const config = loadPromptConfig(configPath);
  const concurrency = parseInt(options.concurrency, 10);
  const batchTester = new BatchTester(config, concurrency);

  const result = await batchTester.runBatchFromCSV(
    options.input,
    options.column,
    options.prompt
  );

  // Export if requested
  if (options.output) {
    const exported =
      options.format === 'csv'
        ? batchTester.exportToCSV(result)
        : batchTester.exportToJSON(result);

    writeFileSync(options.output, exported);
    console.log(chalk.green(`\n✅ Results exported to ${options.output}\n`));
  }

  // Save to history
  if (options.save) {
    const history = new HistoryManager();
    history.addEntry(config.name, config.version, 'batch', result);
  }
}

/**
 * Run history list command
 */
async function runHistoryList(options: any): Promise<void> {
  const history = new HistoryManager();

  history.displayHistory({
    prompt_name: options.filter,
    test_type: options.type,
    limit: options.last ? parseInt(options.last, 10) : 10,
  });
}

/**
 * Run history show command
 */
async function runHistoryShow(id: string): Promise<void> {
  const history = new HistoryManager();
  const entry = history.getEntry(id);

  if (!entry) {
    throw new Error(`History entry not found: ${id}`);
  }

  console.log(chalk.bold.cyan('\n📋 History Entry\n'));
  console.log(chalk.dim('═'.repeat(80)));
  console.log(chalk.white('ID:'), chalk.yellow(entry.id));
  console.log(chalk.white('Prompt:'), chalk.cyan(entry.prompt_name));
  console.log(chalk.white('Version:'), chalk.cyan(entry.prompt_version));
  console.log(chalk.white('Type:'), chalk.magenta(entry.test_type));
  console.log(chalk.white('Time:'), chalk.dim(entry.timestamp.toLocaleString()));

  if (entry.tags) {
    console.log(
      chalk.white('Tags:'),
      entry.tags.map((t) => chalk.cyan(`#${t}`)).join(' ')
    );
  }

  console.log(chalk.dim('─'.repeat(80)));
  console.log(chalk.white('\nResults:'));
  console.log(JSON.stringify(entry.results, null, 2));
  console.log(chalk.dim('═'.repeat(80)));
  console.log();
}

/**
 * Run history analytics command
 */
async function runHistoryAnalytics(name: string): Promise<void> {
  const history = new HistoryManager();
  history.displayAnalytics(name);
}

/**
 * Run history export command
 */
async function runHistoryExport(options: any): Promise<void> {
  const history = new HistoryManager();
  const exported = history.exportHistory(undefined, options.format);

  if (options.output) {
    writeFileSync(options.output, exported);
    console.log(chalk.green(`\n✅ History exported to ${options.output}\n`));
  } else {
    console.log(exported);
  }
}

/**
 * Run history clear command
 */
async function runHistoryClear(): Promise<void> {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to clear all history?',
      default: false,
    },
  ]);

  if (answer.confirm) {
    const history = new HistoryManager();
    history.clearHistory();
    console.log(chalk.green('\n✅ History cleared\n'));
  } else {
    console.log(chalk.yellow('\nCancelled\n'));
  }
}
