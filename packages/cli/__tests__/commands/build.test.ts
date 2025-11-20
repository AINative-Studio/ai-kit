import { describe, it, expect } from 'vitest';
import { buildCommand } from '../../src/commands/build';

describe('build command', () => {
  it('should define build command', () => {
    expect(buildCommand).toBeDefined();
    expect(buildCommand.name()).toBe('build');
  });

  it('should have correct description', () => {
    expect(buildCommand.description()).toContain('Build');
  });

  it('should have production option', () => {
    const options = buildCommand.options;
    const prodOption = options.find((opt: any) => opt.long === '--production');
    expect(prodOption).toBeDefined();
  });

  it('should have analyze option', () => {
    const options = buildCommand.options;
    const analyzeOption = options.find((opt: any) => opt.long === '--analyze');
    expect(analyzeOption).toBeDefined();
  });

  it('should have sourcemap option', () => {
    const options = buildCommand.options;
    const sourcemapOption = options.find((opt: any) => opt.long === '--sourcemap');
    expect(sourcemapOption).toBeDefined();
  });
});
