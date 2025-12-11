import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import { join } from 'path';
import { existsSync } from 'fs';
import { loadProjectConfig } from '../config/loader.js';
import { detectPackageManager } from '../utils/package-manager.js';

export interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  ui?: boolean;
  filter?: string;
  reporter?: string;
}

export const testCommand = new Command('test')
  .description('Run tests for your AI Kit project')
  .argument('[path]', 'Specific test file or directory to run')
  .option('-w, --watch', 'Run tests in watch mode', false)
  .option('-c, --coverage', 'Generate coverage report', false)
  .option('--ui', 'Open Vitest UI', false)
  .option('-f, --filter <pattern>', 'Filter tests by pattern')
  .option('-r, --reporter <reporter>', 'Test reporter (default, verbose, json)')
  .action(async (path: string | undefined, options: TestOptions) => {
    try {
      await runTests(path, options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Tests failed:'), error.message);
      process.exit(1);
    }
  });

async function runTests(
  path: string | undefined,
  options: TestOptions
): Promise<void> {
  console.log(chalk.bold.cyan('\n🧪 Running tests\n'));

  // Check if we're in a project
  const configPath = join(process.cwd(), 'aikit.config.js');
  const altConfigPath = join(process.cwd(), 'aikit.config.ts');

  if (!existsSync(configPath) && !existsSync(altConfigPath)) {
    console.error(
      chalk.red('❌ Not in an AI Kit project.'),
      chalk.dim('Run this command from your project root.')
    );
    process.exit(1);
  }

  // Load project config
  const config = await loadProjectConfig(process.cwd());
  const packageManager = await detectPackageManager();

  // Build test command
  const args: string[] = [];

  // Determine test runner
  const testRunner = config.testRunner || 'vitest';

  if (testRunner === 'vitest') {
    args.push('vitest');

    if (options.watch) {
      args.push('--watch');
    } else if (options.ui) {
      args.push('--ui');
    } else {
      args.push('run');
    }

    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.filter) {
      args.push('--grep', options.filter);
    }

    if (options.reporter) {
      args.push('--reporter', options.reporter);
    }

    if (path) {
      args.push(path);
    }
  } else if (testRunner === 'jest') {
    args.push('jest');

    if (options.watch) {
      args.push('--watch');
    }

    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.filter) {
      args.push('--testNamePattern', options.filter);
    }

    if (path) {
      args.push(path);
    }
  }

  console.log(
    chalk.dim('Running:'),
    chalk.cyan(`${packageManager} ${args.join(' ')}`)
  );
  console.log();

  try {
    const subprocess = execa(packageManager, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      preferLocal: true,
    });

    await subprocess;

    console.log(chalk.green.bold('\n✅ Tests passed!\n'));
  } catch (error: any) {
    if (error.exitCode) {
      console.log(chalk.red.bold('\n❌ Tests failed\n'));
      process.exit(error.exitCode);
    }
    throw error;
  }
}
