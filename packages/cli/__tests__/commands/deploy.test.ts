import { describe, it, expect } from 'vitest';
import { deployCommand } from '../../src/commands/deploy';

describe('deploy command', () => {
  it('should define deploy command', () => {
    expect(deployCommand).toBeDefined();
    expect(deployCommand.name()).toBe('deploy');
  });

  it('should have correct description', () => {
    expect(deployCommand.description()).toContain('Deploy');
  });

  it('should have platform option', () => {
    const options = deployCommand.options;
    const platformOption = options.find((opt: any) => opt.long === '--platform');
    expect(platformOption).toBeDefined();
  });

  it('should have prod option', () => {
    const options = deployCommand.options;
    const prodOption = options.find((opt: any) => opt.long === '--prod');
    expect(prodOption).toBeDefined();
  });

  it('should have env option', () => {
    const options = deployCommand.options;
    const envOption = options.find((opt: any) => opt.long === '--env');
    expect(envOption).toBeDefined();
  });
});
