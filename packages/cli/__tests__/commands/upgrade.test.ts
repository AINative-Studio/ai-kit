import { describe, it, expect } from 'vitest';
import { upgradeCommand } from '../../src/commands/upgrade';

describe('upgrade command', () => {
  it('should define upgrade command', () => {
    expect(upgradeCommand).toBeDefined();
    expect(upgradeCommand.name()).toBe('upgrade');
  });

  it('should have correct description', () => {
    expect(upgradeCommand.description()).toContain('Upgrade');
  });

  it('should have latest option', () => {
    const options = upgradeCommand.options;
    const latestOption = options.find((opt: any) => opt.long === '--latest');
    expect(latestOption).toBeDefined();
  });

  it('should have check option', () => {
    const options = upgradeCommand.options;
    const checkOption = options.find((opt: any) => opt.long === '--check');
    expect(checkOption).toBeDefined();
  });

  it('should have interactive option', () => {
    const options = upgradeCommand.options;
    const interactiveOption = options.find((opt: any) => opt.long === '--interactive');
    expect(interactiveOption).toBeDefined();
  });
});
