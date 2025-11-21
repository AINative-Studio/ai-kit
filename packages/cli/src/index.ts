#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import updateNotifier from 'update-notifier';
import { createCommand } from './commands/create.js';
import { addCommand } from './commands/add.js';
import { testCommand } from './commands/test.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { deployCommand } from './commands/deploy.js';
import { upgradeCommand } from './commands/upgrade.js';
import { promptCommand } from './commands/prompt.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const getFilename = (): string => {
  // CommonJS context
  if (typeof __filename !== 'undefined') {
    return __filename;
  }

  // ESM context - use dynamic check to avoid TS errors
  try {
    // @ts-ignore - import.meta is only available in ESM at runtime
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      // @ts-ignore
      return fileURLToPath(import.meta.url);
    }
  } catch {
    // Fallback
  }

  // Last resort fallback
  return process.cwd();
};

const filename = getFilename();
const dirnamePath = dirname(filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(dirnamePath, '../package.json'), 'utf-8')
);

// Check for updates
const notifier = updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24, // 24 hours
});

if (notifier.update) {
  console.log(
    boxen(
      chalk.yellow('Update available: ') +
        chalk.dim(notifier.update.current) +
        chalk.reset(' → ') +
        chalk.green(notifier.update.latest) +
        '\n\n' +
        chalk.cyan('Run ') +
        chalk.bold('npm install -g @ainative/ai-kit-cli') +
        chalk.cyan(' to update'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
      }
    )
  );
}

const program = new Command();

// Configure program
program
  .name('aikit')
  .description(
    chalk.bold('AI Kit CLI') +
      ' - Scaffold and manage AI-powered applications with Claude'
  )
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText(
    'before',
    boxen(
      chalk.bold.cyan('🤖 AI Kit CLI\n\n') +
        chalk.white(
          'The official CLI tool for building AI-powered applications with Claude.\n' +
            'Create projects, add features, and deploy with confidence.'
        ),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ) + '\n'
  );

// Register commands
program.addCommand(createCommand);
program.addCommand(addCommand);
program.addCommand(promptCommand);
program.addCommand(testCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(deployCommand);
program.addCommand(upgradeCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('\n❌ Error:'), error.message);

    if (error.stack && process.env['DEBUG']) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }

    console.log(
      chalk.yellow('\n💡 Tip:'),
      'Run',
      chalk.cyan('aikit --help'),
      'for usage information'
    );

    process.exit(1);
  }
}

// Handle no command
if (program.args.length === 0) {
  program.help();
}

// Handle unhandled rejections
process.on('unhandledRejection', (error: any) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error.message);
  if (process.env['DEBUG']) {
    console.error(error);
  }
  process.exit(1);
});

// Handle SIGINT
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!'));
  process.exit(0);
});
