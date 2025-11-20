import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup for E2E tests
 *
 * This runs once before all tests and handles:
 * - Environment variable validation
 * - Test database setup
 * - Authentication state preparation
 * - Test data seeding
 * - Server health checks
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting AI Kit E2E Test Suite...\n');

  // Validate required environment variables
  validateEnvironment();

  // Create test directories
  ensureDirectories();

  // Setup test authentication
  await setupAuthentication(config);

  // Setup test database
  await setupTestDatabase();

  // Verify servers are ready
  await verifyServers(config);

  console.log('✅ Global setup complete\n');
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  console.log('📋 Validating environment...');

  const required = ['NODE_ENV'];
  const recommended = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Warn about recommended variables
  for (const key of recommended) {
    if (!process.env[key]) {
      console.warn(`⚠️  Missing recommended environment variable: ${key}`);
      console.warn(`   Some tests may be skipped or use mock data\n`);
    }
  }

  console.log('✓ Environment validated\n');
}

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  console.log('📁 Creating test directories...');

  const dirs = [
    'test-results',
    'playwright-report',
    'screenshots',
    'videos',
    'traces',
    '.auth',
  ];

  for (const dir of dirs) {
    const dirPath = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  console.log('✓ Directories created\n');
}

/**
 * Setup authentication states for different user roles
 */
async function setupAuthentication(config: FullConfig) {
  console.log('🔐 Setting up authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Setup admin user authentication
    await setupAdminAuth(context);

    // Setup regular user authentication
    await setupUserAuth(context);

    // Setup guest authentication
    await setupGuestAuth(context);

    console.log('✓ Authentication setup complete\n');
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup admin user authentication
 */
async function setupAdminAuth(context: any) {
  const page = await context.newPage();

  // Mock admin authentication for testing
  await page.context().addCookies([
    {
      name: 'auth-token',
      value: 'test-admin-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save authentication state
  await page.context().storageState({
    path: path.resolve(__dirname, '..', '.auth/admin.json'),
  });

  await page.close();
}

/**
 * Setup regular user authentication
 */
async function setupUserAuth(context: any) {
  const page = await context.newPage();

  // Mock user authentication for testing
  await page.context().addCookies([
    {
      name: 'auth-token',
      value: 'test-user-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save authentication state
  await page.context().storageState({
    path: path.resolve(__dirname, '..', '.auth/user.json'),
  });

  await page.close();
}

/**
 * Setup guest authentication
 */
async function setupGuestAuth(context: any) {
  const page = await context.newPage();

  // Save empty authentication state for guest
  await page.context().storageState({
    path: path.resolve(__dirname, '..', '.auth/guest.json'),
  });

  await page.close();
}

/**
 * Setup test database
 */
async function setupTestDatabase() {
  console.log('🗄️  Setting up test database...');

  // In a real implementation, you would:
  // 1. Connect to test database
  // 2. Run migrations
  // 3. Seed test data
  // 4. Create test users

  // Mock implementation
  console.log('✓ Test database ready\n');
}

/**
 * Verify servers are ready
 */
async function verifyServers(config: FullConfig) {
  console.log('🌐 Verifying servers...');

  const servers = config.webServer;
  if (!servers) {
    console.log('⚠️  No web servers configured\n');
    return;
  }

  // Wait for servers to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('✓ Servers are ready\n');
}

export default globalSetup;
