import { describe, it, expect } from 'vitest';
import { devCommand } from '../../src/commands/dev';

describe('dev command', () => {
  it('should define dev command', () => {
    expect(devCommand).toBeDefined();
    expect(devCommand.name()).toBe('dev');
  });

  it('should have correct description', () => {
    expect(devCommand.description()).toContain('development server');
  });

  it('should have port option', () => {
    const options = devCommand.options;
    const portOption = options.find((opt: any) => opt.long === '--port');
    expect(portOption).toBeDefined();
  });

  it('should have host option', () => {
    const options = devCommand.options;
    const hostOption = options.find((opt: any) => opt.long === '--host');
    expect(hostOption).toBeDefined();
  });

  it('should have https option', () => {
    const options = devCommand.options;
    const httpsOption = options.find((opt: any) => opt.long === '--https');
    expect(httpsOption).toBeDefined();
  });

  it('should have open option', () => {
    const options = devCommand.options;
    const openOption = options.find((opt: any) => opt.long === '--open');
    expect(openOption).toBeDefined();
  });
});
