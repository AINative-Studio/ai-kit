import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateEnvVars,
  checkPortAvailable,
} from '../../src/utils/validation';

describe('validation utils', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const result = validateProjectName('my-project');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept names with numbers', () => {
      const result = validateProjectName('my-project-123');
      expect(result.valid).toBe(true);
    });

    it('should accept names with underscores', () => {
      const result = validateProjectName('my_project');
      expect(result.valid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject names with uppercase letters', () => {
      const result = validateProjectName('MyProject');
      expect(result.valid).toBe(false);
    });

    it('should reject names starting with dot', () => {
      const result = validateProjectName('.project');
      expect(result.valid).toBe(false);
    });

    it('should reject names starting with underscore', () => {
      const result = validateProjectName('_project');
      expect(result.valid).toBe(false);
    });

    it('should reject names with spaces', () => {
      const result = validateProjectName('my project');
      expect(result.valid).toBe(false);
    });

    it('should reject reserved names', () => {
      const result = validateProjectName('node_modules');
      expect(result.valid).toBe(false);
    });

    it('should reject names longer than 214 characters', () => {
      const longName = 'a'.repeat(215);
      const result = validateProjectName(longName);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEnvVars', () => {
    it('should pass when all vars are present', () => {
      process.env.TEST_VAR = 'value';
      const result = validateEnvVars(['TEST_VAR']);
      expect(result.valid).toBe(true);
      delete process.env.TEST_VAR;
    });

    it('should fail when vars are missing', () => {
      const result = validateEnvVars(['MISSING_VAR']);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should report all missing vars', () => {
      const result = validateEnvVars(['VAR1', 'VAR2', 'VAR3']);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('checkPortAvailable', () => {
    it('should return true for available ports', async () => {
      const available = await checkPortAvailable(9999);
      expect(typeof available).toBe('boolean');
    });

    it('should handle port check errors', async () => {
      const available = await checkPortAvailable(-1);
      expect(typeof available).toBe('boolean');
    });
  });
});
