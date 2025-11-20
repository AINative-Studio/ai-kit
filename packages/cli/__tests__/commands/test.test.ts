import { describe, it, expect } from 'vitest';
import { testCommand } from '../../src/commands/test';

describe('test command', () => {
  it('should define test command', () => {
    expect(testCommand).toBeDefined();
    expect(testCommand.name()).toBe('test');
  });

  it('should have correct description', () => {
    expect(testCommand.description()).toContain('Run tests');
  });

  it('should have watch option', () => {
    const options = testCommand.options;
    const watchOption = options.find((opt: any) => opt.long === '--watch');
    expect(watchOption).toBeDefined();
  });

  it('should have coverage option', () => {
    const options = testCommand.options;
    const coverageOption = options.find((opt: any) => opt.long === '--coverage');
    expect(coverageOption).toBeDefined();
  });

  it('should have ui option', () => {
    const options = testCommand.options;
    const uiOption = options.find((opt: any) => opt.long === '--ui');
    expect(uiOption).toBeDefined();
  });

  it('should have filter option', () => {
    const options = testCommand.options;
    const filterOption = options.find((opt: any) => opt.long === '--filter');
    expect(filterOption).toBeDefined();
  });

  it('should have reporter option', () => {
    const options = testCommand.options;
    const reporterOption = options.find((opt: any) => opt.long === '--reporter');
    expect(reporterOption).toBeDefined();
  });
});
