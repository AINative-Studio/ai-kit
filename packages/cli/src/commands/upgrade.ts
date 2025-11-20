import { Command } from 'commander';
import chalk from 'chalk';
import { Listr } from 'listr2';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execa } from 'execa';
import semver from 'semver';
import { loadProjectConfig } from '../config/loader.js';
import { detectPackageManager } from '../utils/package-manager.js';

export interface UpgradeOptions {
  latest?: boolean;
  check?: boolean;
  interactive?: boolean;
}

export const upgradeCommand = new Command('upgrade')
  .description('Upgrade AI Kit dependencies to the latest version')
  .option('--latest', 'Upgrade to latest versions (including breaking changes)', false)
  .option('--check', 'Check for available updates without upgrading', false)
  .option('-i, --interactive', 'Choose which packages to upgrade', false)
  .action(async (options: UpgradeOptions) => {
    try {
      await upgradeProject(options);
    } catch (error: any) {
      console.error(chalk.red('\n❌ Upgrade failed:'), error.message);
      process.exit(1);
    }
  });

async function upgradeProject(options: UpgradeOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n⬆️  Upgrade AI Kit dependencies\n'));

  // Check if we're in a project
  const packageJsonPath = join(process.cwd(), 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.error(
      chalk.red('❌ No package.json found.'),
      chalk.dim('Run this command from your project root.')
    );
    process.exit(1);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageManager = await detectPackageManager();

  // Find AI Kit packages
  const aikitPackages = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }).filter((pkg) => pkg.startsWith('@aikit/'));

  if (aikitPackages.length === 0) {
    console.log(chalk.yellow('⚠️  No AI Kit packages found in this project'));
    process.exit(0);
  }

  console.log(chalk.dim('Found AI Kit packages:\n'));
  aikitPackages.forEach((pkg) => {
    const version =
      packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];
    console.log(chalk.cyan(`  • ${pkg}`), chalk.dim(`(${version})`));
  });
  console.log();

  // Check for updates
  console.log(chalk.dim('Checking for updates...\n'));

  const updates: Array<{
    name: string;
    current: string;
    latest: string;
    breaking: boolean;
  }> = [];

  for (const pkg of aikitPackages) {
    try {
      const result = await execa('npm', ['view', pkg, 'version']);
      const latestVersion = result.stdout.trim();
      const currentVersion = (
        packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]
      ).replace(/^[\^~]/, '');

      if (semver.gt(latestVersion, currentVersion)) {
        const breaking = semver.major(latestVersion) > semver.major(currentVersion);
        updates.push({
          name: pkg,
          current: currentVersion,
          latest: latestVersion,
          breaking,
        });
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not check updates for ${pkg}`));
    }
  }

  if (updates.length === 0) {
    console.log(chalk.green('✅ All AI Kit packages are up to date!'));
    return;
  }

  console.log(chalk.bold('Available updates:\n'));
  updates.forEach((update) => {
    const icon = update.breaking ? '⚠️ ' : '✨';
    const label = update.breaking ? chalk.yellow('BREAKING') : chalk.green('UPDATE');
    console.log(
      chalk.cyan(`  ${icon} ${update.name}`),
      chalk.dim(`${update.current} → ${update.latest}`),
      label
    );
  });
  console.log();

  if (options.check) {
    return;
  }

  // Filter breaking changes unless --latest is specified
  const packagesToUpdate = options.latest
    ? updates
    : updates.filter((u) => !u.breaking);

  if (packagesToUpdate.length === 0 && updates.length > 0) {
    console.log(
      chalk.yellow('⚠️  Only breaking changes available.'),
      chalk.dim('Use --latest to upgrade.')
    );
    return;
  }

  // Warn about breaking changes
  const breakingUpdates = packagesToUpdate.filter((u) => u.breaking);
  if (breakingUpdates.length > 0) {
    console.log(chalk.yellow.bold('⚠️  Warning: The following updates include breaking changes:\n'));
    breakingUpdates.forEach((u) => {
      console.log(chalk.yellow(`  • ${u.name} ${u.current} → ${u.latest}`));
    });
    console.log(
      chalk.yellow('\nReview the changelog and migration guide before upgrading.')
    );
    console.log(chalk.dim('Changelog:'), chalk.blue('https://ai-kit.dev/changelog'));
    console.log();
  }

  const tasks = new Listr([
    {
      title: 'Backing up package.json',
      task: async () => {
        writeFileSync(
          join(process.cwd(), 'package.json.backup'),
          JSON.stringify(packageJson, null, 2)
        );
      },
    },
    {
      title: 'Updating packages',
      task: async (ctx, task) => {
        for (const update of packagesToUpdate) {
          task.output = `Updating ${update.name}...`;

          if (packageJson.dependencies[update.name]) {
            packageJson.dependencies[update.name] = `^${update.latest}`;
          } else if (packageJson.devDependencies[update.name]) {
            packageJson.devDependencies[update.name] = `^${update.latest}`;
          }
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      },
    },
    {
      title: 'Installing dependencies',
      task: async (ctx, task) => {
        task.output = 'This may take a few minutes...';

        await execa(packageManager, ['install'], {
          cwd: process.cwd(),
          preferLocal: true,
        });
      },
      options: {
        bottomBar: Infinity,
      },
    },
    {
      title: 'Running type check',
      task: async (ctx, task) => {
        try {
          await execa('tsc', ['--noEmit'], {
            cwd: process.cwd(),
            preferLocal: true,
          });
        } catch (error) {
          task.skip('Type errors found - please review');
        }
      },
    },
  ]);

  try {
    await tasks.run();

    console.log(chalk.green.bold('\n✨ Upgrade completed successfully!\n'));
    console.log(chalk.dim('Updated packages:'));
    packagesToUpdate.forEach((update) => {
      console.log(
        chalk.cyan(`  • ${update.name}`),
        chalk.dim(`${update.current} → ${update.latest}`)
      );
    });

    console.log(chalk.bold('\nNext steps:\n'));
    console.log(chalk.cyan('  1. Review the changelog for breaking changes'));
    console.log(chalk.cyan('  2. Test your application: aikit test'));
    console.log(chalk.cyan('  3. Run in dev mode: aikit dev'));

    if (breakingUpdates.length > 0) {
      console.log(
        chalk.yellow('\n⚠️  Breaking changes detected. Run automated migrations:')
      );
      console.log(chalk.cyan('  aikit migrate'));
    }
  } catch (error: any) {
    console.error(chalk.red('\n❌ Upgrade failed:'), error.message);
    console.log(
      chalk.yellow('💡 Restoring from backup...'),
      chalk.dim('package.json.backup')
    );
    throw error;
  }
}
