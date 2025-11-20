import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import { Listr } from 'listr2';
import { join } from 'path';
import { existsSync } from 'fs';
import { loadProjectConfig } from '../config/loader.js';
import { detectPackageManager } from '../utils/package-manager.js';

export interface BuildOptions {
  production?: boolean;
  analyze?: boolean;
  sourcemap?: boolean;
  typecheck?: boolean;
}

export const buildCommand = new Command('build')
  .description('Build your AI Kit project for production')
  .option('--production', 'Build for production (default)', true)
  .option('--analyze', 'Analyze bundle size', false)
  .option('--sourcemap', 'Generate source maps', false)
  .option('--no-typecheck', 'Skip type checking')
  .action(async (options: BuildOptions) => {
    try {
      await buildProject(options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Build failed:'), error.message);
      process.exit(1);
    }
  });

async function buildProject(options: BuildOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n📦 Building project\n'));

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

  const config = await loadProjectConfig(process.cwd());
  const packageManager = await detectPackageManager();

  const tasks = new Listr([
    {
      title: 'Type checking',
      enabled: () => options.typecheck !== false && config.typescript !== false,
      task: async (ctx, task) => {
        try {
          await execa('tsc', ['--noEmit'], {
            cwd: process.cwd(),
            preferLocal: true,
          });
          task.title = 'Type checking ✓';
        } catch (error: any) {
          throw new Error('Type check failed. Run `tsc --noEmit` to see details.');
        }
      },
    },
    {
      title: 'Building application',
      task: async (ctx, task) => {
        const args: string[] = [];

        switch (config.framework) {
          case 'nextjs':
            args.push('next', 'build');
            break;
          case 'vite':
          case 'react':
          case 'vue':
          case 'svelte':
            args.push('vite', 'build');
            break;
          case 'express':
          case 'node':
            args.push('tsup', config.entry || 'src/index.ts');
            break;
          default:
            args.push('build');
        }

        if (options.sourcemap) {
          args.push('--sourcemap');
        }

        if (options.analyze) {
          process.env.ANALYZE = 'true';
        }

        task.output = `Running: ${packageManager} ${args.join(' ')}`;

        await execa(packageManager, args, {
          cwd: process.cwd(),
          preferLocal: true,
          env: {
            ...process.env,
            NODE_ENV: 'production',
          },
        });

        task.title = 'Building application ✓';
      },
      options: {
        bottomBar: Infinity,
      },
    },
    {
      title: 'Optimizing assets',
      skip: () => config.framework === 'express' || config.framework === 'node',
      task: async (ctx, task) => {
        // Framework-specific optimizations happen automatically
        task.title = 'Optimizing assets ✓';
      },
    },
  ]);

  try {
    await tasks.run();

    console.log(chalk.green.bold('\n✨ Build completed successfully!\n'));

    // Show build info
    const distDir = config.distDir || (config.framework === 'nextjs' ? '.next' : 'dist');
    console.log(chalk.dim('Output:'), chalk.cyan(join(process.cwd(), distDir)));

    if (options.analyze) {
      console.log(chalk.dim('Bundle analysis:'), chalk.cyan('Check the generated report'));
    }

    console.log(chalk.bold('\nNext steps:\n'));
    console.log(chalk.cyan('  aikit deploy'), chalk.dim('# Deploy your application'));
    console.log(
      chalk.cyan(`  ${packageManager} start`),
      chalk.dim('# Test production build locally')
    );
  } catch (error: any) {
    console.error(chalk.red('\n❌ Build failed:'), error.message);
    throw error;
  }
}
