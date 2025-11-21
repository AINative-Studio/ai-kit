#!/usr/bin/env node

/**
 * Package Metadata Validation Script
 *
 * Validates that all packages in the AI Kit monorepo have consistent,
 * complete metadata for NPM publishing.
 *
 * Usage: node scripts/validate-packages.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

// Expected metadata for all packages
const EXPECTED_VERSION = '0.1.0-alpha.0';
const EXPECTED_AUTHOR = 'AINative Studio';
const EXPECTED_LICENSE = 'MIT';
const EXPECTED_HOMEPAGE = 'https://ai-kit.ainative.studio';
const EXPECTED_REPO_URL = 'https://github.com/AINative-Studio/ai-kit.git';
const EXPECTED_BUGS_URL = 'https://github.com/AINative-Studio/ai-kit/issues';
const EXPECTED_NODE_VERSION = '>=18.0.0';
const EXPECTED_REGISTRY = 'https://registry.npmjs.org/';

// Package naming rules
const PACKAGE_NAMING = {
  react: '@ainative/ai-kit', // Main package
  core: '@ainative/ai-kit-core',
  svelte: '@ainative/ai-kit-svelte',
  vue: '@ainative/ai-kit-vue',
  nextjs: '@ainative/ai-kit-nextjs',
  cli: '@ainative/ai-kit-cli',
  tools: '@ainative/ai-kit-tools',
  auth: '@ainative/ai-kit-auth',
  rlhf: '@ainative/ai-kit-rlhf',
  zerodb: '@ainative/ai-kit-zerodb',
  'design-system': '@ainative/ai-kit-design-system',
  testing: '@ainative/ai-kit-testing',
  observability: '@ainative/ai-kit-observability',
  safety: '@ainative/ai-kit-safety',
};

// Required fields in package.json
const REQUIRED_FIELDS = [
  'name',
  'version',
  'description',
  'author',
  'license',
  'homepage',
  'repository',
  'bugs',
  'publishConfig',
  'engines',
  'files',
  'scripts',
  'keywords',
];

// Required scripts
const REQUIRED_SCRIPTS = ['build', 'dev', 'test', 'type-check', 'lint', 'clean'];

// Required files in package directory
const REQUIRED_FILES_IN_PACKAGE = ['LICENSE', 'README.md', 'package.json'];

let errorCount = 0;
let warningCount = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(packageName, message) {
  errorCount++;
  log(`  ✗ ${message}`, 'red');
}

function logWarning(packageName, message) {
  warningCount++;
  log(`  ⚠ ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function validatePackageName(packageName, pkg) {
  const expectedName = PACKAGE_NAMING[packageName];
  if (pkg.name !== expectedName) {
    logError(packageName, `Name mismatch: expected "${expectedName}", got "${pkg.name}"`);
    return false;
  }
  return true;
}

function validateVersion(packageName, pkg) {
  if (pkg.version !== EXPECTED_VERSION) {
    logError(packageName, `Version mismatch: expected "${EXPECTED_VERSION}", got "${pkg.version}"`);
    return false;
  }
  return true;
}

function validateDescription(packageName, pkg) {
  if (!pkg.description) {
    logError(packageName, 'Missing description');
    return false;
  }

  if (!pkg.description.startsWith('AI Kit - ') && packageName !== 'core') {
    logWarning(packageName, 'Description should start with "AI Kit - "');
  }

  if (pkg.description.length > 100) {
    logWarning(packageName, `Description is too long (${pkg.description.length} chars, should be <100)`);
  }

  return true;
}

function validateKeywords(packageName, pkg) {
  if (!pkg.keywords || !Array.isArray(pkg.keywords)) {
    logError(packageName, 'Missing or invalid keywords array');
    return false;
  }

  if (!pkg.keywords.includes('ai')) {
    logWarning(packageName, 'Keywords should include "ai"');
  }

  if (!pkg.keywords.includes('ainative')) {
    logWarning(packageName, 'Keywords should include "ainative"');
  }

  if (pkg.keywords.length < 3) {
    logWarning(packageName, `Only ${pkg.keywords.length} keywords (should have at least 3)`);
  }

  return true;
}

function validateRepository(packageName, pkg) {
  if (!pkg.repository || typeof pkg.repository !== 'object') {
    logError(packageName, 'Missing or invalid repository object');
    return false;
  }

  if (pkg.repository.type !== 'git') {
    logError(packageName, 'Repository type should be "git"');
    return false;
  }

  if (pkg.repository.url !== EXPECTED_REPO_URL) {
    logError(packageName, `Repository URL mismatch: expected "${EXPECTED_REPO_URL}", got "${pkg.repository.url}"`);
    return false;
  }

  if (!pkg.repository.directory) {
    logError(packageName, 'Missing repository.directory field');
    return false;
  }

  const expectedDirectory = `packages/${packageName}`;
  if (pkg.repository.directory !== expectedDirectory) {
    logError(packageName, `Repository directory mismatch: expected "${expectedDirectory}", got "${pkg.repository.directory}"`);
    return false;
  }

  return true;
}

function validateBugs(packageName, pkg) {
  if (!pkg.bugs || typeof pkg.bugs !== 'object') {
    logError(packageName, 'Missing or invalid bugs object');
    return false;
  }

  if (pkg.bugs.url !== EXPECTED_BUGS_URL) {
    logError(packageName, `Bugs URL mismatch: expected "${EXPECTED_BUGS_URL}", got "${pkg.bugs.url}"`);
    return false;
  }

  return true;
}

function validatePublishConfig(packageName, pkg) {
  if (!pkg.publishConfig || typeof pkg.publishConfig !== 'object') {
    logError(packageName, 'Missing or invalid publishConfig object');
    return false;
  }

  if (pkg.publishConfig.access !== 'public') {
    logError(packageName, 'publishConfig.access should be "public"');
    return false;
  }

  if (pkg.publishConfig.registry !== EXPECTED_REGISTRY) {
    logError(packageName, `publishConfig.registry should be "${EXPECTED_REGISTRY}"`);
    return false;
  }

  return true;
}

function validateEngines(packageName, pkg) {
  if (!pkg.engines || typeof pkg.engines !== 'object') {
    logError(packageName, 'Missing or invalid engines object');
    return false;
  }

  if (pkg.engines.node !== EXPECTED_NODE_VERSION) {
    logError(packageName, `engines.node should be "${EXPECTED_NODE_VERSION}", got "${pkg.engines.node}"`);
    return false;
  }

  return true;
}

function validateFilesArray(packageName, pkg) {
  if (!pkg.files || !Array.isArray(pkg.files)) {
    logError(packageName, 'Missing or invalid files array');
    return false;
  }

  const requiredFiles = ['dist', 'README.md', 'LICENSE'];
  const missingFiles = requiredFiles.filter(file => !pkg.files.includes(file));

  if (missingFiles.length > 0) {
    logError(packageName, `Missing files in files array: ${missingFiles.join(', ')}`);
    return false;
  }

  return true;
}

function validateScripts(packageName, pkg) {
  if (!pkg.scripts || typeof pkg.scripts !== 'object') {
    logError(packageName, 'Missing or invalid scripts object');
    return false;
  }

  const missingScripts = REQUIRED_SCRIPTS.filter(script => !pkg.scripts[script]);

  if (missingScripts.length > 0) {
    logError(packageName, `Missing scripts: ${missingScripts.join(', ')}`);
    return false;
  }

  return true;
}

function validateExports(packageName, pkg) {
  if (!pkg.exports || typeof pkg.exports !== 'object') {
    logError(packageName, 'Missing or invalid exports field');
    return false;
  }

  if (!pkg.exports['.']) {
    logError(packageName, 'Missing "." export in exports field');
    return false;
  }

  const mainExport = pkg.exports['.'];
  if (!mainExport.types || !mainExport.import || !mainExport.require) {
    logError(packageName, 'Main export should have types, import, and require fields');
    return false;
  }

  return true;
}

function validatePackageFiles(packageName, packagePath) {
  let valid = true;

  for (const file of REQUIRED_FILES_IN_PACKAGE) {
    const filePath = path.join(packagePath, file);
    if (!fs.existsSync(filePath)) {
      logError(packageName, `Missing required file: ${file}`);
      valid = false;
    }
  }

  return valid;
}

function validatePackage(packageName, packagePath) {
  log(`\n${colors.bold}Validating: ${packageName}${colors.reset}`, 'blue');

  // Read package.json
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError(packageName, 'package.json not found');
    return false;
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    logError(packageName, `Failed to parse package.json: ${error.message}`);
    return false;
  }

  // Check all required fields
  const missingFields = REQUIRED_FIELDS.filter(field => !pkg[field]);
  if (missingFields.length > 0) {
    logError(packageName, `Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate specific fields
  let allValid = true;
  allValid = validatePackageName(packageName, pkg) && allValid;
  allValid = validateVersion(packageName, pkg) && allValid;
  allValid = validateDescription(packageName, pkg) && allValid;
  allValid = validateKeywords(packageName, pkg) && allValid;
  allValid = validateRepository(packageName, pkg) && allValid;
  allValid = validateBugs(packageName, pkg) && allValid;
  allValid = validatePublishConfig(packageName, pkg) && allValid;
  allValid = validateEngines(packageName, pkg) && allValid;
  allValid = validateFilesArray(packageName, pkg) && allValid;
  allValid = validateScripts(packageName, pkg) && allValid;
  allValid = validateExports(packageName, pkg) && allValid;
  allValid = validatePackageFiles(packageName, packagePath) && allValid;

  // Check basic fields
  if (pkg.author !== EXPECTED_AUTHOR) {
    logError(packageName, `Author should be "${EXPECTED_AUTHOR}", got "${pkg.author}"`);
    allValid = false;
  }

  if (pkg.license !== EXPECTED_LICENSE) {
    logError(packageName, `License should be "${EXPECTED_LICENSE}", got "${pkg.license}"`);
    allValid = false;
  }

  if (pkg.homepage !== EXPECTED_HOMEPAGE) {
    logError(packageName, `Homepage should be "${EXPECTED_HOMEPAGE}", got "${pkg.homepage}"`);
    allValid = false;
  }

  if (allValid) {
    logSuccess('All checks passed!');
  }

  return allValid;
}

function main() {
  log(`\n${colors.bold}╔═══════════════════════════════════════════════════════════╗${colors.reset}`, 'blue');
  log(`${colors.bold}║  AI Kit Package Metadata Validation                      ║${colors.reset}`, 'blue');
  log(`${colors.bold}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`, 'blue');

  const packagesDir = path.join(__dirname, '..', 'packages');
  const packages = fs.readdirSync(packagesDir).filter(name => {
    const packagePath = path.join(packagesDir, name);
    return fs.statSync(packagePath).isDirectory() && fs.existsSync(path.join(packagePath, 'package.json'));
  });

  log(`Found ${packages.length} packages to validate\n`, 'blue');

  let validPackages = 0;
  for (const packageName of packages) {
    const packagePath = path.join(packagesDir, packageName);
    if (validatePackage(packageName, packagePath)) {
      validPackages++;
    }
  }

  // Summary
  log(`\n${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}`, 'blue');
  log(`${colors.bold}Validation Summary:${colors.reset}`, 'blue');
  log(`${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}\n`, 'blue');

  log(`Total packages: ${packages.length}`, 'blue');
  log(`Valid packages: ${colors.green}${validPackages}${colors.reset}`);
  log(`Invalid packages: ${colors.red}${packages.length - validPackages}${colors.reset}`);
  log(`Errors: ${colors.red}${errorCount}${colors.reset}`);
  log(`Warnings: ${colors.yellow}${warningCount}${colors.reset}\n`);

  if (validPackages === packages.length && errorCount === 0) {
    log(`${colors.bold}${colors.green}✓ All packages passed validation!${colors.reset}\n`);
    process.exit(0);
  } else {
    log(`${colors.bold}${colors.red}✗ Validation failed. Please fix the errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
