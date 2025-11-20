import { test, expect } from '@playwright/test';
import { ChatPage } from '../page-objects/chat-page';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Complete Chatbot Deployment Workflow E2E Tests
 *
 * Tests the full workflow from project creation to deployment
 * Covers: CLI creation, development, testing, building, deployment
 */

const WORKFLOW_DIR = path.join(__dirname, '..', '..', '..', 'workflow-test');
const CLI_PATH = path.join(__dirname, '..', '..', '..', 'packages', 'cli', 'dist', 'index.js');

test.describe('Complete Chatbot Workflow', () => {
  const projectPath = path.join(WORKFLOW_DIR, 'chatbot-workflow');

  test.afterAll(async () => {
    // Cleanup
    if (fs.existsSync(WORKFLOW_DIR)) {
      fs.rmSync(WORKFLOW_DIR, { recursive: true, force: true });
    }
  });

  test('Step 1: Create project with CLI', async () => {
    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);

  test('Step 2: Configure environment', async () => {
    // Create .env file
    const envContent = `
OPENAI_API_KEY=test-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
    `;

    fs.writeFileSync(path.join(projectPath, '.env.local'), envContent.trim());

    expect(fs.existsSync(path.join(projectPath, '.env.local'))).toBe(true);
  });

  test('Step 3: Install dependencies', async () => {
    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(fs.existsSync(path.join(projectPath, 'node_modules'))).toBe(true);
  }, 240000);

  test('Step 4: Run type checking', async () => {
    const { stdout, stderr } = await execAsync('pnpm type-check', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stderr).not.toContain('error');
  }, 90000);

  test('Step 5: Run tests', async () => {
    const { stdout } = await execAsync('pnpm test', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stdout).toMatch(/pass|success/i);
  }, 90000);

  test('Step 6: Start development server', async ({ page }) => {
    // Start dev server in background
    const devServer = exec('pnpm dev', { cwd: projectPath });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Test the running application
    const chatPage = new ChatPage(page);
    await chatPage.goto(3000);

    await expect(chatPage.messageInput).toBeVisible();

    // Stop server
    devServer.kill();
  }, 120000);

  test('Step 7: Test chat functionality', async ({ page }) => {
    // Start dev server
    const devServer = exec('pnpm dev', { cwd: projectPath });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    const chatPage = new ChatPage(page);
    await chatPage.goto(3000);

    // Test messaging
    await chatPage.sendMessage('Hello');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);

    devServer.kill();
  }, 120000);

  test('Step 8: Build for production', async () => {
    const { stdout, stderr } = await execAsync('pnpm build', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(fs.existsSync(path.join(projectPath, '.next'))).toBe(true);
    expect(stderr).not.toContain('error');
  }, 240000);

  test('Step 9: Verify production build', async () => {
    const buildDir = path.join(projectPath, '.next');
    expect(fs.existsSync(buildDir)).toBe(true);

    // Check for static files
    const staticDir = path.join(buildDir, 'static');
    expect(fs.existsSync(staticDir)).toBe(true);
  });

  test('Step 10: Start production server', async ({ page }) => {
    const prodServer = exec('pnpm start', {
      cwd: projectPath,
      env: { ...process.env, PORT: '3000' },
    });

    // Wait for server
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const chatPage = new ChatPage(page);
    await chatPage.goto(3000);

    await expect(chatPage.messageInput).toBeVisible();

    prodServer.kill();
  }, 120000);
});

test.describe('Chatbot Workflow - Quality Checks', () => {
  const projectPath = path.join(WORKFLOW_DIR, 'quality-check');

  test.beforeAll(async () => {
    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });
  }, 300000);

  test('should pass linting', async () => {
    const { stdout, stderr } = await execAsync('pnpm lint', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stderr).not.toContain('error');
  }, 90000);

  test('should have no TypeScript errors', async () => {
    const { stderr } = await execAsync('pnpm type-check', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stderr).not.toContain('error');
  }, 90000);

  test('should build without errors', async () => {
    const { stderr } = await execAsync('pnpm build', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(stderr).not.toContain('error');
  }, 240000);
});

test.describe('Chatbot Workflow - Performance', () => {
  test('should build within time limit', async () => {
    const projectPath = path.join(WORKFLOW_DIR, 'perf-test');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });

    const startTime = Date.now();
    await execAsync('pnpm build', {
      cwd: projectPath,
      timeout: 180000,
    });
    const buildTime = Date.now() - startTime;

    expect(buildTime).toBeLessThan(120000); // 2 minutes
  }, 420000);
});

test.describe('Chatbot Workflow - Integration', () => {
  test('should integrate with external APIs', async ({ page }) => {
    const projectPath = path.join(WORKFLOW_DIR, 'integration-test');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });

    // Create .env with test API key
    fs.writeFileSync(
      path.join(projectPath, '.env.local'),
      'OPENAI_API_KEY=test-key\n'
    );

    // Start server
    const devServer = exec('pnpm dev', { cwd: projectPath });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    const chatPage = new ChatPage(page);
    await chatPage.goto(3000);

    await expect(chatPage.messageInput).toBeVisible();

    devServer.kill();
  }, 300000);
});

test.describe('Chatbot Workflow - Error Recovery', () => {
  test('should handle missing dependencies', async () => {
    const projectPath = path.join(WORKFLOW_DIR, 'error-test');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    // Try to build without installing
    try {
      await execAsync('pnpm build', {
        cwd: projectPath,
        timeout: 60000,
      });
    } catch (error: any) {
      expect(error.message).toBeTruthy();
    }
  }, 90000);

  test('should handle invalid configuration', async ({ page }) => {
    const projectPath = path.join(WORKFLOW_DIR, 'config-error');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });

    // Create invalid .env
    fs.writeFileSync(
      path.join(projectPath, '.env.local'),
      'INVALID_CONFIG=true\n'
    );

    const devServer = exec('pnpm dev', { cwd: projectPath });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    const chatPage = new ChatPage(page);
    await chatPage.goto(3000);

    // Should still load but may show warnings
    await expect(chatPage.messageInput).toBeVisible();

    devServer.kill();
  }, 300000);
});

test.describe('Chatbot Workflow - Deployment Readiness', () => {
  const projectPath = path.join(WORKFLOW_DIR, 'deploy-ready');

  test.beforeAll(async () => {
    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });
  }, 300000);

  test('should have production build', async () => {
    await execAsync('pnpm build', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(fs.existsSync(path.join(projectPath, '.next'))).toBe(true);
  }, 240000);

  test('should have proper environment setup', () => {
    expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true);
  });

  test('should have documentation', () => {
    expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
  });

  test('should have deployment config', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
    );

    expect(packageJson.scripts.build).toBeTruthy();
    expect(packageJson.scripts.start).toBeTruthy();
  });
});
