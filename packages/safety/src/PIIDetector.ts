/**
 * PIIDetector - Comprehensive Personally Identifiable Information Detection System
 *
 * Detects various types of PII in text including:
 * - Email addresses
 * - Phone numbers (multiple formats/regions)
 * - Social Security Numbers
 * - Credit card numbers (with Luhn validation)
 * - IP addresses
 * - Physical addresses
 * - Dates of birth
 * - Driver's license numbers
 * - Passport numbers
 * - Names
 * - URLs
 * - IBAN numbers
 * - VAT numbers
 * - Postal codes
 */

import * as crypto from 'crypto';
import {
  PIIType,
  Region,
  PIIMatch,
  PIIDetectionResult,
  PIIDetectorConfig,
  PIIPattern,
  CustomPIIPattern,
  PatternPriority,
  RedactionStrategy,
  PatternValidationResult,
  PatternTestOptions,
  PatternTestResult,
  PatternExport,
  ImportOptions,
} from './types';

export class PIIDetector {
  private config: Required<PIIDetectorConfig>;
  private patterns: PIIPattern[];
  private customPIIPatterns: Map<string, CustomPIIPattern>;

  constructor(config: PIIDetectorConfig = {}) {
    this.config = {
      regions: config.regions || [Region.GLOBAL, Region.US, Region.EU, Region.UK],
      enabledTypes: config.enabledTypes || Object.values(PIIType),
      redact: config.redact ?? false,
      redactionChar: config.redactionChar || '*',
      minConfidence: config.minConfidence || 0.6,
      customPatterns: config.customPatterns || [],
      validate: config.validate ?? true,
      contextWindow: config.contextWindow || 50,
    };

    this.customPIIPatterns = new Map();
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize detection patterns for all PII types
   */
  private initializePatterns(): PIIPattern[] {
    const patterns: PIIPattern[] = [];

    // Email addresses
    if (this.isTypeEnabled(PIIType.EMAIL)) {
      patterns.push({
        type: PIIType.EMAIL,
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        confidence: 0.95,
        format: 'RFC 5322',
        regions: [Region.GLOBAL],
      });
    }

    // Phone numbers (multiple formats)
    if (this.isTypeEnabled(PIIType.PHONE)) {
      // US/Canada format
      patterns.push({
        type: PIIType.PHONE,
        pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        confidence: 0.85,
        format: 'US/Canada (XXX) XXX-XXXX',
        regions: [Region.US, Region.CA],
      });

      // International format
      patterns.push({
        type: PIIType.PHONE,
        pattern: /\b\+[1-9]\d{1,14}\b/g,
        confidence: 0.8,
        format: 'E.164 International',
        regions: [Region.GLOBAL],
      });

      // UK format
      patterns.push({
        type: PIIType.PHONE,
        pattern: /\b(?:0|\+44)(?:\d\s?){9,10}\b/g,
        confidence: 0.85,
        format: 'UK Format',
        regions: [Region.UK],
      });

      // EU formats
      patterns.push({
        type: PIIType.PHONE,
        pattern: /\b\+?\d{2}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/g,
        confidence: 0.75,
        format: 'EU Format',
        regions: [Region.EU],
      });

      // AU format
      patterns.push({
        type: PIIType.PHONE,
        pattern: /\b(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}\b/g,
        confidence: 0.85,
        format: 'Australian Format',
        regions: [Region.AU],
      });
    }

    // Social Security Numbers (US)
    if (this.isTypeEnabled(PIIType.SSN)) {
      patterns.push({
        type: PIIType.SSN,
        pattern: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,
        confidence: 0.9,
        format: 'US SSN (XXX-XX-XXXX)',
        regions: [Region.US],
        validator: this.validateSSN.bind(this),
      });
    }

    // Credit Card Numbers
    if (this.isTypeEnabled(PIIType.CREDIT_CARD)) {
      patterns.push({
        type: PIIType.CREDIT_CARD,
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
        confidence: 0.85,
        format: 'Visa, MC, Amex, Discover, JCB',
        regions: [Region.GLOBAL],
        validator: this.validateCreditCard.bind(this),
      });
    }

    // IP Addresses (IPv4 and IPv6)
    if (this.isTypeEnabled(PIIType.IP_ADDRESS)) {
      // IPv4
      patterns.push({
        type: PIIType.IP_ADDRESS,
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        confidence: 0.9,
        format: 'IPv4',
        regions: [Region.GLOBAL],
      });

      // IPv6
      patterns.push({
        type: PIIType.IP_ADDRESS,
        pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
        confidence: 0.9,
        format: 'IPv6',
        regions: [Region.GLOBAL],
      });
    }

    // Date of Birth
    if (this.isTypeEnabled(PIIType.DATE_OF_BIRTH)) {
      patterns.push({
        type: PIIType.DATE_OF_BIRTH,
        pattern: /\b(?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.](?:19|20)\d{2}\b/g,
        confidence: 0.7,
        format: 'MM/DD/YYYY',
        regions: [Region.US],
      });

      patterns.push({
        type: PIIType.DATE_OF_BIRTH,
        pattern: /\b(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2}\b/g,
        confidence: 0.7,
        format: 'DD/MM/YYYY',
        regions: [Region.EU, Region.UK, Region.AU],
      });
    }

    // Driver's License (US - various states)
    if (this.isTypeEnabled(PIIType.DRIVERS_LICENSE)) {
      patterns.push({
        type: PIIType.DRIVERS_LICENSE,
        pattern: /\b[A-Z]{1,2}\d{6,8}\b/g,
        confidence: 0.6,
        format: 'US State Format',
        regions: [Region.US],
      });
    }

    // Passport Numbers
    if (this.isTypeEnabled(PIIType.PASSPORT)) {
      // US Passport
      patterns.push({
        type: PIIType.PASSPORT,
        pattern: /\b[A-Z]\d{8}\b/g,
        confidence: 0.7,
        format: 'US Passport',
        regions: [Region.US],
      });

      // UK Passport
      patterns.push({
        type: PIIType.PASSPORT,
        pattern: /\b\d{9}[A-Z]\b/g,
        confidence: 0.7,
        format: 'UK Passport',
        regions: [Region.UK],
      });
    }

    // URLs
    if (this.isTypeEnabled(PIIType.URL)) {
      patterns.push({
        type: PIIType.URL,
        pattern: /\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b/gi,
        confidence: 0.95,
        format: 'URL',
        regions: [Region.GLOBAL],
      });
    }

    // IBAN (European)
    if (this.isTypeEnabled(PIIType.IBAN)) {
      patterns.push({
        type: PIIType.IBAN,
        pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
        confidence: 0.85,
        format: 'IBAN',
        regions: [Region.EU],
        validator: this.validateIBAN.bind(this),
      });
    }

    // VAT Numbers (EU)
    if (this.isTypeEnabled(PIIType.VAT_NUMBER)) {
      patterns.push({
        type: PIIType.VAT_NUMBER,
        pattern: /\b(?:ATU\d{8}|BE0?\d{9,10}|BG\d{9,10}|HR\d{11}|CY\d{8}[A-Z]|CZ\d{8,10}|DK\d{8}|EE\d{9}|FI\d{8}|FR[A-Z0-9]{2}\d{9}|DE\d{9}|EL\d{9}|HU\d{8}|IE\d[A-Z0-9\+\*]\d{5}[A-Z]|IT\d{11}|LV\d{11}|LT(?:\d{9}|\d{12})|LU\d{8}|MT\d{8}|NL\d{9}B\d{2}|PL\d{10}|PT\d{9}|RO\d{2,10}|SK\d{10}|SI\d{8}|ES[A-Z0-9]\d{7}[A-Z0-9]|SE\d{12})\b/g,
        confidence: 0.9,
        format: 'EU VAT',
        regions: [Region.EU],
      });
    }

    // Postal Codes
    if (this.isTypeEnabled(PIIType.POSTAL_CODE)) {
      // US ZIP
      patterns.push({
        type: PIIType.POSTAL_CODE,
        pattern: /\b\d{5}(?:-\d{4})?\b/g,
        confidence: 0.7,
        format: 'US ZIP',
        regions: [Region.US],
      });

      // UK Postcode
      patterns.push({
        type: PIIType.POSTAL_CODE,
        pattern: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi,
        confidence: 0.8,
        format: 'UK Postcode',
        regions: [Region.UK],
      });

      // Canadian Postal Code
      patterns.push({
        type: PIIType.POSTAL_CODE,
        pattern: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
        confidence: 0.85,
        format: 'Canadian Postal Code',
        regions: [Region.CA],
      });
    }

    // Names (simple pattern-based detection)
    if (this.isTypeEnabled(PIIType.NAME)) {
      patterns.push({
        type: PIIType.NAME,
        pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
        confidence: 0.5,
        format: 'Capitalized Names',
        regions: [Region.GLOBAL],
      });
    }

    // Physical Address (simplified pattern)
    if (this.isTypeEnabled(PIIType.PHYSICAL_ADDRESS)) {
      patterns.push({
        type: PIIType.PHYSICAL_ADDRESS,
        pattern: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi,
        confidence: 0.7,
        format: 'Street Address',
        regions: [Region.GLOBAL],
      });
    }

    // Add custom patterns
    if (this.config.customPatterns.length > 0) {
      patterns.push(...this.config.customPatterns);
    }

    return patterns;
  }

  /**
   * Detect PII in text
   */
  public detect(text: string): PIIDetectionResult {
    const matches: PIIMatch[] = [];

    // Apply each pattern
    for (const pattern of this.patterns) {
      // Check if pattern's region is enabled
      if (
        pattern.regions &&
        !pattern.regions.some((r) => this.config.regions.includes(r))
      ) {
        continue;
      }

      // Reset regex lastIndex
      pattern.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.pattern.exec(text)) !== null) {
        const value = match[0];
        const start = match.index;
        const end = start + value.length;
        const confidence = pattern.confidence || 0.8;

        // Validate if validator is provided and validation is enabled
        let validated = true;
        if (this.config.validate && pattern.validator) {
          validated = pattern.validator(value);
        }

        // Skip if validation failed
        if (this.config.validate && !validated) {
          continue;
        }

        // Skip if confidence is below threshold
        if (confidence < this.config.minConfidence) {
          continue;
        }

        matches.push({
          type: pattern.type,
          value,
          start,
          end,
          confidence,
          metadata: {
            region: pattern.regions?.[0],
            format: pattern.format,
            validated,
          },
        });
      }
    }

    // Remove duplicates and overlapping matches
    const uniqueMatches = this.deduplicateMatches(matches);

    // Sort by position
    uniqueMatches.sort((a, b) => a.start - b.start);

    // Generate redacted text if enabled
    let redactedText: string | undefined;
    if (this.config.redact) {
      redactedText = this.redactText(text, uniqueMatches);
    }

    // Generate summary
    const matchesByType: Record<string, number> = {};
    for (const match of uniqueMatches) {
      matchesByType[match.type] = (matchesByType[match.type] || 0) + 1;
    }

    return {
      text,
      matches: uniqueMatches,
      redactedText,
      summary: {
        totalMatches: uniqueMatches.length,
        matchesByType,
        hasPII: uniqueMatches.length > 0,
      },
    };
  }

  /**
   * Remove duplicate and overlapping matches
   */
  private deduplicateMatches(matches: PIIMatch[]): PIIMatch[] {
    if (matches.length === 0) return [];

    // Sort by start position and confidence
    const sorted = [...matches].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.confidence - a.confidence;
    });

    const result: PIIMatch[] = [];
    let lastEnd = -1;

    for (const match of sorted) {
      // Skip if this match overlaps with a previous one
      if (match.start < lastEnd) {
        continue;
      }

      result.push(match);
      lastEnd = match.end;
    }

    return result;
  }

  /**
   * Redact PII from text
   */
  private redactText(text: string, matches: PIIMatch[]): string {
    let result = text;
    let offset = 0;

    for (const match of matches) {
      const redaction = this.config.redactionChar.repeat(match.value.length);
      const start = match.start + offset;
      const end = match.end + offset;

      result = result.substring(0, start) + redaction + result.substring(end);
    }

    return result;
  }

  /**
   * Validate Social Security Number
   */
  private validateSSN(ssn: string): boolean {
    const cleaned = ssn.replace(/[-\s]/g, '');
    if (cleaned.length !== 9) return false;

    // Invalid SSN patterns
    const area = parseInt(cleaned.substring(0, 3));
    const group = parseInt(cleaned.substring(3, 5));
    const serial = parseInt(cleaned.substring(5, 9));

    if (area === 0 || area === 666 || area >= 900) return false;
    if (group === 0) return false;
    if (serial === 0) return false;

    return true;
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  private validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate IBAN (simplified check)
   */
  private validateIBAN(iban: string): boolean {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) return false;

    // Move first 4 characters to end
    const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);

    // Convert letters to numbers (A=10, B=11, etc.)
    const numeric = rearranged.replace(/[A-Z]/g, (char) =>
      (char.charCodeAt(0) - 55).toString()
    );

    // Perform mod 97 check
    let remainder = numeric;
    while (remainder.length > 2) {
      const block = remainder.substring(0, 9);
      remainder = (parseInt(block) % 97).toString() + remainder.substring(block.length);
    }

    return parseInt(remainder) % 97 === 1;
  }

  /**
   * Check if a PII type is enabled
   */
  private isTypeEnabled(type: PIIType): boolean {
    return this.config.enabledTypes.includes(type);
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<PIIDetectorConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PIIDetectorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.patterns = this.initializePatterns();
  }

  // ============================================================================
  // Custom Pattern Management (AIKIT-35)
  // ============================================================================

  /**
   * Register a custom PII pattern
   *
   * @param pattern - Custom pattern configuration
   * @throws Error if pattern is invalid
   *
   * @example
   * ```typescript
   * detector.registerCustomPattern({
   *   id: 'employee-id',
   *   name: 'Employee ID',
   *   pattern: /EMP-\d{6}/g,
   *   priority: PatternPriority.HIGH,
   *   redactionStrategy: RedactionStrategy.LABEL,
   * });
   * ```
   */
  public registerCustomPattern(pattern: CustomPIIPattern): void {
    const validation = this.validatePattern(pattern);
    if (!validation.valid) {
      const errorMsg = 'Invalid pattern: ' + validation.errors.join(', ');
      throw new Error(errorMsg);
    }

    // Ensure pattern has global flag for proper matching
    const flags = pattern.pattern.flags.includes('g')
      ? pattern.pattern.flags
      : pattern.pattern.flags + 'g';

    const normalizedPattern: CustomPIIPattern = {
      ...pattern,
      pattern: new RegExp(pattern.pattern.source, flags),
      enabled: pattern.enabled !== undefined ? pattern.enabled : true,
      redactionStrategy: pattern.redactionStrategy || RedactionStrategy.LABEL,
      confidence: pattern.confidence !== undefined ? pattern.confidence : 0.8,
      priority: pattern.priority || PatternPriority.MEDIUM,
    };

    this.customPIIPatterns.set(pattern.id, normalizedPattern);
  }

  /**
   * Unregister a custom pattern
   *
   * @param patternId - ID of pattern to remove
   * @returns true if pattern was removed
   */
  public unregisterCustomPattern(patternId: string): boolean {
    return this.customPIIPatterns.delete(patternId);
  }

  /**
   * Get a custom pattern by ID
   *
   * @param patternId - Pattern ID
   * @returns Custom pattern or undefined
   */
  public getCustomPattern(patternId: string): CustomPIIPattern | undefined {
    return this.customPIIPatterns.get(patternId);
  }

  /**
   * List all custom patterns
   *
   * @param includeDisabled - Include disabled patterns
   * @returns Array of custom patterns
   */
  public listCustomPatterns(includeDisabled = false): CustomPIIPattern[] {
    const patterns = Array.from(this.customPIIPatterns.values());
    return includeDisabled ? patterns : patterns.filter((p) => p.enabled);
  }

  /**
   * Validate a custom pattern
   *
   * @param pattern - Pattern to validate
   * @returns Validation result
   */
  public validatePattern(pattern: Partial<CustomPIIPattern>): PatternValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!pattern.id) {
      errors.push('Pattern ID is required');
    } else if (!/^[a-zA-Z0-9-_]+$/.test(pattern.id)) {
      errors.push('Pattern ID must contain only alphanumeric characters, hyphens, and underscores');
    }

    if (!pattern.name) {
      errors.push('Pattern name is required');
    }

    if (!pattern.pattern) {
      errors.push('Pattern regular expression is required');
    } else {
      try {
        // Test if pattern is valid
        const testPattern = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        testPattern.test('test');

        // Check for global flag
        if (!pattern.pattern.flags.includes('g')) {
          warnings.push('Pattern should have global flag (g) for proper matching');
        }

        // Calculate complexity score
        const complexityScore = this.calculatePatternComplexity(pattern.pattern);
        if (complexityScore > 80) {
          warnings.push('Pattern complexity is high, may impact performance');
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        errors.push('Invalid regular expression: ' + errorMessage);
      }
    }

    if (pattern.priority !== undefined) {
      const validPriorities = Object.values(PatternPriority).filter(
        (v) => typeof v === 'number'
      );
      if (!validPriorities.includes(pattern.priority)) {
        warnings.push('Priority should be one of the predefined PatternPriority values');
      }
    }

    // Calculate complexity if pattern is valid
    let complexityScore: number | undefined;
    if (pattern.pattern && errors.length === 0) {
      complexityScore = this.calculatePatternComplexity(pattern.pattern);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      complexityScore,
    };
  }

  /**
   * Calculate pattern complexity score
   *
   * @param pattern - RegExp to analyze
   * @returns Complexity score (0-100)
   */
  private calculatePatternComplexity(pattern: RegExp): number {
    const source = pattern.source;
    let score = 0;

    // Length factor
    score += Math.min(source.length / 2, 20);

    // Special regex features
    const features = [
      /\((?!\?:)/g, // Capturing groups
      /\[\^/g, // Negated character classes
      /\{.*,.*\}/g, // Quantifiers with ranges
      /\(\?[=!]/g, // Lookahead/lookbehind
      /\|/g, // Alternations
      /\\/g, // Escapes
    ];

    features.forEach((feature) => {
      const matches = source.match(feature);
      if (matches) {
        score += matches.length * 5;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Test a pattern against sample text
   *
   * @param patternId - Custom pattern ID
   * @param options - Test options
   * @returns Test result
   */
  public testPattern(
    patternId: string,
    options: PatternTestOptions
  ): PatternTestResult {
    const startTime = performance.now();

    const pattern = this.customPIIPatterns.get(patternId);

    if (!pattern) {
      return {
        passed: false,
        matches: [],
        performance: {
          executionTime: performance.now() - startTime,
        },
      };
    }

    const matches: PIIMatch[] = [];
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(options.testString)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      matches.push({
        type: PIIType.EMAIL, // Placeholder, we'll need to extend PIIType to support custom types
        value,
        start,
        end,
        confidence: pattern.confidence || 0.8,
        metadata: {
          customPatternId: pattern.id,
          customPatternName: pattern.name,
          priority: pattern.priority,
        },
      });
    }

    const passed =
      options.expectedMatches === undefined ||
      matches.length === options.expectedMatches;

    const result: PatternTestResult = {
      passed,
      matches,
      performance: {
        executionTime: performance.now() - startTime,
      },
    };

    if (options.testRedaction) {
      result.redactedOutput = this.redactWithCustomPattern(options.testString, matches, pattern);
    }

    return result;
  }

  /**
   * Redact text using custom pattern redaction strategy
   */
  private redactWithCustomPattern(
    text: string,
    matches: PIIMatch[],
    pattern: CustomPIIPattern
  ): string {
    if (matches.length === 0) return text;

    // Sort matches by start index (descending) to replace from end to start
    const sorted = [...matches].sort((a, b) => b.start - a.start);

    let result = text;
    for (const match of sorted) {
      const redacted = this.applyRedactionStrategy(match.value, pattern);
      result =
        result.substring(0, match.start) +
        redacted +
        result.substring(match.end);
    }

    return result;
  }

  /**
   * Apply redaction strategy to a value
   */
  private applyRedactionStrategy(value: string, pattern: CustomPIIPattern): string {
    // Use custom redactor if provided
    if (pattern.customRedactor) {
      return pattern.customRedactor(value);
    }

    const strategy = pattern.redactionStrategy || RedactionStrategy.LABEL;

    switch (strategy) {
      case RedactionStrategy.MASK:
        return '*'.repeat(value.length);

      case RedactionStrategy.LABEL:
        return '[' + pattern.name.toUpperCase() + ']';

      case RedactionStrategy.HASH:
        const hash = crypto.createHash('sha256').update(value).digest('hex');
        return '[HASH:' + hash.substring(0, 8) + ']';

      case RedactionStrategy.PARTIAL:
        if (value.length <= 4) return '*'.repeat(value.length);
        const visibleChars = Math.ceil(value.length * 0.2);
        const start = value.substring(0, visibleChars);
        const end = value.substring(value.length - visibleChars);
        const masked = '*'.repeat(value.length - visibleChars * 2);
        return start + masked + end;

      case RedactionStrategy.REMOVE:
        return '';

      default:
        return '[' + pattern.name.toUpperCase() + ']';
    }
  }

  /**
   * Detect PII using both built-in and custom patterns
   * Extended to support custom patterns with priority ordering
   */
  public detectWithCustomPatterns(text: string): PIIDetectionResult {
    // First, run the standard detection
    const standardResult = this.detect(text);

    // Then apply custom patterns
    const customMatches: PIIMatch[] = [];

    // Sort custom patterns by priority (highest first)
    const sortedCustomPatterns = Array.from(this.customPIIPatterns.values())
      .filter((p) => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const customPattern of sortedCustomPatterns) {
      // Check if pattern's region is enabled
      if (
        customPattern.regions &&
        !customPattern.regions.some((r) => this.config.regions.includes(r))
      ) {
        continue;
      }

      const regex = new RegExp(customPattern.pattern.source, customPattern.pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        const start = match.index;
        const end = start + value.length;

        // Validate if validator is provided
        let validated = true;
        if (this.config.validate && customPattern.validator) {
          validated = customPattern.validator(value);
        }

        if (this.config.validate && !validated) {
          continue;
        }

        customMatches.push({
          type: PIIType.EMAIL, // Placeholder - we'll mark it as custom in metadata
          value,
          start,
          end,
          confidence: customPattern.confidence || 0.8,
          metadata: {
            customPatternId: customPattern.id,
            customPatternName: customPattern.name,
            priority: customPattern.priority,
            isCustomPattern: true,
            tags: customPattern.tags,
          },
        });
      }
    }

    // Combine and deduplicate matches
    const allMatches = [...standardResult.matches, ...customMatches];
    const uniqueMatches = this.deduplicateMatches(allMatches);

    // Generate redacted text with custom patterns
    let redactedText: string | undefined;
    if (this.config.redact) {
      redactedText = this.redactTextWithCustomPatterns(text, uniqueMatches);
    }

    // Generate summary
    const matchesByType: Record<string, number> = {};
    for (const match of uniqueMatches) {
      const key = match.metadata?.['customPatternName'] || match.type;
      matchesByType[key] = (matchesByType[key] || 0) + 1;
    }

    return {
      text,
      matches: uniqueMatches,
      redactedText,
      summary: {
        totalMatches: uniqueMatches.length,
        matchesByType,
        hasPII: uniqueMatches.length > 0,
      },
    };
  }

  /**
   * Redact text considering custom patterns
   */
  private redactTextWithCustomPatterns(text: string, matches: PIIMatch[]): string {
    if (matches.length === 0) return text;

    // Sort by start position (descending)
    const sorted = [...matches].sort((a, b) => b.start - a.start);

    let result = text;
    for (const match of sorted) {
      let redacted: string;

      // Check if this is a custom pattern match
      if (match.metadata?.['isCustomPattern'] && match.metadata?.['customPatternId']) {
        const customPattern = this.customPIIPatterns.get(match.metadata['customPatternId']);
        if (customPattern) {
          redacted = this.applyRedactionStrategy(match.value, customPattern);
        } else {
          redacted = this.config.redactionChar.repeat(match.value.length);
        }
      } else {
        redacted = this.config.redactionChar.repeat(match.value.length);
      }

      result = result.substring(0, match.start) + redacted + result.substring(match.end);
    }

    return result;
  }

  /**
   * Export custom patterns to JSON
   *
   * @returns Pattern export object
   */
  public exportPatterns(): PatternExport {
    const patterns = Array.from(this.customPIIPatterns.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      pattern: p.pattern.source,
      flags: p.pattern.flags,
      priority: p.priority,
      redactionStrategy: p.redactionStrategy,
      tags: p.tags,
      enabled: p.enabled,
      confidence: p.confidence,
      regions: p.regions,
    }));

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      patterns,
    };
  }

  /**
   * Import custom patterns from JSON
   *
   * @param exportData - Pattern export data
   * @param options - Import options
   * @returns Number of patterns imported
   */
  public importPatterns(
    exportData: PatternExport,
    options: ImportOptions = {}
  ): number {
    const defaultOpts = { replace: false, validate: true, idPrefix: '' };
    const opts = { ...defaultOpts, ...options };

    let importedCount = 0;

    for (const patternData of exportData.patterns) {
      const id = opts.idPrefix + patternData.id;

      // Skip if pattern exists and replace is false
      if (!opts.replace && this.customPIIPatterns.has(id)) {
        continue;
      }

      try {
        const pattern: CustomPIIPattern = {
          id,
          name: patternData.name,
          description: patternData.description,
          pattern: new RegExp(patternData.pattern, patternData.flags || 'g'),
          priority: patternData.priority,
          redactionStrategy: patternData.redactionStrategy,
          tags: patternData.tags,
          enabled: patternData.enabled !== undefined ? patternData.enabled : true,
          confidence: patternData.confidence,
          regions: patternData.regions,
        };

        if (opts.validate) {
          const validation = this.validatePattern(pattern);
          if (!validation.valid) {
            console.warn('Skipping invalid pattern ' + id + ':', validation.errors);
            continue;
          }
        }

        this.registerCustomPattern(pattern);
        importedCount++;
      } catch (error) {
        console.warn('Failed to import pattern ' + id + ':', error);
      }
    }

    return importedCount;
  }

  /**
   * Clear all custom patterns
   */
  public clearCustomPatterns(): void {
    this.customPIIPatterns.clear();
  }

  /**
   * Get statistics about registered patterns
   */
  public getPatternStats(): {
    builtInCount: number;
    customCount: number;
    enabledCustomCount: number;
    totalPriority: Partial<Record<PatternPriority, number>>;
  } {
    const totalPriority: Partial<Record<PatternPriority, number>> = {};

    this.customPIIPatterns.forEach((p) => {
      if (p.enabled) {
        totalPriority[p.priority] = (totalPriority[p.priority] || 0) + 1;
      }
    });

    return {
      builtInCount: this.patterns.length,
      customCount: this.customPIIPatterns.size,
      enabledCustomCount: Array.from(this.customPIIPatterns.values()).filter(
        (p) => p.enabled
      ).length,
      totalPriority,
    };
  }
}

export default PIIDetector;
