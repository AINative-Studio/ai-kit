import { describe, it, expect } from 'vitest';
import { version } from '../src/index';

describe('@ainative/ai-kit-rlhf', () => {
  it('should export version', () => {
    expect(version).toBe('0.1.0-alpha.0');
  });
});
