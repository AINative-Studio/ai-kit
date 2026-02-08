#!/usr/bin/env tsx
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

const rootDir = join(__dirname, '../..');
let allTestsPassed = true;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    allTestsPassed = false;
    failedTests++;
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substring: string) {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}"`);
      }
    },
    toBeGreaterThan(num: number) {
      if (actual <= num) {
        throw new Error(`Expected ${actual} to be greater than ${num}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toHaveProperty(prop: string) {
      if (!(prop in actual)) {
        throw new Error(`Expected object to have property "${prop}"`);
      }
    }
  };
}

console.log('Validating GitHub Templates...\n');

// Test directory structure
console.log('Testing Directory Structure:');
test('should have .github directory', () => {
  if (!existsSync(join(rootDir, '.github'))) {
    throw new Error('.github directory not found');
  }
});

test('should have .github/ISSUE_TEMPLATE directory', () => {
  if (!existsSync(join(rootDir, '.github/ISSUE_TEMPLATE'))) {
    throw new Error('.github/ISSUE_TEMPLATE directory not found');
  }
});

// Test required files
console.log('\nTesting Required Files:');
const templatesDir = join(rootDir, '.github/ISSUE_TEMPLATE');
const bugReportPath = join(templatesDir, 'bug_report.yml');
const featureRequestPath = join(templatesDir, 'feature_request.yml');
const configPath = join(templatesDir, 'config.yml');
const prTemplatePath = join(rootDir, '.github/pull_request_template.md');
const contributingPath = join(rootDir, 'docs/contributing/CONTRIBUTING.md');
const licensePath = join(rootDir, 'LICENSE');

test('should have bug_report.yml', () => {
  if (!existsSync(bugReportPath)) {
    throw new Error('bug_report.yml not found');
  }
});

test('should have feature_request.yml', () => {
  if (!existsSync(featureRequestPath)) {
    throw new Error('feature_request.yml not found');
  }
});

test('should have config.yml', () => {
  if (!existsSync(configPath)) {
    throw new Error('config.yml not found');
  }
});

test('should have pull_request_template.md', () => {
  if (!existsSync(prTemplatePath)) {
    throw new Error('pull_request_template.md not found');
  }
});

test('should have CONTRIBUTING.md', () => {
  if (!existsSync(contributingPath)) {
    throw new Error('CONTRIBUTING.md not found');
  }
});

test('should have LICENSE', () => {
  if (!existsSync(licensePath)) {
    throw new Error('LICENSE not found');
  }
});

// Validate bug_report.yml
console.log('\nValidating bug_report.yml:');
let bugReportData: any;

test('should be valid YAML', () => {
  const content = readFileSync(bugReportPath, 'utf-8');
  bugReportData = yaml.parse(content);
});

test('should have required fields', () => {
  expect(bugReportData).toHaveProperty('name');
  expect(bugReportData).toHaveProperty('description');
  expect(bugReportData).toHaveProperty('body');
});

test('should have Bug Report as name', () => {
  expect(bugReportData.name).toBe('Bug Report');
});

test('should have bug in labels', () => {
  if (!bugReportData.labels || !Array.isArray(bugReportData.labels) || !bugReportData.labels.includes('bug')) {
    throw new Error('Labels should include "bug"');
  }
});

test('should have description field', () => {
  const descField = bugReportData.body.find((f: any) => f.id === 'description');
  expect(descField).toBeDefined();
  expect(descField.type).toBe('textarea');
});

test('should have package dropdown', () => {
  const packageField = bugReportData.body.find((f: any) => f.id === 'package');
  expect(packageField).toBeDefined();
  expect(packageField.type).toBe('dropdown');
});

// Validate feature_request.yml
console.log('\nValidating feature_request.yml:');
let featureRequestData: any;

test('should be valid YAML', () => {
  const content = readFileSync(featureRequestPath, 'utf-8');
  featureRequestData = yaml.parse(content);
});

test('should have required fields', () => {
  expect(featureRequestData).toHaveProperty('name');
  expect(featureRequestData).toHaveProperty('description');
  expect(featureRequestData).toHaveProperty('body');
});

test('should have Feature Request as name', () => {
  expect(featureRequestData.name).toBe('Feature Request');
});

test('should have enhancement in labels', () => {
  if (!featureRequestData.labels || !featureRequestData.labels.includes('enhancement')) {
    throw new Error('Labels should include "enhancement"');
  }
});

// Validate config.yml
console.log('\nValidating config.yml:');
let configData: any;

test('should be valid YAML', () => {
  const content = readFileSync(configPath, 'utf-8');
  configData = yaml.parse(content);
});

test('should have blank_issues_enabled', () => {
  expect(configData).toHaveProperty('blank_issues_enabled');
});

test('should have contact_links', () => {
  if (!Array.isArray(configData.contact_links) || configData.contact_links.length === 0) {
    throw new Error('contact_links should be a non-empty array');
  }
});

// Validate PR template
console.log('\nValidating pull_request_template.md:');
const prTemplate = readFileSync(prTemplatePath, 'utf-8');

test('should contain Summary section', () => {
  expect(prTemplate).toContain('## Summary');
});

test('should contain Type of Change section', () => {
  expect(prTemplate).toContain('## Type of Change');
});

test('should contain Testing section', () => {
  expect(prTemplate).toContain('## Testing');
});

test('should contain Checklist section', () => {
  expect(prTemplate).toContain('## Checklist');
});

test('should have AINative attribution', () => {
  expect(prTemplate).toContain('AINative');
});

// Validate CONTRIBUTING.md
console.log('\nValidating CONTRIBUTING.md:');
const contributing = readFileSync(contributingPath, 'utf-8');

test('should have main heading', () => {
  expect(contributing).toContain('# Contributing to AI Kit');
});

test('should have Getting Started section', () => {
  expect(contributing).toContain('## Getting Started');
});

test('should have Testing Guidelines section', () => {
  expect(contributing).toContain('## Testing Guidelines');
});

test('should mention Node.js 18+', () => {
  expect(contributing).toContain('Node.js 18');
});

test('should have AINative attribution', () => {
  expect(contributing).toContain('AINative');
});

// Validate LICENSE
console.log('\nValidating LICENSE:');
const license = readFileSync(licensePath, 'utf-8');

test('should be MIT License', () => {
  expect(license).toContain('MIT License');
});

test('should have AINative Studio copyright', () => {
  expect(license).toContain('AINative Studio');
});

test('should contain standard MIT text', () => {
  expect(license).toContain('Permission is hereby granted');
  expect(license).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${passedTests}`);
console.log(`Tests Failed: ${failedTests}`);
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`${'='.repeat(50)}\n`);

if (!allTestsPassed) {
  console.error('Some tests failed!');
  process.exit(1);
}

console.log('All tests passed!');
process.exit(0);
