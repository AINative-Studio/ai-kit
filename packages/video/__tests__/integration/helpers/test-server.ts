/**
 * Test server utilities for integration tests
 * Provides a simple HTTP server to serve test files
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

export interface TestServerOptions {
  port?: number;
  rootDir: string;
}

export class TestServer {
  private server: ReturnType<typeof createServer> | null = null;
  private port: number;
  private rootDir: string;

  constructor(options: TestServerOptions) {
    this.port = options.port || 5173;
    this.rootDir = options.rootDir;
  }

  async start(): Promise<string> {
    if (this.server) {
      throw new Error('Server already running');
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          const url = req.url === '/' ? '/test-page.html' : req.url;
          const filePath = join(this.rootDir, url || '');
          const ext = extname(filePath);
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';

          const content = await readFile(filePath);

          res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(content);
        } catch (error) {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      this.server.listen(this.port, () => {
        resolve(`http://localhost:${this.port}`);
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}
