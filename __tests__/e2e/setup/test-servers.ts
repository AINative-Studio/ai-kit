import { ChildProcess, spawn } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const sleep = promisify(setTimeout);

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string;
  command: string;
  port: number;
  cwd: string;
  env?: Record<string, string>;
  healthCheckPath?: string;
  startupTimeout?: number;
}

/**
 * Test server manager
 *
 * Manages starting and stopping development servers for E2E tests
 */
export class TestServers {
  private servers: Map<string, ChildProcess> = new Map();
  private readonly maxRetries = 30;
  private readonly retryDelay = 1000;

  /**
   * Start a development server
   */
  async start(config: ServerConfig): Promise<void> {
    console.log(`🚀 Starting ${config.name} server on port ${config.port}...`);

    const process = spawn(config.command, {
      cwd: config.cwd,
      shell: true,
      env: {
        ...process.env,
        ...config.env,
        PORT: config.port.toString(),
        NODE_ENV: 'test',
      },
      stdio: 'pipe',
    });

    // Store server process
    this.servers.set(config.name, process);

    // Log server output
    process.stdout?.on('data', (data) => {
      if (process.env.DEBUG) {
        console.log(`[${config.name}] ${data.toString().trim()}`);
      }
    });

    process.stderr?.on('data', (data) => {
      if (process.env.DEBUG) {
        console.error(`[${config.name}] ${data.toString().trim()}`);
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${config.name} server error:`, error);
    });

    // Wait for server to be ready
    await this.waitForServer(
      config.port,
      config.healthCheckPath,
      config.startupTimeout
    );

    console.log(`✅ ${config.name} server ready on port ${config.port}`);
  }

  /**
   * Stop a specific server
   */
  async stop(name: string): Promise<void> {
    const process = this.servers.get(name);

    if (!process) {
      console.warn(`⚠️  Server ${name} not found`);
      return;
    }

    console.log(`🛑 Stopping ${name} server...`);

    // Kill process
    process.kill('SIGTERM');

    // Wait for graceful shutdown
    await sleep(2000);

    // Force kill if still running
    if (!process.killed) {
      process.kill('SIGKILL');
    }

    this.servers.delete(name);
    console.log(`✅ ${name} server stopped`);
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    const names = Array.from(this.servers.keys());

    for (const name of names) {
      await this.stop(name);
    }
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServer(
    port: number,
    healthCheckPath = '/',
    timeout = 120000
  ): Promise<void> {
    const startTime = Date.now();

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await this.checkServer(port, healthCheckPath);
        return;
      } catch (error) {
        const elapsed = Date.now() - startTime;

        if (elapsed > timeout) {
          throw new Error(
            `Server on port ${port} failed to start within ${timeout}ms`
          );
        }

        await sleep(this.retryDelay);
      }
    }

    throw new Error(`Server on port ${port} failed to start`);
  }

  /**
   * Check if server is responding
   */
  private async checkServer(
    port: number,
    path: string = '/'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: 'localhost',
          port,
          path,
          method: 'GET',
          timeout: 1000,
        },
        (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`Server returned status ${res.statusCode}`));
          }
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Get server status
   */
  isRunning(name: string): boolean {
    const process = this.servers.get(name);
    return process !== undefined && !process.killed;
  }

  /**
   * Get all running servers
   */
  getRunningServers(): string[] {
    return Array.from(this.servers.keys()).filter((name) =>
      this.isRunning(name)
    );
  }
}

// Export singleton instance
export const testServers = new TestServers();

// Cleanup on process exit
process.on('exit', () => {
  testServers.stopAll();
});

process.on('SIGINT', async () => {
  await testServers.stopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await testServers.stopAll();
  process.exit(0);
});
