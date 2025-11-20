#!/usr/bin/env tsx

/**
 * Generate comprehensive test coverage report
 * Usage: tsx scripts/generate-test-report.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CoverageData {
  total: {
    lines: { total: number; covered: number; pct: number };
    statements: { total: number; covered: number; pct: number };
    functions: { total: number; covered: number; pct: number };
    branches: { total: number; covered: number; pct: number };
  };
  [key: string]: any;
}

interface PackageCoverage {
  name: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
  testFiles: number;
  passing: boolean;
}

const COVERAGE_THRESHOLDS = {
  core: { lines: 90, statements: 90, functions: 90, branches: 85 },
  react: { lines: 90, statements: 90, functions: 90, branches: 85 },
  nextjs: { lines: 90, statements: 90, functions: 90, branches: 85 },
  tools: { lines: 90, statements: 90, functions: 90, branches: 85 },
  testing: { lines: 90, statements: 90, functions: 90, branches: 85 },
  cli: { lines: 85, statements: 85, functions: 85, branches: 80 },
};

async function main() {
  console.log('🧪 Generating Test Coverage Report\n');

  // Check if coverage file exists
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage file not found. Run tests with coverage first:');
    console.error('   pnpm test:coverage\n');
    process.exit(1);
  }

  // Load coverage data
  const coverageData: CoverageData = JSON.parse(
    fs.readFileSync(coveragePath, 'utf-8')
  );

  // Count test files per package
  const testFileCounts = await countTestFiles();

  // Analyze coverage per package
  const packages: PackageCoverage[] = [];

  for (const [packageName, thresholds] of Object.entries(COVERAGE_THRESHOLDS)) {
    const packagePath = `packages/${packageName}/`;
    let packageCoverage = { lines: 0, statements: 0, functions: 0, branches: 0 };
    let fileCount = 0;

    // Aggregate coverage for package files
    for (const [file, data] of Object.entries(coverageData)) {
      if (file.includes(packagePath) && file !== 'total') {
        const fileCov = data as any;
        packageCoverage.lines += fileCov.lines.pct;
        packageCoverage.statements += fileCov.statements.pct;
        packageCoverage.functions += fileCov.functions.pct;
        packageCoverage.branches += fileCov.branches.pct;
        fileCount++;
      }
    }

    // Calculate averages
    if (fileCount > 0) {
      packageCoverage.lines /= fileCount;
      packageCoverage.statements /= fileCount;
      packageCoverage.functions /= fileCount;
      packageCoverage.branches /= fileCount;
    }

    const passing =
      packageCoverage.lines >= thresholds.lines &&
      packageCoverage.statements >= thresholds.statements &&
      packageCoverage.functions >= thresholds.functions &&
      packageCoverage.branches >= thresholds.branches;

    packages.push({
      name: packageName,
      lines: Math.round(packageCoverage.lines * 10) / 10,
      statements: Math.round(packageCoverage.statements * 10) / 10,
      functions: Math.round(packageCoverage.functions * 10) / 10,
      branches: Math.round(packageCoverage.branches * 10) / 10,
      testFiles: testFileCounts[packageName] || 0,
      passing,
    });
  }

  // Print report
  printReport(packages, coverageData.total);

  // Generate markdown report
  generateMarkdownReport(packages, coverageData.total);

  // Check if all packages meet thresholds
  const allPassing = packages.every((p) => p.passing);

  if (!allPassing) {
    console.error('\n❌ Some packages do not meet coverage thresholds\n');
    process.exit(1);
  }

  console.log('\n✅ All packages meet coverage thresholds\n');
}

async function countTestFiles(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const packageName of Object.keys(COVERAGE_THRESHOLDS)) {
    const pattern = `packages/${packageName}/**/*.{test,spec}.{ts,tsx}`;
    const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] });
    counts[packageName] = files.length;
  }

  return counts;
}

function printReport(packages: PackageCoverage[], total: CoverageData['total']) {
  console.log('📊 Coverage by Package\n');
  console.log('┌─────────────┬───────┬────────────┬───────────┬──────────┬───────────┬────────┐');
  console.log('│ Package     │ Tests │ Lines      │ Stmts     │ Funcs    │ Branches  │ Status │');
  console.log('├─────────────┼───────┼────────────┼───────────┼──────────┼───────────┼────────┤');

  for (const pkg of packages) {
    const status = pkg.passing ? '✅ Pass' : '❌ Fail';
    const lines = formatCoverage(pkg.lines, COVERAGE_THRESHOLDS[pkg.name as keyof typeof COVERAGE_THRESHOLDS].lines);
    const statements = formatCoverage(pkg.statements, COVERAGE_THRESHOLDS[pkg.name as keyof typeof COVERAGE_THRESHOLDS].statements);
    const functions = formatCoverage(pkg.functions, COVERAGE_THRESHOLDS[pkg.name as keyof typeof COVERAGE_THRESHOLDS].functions);
    const branches = formatCoverage(pkg.branches, COVERAGE_THRESHOLDS[pkg.name as keyof typeof COVERAGE_THRESHOLDS].branches);

    console.log(
      `│ ${pkg.name.padEnd(11)} │ ${pkg.testFiles.toString().padStart(5)} │ ${lines} │ ${statements} │ ${functions} │ ${branches} │ ${status} │`
    );
  }

  console.log('└─────────────┴───────┴────────────┴───────────┴──────────┴───────────┴────────┘');

  console.log('\n📈 Overall Coverage\n');
  console.log(`Lines:      ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`);
  console.log(`Statements: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`);
  console.log(`Functions:  ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`);
  console.log(`Branches:   ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`);
}

function formatCoverage(actual: number, threshold: number): string {
  const pct = `${actual.toFixed(1)}%`;
  const passing = actual >= threshold;
  return passing ? pct.padStart(10) : `${pct} ⚠️`.padStart(10);
}

function generateMarkdownReport(packages: PackageCoverage[], total: CoverageData['total']) {
  const reportPath = path.join(process.cwd(), 'TEST_COVERAGE_REPORT.md');

  const lines = [
    '# Test Coverage Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    '| Metric | Coverage | Covered/Total |',
    '|--------|----------|---------------|',
    `| Lines | ${total.lines.pct.toFixed(2)}% | ${total.lines.covered}/${total.lines.total} |`,
    `| Statements | ${total.statements.pct.toFixed(2)}% | ${total.statements.covered}/${total.statements.total} |`,
    `| Functions | ${total.functions.pct.toFixed(2)}% | ${total.functions.covered}/${total.functions.total} |`,
    `| Branches | ${total.branches.pct.toFixed(2)}% | ${total.branches.covered}/${total.branches.total} |`,
    '',
    '## Package Coverage',
    '',
    '| Package | Tests | Lines | Statements | Functions | Branches | Status |',
    '|---------|-------|-------|------------|-----------|----------|--------|',
  ];

  for (const pkg of packages) {
    const status = pkg.passing ? '✅ Pass' : '❌ Fail';
    lines.push(
      `| ${pkg.name} | ${pkg.testFiles} | ${pkg.lines.toFixed(1)}% | ${pkg.statements.toFixed(1)}% | ${pkg.functions.toFixed(1)}% | ${pkg.branches.toFixed(1)}% | ${status} |`
    );
  }

  lines.push(
    '',
    '## Thresholds',
    '',
    '| Package | Lines | Statements | Functions | Branches |',
    '|---------|-------|------------|-----------|----------|'
  );

  for (const [name, thresholds] of Object.entries(COVERAGE_THRESHOLDS)) {
    lines.push(
      `| ${name} | ${thresholds.lines}% | ${thresholds.statements}% | ${thresholds.functions}% | ${thresholds.branches}% |`
    );
  }

  lines.push(
    '',
    '## Test Files',
    '',
    `Total test files: ${packages.reduce((sum, p) => sum + p.testFiles, 0)}`,
    '',
    '## View Detailed Report',
    '',
    'Open `coverage/index.html` in your browser for detailed coverage information.',
    ''
  );

  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\n📄 Markdown report saved to: ${reportPath}`);
}

main().catch((error) => {
  console.error('Error generating report:', error);
  process.exit(1);
});
