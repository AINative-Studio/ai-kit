/**
 * Security types and interfaces for prompt injection detection
 */

/**
 * Sensitivity level for detection
 */
export enum SensitivityLevel {
  /** Low sensitivity - only detect obvious attacks */
  LOW = 'low',
  /** Medium sensitivity - balanced detection */
  MEDIUM = 'medium',
  /** High sensitivity - aggressive detection, may have false positives */
  HIGH = 'high',
}

/**
 * Types of injection attacks that can be detected
 */
export enum InjectionPattern {
  /** System prompt override attempts */
  SYSTEM_PROMPT_OVERRIDE = 'system_prompt_override',
  /** Role confusion attacks */
  ROLE_CONFUSION = 'role_confusion',
  /** Instruction injection */
  INSTRUCTION_INJECTION = 'instruction_injection',
  /** Delimiter attacks using special markers */
  DELIMITER_ATTACK = 'delimiter_attack',
  /** Encoding-based attacks */
  ENCODING_ATTACK = 'encoding_attack',
  /** Multi-language injection attacks */
  MULTI_LANGUAGE_ATTACK = 'multi_language_attack',
  /** Context escape attempts */
  CONTEXT_ESCAPE = 'context_escape',
  /** Jailbreak attempts */
  JAILBREAK = 'jailbreak',
}

/**
 * Detection result for a single pattern match
 */
export interface PatternMatch {
  /** Type of pattern detected */
  pattern: InjectionPattern;
  /** Confidence score (0-1) */
  confidence: number;
  /** Matched text excerpt */
  matchedText: string;
  /** Position in original text */
  position: {
    start: number;
    end: number;
  };
  /** Additional context about the match */
  context?: Record<string, any>;
}

/**
 * Overall detection result
 */
export interface DetectionResult {
  /** Whether injection was detected */
  isInjection: boolean;
  /** Overall confidence score (0-1) */
  confidence: number;
  /** All pattern matches found */
  matches: PatternMatch[];
  /** Analyzed text */
  analyzedText: string;
  /** Sensitivity level used */
  sensitivityLevel: SensitivityLevel;
  /** Analysis timestamp */
  timestamp: Date;
  /** Recommended action */
  recommendation: 'allow' | 'warn' | 'block';
  /** Explanation of the detection */
  explanation?: string;
}

/**
 * Configuration for prompt injection detector
 */
export interface PromptInjectionConfig {
  /** Sensitivity level for detection */
  sensitivityLevel?: SensitivityLevel;
  /** Patterns to enable (all enabled by default) */
  enabledPatterns?: InjectionPattern[];
  /** Patterns to disable */
  disabledPatterns?: InjectionPattern[];
  /** Custom confidence threshold (0-1) */
  confidenceThreshold?: number;
  /** Maximum text length to analyze */
  maxTextLength?: number;
  /** Whether to normalize text before analysis */
  normalizeText?: boolean;
  /** Custom pattern definitions */
  customPatterns?: CustomPattern[];
  /** Whether to detect encoding attacks */
  detectEncoding?: boolean;
  /** Whether to detect multi-language attacks */
  detectMultiLanguage?: boolean;
}

/**
 * Custom pattern definition for detection
 */
export interface CustomPattern {
  /** Unique identifier */
  id: string;
  /** Pattern name */
  name: string;
  /** Regular expression or string pattern */
  pattern: string | RegExp;
  /** Pattern type */
  type: InjectionPattern;
  /** Confidence multiplier (0-1) */
  confidenceMultiplier?: number;
  /** Whether pattern is case sensitive */
  caseSensitive?: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Statistics about detection runs
 */
export interface DetectionStats {
  /** Total prompts analyzed */
  totalAnalyzed: number;
  /** Total injections detected */
  totalDetected: number;
  /** Detection rate */
  detectionRate: number;
  /** Pattern distribution */
  patternDistribution: Record<InjectionPattern, number>;
  /** Average confidence scores */
  averageConfidence: number;
  /** Timestamp of statistics */
  timestamp: Date;
}

/**
 * Pattern rule definition used internally
 */
export interface PatternRule {
  /** Pattern to match */
  pattern: RegExp;
  /** Pattern type */
  type: InjectionPattern;
  /** Base confidence score */
  confidence: number;
  /** Weight multiplier based on sensitivity */
  weight: {
    [SensitivityLevel.LOW]: number;
    [SensitivityLevel.MEDIUM]: number;
    [SensitivityLevel.HIGH]: number;
  };
  /** Description of what this pattern detects */
  description: string;
}

// ============================================================================
// PII Detection Types
// ============================================================================

/**
 * Types of Personally Identifiable Information (PII) that can be detected
 */
export enum PIIType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SSN = 'SSN',
  CREDIT_CARD = 'CREDIT_CARD',
  IP_ADDRESS = 'IP_ADDRESS',
  PHYSICAL_ADDRESS = 'PHYSICAL_ADDRESS',
  DATE_OF_BIRTH = 'DATE_OF_BIRTH',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  NAME = 'NAME',
  URL = 'URL',
  IBAN = 'IBAN',
  VAT_NUMBER = 'VAT_NUMBER',
  POSTAL_CODE = 'POSTAL_CODE',
}

/**
 * Supported regions for PII detection
 */
export enum Region {
  US = 'US',
  EU = 'EU',
  UK = 'UK',
  CA = 'CA',
  AU = 'AU',
  GLOBAL = 'GLOBAL',
}

/**
 * A detected PII instance in text
 */
export interface PIIMatch {
  /** Type of PII detected */
  type: PIIType;
  /** The actual PII value found */
  value: string;
  /** Starting position in the text */
  start: number;
  /** Ending position in the text */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Additional metadata about the match */
  metadata?: {
    region?: Region;
    format?: string;
    validated?: boolean;
    [key: string]: any;
  };
}

/**
 * Result of PII detection
 */
export interface PIIDetectionResult {
  /** Original text analyzed */
  text: string;
  /** All PII matches found */
  matches: PIIMatch[];
  /** Text with PII redacted (if redaction was enabled) */
  redactedText?: string;
  /** Summary statistics */
  summary: {
    totalMatches: number;
    matchesByType: Record<string, number>;
    hasPII: boolean;
  };
}

/**
 * Configuration options for PII detection
 */
export interface PIIDetectorConfig {
  /** Regions to support for detection */
  regions?: Region[];
  /** Specific PII types to detect (if not specified, all types are detected) */
  enabledTypes?: PIIType[];
  /** Whether to perform redaction */
  redact?: boolean;
  /** Redaction character/string to use */
  redactionChar?: string;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Custom patterns for detection */
  customPatterns?: PIIPattern[];
  /** Whether to validate detected PII (e.g., Luhn algorithm for credit cards) */
  validate?: boolean;
  /** Context window size for named entity recognition */
  contextWindow?: number;
}

/**
 * Pattern definition for PII detection
 */
export interface PIIPattern {
  /** Type of PII this pattern detects */
  type: PIIType;
  /** Regular expression pattern */
  pattern: RegExp;
  /** Optional validator function */
  validator?: (value: string) => boolean;
  /** Applicable regions */
  regions?: Region[];
  /** Confidence score for this pattern (0-1) */
  confidence?: number;
  /** Format description */
  format?: string;
}

/**
 * Priority levels for custom pattern matching
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
  /** Replace with asterisks: test@example.com -> ******************** */
  MASK = 'mask',
  /** Replace with type label: test@example.com -> [EMAIL] */
  LABEL = 'label',
  /** Hash the value: test@example.com -> [HASH:a1b2c3...] */
  HASH = 'hash',
  /** Partially redact: test@example.com -> t***@e*****.com */
  PARTIAL = 'partial',
  /** Remove completely: test@example.com -> '' */
  REMOVE = 'remove',
}

/**
 * Custom PII pattern definition with advanced features
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
  /** Optional validator function */
  validator?: (value: string) => boolean;
  /** Applicable regions */
  regions?: Region[];
  /** Confidence score for this pattern (0-1) */
  confidence?: number;
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
    confidence?: number;
    regions?: Region[];
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

// ============================================================================
// Content Moderation Types
// ============================================================================

/**
 * Categories of content that can be moderated
 */
export enum ModerationCategory {
  /** Profanity and offensive language */
  PROFANITY = 'PROFANITY',
  /** Hate speech and discrimination */
  HATE_SPEECH = 'HATE_SPEECH',
  /** Violence, threats, and harm */
  VIOLENCE = 'VIOLENCE',
  /** Sexual or adult content */
  SEXUAL_CONTENT = 'SEXUAL_CONTENT',
  /** Spam and promotional content */
  SPAM = 'SPAM',
  /** Personally identifiable information */
  PII = 'PII',
}

/**
 * Severity levels for content violations
 */
export enum SeverityLevel {
  /** Low severity - mild violations */
  LOW = 'LOW',
  /** Medium severity - moderate violations */
  MEDIUM = 'MEDIUM',
  /** High severity - serious violations */
  HIGH = 'HIGH',
  /** Critical severity - severe violations requiring immediate action */
  CRITICAL = 'CRITICAL',
}

/**
 * Actions to take based on moderation results
 */
export enum ModerationAction {
  /** Allow the content to pass through */
  ALLOW = 'ALLOW',
  /** Warn about the content but allow it */
  WARN = 'WARN',
  /** Block the content from processing */
  BLOCK = 'BLOCK',
}

/**
 * Language codes for multi-language support
 */
export enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  DUTCH = 'nl',
  RUSSIAN = 'ru',
  CHINESE = 'zh',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ARABIC = 'ar',
}

/**
 * A detected content violation
 */
export interface ModerationMatch {
  /** Category of the violation */
  category: ModerationCategory;
  /** Severity level of the violation */
  severity: SeverityLevel;
  /** Confidence score (0-1) */
  confidence: number;
  /** Matched text */
  matchedText: string;
  /** Starting position in the text */
  start: number;
  /** Ending position in the text */
  end: number;
  /** Description of why this was flagged */
  reason: string;
  /** Metadata about the match */
  metadata?: {
    /** Pattern ID that matched */
    patternId?: string;
    /** Language detected */
    language?: Language;
    /** Context window around the match */
    context?: string;
    /** Additional custom metadata */
    [key: string]: any;
  };
}

/**
 * Result of content moderation
 */
export interface ModerationResult {
  /** Original text analyzed */
  text: string;
  /** Whether content violations were detected */
  flagged: boolean;
  /** Recommended action */
  action: ModerationAction;
  /** Overall severity level */
  overallSeverity: SeverityLevel;
  /** Overall confidence score (0-1) */
  confidence: number;
  /** All matches found */
  matches: ModerationMatch[];
  /** Summary statistics */
  summary: {
    /** Total violations found */
    totalViolations: number;
    /** Violations by category */
    violationsByCategory: Partial<Record<ModerationCategory, number>>;
    /** Highest severity detected */
    highestSeverity: SeverityLevel;
  };
  /** Analysis timestamp */
  timestamp: Date;
  /** Sanitized version of the text (if enabled) */
  sanitizedText?: string;
}

/**
 * Pattern definition for content moderation
 */
export interface ModerationPattern {
  /** Unique identifier */
  id: string;
  /** Category this pattern detects */
  category: ModerationCategory;
  /** Regular expression or keyword list */
  pattern: RegExp | string[];
  /** Severity level for matches */
  severity: SeverityLevel;
  /** Confidence score for this pattern (0-1) */
  confidence: number;
  /** Description of what this pattern detects */
  description: string;
  /** Applicable languages */
  languages?: Language[];
  /** Whether pattern is case-sensitive */
  caseSensitive?: boolean;
  /** Context rules to reduce false positives */
  contextRules?: ContextRule[];
}

/**
 * Context rule for reducing false positives
 */
export interface ContextRule {
  /** Type of context check */
  type: 'whitelist' | 'blacklist' | 'surrounding' | 'preceding' | 'following';
  /** Pattern to check in context */
  pattern: RegExp | string;
  /** Action if context rule matches */
  action: 'allow' | 'block';
  /** Window size for context (in characters) */
  windowSize?: number;
}

/**
 * Threshold configuration for actions
 */
export interface ModerationThresholds {
  /** Confidence threshold for blocking (0-1) */
  blockThreshold: number;
  /** Confidence threshold for warnings (0-1) */
  warnThreshold: number;
  /** Severity level that triggers automatic blocking */
  autoBlockSeverity: SeverityLevel;
}

/**
 * Configuration for ContentModerator
 */
export interface ContentModeratorConfig {
  /** Categories to enable (all enabled by default) */
  enabledCategories?: ModerationCategory[];
  /** Languages to support */
  languages?: Language[];
  /** Custom moderation patterns */
  customPatterns?: ModerationPattern[];
  /** Action thresholds */
  thresholds?: Partial<ModerationThresholds>;
  /** Whether to sanitize flagged content */
  sanitize?: boolean;
  /** Sanitization character/string */
  sanitizationChar?: string;
  /** Whether to enable context-aware filtering */
  contextAwareFiltering?: boolean;
  /** Maximum text length to analyze */
  maxTextLength?: number;
  /** Whether to integrate with PII detection */
  enablePIIDetection?: boolean;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
}

/**
 * Word list for a specific category and language
 */
export interface WordList {
  /** Category this word list belongs to */
  category: ModerationCategory;
  /** Language of the word list */
  language: Language;
  /** Severity level for words in this list */
  severity: SeverityLevel;
  /** Words/phrases to detect */
  words: string[];
  /** Whether matching is case-sensitive */
  caseSensitive?: boolean;
}
