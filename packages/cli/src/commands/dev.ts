import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import { join } from 'path';
import { existsSync } from 'fs';
import ora from 'ora';
import { loadProjectConfig } from '../config/loader.js';
import { detectPackageManager } from '../utils/package-manager.js';
import { checkPortAvailable } from '../utils/validation.js';

export interface DevOptions {
  port?: number;
  host?: string;
  https?: boolean;
  open?: boolean;
}

export const devCommand = new Command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-H, --host <host>', 'Host to run on', 'localhost')
  .option('--https', 'Use HTTPS', false)
  .option('--open', 'Open browser automatically', false)
  .action(async (options: DevOptions) => {
    try {
      await startDevServer(options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Failed to start dev server:'), error.message);
      process.exit(1);
    }
  });

async function startDevServer(options: DevOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Starting development server\n'));

  // Check if we're in a project
  const configPath = join(process.cwd(), 'aikit.config.ts');
  const altConfigPath = join(process.cwd(), 'aikit.config.js');

  if (!existsSync(configPath) && !existsSync(altConfigPath)) {
    console.error(
      chalk.red('❌ Not in an AI Kit project.'),
      chalk.dim('Run this command from your project root.')
    );
    process.exit(1);
  }

  // Validate environment
  const spinner = ora('Validating environment...').start();

  const config = await loadProjectConfig(process.cwd());
  const packageManager = await detectPackageManager();

  // Check required env vars
  const requiredEnvVars = config.requiredEnvVars || ['ANTHROPIC_API_KEY'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    spinner.fail('Missing environment variables');
    console.error(chalk.red('\nRequired environment variables:'));
    missingVars.forEach((v) => console.error(chalk.red(`  • ${v}`)));
    console.log(chalk.yellow('\n💡 Tip:'), 'Add them to your .env file');
    process.exit(1);
  }

  // Check port availability
  const port = options.port || config.devPort || 3000;
  const isPortAvailable = await checkPortAvailable(port);

  if (!isPortAvailable) {
    spinner.fail(`Port ${port} is already in use`);
    console.log(
      chalk.yellow('💡 Tip:'),
      `Use a different port with ${chalk.cyan(`--port <number>`)}`
    );
    process.exit(1);
  }

  spinner.succeed('Environment ready');

  // Build dev command based on framework
  const args: string[] = [];

  switch (config.framework) {
    case 'nextjs':
      args.push('next', 'dev');
      break;
    case 'vite':
    case 'react':
    case 'vue':
    case 'svelte':
      args.push('vite');
      break;
    case 'express':
    case 'node':
      args.push('tsx', 'watch', config.entry || 'src/index.ts');
      break;
    default:
      args.push('dev');
  }

  // Add options
  if (options.port) {
    args.push('--port', String(options.port));
  }

  if (options.host) {
    args.push('--host', options.host);
  }

  if (options.https) {
    args.push('--https');
  }

  if (options.open) {
    args.push('--open');
  }

  console.log(
    chalk.dim('Running:'),
    chalk.cyan(`${packageManager} ${args.join(' ')}`)
  );
  console.log();

  // Start dev server
  try {
    const subprocess = execa(packageManager, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      preferLocal: true,
      env: {
        ...process.env,
        PORT: String(port),
        HOST: options.host || 'localhost',
      },
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      subprocess.kill('SIGINT');
      console.log(chalk.yellow('\n\n👋 Dev server stopped'));
      process.exit(0);
    });

    await subprocess;
  } catch (error: any) {
    if (error.signal === 'SIGINT') {
      // Normal exit
      return;
    }
    throw error;
  }
}
