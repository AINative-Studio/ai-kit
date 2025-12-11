import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Listr } from 'listr2';
import { join } from 'path';
import { existsSync } from 'fs';
import { execa } from 'execa';
import { loadProjectConfig } from '../config/loader.js';
import { buildDockerImage } from '../utils/docker.js';
import { validateEnvironment } from '../utils/validation.js';
import { detectPackageManager } from '../utils/package-manager.js';

export interface DeployOptions {
  platform?: 'vercel' | 'railway' | 'docker' | 'netlify';
  prod?: boolean;
  env?: string;
}

export const deployCommand = new Command('deploy')
  .description('Deploy your AI Kit project')
  .option(
    '-p, --platform <platform>',
    'Deployment platform (vercel, railway, docker, netlify)'
  )
  .option('--prod', 'Deploy to production', false)
  .option('--env <environment>', 'Environment to deploy to')
  .action(async (options: DeployOptions) => {
    try {
      await deployProject(options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Deployment failed:'), error.message);
      process.exit(1);
    }
  });

async function deployProject(options: DeployOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Deploy AI Kit project\n'));

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

  const config = await loadProjectConfig(process.cwd());

  // Prompt for platform if not specified
  let platform = options.platform;

  if (!platform) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'platform',
        message: 'Select deployment platform:',
        choices: [
          { name: 'Vercel (recommended for Next.js)', value: 'vercel' },
          { name: 'Railway (full-stack apps)', value: 'railway' },
          { name: 'Docker (containerized)', value: 'docker' },
          { name: 'Netlify (static sites)', value: 'netlify' },
        ],
      },
    ]);
    platform = answer.platform;
  }

  // Validate environment
  const envCheck = await validateEnvironment();
  if (!envCheck.valid) {
    console.error(chalk.red('\nEnvironment validation failed:'));
    envCheck.errors.forEach((error) => console.error(chalk.red(`  • ${error}`)));
    process.exit(1);
  }

  // Detect package manager
  const packageManager = await detectPackageManager();

  const tasks = new Listr([
    {
      title: 'Building project',
      task: async () => {
        const buildArgs = packageManager === 'npm' ? ['run', 'build'] : ['build'];
        await execa(packageManager, buildArgs, {
          cwd: process.cwd(),
          preferLocal: true,
        });
      },
    },
    {
      title: `Deploying to ${platform}`,
      task: async (ctx, task) => {
        switch (platform) {
          case 'vercel':
            await deployToVercel(options, task);
            break;
          case 'railway':
            await deployToRailway(options, task);
            break;
          case 'docker':
            await deployWithDocker(config, task);
            break;
          case 'netlify':
            await deployToNetlify(options, task);
            break;
          default:
            throw new Error(`Unknown platform: ${platform}`);
        }
      },
      options: {
        bottomBar: Infinity,
      },
    },
  ]);

  try {
    await tasks.run();

    console.log(chalk.green.bold('\n✨ Deployment successful!\n'));
    console.log(
      chalk.dim('Platform:'),
      chalk.cyan(platform)
    );

    console.log(chalk.bold('\nNext steps:\n'));
    console.log(
      chalk.cyan('  • Monitor your deployment in the platform dashboard')
    );
    console.log(
      chalk.cyan('  • Configure environment variables if needed')
    );
    console.log(
      chalk.cyan('  • Set up custom domains')
    );
  } catch (error: any) {
    console.error(chalk.red('\n❌ Deployment failed:'), error.message);
    throw error;
  }
}

async function deployToVercel(options: DeployOptions, task: any): Promise<void> {
  task.output = 'Checking Vercel CLI...';

  try {
    await execa('vercel', ['--version'], { preferLocal: true });
  } catch {
    throw new Error('Vercel CLI not found. Install with: npm i -g vercel');
  }

  const args = ['--yes'];

  if (options.prod) {
    args.push('--prod');
  }

  task.output = 'Deploying to Vercel...';

  const result = await execa('vercel', args, {
    cwd: process.cwd(),
    preferLocal: true,
  });

  if (result.stdout) {
    const url = result.stdout.split('\n').find((line) => line.includes('https://'));
    if (url) {
      task.title = `Deployed to ${url}`;
    }
  }
}

async function deployToRailway(options: DeployOptions, task: any): Promise<void> {
  task.output = 'Checking Railway CLI...';

  try {
    await execa('railway', ['--version'], { preferLocal: true });
  } catch {
    throw new Error('Railway CLI not found. Install from: https://railway.app/cli');
  }

  task.output = 'Deploying to Railway...';

  const args = ['up'];

  if (options.env) {
    args.push('--environment', options.env);
  }

  await execa('railway', args, {
    cwd: process.cwd(),
    preferLocal: true,
  });

  task.title = 'Deployed to Railway ✓';
}

async function deployWithDocker(config: any, task: any): Promise<void> {
  task.output = 'Checking Docker...';

  try {
    await execa('docker', ['--version']);
  } catch {
    throw new Error('Docker not found. Install from: https://docker.com');
  }

  task.output = 'Building Docker image...';

  const imageName = config.dockerImage || `aikit-${config.name}`;
  await buildDockerImage(process.cwd(), imageName);

  task.title = `Docker image built: ${imageName}`;
}

async function deployToNetlify(options: DeployOptions, task: any): Promise<void> {
  task.output = 'Checking Netlify CLI...';

  try {
    await execa('netlify', ['--version'], { preferLocal: true });
  } catch {
    throw new Error('Netlify CLI not found. Install with: npm i -g netlify-cli');
  }

  task.output = 'Deploying to Netlify...';

  const args = ['deploy'];

  if (options.prod) {
    args.push('--prod');
  }

  await execa('netlify', args, {
    cwd: process.cwd(),
    preferLocal: true,
  });

  task.title = 'Deployed to Netlify ✓';
}
