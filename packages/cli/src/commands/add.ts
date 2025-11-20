import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Listr } from 'listr2';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  generateComponent,
  generateAgent,
  generateTool,
  generateRoute,
  generateTest,
} from '../utils/generators.js';
import { loadProjectConfig } from '../config/loader.js';

export interface AddOptions {
  type?: string;
  name?: string;
  path?: string;
}

export const addCommand = new Command('add')
  .description('Add features to an existing AI Kit project')
  .argument('[feature]', 'Feature to add (component, agent, tool, route, test)')
  .option('-t, --type <type>', 'Type of feature to add')
  .option('-n, --name <name>', 'Name of the feature')
  .option('-p, --path <path>', 'Path where to create the feature')
  .action(async (feature: string | undefined, options: AddOptions) => {
    try {
      await addFeature(feature, options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Failed to add feature:'), error.message);
      process.exit(1);
    }
  });

async function addFeature(
  feature: string | undefined,
  options: AddOptions
): Promise<void> {
  console.log(chalk.bold.cyan('\n➕ Add feature to AI Kit project\n'));

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

  // Load project config
  const config = await loadProjectConfig(process.cwd());

  // Determine feature type
  const featureType = feature || options.type;

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'featureType',
      message: 'What do you want to add?',
      choices: [
        { name: 'Component', value: 'component' },
        { name: 'Agent', value: 'agent' },
        { name: 'Tool', value: 'tool' },
        { name: 'Route/API Endpoint', value: 'route' },
        { name: 'Test File', value: 'test' },
      ],
      when: !featureType,
    },
    {
      type: 'input',
      name: 'name',
      message: (answers: any) => {
        const type = featureType || answers.featureType;
        return `${type.charAt(0).toUpperCase() + type.slice(1)} name:`;
      },
      when: !options.name,
      validate: (input: string) => {
        if (!input) return 'Name is required';
        if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(input)) {
          return 'Name must start with a letter and contain only letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'path',
      message: 'Where should this be created?',
      default: (answers: any) => {
        const type = featureType || answers.featureType;
        switch (type) {
          case 'component':
            return config.framework === 'nextjs' ? 'components' : 'src/components';
          case 'agent':
            return 'agents';
          case 'tool':
            return 'tools';
          case 'route':
            return config.framework === 'nextjs' ? 'app/api' : 'src/routes';
          case 'test':
            return '__tests__';
          default:
            return 'src';
        }
      },
      when: !options.path,
    },
  ]);

  const type = featureType || answers.featureType;
  const name = options.name || answers.name;
  const path = options.path || answers.path;

  const tasks = new Listr([
    {
      title: `Generating ${type}`,
      task: async () => {
        const targetPath = join(process.cwd(), path);

        switch (type) {
          case 'component':
            await generateComponent(targetPath, name, config);
            break;
          case 'agent':
            await generateAgent(targetPath, name, config);
            break;
          case 'tool':
            await generateTool(targetPath, name, config);
            break;
          case 'route':
            await generateRoute(targetPath, name, config);
            break;
          case 'test':
            await generateTest(targetPath, name, config);
            break;
          default:
            throw new Error(`Unknown feature type: ${type}`);
        }
      },
    },
  ]);

  await tasks.run();

  console.log(chalk.green.bold('\n✨ Feature added successfully!\n'));
  console.log(chalk.dim('Location:'), chalk.cyan(join(path, name)));

  // Show next steps
  console.log(chalk.bold('\nNext steps:\n'));

  switch (type) {
    case 'component':
      console.log(chalk.cyan('  1. Import the component in your app'));
      console.log(chalk.cyan('  2. Add props and customize as needed'));
      break;
    case 'agent':
      console.log(chalk.cyan('  1. Configure agent tools and prompts'));
      console.log(chalk.cyan('  2. Test with: aikit test'), chalk.dim(join(path, name)));
      break;
    case 'tool':
      console.log(chalk.cyan('  1. Implement the tool logic'));
      console.log(chalk.cyan('  2. Register the tool with your agent'));
      break;
    case 'route':
      console.log(chalk.cyan('  1. Implement the route handler'));
      console.log(chalk.cyan('  2. Test with your API client'));
      break;
    case 'test':
      console.log(chalk.cyan('  1. Write your test cases'));
      console.log(chalk.cyan('  2. Run with: aikit test'), chalk.dim(join(path, name)));
      break;
  }
}
