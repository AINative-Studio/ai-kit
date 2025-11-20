import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectPackageManager, addPackage, removePackage, getRunCommand } from '../../src/utils/package-manager';
import { vol } from 'memfs';

vi.mock('fs');
vi.mock('execa');

describe('package-manager utils', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from lock file', async () => {
      vol.fromJSON({ 'pnpm-lock.yaml': '' });
      const pm = await detectPackageManager();
      expect(pm).toBe('pnpm');
    });

    it('should detect yarn from lock file', async () => {
      vol.fromJSON({ 'yarn.lock': '' });
      const pm = await detectPackageManager();
      expect(pm).toBe('yarn');
    });

    it('should detect npm from lock file', async () => {
      vol.fromJSON({ 'package-lock.json': '' });
      const pm = await detectPackageManager();
      expect(pm).toBe('npm');
    });

    it('should prioritize pnpm lock file', async () => {
      vol.fromJSON({
        'pnpm-lock.yaml': '',
        'yarn.lock': '',
        'package-lock.json': '',
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
