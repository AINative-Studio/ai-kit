import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { createCommand } from '../../src/commands/create';

// Mock file system
vi.mock('fs');
vi.mock('fs/promises');

describe('create command', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should define create command', () => {
    expect(createCommand).toBeDefined();
    expect(createCommand.name()).toBe('create');
  });

  it('should have correct description', () => {
    expect(createCommand.description()).toContain('Create a new AI Kit project');
  });

  it('should accept project name argument', () => {
    const args = createCommand.args;
    expect(args).toHaveLength(1);
    expect(args[0].name()).toBe('project-name');
  });

  it('should have template option', () => {
    const options = createCommand.options;
    const templateOption = options.find((opt: any) => opt.long === '--template');
    expect(templateOption).toBeDefined();
  });

  it('should have typescript option', () => {
    const options = createCommand.options;
    const tsOption = options.find((opt: any) => opt.long === '--typescript');
    expect(tsOption).toBeDefined();
  });

  it('should have package-manager option', () => {
    const options = createCommand.options;
    const pmOption = options.find((opt: any) => opt.long === '--package-manager');
    expect(pmOption).toBeDefined();
  });

  it('should have git option', () => {
    const options = createCommand.options;
    const gitOption = options.find((opt: any) => opt.long === '--git');
    expect(gitOption).toBeDefined();
  });

  it('should have install option', () => {
    const options = createCommand.options;
    const installOption = options.find((opt: any) => opt.long === '--install');
    expect(installOption).toBeDefined();
  });

  it('should have yes option', () => {
    const options = createCommand.options;
    const yesOption = options.find((opt: any) => opt.long === '--yes');
    expect(yesOption).toBeDefined();
  });
});
