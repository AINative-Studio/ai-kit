import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * AI Kit E2E Test Configuration
 *
 * Comprehensive Playwright configuration for testing:
 * - Chat applications (Next.js, React, Vue, Svelte)
 * - Agent applications (Research, Code Review, Support)
 * - Dashboard applications (Analytics, Monitoring, Admin)
 * - CLI tools (Project creation, Prompt testing)
 * - Complete workflows (Deployment, Integration)
 */
export default defineConfig({
  // Test directory
  testDir: './',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 10 * 1000,

    // Custom matchers
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action such as `click()` can take
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Global setup and teardown
  globalSetup: path.resolve(__dirname, 'setup/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'setup/global-teardown.ts'),

  // Configure projects for major browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },

    // Dark mode testing
    {
      name: 'chromium-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'cd examples/chat-apps/nextjs-chatbot && pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
      },
    },
    {
      command: 'cd examples/chat-apps/react-tools-chat && pnpm dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        PORT: '3001',
      },
    },
    {
      command: 'cd examples/dashboard-apps/usage-analytics && pnpm dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        PORT: '3002',
      },
    },
  ],

  // Test output directory
  outputDir: 'test-results',

  // Preserve output from previous runs
  preserveOutput: 'always',

  // Update snapshots on mismatch
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',

  // Grep patterns
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  grepInvert: process.env.TEST_GREP_INVERT
    ? new RegExp(process.env.TEST_GREP_INVERT)
    : undefined,
});
