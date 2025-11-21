/**
 * @fileoverview Type definitions for PII detection system
 * @module @aikit/core/security
 */

/**
 * Built-in PII types supported by the detector
 */
export enum PIIType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  IP_ADDRESS = 'ip_address',
  US_PASSPORT = 'us_passport',
  CUSTOM = 'custom',
}

/**
 * Priority levels for pattern matching
 * Higher priority patterns are evaluated first
 */
export enum PatternPriority {
  CRITICAL = 100,
  HIGH = 75,
  MEDIUM = 50,
  LOW = 25,
  LOWEST = 0,
}

/**
 * Redaction strategies for PII data
 */
export enum RedactionStrategy {
  /** Replace with asterisks: test@email.com -> ****@*****.*** */
  MASK = 'mask',
  /** Replace with type label: test@email.com -> [EMAIL] */
  LABEL = 'label',
  /** Hash the value: test@email.com -> [HASH:a1b2c3...] */
  HASH = 'hash',
  /** Partially redact: test@email.com -> t***@e*****.com */
  PARTIAL = 'partial',
  /** Remove completely: test@email.com -> '' */
  REMOVE = 'remove',
}

/**
 * Configuration for a custom PII pattern
 */
export interface CustomPIIPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this pattern detects */
  description?: string;
  /** Regular expression pattern */
  pattern: RegExp;
  /** Priority for pattern matching order */
  priority: PatternPriority;
  /** Custom redaction strategy */
  redactionStrategy?: RedactionStrategy;
  /** Custom redaction function (overrides redactionStrategy) */
  customRedactor?: (match: string) => string;
  /** Whether pattern is case-sensitive */
  caseSensitive?: boolean;
  /** Tags for categorizing patterns */
  tags?: string[];
  /** Whether this pattern is enabled */
  enabled?: boolean;
}

/**
 * Built-in PII pattern configuration
 */
export interface BuiltInPattern {
  type: PIIType;
  pattern: RegExp;
  priority: PatternPriority;
  redactionStrategy: RedactionStrategy;
  description: string;
}

/**
 * Result of a PII detection match
 */
export interface PIIMatch {
  /** Type of PII detected */
  type: PIIType | string;
  /** The matched text */
  value: string;
  /** Start index in the original text */
  startIndex: number;
  /** End index in the original text */
  endIndex: number;
  /** Priority of the pattern that matched */
  priority: PatternPriority;
  /** Redacted version of the value */
  redacted: string;
  /** Custom pattern ID if matched by custom pattern */
  customPatternId?: string;
}

/**
 * Options for PII detection
 */
export interface DetectionOptions {
  /** Enable/disable built-in patterns */
  useBuiltInPatterns?: boolean;
  /** Enable/disable custom patterns */
  useCustomPatterns?: boolean;
  /** Specific PII types to detect (null = all) */
  includeTypes?: (PIIType | string)[];
  /** PII types to exclude */
  excludeTypes?: (PIIType | string)[];
  /** Return all matches or just first match */
  findAll?: boolean;
  /** Case-sensitive matching */
  caseSensitive?: boolean;
}

/**
 * Result of PII detection operation
 */
export interface PIIDetectionResult {
  /** Whether any PII was found */
  hasPII: boolean;
  /** All matches found */
  matches: PIIMatch[];
  /** Original text */
  originalText: string;
  /** Text with all PII redacted */
  redactedText: string;
  /** Summary statistics */
  stats: {
    totalMatches: number;
    byType: Record<string, number>;
    byPriority: Record<PatternPriority, number>;
  };
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  /** Whether the pattern is valid */
  valid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Pattern complexity score (0-100) */
  complexityScore?: number;
}

/**
 * Options for pattern testing
 */
export interface PatternTestOptions {
  /** Test string to match against */
  testString: string;
  /** Whether to test redaction */
  testRedaction?: boolean;
  /** Expected number of matches */
  expectedMatches?: number;
}

/**
 * Result of pattern testing
 */
export interface PatternTestResult {
  /** Whether the test passed */
  passed: boolean;
  /** Matches found */
  matches: PIIMatch[];
  /** Redacted output if tested */
  redactedOutput?: string;
  /** Performance metrics */
  performance: {
    /** Execution time in milliseconds */
    executionTime: number;
  };
}

/**
 * Export format for custom patterns
 */
export interface PatternExport {
  /** Export format version */
  version: string;
  /** Export timestamp */
  exportedAt: string;
  /** Custom patterns */
  patterns: Array<{
    id: string;
    name: string;
    description?: string;
    pattern: string;
    flags?: string;
    priority: PatternPriority;
    redactionStrategy?: RedactionStrategy;
    tags?: string[];
    enabled?: boolean;
  }>;
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Whether to replace existing patterns with same ID */
  replace?: boolean;
  /** Whether to validate before importing */
  validate?: boolean;
  /** Prefix to add to imported pattern IDs */
  idPrefix?: string;
}
