import { describe, it, expect } from 'vitest';
import { UsageTracker, InMemoryStorage } from '../src/index';

describe('@ainative/ai-kit-observability', () => {
  it('should export UsageTracker', () => {
    expect(UsageTracker).toBeDefined();
  });

  it('should export InMemoryStorage', () => {
    expect(InMemoryStorage).toBeDefined();
  });
});
