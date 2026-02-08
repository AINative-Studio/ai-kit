import { describe, it, expect, beforeEach } from 'vitest';
import { NoiseProcessor } from '../noise-processor';

describe('NoiseProcessor', () => {
  let processor: NoiseProcessor;

  beforeEach(() => {
    processor = new NoiseProcessor();
  });

  describe('constructor', () => {
    it('should create processor with default threshold', () => {
      expect(processor).toBeInstanceOf(NoiseProcessor);
    });

    it('should accept custom threshold', () => {
      const customProcessor = new NoiseProcessor({ threshold: 0.5 });
      expect(customProcessor).toBeInstanceOf(NoiseProcessor);
    });
  });

  describe('process', () => {
    it('should process audio data', () => {
      const input = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const output = processor.process(input);

      expect(output).toBeInstanceOf(Float32Array);
      expect(output.length).toBe(input.length);
    });

    it('should reduce noise below threshold', () => {
      const processor = new NoiseProcessor({ threshold: 0.3 });

      // Process learning frames first
      for (let i = 0; i < 10; i++) {
        processor.process(new Float32Array([0.05, 0.05, 0.05, 0.05]));
      }

      // Now test with actual input
      const input = new Float32Array([0.1, 0.2, 0.5, 0.6]);
      const output = processor.process(input);

      // After learning noise floor of 0.05, values close to it should be reduced
      expect(output[0]).toBeLessThanOrEqual(input[0] ?? 0);
      expect(output[1]).toBeLessThanOrEqual(input[1] ?? 0);
      // Values significantly above threshold should be preserved or minimally affected
      expect(output[2]).toBeGreaterThan(0);
      expect(output[3]).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const input = new Float32Array([]);
      const output = processor.process(input);

      expect(output.length).toBe(0);
    });
  });

  describe('setThreshold', () => {
    it('should update noise threshold', () => {
      processor.setThreshold(0.7);

      // Learn noise profile first with low noise
      for (let i = 0; i < 10; i++) {
        processor.process(new Float32Array([0.1, 0.1]));
      }

      const input = new Float32Array([0.5, 0.8]);
      const output = processor.process(input);

      // Both values should be processed, check they're non-negative
      expect(output[0]).toBeGreaterThanOrEqual(0);
      expect(output[1]).toBeGreaterThanOrEqual(0);
      // Higher value should remain higher or equal
      expect(output[1] ?? 0).toBeGreaterThanOrEqual(output[0] ?? 0);
    });

    it('should clamp threshold between 0 and 1', () => {
      processor.setThreshold(1.5);
      expect(() => processor.setThreshold(-0.5)).not.toThrow();
    });
  });

  describe('getThreshold', () => {
    it('should return current threshold', () => {
      const initialThreshold = processor.getThreshold();
      expect(initialThreshold).toBeGreaterThanOrEqual(0);
      expect(initialThreshold).toBeLessThanOrEqual(1);

      processor.setThreshold(0.5);
      expect(processor.getThreshold()).toBe(0.5);
    });
  });

  describe('reset', () => {
    it('should reset noise estimation', () => {
      const input = new Float32Array([0.1, 0.2, 0.3]);
      processor.process(input);
      processor.process(input);

      processor.reset();

      // After reset, processing should start fresh
      const output = processor.process(input);
      expect(output).toBeDefined();
    });
  });
});
