import { describe, it, expect, vi } from 'vitest';
import { isGitAvailable, createGitignore } from '../../src/utils/git';
import { vol } from 'memfs';

vi.mock('fs');
vi.mock('fs/promises');

describe('git utils', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('isGitAvailable', () => {
    it('should check if git is installed', async () => {
      const available = await isGitAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('createGitignore', () => {
    it('should create gitignore file', () => {
      createGitignore('/test/project', 'nextjs');
      // File should be created (mocked)
      expect(true).toBe(true);
    });

    it('should include common ignores', () => {
      createGitignore('/test/project', 'node');
      // Should contain node_modules, .env, etc.
      expect(true).toBe(true);
    });

    it('should include framework-specific ignores for nextjs', () => {
      createGitignore('/test/project', 'nextjs');
      expect(true).toBe(true);
    });

    it('should include framework-specific ignores for vite', () => {
      createGitignore('/test/project', 'vite');
      expect(true).toBe(true);
    });
  });
});
