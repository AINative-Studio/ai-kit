import { execa } from 'execa';
import net from 'net';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate the environment has all required tools
 */
export async function validateEnvironment(): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    errors.push(`Node.js 18 or higher required (current: ${nodeVersion})`);
  }

  // Check if git is available
  try {
    await execa('git', ['--version']);
  } catch {
    errors.push('Git is not installed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a port is available
 */
export async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Validate environment variables
 */
export function validateEnvVars(required: string[]): ValidationResult {
  const errors: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing environment variable: ${varName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name) {
    errors.push('Project name is required');
  }

  if (name.length < 1) {
    errors.push('Project name must be at least 1 character');
  }

  if (name.length > 214) {
    errors.push('Project name must be less than 214 characters');
  }

  if (!/^[a-z0-9-_]+$/.test(name)) {
    errors.push(
      'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
    );
  }

  if (name.startsWith('.') || name.startsWith('_')) {
    errors.push('Project name cannot start with a dot or underscore');
  }

  const reservedNames = ['node_modules', 'favicon.ico'];
  if (reservedNames.includes(name)) {
    errors.push(`Project name "${name}" is reserved`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
