import { describe, it, expect, beforeEach } from 'vitest';
import { ActionClassifier } from '../models/action-classifier';
import { OpticalFlowResult, MotionVector } from '../types';

describe('ActionClassifier', () => {
  let classifier: ActionClassifier;

  beforeEach(() => {
    classifier = new ActionClassifier();
  });

  describe('Constructor', () => {
    it('creates classifier with default configuration', () => {
      expect(classifier).toBeDefined();
      expect(classifier).toBeInstanceOf(ActionClassifier);
    });

    it('accepts custom configuration', () => {
      const customClassifier = new ActionClassifier({
        blockSize: 16,
        searchRadius: 7,
        motionThreshold: 5.0
      });
      expect(customClassifier).toBeDefined();
    });
  });

  describe('computeOpticalFlow', () => {
    it('computes optical flow between two frames', () => {
      const frame1 = new ImageData(640, 480);
      const frame2 = new ImageData(640, 480);

      // Add some pixel differences
      for (let i = 0; i < 100; i++) {
        frame2.data[i * 4] = 255;
      }

      const flow = classifier.computeOpticalFlow(frame1, frame2);

      expect(flow).toHaveProperty('vectors');
      expect(flow).toHaveProperty('magnitude');
      expect(flow).toHaveProperty('direction');
      expect(Array.isArray(flow.vectors)).toBe(true);
      expect(typeof flow.magnitude).toBe('number');
    });

    it('returns zero flow for identical frames', () => {
      const frame1 = new ImageData(640, 480);
      const frame2 = new ImageData(640, 480);

      const flow = classifier.computeOpticalFlow(frame1, frame2);

      expect(flow.magnitude).toBe(0);
    });

    it('detects horizontal motion', () => {
      const frame1 = new ImageData(100, 100);
      const frame2 = new ImageData(100, 100);

      // Create horizontal motion pattern
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 90; x++) {
          const idx1 = (y * 100 + x) * 4;
          const idx2 = (y * 100 + (x + 10)) * 4;
          frame1.data[idx1] = 255;
          frame2.data[idx2] = 255;
        }
      }

      const flow = classifier.computeOpticalFlow(frame1, frame2);

      expect(flow.magnitude).toBeGreaterThan(0);
      expect(Math.abs(flow.direction)).toBeLessThan(Math.PI / 4); // Roughly horizontal
    });

    it('detects vertical motion', () => {
      const frame1 = new ImageData(100, 100);
      const frame2 = new ImageData(100, 100);

      // Create vertical motion pattern
      for (let y = 0; y < 90; y++) {
        for (let x = 0; x < 100; x++) {
          const idx1 = (y * 100 + x) * 4;
          const idx2 = ((y + 10) * 100 + x) * 4;
          frame1.data[idx1] = 255;
          frame2.data[idx2] = 255;
        }
      }

      const flow = classifier.computeOpticalFlow(frame1, frame2);

      expect(flow.magnitude).toBeGreaterThan(0);
      const absDir = Math.abs(flow.direction);
      expect(absDir).toBeGreaterThan(Math.PI / 3); // Roughly vertical
    });
  });

  describe('classifyMotion', () => {
    it('classifies motion as action when threshold exceeded', () => {
      const highMotionFlow: OpticalFlowResult = {
        vectors: [],
        magnitude: 50.0,
        direction: 0,
        averageMotion: 50.0
      };

      const result = classifier.classifyMotion(highMotionFlow);

      expect(result).toHaveProperty('isAction');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('actionType');
      expect(result.isAction).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('does not classify low motion as action', () => {
      const lowMotionFlow: OpticalFlowResult = {
        vectors: [],
        magnitude: 1.0,
        direction: 0,
        averageMotion: 1.0
      };

      const result = classifier.classifyMotion(lowMotionFlow);

      expect(result.isAction).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('identifies camera pan motion', () => {
      const panFlow: OpticalFlowResult = {
        vectors: Array(100).fill({ dx: 5, dy: 0, magnitude: 5 }),
        magnitude: 30.0,
        direction: 0,
        averageMotion: 30.0
      };

      const result = classifier.classifyMotion(panFlow);

      expect(result.actionType).toBe('camera_pan');
    });

    it('identifies object motion', () => {
      const objectFlow: OpticalFlowResult = {
        vectors: [
          { dx: 10, dy: 5, magnitude: 11.2 },
          { dx: 0, dy: 0, magnitude: 0 },
          { dx: 0, dy: 0, magnitude: 0 }
        ],
        magnitude: 15.0,
        direction: Math.PI / 4,
        averageMotion: 3.7
      };

      const result = classifier.classifyMotion(objectFlow);

      expect(result.actionType).toBe('object_motion');
    });
  });

  describe('analyzeMotionIntensity', () => {
    it('calculates motion intensity from frame sequence', () => {
      const frames = [
        new ImageData(640, 480),
        new ImageData(640, 480),
        new ImageData(640, 480)
      ];

      const intensity = classifier.analyzeMotionIntensity(frames);

      expect(typeof intensity).toBe('number');
      expect(intensity).toBeGreaterThanOrEqual(0);
    });

    it('returns higher intensity for motion sequences', () => {
      const staticFrames = [
        new ImageData(100, 100),
        new ImageData(100, 100)
      ];

      const motionFrames = [
        new ImageData(100, 100),
        new ImageData(100, 100)
      ];

      // Add motion to second set
      for (let i = 0; i < motionFrames[1].data.length; i += 4) {
        motionFrames[1].data[i] = Math.random() * 255;
      }

      const staticIntensity = classifier.analyzeMotionIntensity(staticFrames);
      const motionIntensity = classifier.analyzeMotionIntensity(motionFrames);

      expect(motionIntensity).toBeGreaterThan(staticIntensity);
    });
  });

  describe('Motion Vector Analysis', () => {
    it('calculates motion vector magnitude', () => {
      const vector: MotionVector = { dx: 3, dy: 4, magnitude: 0 };
      const magnitude = classifier.calculateVectorMagnitude(vector);

      expect(magnitude).toBeCloseTo(5.0, 1);
    });

    it('calculates motion vector direction', () => {
      const vector: MotionVector = { dx: 1, dy: 1, magnitude: 0 };
      const direction = classifier.calculateVectorDirection(vector);

      expect(direction).toBeCloseTo(Math.PI / 4, 2);
    });

    it('identifies dominant motion direction', () => {
      const vectors: MotionVector[] = [
        { dx: 5, dy: 0, magnitude: 5 },
        { dx: 4, dy: 0, magnitude: 4 },
        { dx: 5, dy: 1, magnitude: 5.1 }
      ];

      const dominantDirection = classifier.getDominantDirection(vectors);

      expect(dominantDirection).toBeCloseTo(0, 1); // Horizontal
    });
  });

  describe('Block Matching Algorithm', () => {
    it('finds best matching block', () => {
      const frame1 = new ImageData(100, 100);
      const frame2 = new ImageData(100, 100);

      // Create a distinctive pattern
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const idx = ((20 + i) * 100 + (20 + j)) * 4;
          frame1.data[idx] = 255;
        }
      }

      // Shift the pattern
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const idx = ((20 + i) * 100 + (25 + j)) * 4;
          frame2.data[idx] = 255;
        }
      }

      const match = classifier.findBlockMatch(frame1, frame2, 20, 20, 8);

      expect(match).toHaveProperty('dx');
      expect(match).toHaveProperty('dy');
      expect(match).toHaveProperty('error');
      expect(Math.abs(match.dx)).toBeGreaterThan(0);
    });

    it('calculates block difference error', () => {
      const block1 = new Uint8ClampedArray(64 * 4);
      const block2 = new Uint8ClampedArray(64 * 4);

      block1.fill(100);
      block2.fill(150);

      const error = classifier.calculateBlockError(block1, block2);

      expect(error).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('processes frame pair in reasonable time', () => {
      const frame1 = new ImageData(640, 480);
      const frame2 = new ImageData(640, 480);

      const startTime = Date.now();
      classifier.computeOpticalFlow(frame1, frame2);
      const endTime = Date.now();

      // Should complete in less than 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
