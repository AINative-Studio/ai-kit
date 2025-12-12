import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { detectPackageManager, addPackage, removePackage, getRunCommand } from '../../src/utils/package-manager';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('execa');

describe('package-manager utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no lock files exist
    (fs.existsSync as Mock).mockReturnValue(false);
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from lock file', async () => {
      (fs.existsSync as Mock).mockImplementation((path: string) => {
        return path === 'pnpm-lock.yaml';
      });
      const pm = await detectPackageManager();
      expect(pm).toBe('pnpm');
    });

    it('should detect yarn from lock file', async () => {
      (fs.existsSync as Mock).mockImplementation((path: string) => {
        return path === 'yarn.lock';
      });
      const pm = await detectPackageManager();
      expect(pm).toBe('yarn');
    });

    it('should detect npm from lock file', async () => {
      (fs.existsSync as Mock).mockImplementation((path: string) => {
        return path === 'package-lock.json';
      });
      const pm = await detectPackageManager();
      expect(pm).toBe('npm');
    });

    it('should prioritize pnpm lock file', async () => {
      (fs.existsSync as Mock).mockImplementation((path: string) => {
        return ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'].includes(path);
      });
      const pm = await detectPackageManager();
      expect(pm).toBe('pnpm');
    });
  });

  describe('getRunCommand', () => {
    it('should return "npm run" for npm', () => {
      expect(getRunCommand('npm')).toBe('npm run');
    });

    it('should return "yarn" for yarn', () => {
      expect(getRunCommand('yarn')).toBe('yarn');
    });

    it('should return "pnpm" for pnpm', () => {
      expect(getRunCommand('pnpm')).toBe('pnpm');
    });
  });
});
