/**
 * Comprehensive tests for Custom PII Patterns (AIKIT-35)
 * Target: 80%+ test coverage
 */

import { PIIDetector } from '../src/PIIDetector';
import {
  PatternPriority,
  RedactionStrategy,
  CustomPIIPattern,
  Region,
} from '../src/types';

describe('Custom PII Patterns (AIKIT-35)', () => {
  let detector: PIIDetector;

  beforeEach(() => {
    detector = new PIIDetector();
  });

  describe('Pattern Registration', () => {
    it('should register a valid custom pattern', () => {
      const pattern: CustomPIIPattern = {
        id: 'employee-id',
        name: 'Employee ID',
        description: 'Company employee identification number',
        pattern: /EMP-\d{6}/g,
        priority: PatternPriority.HIGH,
        redactionStrategy: RedactionStrategy.LABEL,
      };

      expect(() => detector.registerCustomPattern(pattern)).not.toThrow();
      const registered = detector.getCustomPattern('employee-id');
      expect(registered).toBeDefined();
      expect(registered?.name).toBe('Employee ID');
    });

    it('should automatically add global flag if missing', () => {
      const pattern: CustomPIIPattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        pattern: /TEST-\d{4}/,
        priority: PatternPriority.MEDIUM,
      };

      detector.registerCustomPattern(pattern);
      const registered = detector.getCustomPattern('test-pattern');
      expect(registered?.pattern.flags).toContain('g');
    });

    it('should throw error for invalid pattern ID', () => {
      const pattern: CustomPIIPattern = {
        id: 'invalid pattern!',
        name: 'Invalid',
        pattern: /test/g,
        priority: PatternPriority.LOW,
      };

      expect(() => detector.registerCustomPattern(pattern)).toThrow(/Pattern ID must contain only/);
    });

    it('should throw error for missing pattern ID', () => {
      const pattern = {
        name: 'Test',
        pattern: /test/g,
        priority: PatternPriority.LOW,
      } as CustomPIIPattern;

      expect(() => detector.registerCustomPattern(pattern)).toThrow(/Pattern ID is required/);
    });

    it('should throw error for missing pattern name', () => {
      const pattern = {
        id: 'test',
        pattern: /test/g,
        priority: PatternPriority.LOW,
      } as CustomPIIPattern;

      expect(() => detector.registerCustomPattern(pattern)).toThrow(/Pattern name is required/);
    });

    it('should set default values for optional fields', () => {
      const pattern: CustomPIIPattern = {
        id: 'simple-pattern',
        name: 'Simple',
        pattern: /SIMPLE-\d{3}/g,
        priority: PatternPriority.LOW,
      };

      detector.registerCustomPattern(pattern);
      const registered = detector.getCustomPattern('simple-pattern');

      expect(registered?.enabled).toBe(true);
      expect(registered?.redactionStrategy).toBe(RedactionStrategy.LABEL);
      expect(registered?.confidence).toBe(0.8);
    });
  });

  describe('Pattern Unregistration', () => {
    it('should unregister an existing pattern', () => {
      const pattern: CustomPIIPattern = {
        id: 'temp-pattern',
        name: 'Temporary',
        pattern: /TEMP-\d{4}/g,
        priority: PatternPriority.LOW,
      };

      detector.registerCustomPattern(pattern);
      expect(detector.getCustomPattern('temp-pattern')).toBeDefined();

      const result = detector.unregisterCustomPattern('temp-pattern');
      expect(result).toBe(true);
      expect(detector.getCustomPattern('temp-pattern')).toBeUndefined();
    });

    it('should return false when unregistering non-existent pattern', () => {
      const result = detector.unregisterCustomPattern('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Pattern Listing', () => {
    beforeEach(() => {
      detector.registerCustomPattern({
        id: 'pattern-1',
        name: 'Pattern 1',
        pattern: /P1-\d{4}/g,
        priority: PatternPriority.HIGH,
        enabled: true,
      });

      detector.registerCustomPattern({
        id: 'pattern-2',
        name: 'Pattern 2',
        pattern: /P2-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        enabled: false,
      });

      detector.registerCustomPattern({
        id: 'pattern-3',
        name: 'Pattern 3',
        pattern: /P3-\d{4}/g,
        priority: PatternPriority.LOW,
        enabled: true,
      });
    });

    it('should list only enabled patterns by default', () => {
      const patterns = detector.listCustomPatterns();
      expect(patterns).toHaveLength(2);
      expect(patterns.every(p => p.enabled)).toBe(true);
    });

    it('should list all patterns when includeDisabled is true', () => {
      const patterns = detector.listCustomPatterns(true);
      expect(patterns).toHaveLength(3);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate a correct pattern', () => {
      const pattern: CustomPIIPattern = {
        id: 'valid-pattern',
        name: 'Valid Pattern',
        pattern: /VALID-\d{6}/g,
        priority: PatternPriority.HIGH,
      };

      const result = detector.validatePattern(pattern);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing global flag', () => {
      const pattern: CustomPIIPattern = {
        id: 'no-global',
        name: 'No Global',
        pattern: /TEST-\d{4}/,
        priority: PatternPriority.MEDIUM,
      };

      const result = detector.validatePattern(pattern);
      expect(result.warnings).toContain('Pattern should have global flag (g) for proper matching');
    });

    it('should calculate complexity score', () => {
      const simplePattern: CustomPIIPattern = {
        id: 'simple',
        name: 'Simple',
        pattern: /\d{4}/g,
        priority: PatternPriority.LOW,
      };

      const complexPattern: CustomPIIPattern = {
        id: 'complex',
        name: 'Complex',
        pattern: /(?:(?:\+?1[-.\s]?)?(?:\((?=\d{3}\)))?([2-9]\d{2})(?:(?<=\(\d{3})\))?\s?[-.]?\s?([2-9]\d{2})\s?[-.]?\s?(\d{4}))/g,
        priority: PatternPriority.LOW,
      };

      const simpleResult = detector.validatePattern(simplePattern);
      const complexResult = detector.validatePattern(complexPattern);

      expect(simpleResult.complexityScore).toBeLessThan(complexResult.complexityScore!);
    });

    it('should warn about high complexity patterns', () => {
      const pattern: CustomPIIPattern = {
        id: 'very-complex',
        name: 'Very Complex',
        pattern: /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}|(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g,
        priority: PatternPriority.LOW,
      };

      const result = detector.validatePattern(pattern);
      expect(result.warnings.some(w => w.includes('complexity'))).toBe(true);
    });

    it('should detect invalid regular expressions', () => {
      const pattern = {
        id: 'invalid-regex',
        name: 'Invalid Regex',
        pattern: { source: '[', flags: 'g' } as RegExp,
        priority: PatternPriority.LOW,
      } as CustomPIIPattern;

      const result = detector.validatePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid regular expression'))).toBe(true);
    });
  });

  describe('Pattern Testing', () => {
    beforeEach(() => {
      detector.registerCustomPattern({
        id: 'employee-id',
        name: 'Employee ID',
        pattern: /EMP-\d{6}/g,
        priority: PatternPriority.HIGH,
        redactionStrategy: RedactionStrategy.LABEL,
      });
    });

    it('should test pattern and find matches', () => {
      const result = detector.testPattern('employee-id', {
        testString: 'Employees: EMP-123456, EMP-789012',
      });

      expect(result.passed).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].value).toBe('EMP-123456');
      expect(result.matches[1].value).toBe('EMP-789012');
      expect(result.performance.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should test pattern with expected match count', () => {
      const result = detector.testPattern('employee-id', {
        testString: 'Employee: EMP-123456',
        expectedMatches: 1,
      });

      expect(result.passed).toBe(true);
    });

    it('should fail test when match count does not match expected', () => {
      const result = detector.testPattern('employee-id', {
        testString: 'Employees: EMP-123456, EMP-789012',
        expectedMatches: 1,
      });

      expect(result.passed).toBe(false);
      expect(result.matches).toHaveLength(2);
    });

    it('should test redaction when requested', () => {
      const result = detector.testPattern('employee-id', {
        testString: 'Employee: EMP-123456',
        testRedaction: true,
      });

      expect(result.redactedOutput).toBeDefined();
      expect(result.redactedOutput).toContain('[EMPLOYEE ID]');
    });

    it('should return failed test for non-existent pattern', () => {
      const result = detector.testPattern('non-existent', {
        testString: 'test string',
      });

      expect(result.passed).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('Priority System', () => {
    beforeEach(() => {
      detector.registerCustomPattern({
        id: 'high-priority',
        name: 'High Priority',
        pattern: /HIGH-\d{4}/g,
        priority: PatternPriority.HIGH,
      });

      detector.registerCustomPattern({
        id: 'low-priority',
        name: 'Low Priority',
        pattern: /LOW-\d{4}/g,
        priority: PatternPriority.LOW,
      });

      detector.registerCustomPattern({
        id: 'critical-priority',
        name: 'Critical Priority',
        pattern: /CRIT-\d{4}/g,
        priority: PatternPriority.CRITICAL,
      });
    });

    it('should process patterns in priority order', () => {
      const patterns = detector.listCustomPatterns();
      const stats = detector.getPatternStats();

      expect(stats.customCount).toBe(3);
      expect(stats.totalPriority[PatternPriority.CRITICAL]).toBe(1);
      expect(stats.totalPriority[PatternPriority.HIGH]).toBe(1);
      expect(stats.totalPriority[PatternPriority.LOW]).toBe(1);
    });
  });

  describe('Redaction Strategies', () => {
    it('should redact using MASK strategy', () => {
      detector.registerCustomPattern({
        id: 'mask-test',
        name: 'Mask Test',
        pattern: /MASK-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        redactionStrategy: RedactionStrategy.MASK,
      });

      const result = detector.testPattern('mask-test', {
        testString: 'Value: MASK-1234',
        testRedaction: true,
      });

      expect(result.redactedOutput).toContain('*********');
    });

    it('should redact using LABEL strategy', () => {
      detector.registerCustomPattern({
        id: 'label-test',
        name: 'Label Test',
        pattern: /LABEL-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        redactionStrategy: RedactionStrategy.LABEL,
      });

      const result = detector.testPattern('label-test', {
        testString: 'Value: LABEL-1234',
        testRedaction: true,
      });

      expect(result.redactedOutput).toContain('[LABEL TEST]');
    });

    it('should redact using PARTIAL strategy', () => {
      detector.registerCustomPattern({
        id: 'partial-test',
        name: 'Partial Test',
        pattern: /PARTIAL-\d{8}/g,
        priority: PatternPriority.MEDIUM,
        redactionStrategy: RedactionStrategy.PARTIAL,
      });

      const result = detector.testPattern('partial-test', {
        testString: 'Value: PARTIAL-12345678',
        testRedaction: true,
      });

      expect(result.redactedOutput).toMatch(/PA.*\*+.*78/);
    });

    it('should redact using HASH strategy', () => {
      detector.registerCustomPattern({
        id: 'hash-test',
        name: 'Hash Test',
        pattern: /HASH-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        redactionStrategy: RedactionStrategy.HASH,
      });

      const result = detector.testPattern('hash-test', {
        testString: 'Value: HASH-1234',
        testRedaction: true,
      });

      expect(result.redactedOutput).toMatch(/\[HASH:[a-f0-9]{8}\]/);
    });

    it('should redact using REMOVE strategy', () => {
      detector.registerCustomPattern({
        id: 'remove-test',
        name: 'Remove Test',
        pattern: /REMOVE-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        redactionStrategy: RedactionStrategy.REMOVE,
      });

      const result = detector.testPattern('remove-test', {
        testString: 'Value: REMOVE-1234 end',
        testRedaction: true,
      });

      expect(result.redactedOutput).toBe('Value:  end');
    });

    it('should use custom redactor function', () => {
      detector.registerCustomPattern({
        id: 'custom-redactor',
        name: 'Custom Redactor',
        pattern: /CUSTOM-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        customRedactor: (match: string) => `<REDACTED:${match.length}>`,
      });

      const result = detector.testPattern('custom-redactor', {
        testString: 'Value: CUSTOM-1234',
        testRedaction: true,
      });

      expect(result.redactedOutput).toContain('<REDACTED:11>');
    });
  });

  describe('Integration with Built-in Patterns', () => {
    it('should detect both built-in and custom patterns', () => {
      detector.registerCustomPattern({
        id: 'project-code',
        name: 'Project Code',
        pattern: /PROJ-\d{6}/g,
        priority: PatternPriority.HIGH,
      });

      detector.updateConfig({ redact: true });
      const result = detector.detectWithCustomPatterns(
        'Email: test@example.com, Project: PROJ-123456'
      );

      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.summary.hasPII).toBe(true);
    });
  });

  describe('Pattern Import/Export', () => {
    beforeEach(() => {
      detector.registerCustomPattern({
        id: 'pattern-1',
        name: 'Pattern 1',
        pattern: /P1-\d{4}/g,
        priority: PatternPriority.HIGH,
        tags: ['test', 'export'],
      });

      detector.registerCustomPattern({
        id: 'pattern-2',
        name: 'Pattern 2',
        pattern: /P2-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        description: 'Test pattern for export',
      });
    });

    it('should export patterns to JSON', () => {
      const exported = detector.exportPatterns();

      expect(exported.version).toBe('1.0.0');
      expect(exported.exportedAt).toBeDefined();
      expect(exported.patterns).toHaveLength(2);
      expect(exported.patterns[0].id).toBe('pattern-1');
      expect(exported.patterns[0].name).toBe('Pattern 1');
      expect(exported.patterns[0].pattern).toBe('P1-\\d{4}');
    });

    it('should import patterns from JSON', () => {
      const exportData = detector.exportPatterns();
      const newDetector = new PIIDetector();

      const importedCount = newDetector.importPatterns(exportData);

      expect(importedCount).toBe(2);
      expect(newDetector.getCustomPattern('pattern-1')).toBeDefined();
      expect(newDetector.getCustomPattern('pattern-2')).toBeDefined();
    });

    it('should not replace existing patterns when replace is false', () => {
      const exportData = detector.exportPatterns();

      // Create a new detector and add one pattern
      const newDetector = new PIIDetector();
      newDetector.registerCustomPattern({
        id: 'pattern-1',
        name: 'Modified Pattern 1',
        pattern: /MODIFIED-\d{4}/g,
        priority: PatternPriority.LOW,
      });

      const importedCount = newDetector.importPatterns(exportData, { replace: false });

      expect(importedCount).toBe(1); // Only pattern-2 should be imported
      const pattern1 = newDetector.getCustomPattern('pattern-1');
      expect(pattern1?.name).toBe('Modified Pattern 1'); // Should keep modified version
      expect(newDetector.getCustomPattern('pattern-2')).toBeDefined(); // Pattern-2 should be imported
    });

    it('should replace existing patterns when replace is true', () => {
      const exportData = detector.exportPatterns();
      
      // Modify one pattern
      detector.unregisterCustomPattern('pattern-1');
      detector.registerCustomPattern({
        id: 'pattern-1',
        name: 'Modified Pattern 1',
        pattern: /MODIFIED-\d{4}/g,
        priority: PatternPriority.LOW,
      });

      const importedCount = detector.importPatterns(exportData, { replace: true });

      expect(importedCount).toBe(2);
      const pattern1 = detector.getCustomPattern('pattern-1');
      expect(pattern1?.name).toBe('Pattern 1'); // Should be replaced with exported version
    });

    it('should add prefix to imported pattern IDs', () => {
      const exportData = detector.exportPatterns();
      const newDetector = new PIIDetector();

      newDetector.importPatterns(exportData, { idPrefix: 'imported-' });

      expect(newDetector.getCustomPattern('imported-pattern-1')).toBeDefined();
      expect(newDetector.getCustomPattern('imported-pattern-2')).toBeDefined();
      expect(newDetector.getCustomPattern('pattern-1')).toBeUndefined();
    });

    it('should skip invalid patterns during import when validate is true', () => {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        patterns: [
          {
            id: 'valid',
            name: 'Valid',
            pattern: 'VALID-\\d{4}',
            flags: 'g',
            priority: PatternPriority.MEDIUM,
          },
          {
            id: '',
            name: 'Invalid',
            pattern: 'INVALID',
            flags: 'g',
            priority: PatternPriority.MEDIUM,
          },
        ],
      };

      const newDetector = new PIIDetector();
      const importedCount = newDetector.importPatterns(exportData, { validate: true });

      expect(importedCount).toBe(1);
      expect(newDetector.getCustomPattern('valid')).toBeDefined();
    });
  });

  describe('Pattern Statistics', () => {
    it('should provide accurate pattern statistics', () => {
      detector.registerCustomPattern({
        id: 'stat-1',
        name: 'Stat 1',
        pattern: /S1-\d{4}/g,
        priority: PatternPriority.HIGH,
        enabled: true,
      });

      detector.registerCustomPattern({
        id: 'stat-2',
        name: 'Stat 2',
        pattern: /S2-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        enabled: true,
      });

      detector.registerCustomPattern({
        id: 'stat-3',
        name: 'Stat 3',
        pattern: /S3-\d{4}/g,
        priority: PatternPriority.LOW,
        enabled: false,
      });

      const stats = detector.getPatternStats();

      expect(stats.customCount).toBe(3);
      expect(stats.enabledCustomCount).toBe(2);
      expect(stats.builtInCount).toBeGreaterThan(0);
    });
  });

  describe('Clear Custom Patterns', () => {
    it('should clear all custom patterns', () => {
      detector.registerCustomPattern({
        id: 'temp-1',
        name: 'Temp 1',
        pattern: /T1-\d{4}/g,
        priority: PatternPriority.MEDIUM,
      });

      detector.registerCustomPattern({
        id: 'temp-2',
        name: 'Temp 2',
        pattern: /T2-\d{4}/g,
        priority: PatternPriority.MEDIUM,
      });

      expect(detector.listCustomPatterns()).toHaveLength(2);

      detector.clearCustomPatterns();

      expect(detector.listCustomPatterns()).toHaveLength(0);
      expect(detector.getCustomPattern('temp-1')).toBeUndefined();
      expect(detector.getCustomPattern('temp-2')).toBeUndefined();
    });
  });

  describe('Region-Specific Patterns', () => {
    it('should respect region settings for custom patterns', () => {
      detector.updateConfig({ regions: [Region.US] });

      detector.registerCustomPattern({
        id: 'us-only',
        name: 'US Only',
        pattern: /US-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        regions: [Region.US],
      });

      detector.registerCustomPattern({
        id: 'eu-only',
        name: 'EU Only',
        pattern: /EU-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        regions: [Region.EU],
      });

      const result = detector.detectWithCustomPatterns('Codes: US-1234, EU-5678');

      // Should only detect US pattern
      const usMatches = result.matches.filter(m => m.value === 'US-1234');
      const euMatches = result.matches.filter(m => m.value === 'EU-5678');

      expect(usMatches.length).toBeGreaterThan(0);
      expect(euMatches.length).toBe(0);
    });
  });

  describe('Pattern Tags', () => {
    it('should store and retrieve pattern tags', () => {
      detector.registerCustomPattern({
        id: 'tagged',
        name: 'Tagged Pattern',
        pattern: /TAG-\d{4}/g,
        priority: PatternPriority.MEDIUM,
        tags: ['finance', 'sensitive', 'audit'],
      });

      const pattern = detector.getCustomPattern('tagged');
      expect(pattern?.tags).toEqual(['finance', 'sensitive', 'audit']);
    });
  });

  describe('Performance', () => {
    it('should complete pattern testing in reasonable time', () => {
      detector.registerCustomPattern({
        id: 'perf-test',
        name: 'Performance Test',
        pattern: /PERF-\d{6}/g,
        priority: PatternPriority.MEDIUM,
      });

      const largeText = 'PERF-123456 '.repeat(1000);
      const result = detector.testPattern('perf-test', {
        testString: largeText,
      });

      expect(result.performance.executionTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(result.matches).toHaveLength(1000);
    });
  });
});
