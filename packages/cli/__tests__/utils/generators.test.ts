import { describe, it, expect, vi } from 'vitest';
import { generateComponent, generateAgent, generateTool } from '../../src/utils/generators';

vi.mock('fs/promises');

describe('generators utils', () => {
  const mockConfig = {
    framework: 'react',
    typescript: true,
  };

  describe('generateComponent', () => {
    it('should generate React component', async () => {
      await expect(
        generateComponent('/test/path', 'TestComponent', mockConfig)
      ).resolves.not.toThrow();
    });

    it('should generate Vue component', async () => {
      await expect(
        generateComponent('/test/path', 'TestComponent', {
          ...mockConfig,
          framework: 'vue',
        })
      ).resolves.not.toThrow();
    });

    it('should generate Svelte component', async () => {
      await expect(
        generateComponent('/test/path', 'TestComponent', {
          ...mockConfig,
          framework: 'svelte',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('generateAgent', () => {
    it('should generate agent file', async () => {
      await expect(
        generateAgent('/test/path', 'TestAgent', mockConfig)
      ).resolves.not.toThrow();
    });

    it('should create agent class', async () => {
      await expect(
        generateAgent('/test/path', 'MyAgent', mockConfig)
      ).resolves.not.toThrow();
    });
  });

  describe('generateTool', () => {
    it('should generate tool file', async () => {
      await expect(
        generateTool('/test/path', 'testTool', mockConfig)
      ).resolves.not.toThrow();
    });

    it('should create tool object', async () => {
      await expect(
        generateTool('/test/path', 'myTool', mockConfig)
      ).resolves.not.toThrow();
    });
  });
});
