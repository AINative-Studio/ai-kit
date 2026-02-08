#!/usr/bin/env tsx
/**
 * Comprehensive Test Coverage Analysis Script
 * Identifies all source files and their corresponding test coverage
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative, basename, dirname } from 'path';
import { existsSync } from 'fs';

interface FileAnalysis {
  package: string;
  file: string;
  relativePath: string;
  hasTests: boolean;
  testFiles: string[];
  linesOfCode: number;
  complexity: 'low' | 'medium' | 'high';
  criticalPath: boolean;
}

interface PackageCoverage {
  name: string;
  totalFiles: number;
  coveredFiles: number;
  uncoveredFiles: number;
  coverage: number;
  files: FileAnalysis[];
}

const PACKAGES_DIR = join(process.cwd(), 'packages');
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  '__tests__',
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
  '.d.ts',
  'index.ts', // Barrel files
  'types.ts', // Pure type files
];

const CRITICAL_PATTERNS = [
  '/agents/',
  '/streaming/',
  '/auth/',
  '/session/',
  '/recording/',
  '/beta/',
  'hooks',
];

async function getAllSourceFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (EXCLUDE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await getAllSourceFiles(fullPath, baseDir)));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findTestFiles(sourceFile: string, packageDir: string): Promise<string[]> {
  const testFiles: string[] = [];
  const baseName = basename(sourceFile, sourceFile.endsWith('.tsx') ? '.tsx' : '.ts');
  const dirName = dirname(sourceFile);

  // Check for co-located tests
  const colocatedTest1 = join(dirName, `${baseName}.test.ts`);
  const colocatedTest2 = join(dirName, `${baseName}.test.tsx`);
  const colocatedTest3 = join(dirName, `${baseName}.spec.ts`);
  const colocatedTest4 = join(dirName, `${baseName}.spec.tsx`);

  if (existsSync(colocatedTest1)) testFiles.push(colocatedTest1);
  if (existsSync(colocatedTest2)) testFiles.push(colocatedTest2);
  if (existsSync(colocatedTest3)) testFiles.push(colocatedTest3);
  if (existsSync(colocatedTest4)) testFiles.push(colocatedTest4);

  // Check for __tests__ directory
  const testsDir = join(dirName, '__tests__');
  if (existsSync(testsDir)) {
    const testFile1 = join(testsDir, `${baseName}.test.ts`);
    const testFile2 = join(testsDir, `${baseName}.test.tsx`);
    const testFile3 = join(testsDir, `${baseName}.spec.ts`);
    const testFile4 = join(testsDir, `${baseName}.spec.tsx`);

    if (existsSync(testFile1)) testFiles.push(testFile1);
    if (existsSync(testFile2)) testFiles.push(testFile2);
    if (existsSync(testFile3)) testFiles.push(testFile3);
    if (existsSync(testFile4)) testFiles.push(testFile4);
  }

  // Check package-level __tests__ directory
  const packageTestsDir = join(packageDir, '__tests__');
  if (existsSync(packageTestsDir)) {
    const relativePath = relative(join(packageDir, 'src'), dirName);
    const testDirPath = join(packageTestsDir, relativePath);

    if (existsSync(testDirPath)) {
      const testFile1 = join(testDirPath, `${baseName}.test.ts`);
      const testFile2 = join(testDirPath, `${baseName}.test.tsx`);

      if (existsSync(testFile1)) testFiles.push(testFile1);
      if (existsSync(testFile2)) testFiles.push(testFile2);
    }
  }

  return testFiles;
}

async function analyzeComplexity(file: string): Promise<'low' | 'medium' | 'high'> {
  try {
    const content = await readFile(file, 'utf-8');
    const lines = content.split('\n').length;

    // Simple heuristic based on lines of code and complexity indicators
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    const functionCount = (content.match(/function\s+\w+/g) || []).length;
    const asyncCount = (content.match(/async\s+/g) || []).length;
    const ifCount = (content.match(/\bif\s*\(/g) || []).length;
    const loopCount = (content.match(/\b(for|while)\s*\(/g) || []).length;

    const complexityScore = classCount * 3 + functionCount * 2 + asyncCount * 2 + ifCount + loopCount;

    if (lines < 50 && complexityScore < 20) return 'low';
    if (lines < 200 && complexityScore < 50) return 'medium';
    return 'high';
  } catch {
    return 'medium';
  }
}

function isCriticalPath(filePath: string): boolean {
  return CRITICAL_PATTERNS.some(pattern => filePath.includes(pattern));
}

async function analyzePackage(packagePath: string): Promise<PackageCoverage> {
  const packageName = basename(packagePath);
  const srcDir = join(packagePath, 'src');

  if (!existsSync(srcDir)) {
    return {
      name: packageName,
      totalFiles: 0,
      coveredFiles: 0,
      uncoveredFiles: 0,
      coverage: 0,
      files: [],
    };
  }

  const sourceFiles = await getAllSourceFiles(srcDir);
  const analyses: FileAnalysis[] = [];

  for (const file of sourceFiles) {
    const testFiles = await findTestFiles(file, packagePath);
    const content = await readFile(file, 'utf-8');
    const linesOfCode = content.split('\n').length;
    const complexity = await analyzeComplexity(file);
    const criticalPath = isCriticalPath(file);

    analyses.push({
      package: packageName,
      file: basename(file),
      relativePath: relative(packagePath, file),
      hasTests: testFiles.length > 0,
      testFiles: testFiles.map(tf => relative(packagePath, tf)),
      linesOfCode,
      complexity,
      criticalPath,
    });
  }

  const coveredFiles = analyses.filter(a => a.hasTests).length;
  const totalFiles = analyses.length;

  return {
    name: packageName,
    totalFiles,
    coveredFiles,
    uncoveredFiles: totalFiles - coveredFiles,
    coverage: totalFiles > 0 ? (coveredFiles / totalFiles) * 100 : 0,
    files: analyses,
  };
}

async function main() {
  console.log('🔍 Analyzing Test Coverage Across All Packages...\n');

  const packages = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const analyses: PackageCoverage[] = [];

  for (const pkg of packages) {
    if (!pkg.isDirectory() || pkg.name === 'node_modules') continue;

    const packagePath = join(PACKAGES_DIR, pkg.name);
    const analysis = await analyzePackage(packagePath);
    analyses.push(analysis);
  }

  // Sort by coverage percentage
  analyses.sort((a, b) => a.coverage - b.coverage);

  // Print summary
  console.log('📊 COVERAGE SUMMARY BY PACKAGE\n');
  console.log('Package                 | Total Files | Covered | Uncovered | Coverage %');
  console.log('------------------------|-------------|---------|-----------|------------');

  for (const analysis of analyses) {
    const coverage = analysis.coverage.toFixed(1);
    const status = analysis.coverage >= 80 ? '✅' : '❌';
    console.log(
      `${status} ${analysis.name.padEnd(20)} | ${String(analysis.totalFiles).padStart(11)} | ${String(analysis.coveredFiles).padStart(7)} | ${String(analysis.uncoveredFiles).padStart(9)} | ${coverage.padStart(9)}%`
    );
  }

  // Calculate overall coverage
  const totalFiles = analyses.reduce((sum, a) => sum + a.totalFiles, 0);
  const totalCovered = analyses.reduce((sum, a) => sum + a.coveredFiles, 0);
  const overallCoverage = totalFiles > 0 ? (totalCovered / totalFiles) * 100 : 0;

  console.log('------------------------|-------------|---------|-----------|------------');
  console.log(
    `TOTAL                   | ${String(totalFiles).padStart(11)} | ${String(totalCovered).padStart(7)} | ${String(totalFiles - totalCovered).padStart(9)} | ${overallCoverage.toFixed(1).padStart(9)}%\n`
  );

  // Print files without tests (under 80% coverage threshold)
  console.log('\n🚨 FILES WITHOUT TESTS (PRIORITY ORDER)\n');

  const uncoveredFiles = analyses
    .flatMap(a => a.files.filter(f => !f.hasTests))
    .sort((a, b) => {
      // Sort by: critical path first, then complexity, then LOC
      if (a.criticalPath !== b.criticalPath) return a.criticalPath ? -1 : 1;
      if (a.complexity !== b.complexity) {
        const complexityOrder = { high: 0, medium: 1, low: 2 };
        return complexityOrder[a.complexity] - complexityOrder[b.complexity];
      }
      return b.linesOfCode - a.linesOfCode;
    });

  for (const file of uncoveredFiles) {
    const priority = file.criticalPath ? '🔴 CRITICAL' : file.complexity === 'high' ? '🟡 HIGH' : '🟢 NORMAL';
    console.log(`${priority} | ${file.package}/${file.relativePath} (${file.linesOfCode} LOC, ${file.complexity} complexity)`);
  }

  console.log(`\n📈 Total Uncovered Files: ${uncoveredFiles.length}`);
  console.log(`📈 Critical Path Files Without Tests: ${uncoveredFiles.filter(f => f.criticalPath).length}`);
  console.log(`📈 High Complexity Files Without Tests: ${uncoveredFiles.filter(f => f.complexity === 'high').length}\n`);

  // Export as JSON for further processing
  const output = {
    summary: {
      totalFiles,
      totalCovered,
      totalUncovered: totalFiles - totalCovered,
      overallCoverage,
      timestamp: new Date().toISOString(),
    },
    packages: analyses,
    uncoveredFiles,
  };

  await import('fs/promises').then(fs =>
    fs.writeFile(
      join(process.cwd(), 'coverage-analysis.json'),
      JSON.stringify(output, null, 2)
    )
  );

  console.log('✅ Coverage analysis saved to coverage-analysis.json\n');
}

main().catch(console.error);
