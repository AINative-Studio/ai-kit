import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * CLI Project Creation E2E Tests
 *
 * Tests the AI Kit CLI for project creation
 * Covers: template scaffolding, dependency installation, build process
 */

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'test-projects');
const CLI_PATH = path.join(__dirname, '..', '..', '..', 'packages', 'cli', 'dist', 'index.js');

test.describe('CLI - Project Creation', () => {
  test.beforeAll(async () => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Cleanup test projects
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should display help information', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
    expect(stdout).toContain('create');
    expect(stdout).toContain('--template');
  });

  test('should display version', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  test('should list available templates', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} create --list`);
    expect(stdout).toContain('nextjs-chatbot');
    expect(stdout).toContain('react-chat');
    expect(stdout).toContain('research-agent');
  });

  test('should create nextjs-chatbot project', async () => {
    const projectPath = path.join(TEST_DIR, 'test-nextjs-chatbot');

    const { stdout } = await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );

    expect(stdout).toContain('success');
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);

  test('should create react-chat project', async () => {
    const projectPath = path.join(TEST_DIR, 'test-react-chat');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template react-chat --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);

  test('should create vue-assistant project', async () => {
    const projectPath = path.join(TEST_DIR, 'test-vue-assistant');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template vue-assistant --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);

  test('should create research-agent project', async () => {
    const projectPath = path.join(TEST_DIR, 'test-research-agent');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template research-agent --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);

  test('should create analytics-dashboard project', async () => {
    const projectPath = path.join(TEST_DIR, 'test-analytics');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template analytics-dashboard --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  }, 90000);
});

test.describe('CLI - Project Structure', () => {
  const projectPath = path.join(TEST_DIR, 'structure-test');

  test.beforeAll(async () => {
    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );
  });

  test('should have package.json', () => {
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
  });

  test('should have tsconfig.json', () => {
    expect(fs.existsSync(path.join(projectPath, 'tsconfig.json'))).toBe(true);
  });

  test('should have src directory', () => {
    expect(fs.existsSync(path.join(projectPath, 'src'))).toBe(true);
  });

  test('should have README.md', () => {
    expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
  });

  test('should have .gitignore', () => {
    expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true);
  });

  test('should have .env.example', () => {
    expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true);
  });

  test('should have proper package.json structure', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
    );

    expect(packageJson.name).toBeTruthy();
    expect(packageJson.version).toBeTruthy();
    expect(packageJson.scripts).toBeTruthy();
    expect(packageJson.dependencies).toBeTruthy();
  });

  test('should include AI Kit dependencies', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
    );

    expect(packageJson.dependencies['@ainative/ai-kit-core']).toBeTruthy();
  });
});

test.describe('CLI - Installation & Build', () => {
  const projectPath = path.join(TEST_DIR, 'build-test');

  test.beforeAll(async () => {
    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-install`,
      { timeout: 60000 }
    );
  });

  test('should install dependencies', async () => {
    await execAsync('pnpm install', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(fs.existsSync(path.join(projectPath, 'node_modules'))).toBe(true);
  }, 240000);

  test('should run type checking', async () => {
    const { stdout } = await execAsync('pnpm type-check', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stdout).not.toContain('error');
  }, 90000);

  test('should run linting', async () => {
    await execAsync('pnpm lint', {
      cwd: projectPath,
      timeout: 60000,
    });
  }, 90000);

  test('should build project', async () => {
    await execAsync('pnpm build', {
      cwd: projectPath,
      timeout: 180000,
    });

    expect(fs.existsSync(path.join(projectPath, 'dist'))).toBe(true);
  }, 240000);

  test('should run tests', async () => {
    const { stdout } = await execAsync('pnpm test', {
      cwd: projectPath,
      timeout: 60000,
    });

    expect(stdout).toContain('pass');
  }, 90000);
});

test.describe('CLI - Error Handling', () => {
  test('should handle invalid template name', async () => {
    const projectPath = path.join(TEST_DIR, 'invalid-test');

    try {
      await execAsync(
        `node ${CLI_PATH} create ${projectPath} --template invalid-template`,
        { timeout: 30000 }
      );
      expect(false).toBe(true); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('invalid');
    }
  });

  test('should handle existing directory', async () => {
    const projectPath = path.join(TEST_DIR, 'existing');
    fs.mkdirSync(projectPath, { recursive: true });

    try {
      await execAsync(
        `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot`,
        { timeout: 30000 }
      );
      expect(false).toBe(true); // Should not reach here
    } catch (error: any) {
      expect(error.message).toMatch(/exist|already/i);
    }
  });

  test('should handle missing project name', async () => {
    try {
      await execAsync(`node ${CLI_PATH} create --template nextjs-chatbot`, {
        timeout: 30000,
      });
      expect(false).toBe(true); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('required');
    }
  });
});

test.describe('CLI - Customization Options', () => {
  test('should create project with custom name', async () => {
    const projectPath = path.join(TEST_DIR, 'custom-name');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --name "My Custom App" --skip-install`,
      { timeout: 60000 }
    );

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
    );

    expect(packageJson.name).toBe('my-custom-app');
  }, 90000);

  test('should skip git initialization', async () => {
    const projectPath = path.join(TEST_DIR, 'no-git');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --skip-git --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(path.join(projectPath, '.git'))).toBe(false);
  }, 90000);

  test('should include example files', async () => {
    const projectPath = path.join(TEST_DIR, 'with-examples');

    await execAsync(
      `node ${CLI_PATH} create ${projectPath} --template nextjs-chatbot --examples --skip-install`,
      { timeout: 60000 }
    );

    expect(fs.existsSync(path.join(projectPath, 'examples'))).toBe(true);
  }, 90000);
});
