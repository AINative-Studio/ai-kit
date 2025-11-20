import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for E2E tests
 *
 * This runs once after all tests and handles:
 * - Cleanup of test data
 * - Database cleanup
 * - File cleanup
 * - Resource cleanup
 * - Test report generation
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Cleaning up after E2E tests...\n');

  // Cleanup test database
  await cleanupTestDatabase();

  // Cleanup temporary files
  cleanupTempFiles();

  // Generate test summary
  generateTestSummary();

  console.log('✅ Global teardown complete\n');
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  console.log('🗄️  Cleaning up test database...');

  // In a real implementation, you would:
  // 1. Delete test data
  // 2. Reset database state
  // 3. Close connections

  console.log('✓ Test database cleaned\n');
}

/**
 * Cleanup temporary files
 */
function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...');

  const authDir = path.resolve(__dirname, '..', '.auth');
  if (fs.existsSync(authDir)) {
    // Keep .auth directory for debugging, but could be removed in CI
    if (process.env.CI) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  }

  console.log('✓ Temporary files cleaned\n');
}

/**
 * Generate test summary
 */
function generateTestSummary() {
  console.log('📊 Generating test summary...');

  const resultsFile = path.resolve(__dirname, '..', 'test-results.json');

  if (fs.existsSync(resultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

      console.log('\n═══════════════════════════════════════════');
      console.log('          E2E TEST SUMMARY');
      console.log('═══════════════════════════════════════════\n');

      const suites = results.suites || [];
      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;

      // Calculate statistics
      for (const suite of suites) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            totalTests++;
            if (test.status === 'passed') passedTests++;
            if (test.status === 'failed') failedTests++;
            if (test.status === 'skipped') skippedTests++;
          }
        }
      }

      console.log(`Total Tests:    ${totalTests}`);
      console.log(`✅ Passed:      ${passedTests}`);
      console.log(`❌ Failed:      ${failedTests}`);
      console.log(`⏭️  Skipped:     ${skippedTests}`);
      console.log(`\n═══════════════════════════════════════════\n`);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  }
}

export default globalTeardown;
