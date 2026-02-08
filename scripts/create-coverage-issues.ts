#!/usr/bin/env tsx
/**
 * Generate GitHub issues for all files without test coverage
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

interface UncoveredFile {
  package: string;
  file: string;
  relativePath: string;
  linesOfCode: number;
  complexity: 'low' | 'medium' | 'high';
  criticalPath: boolean;
}

interface CoverageData {
  summary: {
    totalFiles: number;
    totalCovered: number;
    totalUncovered: number;
    overallCoverage: number;
  };
  uncoveredFiles: UncoveredFile[];
}

const ISSUE_PRIORITIES = {
  critical: { label: 'priority: critical', color: 'b60205' },
  high: { label: 'priority: high', color: 'd93f0b' },
  medium: { label: 'priority: medium', color: 'fbca04' },
  low: { label: 'priority: low', color: '0e8a16' },
};

function getPriority(file: UncoveredFile): 'critical' | 'high' | 'medium' | 'low' {
  if (file.criticalPath) return 'critical';
  if (file.complexity === 'high') return 'high';
  if (file.complexity === 'medium') return 'medium';
  return 'low';
}

function getStoryPoints(file: UncoveredFile): number {
  const basePoints = {
    low: 2,
    medium: 5,
    high: 8,
  }[file.complexity];

  const multiplier = file.criticalPath ? 1.5 : 1.0;
  const locMultiplier = file.linesOfCode > 500 ? 1.5 : file.linesOfCode > 300 ? 1.2 : 1.0;

  return Math.round(basePoints * multiplier * locMultiplier);
}

function getMissingTestCases(file: UncoveredFile): string[] {
  const baseCases = [
    'Unit tests for main functionality',
    'Edge case handling',
    'Error handling and validation',
  ];

  if (file.criticalPath) {
    baseCases.push(
      'Integration tests with dependencies',
      'Resource cleanup and lifecycle management',
      'Concurrent access scenarios'
    );
  }

  if (file.complexity === 'high') {
    baseCases.push(
      'Complex state machine transitions',
      'Performance benchmarks',
      'Memory leak prevention'
    );
  }

  // Domain-specific test cases
  if (file.relativePath.includes('session')) {
    baseCases.push(
      'Session creation and retrieval',
      'Session expiration and cleanup',
      'Data serialization/deserialization',
      'TTL management'
    );
  }

  if (file.relativePath.includes('llm') || file.relativePath.includes('Provider')) {
    baseCases.push(
      'API call mocking and response handling',
      'Token counting accuracy',
      'Streaming response parsing',
      'Rate limit and retry logic',
      'Cost calculation'
    );
  }

  if (file.relativePath.includes('recording') || file.relativePath.includes('video')) {
    baseCases.push(
      'MediaRecorder lifecycle',
      'Stream composition and sync',
      'Browser compatibility',
      'Resource disposal on unmount'
    );
  }

  if (file.relativePath.includes('hook')) {
    baseCases.push(
      'Hook initialization and cleanup',
      'State updates and re-renders',
      'Effect dependencies',
      'Memory leak prevention'
    );
  }

  if (file.relativePath.includes('Storage') || file.relativePath.includes('Store')) {
    baseCases.push(
      'CRUD operations',
      'Data persistence and retrieval',
      'Error handling for storage failures',
      'Transaction handling'
    );
  }

  return baseCases;
}

function generateIssueBody(file: UncoveredFile, issueNumber: number): string {
  const priority = getPriority(file);
  const storyPoints = getStoryPoints(file);
  const testCases = getMissingTestCases(file);

  return `## 🧪 Add Test Coverage for \`${file.relativePath}\`

### 📊 Coverage Analysis

| Metric | Value |
|--------|-------|
| **File** | \`packages/${file.package}/${file.relativePath}\` |
| **Lines of Code** | ${file.linesOfCode} |
| **Complexity** | ${file.complexity.toUpperCase()} |
| **Critical Path** | ${file.criticalPath ? '🔴 YES' : '🟢 NO'} |
| **Current Coverage** | 0% |
| **Target Coverage** | 80% |

### 🎯 Priority: ${priority.toUpperCase()}

${file.criticalPath ? '⚠️ **CRITICAL PATH**: This file is part of a critical code path and MUST be tested before production deployment.' : ''}

### 📝 Missing Test Cases

${testCases.map((tc, i) => `${i + 1}. ${tc}`).join('\n')}

### 📐 Story Point Estimate

**${storyPoints} points** - ${storyPoints <= 3 ? 'Small' : storyPoints <= 5 ? 'Medium' : storyPoints <= 8 ? 'Large' : 'Extra Large'}

### ✅ Acceptance Criteria

- [ ] Unit tests added with 80%+ line coverage
- [ ] Branch coverage achieves 75%+
- [ ] All test cases listed above are implemented
- [ ] Edge cases and error scenarios covered
- [ ] Tests pass in CI/CD pipeline
- [ ] No flaky tests introduced
- [ ] Test documentation added

### 🔗 Related Files

Run this command to find related tests:
\`\`\`bash
find packages/${file.package}/__tests__ -name "*${file.file.replace(/\.(ts|tsx)$/, '')}*"
\`\`\`

### 🛠️ Testing Framework

- **Test Runner:** Vitest
- **Testing Library:** ${file.file.endsWith('.tsx') ? '@testing-library/react' : 'Vitest'}
- **Coverage Tool:** @vitest/coverage-v8

### 📚 Resources

- [Coverage Audit Report](/docs/testing/coverage-audit-2026-02-07.md)
- [TDD Guidelines](/.ainative/mandatory-tdd.md) (if exists)
- [Testing Package](/packages/testing/README.md)

### 🏷️ Labels

\`testing\`, \`coverage\`, \`${ISSUE_PRIORITIES[priority].label}\`, \`${file.package}\`

---

**Generated by Coverage Audit Tool**
**Issue #COVERAGE-${String(issueNumber).padStart(3, '0')}**
**Date:** ${new Date().toISOString().split('T')[0]}
`;
}

async function main() {
  console.log('📋 Generating GitHub issues for uncovered files...\n');

  const coverageData: CoverageData = JSON.parse(
    await readFile(join(process.cwd(), 'coverage-analysis.json'), 'utf-8')
  );

  const { uncoveredFiles } = coverageData;

  // Sort by priority
  const sortedFiles = uncoveredFiles.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aPriority = getPriority(a);
    const bPriority = getPriority(b);

    if (aPriority !== bPriority) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }

    // Within same priority, sort by LOC descending
    return b.linesOfCode - a.linesOfCode;
  });

  // Generate issue templates
  console.log('📝 Issue Templates Generated:\n');
  console.log('=' . repeat(100));

  const issuesByPriority: Record<string, string[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  sortedFiles.forEach((file, index) => {
    const issueNumber = index + 1;
    const priority = getPriority(file);
    const body = generateIssueBody(file, issueNumber);

    issuesByPriority[priority].push(body);
  });

  // Print summary
  console.log('\n📊 ISSUE SUMMARY\n');
  console.log(`Total Issues to Create: ${uncoveredFiles.length}\n`);

  Object.entries(issuesByPriority).forEach(([priority, issues]) => {
    if (issues.length > 0) {
      const icon = {
        critical: '🔴',
        high: '🟡',
        medium: '🟠',
        low: '🟢',
      }[priority];

      console.log(`${icon} ${priority.toUpperCase()}: ${issues.length} issues`);
    }
  });

  // Write issue bodies to file for batch creation
  const issueScript = `#!/bin/bash
# GitHub Issue Creation Script
# Generated from coverage audit
#
# Usage: ./create-coverage-issues.sh <github-repo> <github-token>
#
# Example: ./create-coverage-issues.sh ainative/ai-kit ghp_xxxxx
#

REPO="$1"
TOKEN="$2"

if [ -z "$REPO" ] || [ -z "$TOKEN" ]; then
  echo "Usage: ./create-coverage-issues.sh <github-repo> <github-token>"
  exit 1
fi

echo "Creating ${uncoveredFiles.length} issues for $REPO..."
echo ""

${sortedFiles
  .map((file, index) => {
    const issueNumber = index + 1;
    const priority = getPriority(file);
    const body = generateIssueBody(file, issueNumber)
      .replace(/`/g, '\\`')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$');

    const title = `Add test coverage for ${file.package}/${file.file}`;
    const labels = ['testing', 'coverage', ISSUE_PRIORITIES[priority].label, file.package].join(',');

    return `# Issue ${issueNumber}: ${file.relativePath}
gh issue create \\
  --repo "$REPO" \\
  --title "${title}" \\
  --body "${body}" \\
  --label "${labels}" \\
  --assignee "@me"

echo "✅ Created issue ${issueNumber}/${uncoveredFiles.length}: ${file.file}"
sleep 1  # Rate limit protection
`;
  })
  .join('\n')}

echo ""
echo "✅ All ${uncoveredFiles.length} issues created successfully!"
`;

  await import('fs/promises').then(fs =>
    fs.writeFile(join(process.cwd(), 'create-coverage-issues.sh'), issueScript, {
      mode: 0o755,
    })
  );

  console.log('\n✅ Issue creation script written to: create-coverage-issues.sh');
  console.log('\nTo create issues, run:');
  console.log('  ./create-coverage-issues.sh <owner/repo> <github-token>\n');

  // Print first 3 critical issues as examples
  console.log('\n📋 SAMPLE CRITICAL ISSUES (First 3):\n');
  console.log('=' .repeat(100));

  issuesByPriority.critical.slice(0, 3).forEach((issue, index) => {
    console.log(`\n### CRITICAL ISSUE #${index + 1}\n`);
    console.log(issue);
    console.log('\n' + '='.repeat(100));
  });

  console.log('\n✅ Coverage issue generation complete!\n');
}

main().catch(console.error);
