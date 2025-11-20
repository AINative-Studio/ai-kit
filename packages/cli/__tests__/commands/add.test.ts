import { describe, it, expect, vi } from 'vitest';
import { addCommand } from '../../src/commands/add';

describe('add command', () => {
  it('should define add command', () => {
    expect(addCommand).toBeDefined();
    expect(addCommand.name()).toBe('add');
  });

  it('should have correct description', () => {
    expect(addCommand.description()).toContain('Add features');
  });

  it('should accept feature argument', () => {
    const args = addCommand.args;
    expect(args).toHaveLength(1);
  });

  it('should have type option', () => {
    const options = addCommand.options;
    const typeOption = options.find((opt: any) => opt.long === '--type');
    expect(typeOption).toBeDefined();
  });

  it('should have name option', () => {
    const options = addCommand.options;
    const nameOption = options.find((opt: any) => opt.long === '--name');
    expect(nameOption).toBeDefined();
  });

  it('should have path option', () => {
    const options = addCommand.options;
    const pathOption = options.find((opt: any) => opt.long === '--path');
    expect(pathOption).toBeDefined();
  });
});
