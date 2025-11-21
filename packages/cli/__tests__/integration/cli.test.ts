import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI integration', () => {
  it('should have valid package.json', () => {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    expect(packageJson.name).toBe('@ainative/ai-kit-cli');
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin.aikit).toBeDefined();
  });

  it('should export all required dependencies', () => {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.commander).toBeDefined();
    expect(packageJson.dependencies.inquirer).toBeDefined();
    expect(packageJson.dependencies.chalk).toBeDefined();
    expect(packageJson.dependencies.ora).toBeDefined();
  });

  it('should have all required scripts', () => {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
  });

  it('should specify minimum Node.js version', () => {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    expect(packageJson.engines.node).toBeDefined();
    expect(packageJson.engines.node).toContain('18');
  });
});
