import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Listr } from 'listr2';
import { existsSync } from 'fs';
import { join } from 'path';
import validate from 'validate-npm-package-name';
import {
  detectPackageManager,
  installDependencies,
} from '../utils/package-manager.js';
import { initializeGit } from '../utils/git.js';
import { generateProject } from '../utils/template-generator.js';
import { createVSCodeConfig } from '../utils/vscode.js';
import { validateEnvironment } from '../utils/validation.js';
import { TEMPLATES } from '../templates/registry.js';

export interface CreateOptions {
  template?: string;
  name?: string;
  typescript?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  git?: boolean;
  install?: boolean;
  yes?: boolean;
}

export const createCommand = new Command('create')
  .description('Create a new AI Kit project')
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use')
  .option('--typescript', 'Use TypeScript (default: true)', true)
  .option('--no-typescript', 'Use JavaScript instead of TypeScript')
  .option(
    '-p, --package-manager <pm>',
    'Package manager to use (npm, yarn, pnpm)'
  )
  .option('--git', 'Initialize git repository (default: true)', true)
  .option('--no-git', 'Skip git initialization')
  .option('--install', 'Install dependencies (default: true)', true)
  .option('--no-install', 'Skip dependency installation')
  .option('-y, --yes', 'Skip prompts and use defaults', false)
  .action(async (projectName: string | undefined, options: CreateOptions) => {
    try {
      await createProject(projectName, options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Failed to create project:'), error.message);
      process.exit(1);
    }
  });

async function createProject(
  projectName: string | undefined,
  options: CreateOptions
): Promise<void> {
  console.log(
    chalk.bold.cyan('\n🚀 Create a new AI Kit project\n')
  );

  // Validate environment
  const spinner = ora('Checking environment...').start();
  const envCheck = await validateEnvironment();
  if (!envCheck.valid) {
    spinner.fail('Environment check failed');
    console.error(chalk.red('\nMissing requirements:'));
    envCheck.errors.forEach((error) => console.error(chalk.red(`  • ${error}`)));
    process.exit(1);
  }
  spinner.succeed('Environment ready');

  // Gather project information
  const answers = await (options.yes
    ? getDefaultAnswers(projectName, options)
    : promptUser(projectName, options));

  // Validate project name
  const validation = validate(answers.projectName);
  if (!validation.validForNewPackages) {
    console.error(
      chalk.red('\n❌ Invalid project name:'),
      validation.errors?.join(', ')
    );
    process.exit(1);
  }

  const projectPath = join(process.cwd(), answers.projectName);

  // Check if directory exists
  if (existsSync(projectPath)) {
    console.error(
      chalk.red('\n❌ Directory already exists:'),
      chalk.cyan(projectPath)
    );
    process.exit(1);
  }

  // Create project
  const tasks = new Listr([
    {
      title: 'Creating project structure',
      task: async () => {
        await generateProject({
          projectPath,
          projectName: answers.projectName,
          template: answers.template,
          typescript: answers.typescript,
          features: answers.features,
        });
      },
    },
    {
      title: 'Initializing git repository',
      enabled: () => answers.git,
      task: async () => {
        await initializeGit(projectPath);
      },
    },
    {
      title: 'Creating VS Code configuration',
      task: async () => {
        await createVSCodeConfig(projectPath, answers.template);
      },
    },
    {
      title: 'Installing dependencies',
      enabled: () => answers.install,
      task: async (ctx, task) => {
        task.output = 'This may take a few minutes...';
        await installDependencies(projectPath, answers.packageManager);
      },
      options: {
        bottomBar: Infinity,
      },
    },
  ]);

  try {
    await tasks.run();

    // Success message
    console.log(
      chalk.green.bold('\n✨ Success!'),
      chalk.white('Your AI Kit project is ready!\n')
    );

    // Next steps
    console.log(chalk.bold('Next steps:\n'));
    console.log(chalk.cyan('  cd'), answers.projectName);

    if (!answers.install) {
      console.log(
        chalk.cyan(`  ${answers.packageManager} install`),
        chalk.dim('# Install dependencies')
      );
    }

    const template = TEMPLATES.find((t) => t.id === answers.template);
    if (template?.nextSteps) {
      template.nextSteps.forEach((step) => {
        console.log(chalk.cyan(`  ${step.command}`), chalk.dim(`# ${step.description}`));
      });
    } else {
      console.log(
        chalk.cyan(`  ${answers.packageManager} run dev`),
        chalk.dim('# Start development server')
      );
    }

    console.log(chalk.cyan('  aikit add <feature>'), chalk.dim('# Add features to your project'));

    console.log(
      chalk.dim('\n📖 Documentation:'),
      chalk.blue('https://ai-kit.dev/docs')
    );
    console.log(
      chalk.dim('💬 Discord:'),
      chalk.blue('https://discord.gg/ai-kit')
    );

  } catch (error: any) {
    console.error(chalk.red('\n❌ Project creation failed:'), error.message);
    throw error;
  }
}

async function promptUser(
  projectName: string | undefined,
  options: CreateOptions
): Promise<any> {
  const packageManager =
    options.packageManager || (await detectPackageManager());

  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-ai-app',
      when: !projectName,
      validate: (input: string) => {
        const validation = validate(input);
        if (!validation.validForNewPackages) {
          return validation.errors?.[0] || 'Invalid project name';
        }
        if (existsSync(join(process.cwd(), input))) {
          return 'Directory already exists';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: TEMPLATES.map((t) => ({
        name: `${t.name} ${chalk.dim(`- ${t.description}`)}`,
        value: t.id,
      })),
      default: options.template || 'nextjs-chat',
      when: !options.template,
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: (answers: any) => {
        const template = TEMPLATES.find((t) => t.id === (answers.template || options.template));
        return template?.optionalFeatures || [];
      },
      when: (answers: any) => {
        const template = TEMPLATES.find((t) => t.id === (answers.template || options.template));
        return template?.optionalFeatures && template.optionalFeatures.length > 0;
      },
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: options.typescript ?? true,
      when: options.typescript === undefined,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'pnpm (recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: packageManager,
      when: !options.packageManager,
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      default: options.git ?? true,
      when: options.git === undefined,
    },
    {
      type: 'confirm',
      name: 'install',
      message: 'Install dependencies?',
      default: options.install ?? true,
      when: options.install === undefined,
    },
  ]).then((answers) => ({
    projectName: projectName || answers.projectName,
    template: options.template || answers.template,
    typescript: options.typescript ?? answers.typescript,
    packageManager: options.packageManager || answers.packageManager,
    git: options.git ?? answers.git,
    install: options.install ?? answers.install,
    features: answers.features || [],
  }));
}

function getDefaultAnswers(
  projectName: string | undefined,
  options: CreateOptions
): Promise<any> {
  return Promise.resolve({
    projectName: projectName || 'my-ai-app',
    template: options.template || 'nextjs-chat',
    typescript: options.typescript ?? true,
    packageManager: options.packageManager || 'pnpm',
    git: options.git ?? true,
    install: options.install ?? true,
    features: [],
  });
}
