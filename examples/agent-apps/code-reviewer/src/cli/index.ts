#!/usr/bin/env node
/**
 * Code Reviewer CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { codeReviewAgent } from '../agents/code-review-agent';

const program = new Command();

program
  .name('code-reviewer')
  .description('AI-powered code review CLI')
  .version('0.0.1');

program
  .command('review')
  .description('Review code in a repository')
  .option('-r, --repo <repository>', 'Repository to review')
  .option('-p, --pr <number>', 'Pull request number')
  .option('-b, --branch <branch>', 'Branch to review')
  .option('--no-security', 'Skip security scan')
  .option('--no-style', 'Skip style check')
  .option('--no-performance', 'Skip performance analysis')
  .option('--no-tests', 'Skip test coverage check')
  .action(async (options) => {
    const spinner = ora('Starting code review...').start();

    try {
      const result = await codeReviewAgent.review({
        repository: options.repo || '.',
        pullRequestNumber: options.pr ? parseInt(options.pr) : undefined,
        branch: options.branch,
        checkSecurity: options.security,
        checkStyle: options.style,
        checkPerformance: options.performance,
        checkTests: options.tests,
      });

      spinner.succeed('Code review completed!');

      if (result.success && result.output) {
        const data = result.output as any;

        console.log(chalk.bold('\n📊 Review Summary\n'));
        console.log(data.summary);

        console.log(chalk.bold('\n🔍 Findings\n'));
        data.findings.forEach((finding: any) => {
          const icon = finding.severity === 'critical' ? '🚨' :
                       finding.severity === 'high' ? '⚠️' : 'ℹ️';
          console.log(`${icon} ${chalk.yellow(finding.file)}: ${finding.message}`);
          if (finding.suggestion) {
            console.log(chalk.gray(`   💡 ${finding.suggestion}`));
          }
        });

        console.log(chalk.bold('\n📈 Metrics\n'));
        console.log(`Files Reviewed: ${data.metrics.filesReviewed}`);
        console.log(`Issues Found: ${data.metrics.issuesFound}`);
        console.log(`Code Quality Score: ${data.metrics.codeQualityScore}/100`);
        console.log(`Test Coverage: ${data.metrics.testCoverage}%`);
      } else {
        console.error(chalk.red('Review failed:'), result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Code review failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

program.parse();
