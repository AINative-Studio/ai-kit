/**
 * Comprehensive Prompt Injection Detector
 * Detects and prevents prompt injection attacks in LLM applications
 */

import {
  SensitivityLevel,
  InjectionPattern,
  DetectionResult,
  PatternMatch,
  PromptInjectionConfig,
  PatternRule,
  DetectionStats,
  CustomPattern,
} from './types';

/**
 * Main class for detecting prompt injection attacks
 */
export class PromptInjectionDetector {
  private config: Required<PromptInjectionConfig>;
  private patternRules: PatternRule[];
  private stats: DetectionStats;

  constructor(config: PromptInjectionConfig = {}) {
    this.config = {
      sensitivityLevel: config.sensitivityLevel || SensitivityLevel.MEDIUM,
      enabledPatterns: config.enabledPatterns || Object.values(InjectionPattern),
      disabledPatterns: config.disabledPatterns || [],
      confidenceThreshold: config.confidenceThreshold || 0.7,
      maxTextLength: config.maxTextLength || 10000,
      normalizeText: config.normalizeText !== false,
      customPatterns: config.customPatterns || [],
      detectEncoding: config.detectEncoding !== false,
      detectMultiLanguage: config.detectMultiLanguage !== false,
    };

    this.patternRules = this.initializePatternRules();
    this.stats = {
      totalAnalyzed: 0,
      totalDetected: 0,
      detectionRate: 0,
      patternDistribution: {} as Record<InjectionPattern, number>,
      averageConfidence: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Initialize pattern rules for detection
   */
  private initializePatternRules(): PatternRule[] {
    const rules: PatternRule[] = [
      // System Prompt Override Attempts
      {
        pattern: /(?:ignore|disregard|forget|skip)\s+(?:all\s+)?(?:previous|prior|above|all|any|your|the)\s+(?:instructions?|prompts?|rules?|directives?|commands?|and)/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.95,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Attempts to override system prompts',
      },
      {
        pattern: /(?:ignore|disregard)\s+(?:instructions?|rules?|prompts?)/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Simple instruction bypass',
      },
      {
        pattern: /(?:disregard|ignore)\s+all\s+your\s+instructions?/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.95,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Direct instruction bypass',
      },
      {
        pattern: /(?:new|different)\s+(?:instructions?|rules?|context|system\s+prompt)/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Attempts to set new instructions',
      },
      {
        pattern: /system\s+prompt\s+is\s+now/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.9,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Direct system prompt override',
      },
      {
        pattern: /(?:your\s+)?(?:new|actual)\s+(?:goal|objective|purpose|task)\s+(?:is|will\s+be)/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Goal hijacking attempt',
      },
      {
        pattern: /(?:repeat|show|reveal|tell\s+me)\s+(?:everything|all|what|your)\s+(?:before|above|prior|initial|original)\s+(?:this|instructions?|prompts?)/gi,
        type: InjectionPattern.SYSTEM_PROMPT_OVERRIDE,
        confidence: 0.8,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Prompt leaking attempt',
      },

      // Role Confusion Attacks
      {
        pattern: /(?:you are|you're|act as|pretend to be|behave like|simulate)\s+(?:now\s+)?(?:a|an|the)?\s*(?:assistant|chatbot|ai|bot|admin|developer|root|system)/gi,
        type: InjectionPattern.ROLE_CONFUSION,
        confidence: 0.8,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.2,
        },
        description: 'Attempts to change AI role',
      },
      {
        pattern: /(?:from now on|starting now|henceforth),?\s+you\s+(?:will|shall|must|should)\s+(?:act|behave|respond|answer)/gi,
        type: InjectionPattern.ROLE_CONFUSION,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Role modification commands',
      },

      // Instruction Injection
      {
        pattern: /\[INST(?:RUCTION)?\]|\[\/INST(?:RUCTION)?\]/gi,
        type: InjectionPattern.INSTRUCTION_INJECTION,
        confidence: 0.9,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Instruction tag injection',
      },
      {
        pattern: /<\|(?:im_start|im_end)\|>/gi,
        type: InjectionPattern.INSTRUCTION_INJECTION,
        confidence: 0.95,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'ChatML tag injection',
      },
      {
        pattern: /(?:disregard|ignore)\s+(?:all|any|previous)\s+(?:and|&)\s+(?:following|subsequent)\s+(?:instructions?|rules?|commands?)/gi,
        type: InjectionPattern.INSTRUCTION_INJECTION,
        confidence: 0.9,
        weight: {
          [SensitivityLevel.LOW]: 1.0,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Instruction bypass attempt',
      },
      {
        pattern: /###\s+(?:Instruction|Response):/gi,
        type: InjectionPattern.INSTRUCTION_INJECTION,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Alpaca-style instruction format',
      },
      {
        pattern: /(?:Below|Above)\s+is\s+(?:an?\s+)?instruction\s+that\s+describes?\s+(?:a\s+)?task/gi,
        type: InjectionPattern.INSTRUCTION_INJECTION,
        confidence: 0.8,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Instruction template injection',
      },

      // Delimiter Attacks
      {
        pattern: /```[\s\S]*?(?:system|admin|root|sudo)[\s\S]*?```/gi,
        type: InjectionPattern.DELIMITER_ATTACK,
        confidence: 0.75,
        weight: {
          [SensitivityLevel.LOW]: 0.6,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.2,
        },
        description: 'Code block delimiter attack',
      },
      {
        pattern: /#{2,}[\s\S]*?(?:system|admin|instructions?)[\s\S]*?#{2,}/gi,
        type: InjectionPattern.DELIMITER_ATTACK,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Markdown header delimiter attack',
      },
      {
        pattern: /---+[\s\S]*?(?:system|admin|instructions?)[\s\S]*?---+/gi,
        type: InjectionPattern.DELIMITER_ATTACK,
        confidence: 0.8,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Horizontal rule delimiter attack',
      },

      // Context Escape
      {
        pattern: /\]\]\s*(?:ignore|disregard|forget)/gi,
        type: InjectionPattern.CONTEXT_ESCAPE,
        confidence: 0.8,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.2,
        },
        description: 'Context boundary escape attempt',
      },
      {
        pattern: /(?:end|close|exit)\s+(?:context|prompt|system)/gi,
        type: InjectionPattern.CONTEXT_ESCAPE,
        confidence: 0.75,
        weight: {
          [SensitivityLevel.LOW]: 0.6,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Context termination attempt',
      },

      // Jailbreak Attempts
      {
        pattern: /(?:DAN|developer mode|jailbreak|unrestricted mode|god mode)/gi,
        type: InjectionPattern.JAILBREAK,
        confidence: 0.9,
        weight: {
          [SensitivityLevel.LOW]: 0.8,
          [SensitivityLevel.MEDIUM]: 1.0,
          [SensitivityLevel.HIGH]: 1.2,
        },
        description: 'Known jailbreak patterns',
      },
      {
        pattern: /(?:without any restrictions|no limitations|unlimited access|bypass all)/gi,
        type: InjectionPattern.JAILBREAK,
        confidence: 0.75,
        weight: {
          [SensitivityLevel.LOW]: 0.6,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Restriction bypass attempt',
      },

      // Multi-language attacks (common phrases in various languages)
      {
        pattern: /(?:ignorar|ignorer|ignorieren|無視|무시)\s+(?:instrucciones|instructions|Anweisungen|指示|지침|les|todas?)/gi,
        type: InjectionPattern.MULTI_LANGUAGE_ATTACK,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Multi-language injection attempt',
      },
      {
        pattern: /(?:Sie\s+alle|toutes?\s+les|todas?\s+las)\s+(?:Anweisungen|instructions|instrucciones)/gi,
        type: InjectionPattern.MULTI_LANGUAGE_ATTACK,
        confidence: 0.85,
        weight: {
          [SensitivityLevel.LOW]: 0.7,
          [SensitivityLevel.MEDIUM]: 0.9,
          [SensitivityLevel.HIGH]: 1.1,
        },
        description: 'Multi-language injection attempt',
      },
      {
        pattern: /(?:précédentes?|anteriores?|vorherige)/gi,
        type: InjectionPattern.MULTI_LANGUAGE_ATTACK,
        confidence: 0.75,
        weight: {
          [SensitivityLevel.LOW]: 0.6,
          [SensitivityLevel.MEDIUM]: 0.8,
          [SensitivityLevel.HIGH]: 1.0,
        },
        description: 'Multi-language injection attempt',
      },
    ];

    // Filter rules based on enabled/disabled patterns
    return rules.filter(
      (rule) =>
        this.config.enabledPatterns.includes(rule.type) &&
        !this.config.disabledPatterns.includes(rule.type)
    );
  }

  /**
   * Detect encoding-based attacks
   */
  private detectEncodingAttacks(text: string): PatternMatch[] {
    if (!this.config.detectEncoding) {
      return [];
    }

    const matches: PatternMatch[] = [];

    // Base64 detection
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
    const base64Matches = text.match(base64Pattern);

    if (base64Matches) {
      for (const match of base64Matches) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf-8');
          // Check if decoded content contains suspicious keywords
          if (
            /(?:ignore|system|admin|prompt|instruction)/gi.test(decoded)
          ) {
            const index = text.indexOf(match);
            matches.push({
              pattern: InjectionPattern.ENCODING_ATTACK,
              confidence: 0.8,
              matchedText: match.substring(0, 50) + '...',
              position: { start: index, end: index + match.length },
              context: { encoding: 'base64', decoded: decoded.substring(0, 100) },
            });
          }
        } catch {
          // Not valid base64, continue
        }
      }
    }

    // Hex encoding detection
    const hexPattern = /(?:\\x[0-9a-fA-F]{2}){8,}/g;
    const hexMatches = text.match(hexPattern);

    if (hexMatches) {
      for (const match of hexMatches) {
        const index = text.indexOf(match);
        matches.push({
          pattern: InjectionPattern.ENCODING_ATTACK,
          confidence: 0.75,
          matchedText: match.substring(0, 50),
          position: { start: index, end: index + match.length },
          context: { encoding: 'hex' },
        });
      }
    }

    // Unicode escape detection
    const unicodePattern = /(?:\\u[0-9a-fA-F]{4}){4,}/g;
    const unicodeMatches = text.match(unicodePattern);

    if (unicodeMatches) {
      for (const match of unicodeMatches) {
        const index = text.indexOf(match);
        matches.push({
          pattern: InjectionPattern.ENCODING_ATTACK,
          confidence: 0.7,
          matchedText: match.substring(0, 50),
          position: { start: index, end: index + match.length },
          context: { encoding: 'unicode' },
        });
      }
    }

    return matches;
  }

  /**
   * Analyze text for heuristic indicators of injection
   */
  private analyzeHeuristics(text: string): number {
    let suspicionScore = 0;

    // Check for excessive special characters
    const specialCharCount = (text.match(/[{}[\]<>|]/g) || []).length;
    if (specialCharCount > text.length * 0.1) {
      suspicionScore += 0.2;
    }

    // Check for multiple delimiter types
    const delimiterTypes = [
      /```/g,
      /#{3,}/g,
      /---/g,
      /\*{3,}/g,
      /={3,}/g,
    ];
    const delimiterCount = delimiterTypes.filter((pattern) =>
      pattern.test(text)
    ).length;
    if (delimiterCount >= 3) {
      suspicionScore += 0.3;
    }

    // Check for unusual capitalization patterns
    const capsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
    if (capsWords.length > 5) {
      suspicionScore += 0.15;
    }

    // Check for repetitive phrases
    const words = text.toLowerCase().split(/\s+/);
    const wordSet = new Set(words);
    if (words.length > 20 && wordSet.size / words.length < 0.5) {
      suspicionScore += 0.2;
    }

    // Check for suspicious keyword density
    const suspiciousKeywords = [
      'system',
      'admin',
      'root',
      'ignore',
      'disregard',
      'instruction',
      'prompt',
      'override',
    ];
    const keywordCount = suspiciousKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword)
    ).length;
    if (keywordCount >= 3) {
      suspicionScore += 0.25;
    }

    return Math.min(suspicionScore, 1.0);
  }

  /**
   * Normalize text for analysis
   */
  private normalizeText(text: string): string {
    if (!this.config.normalizeText) {
      return text;
    }

    // Remove excessive whitespace
    let normalized = text.replace(/\s+/g, ' ').trim();

    // Normalize unicode variations
    normalized = normalized.normalize('NFKC');

    // Remove zero-width characters
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    return normalized;
  }

  /**
   * Apply custom patterns if configured
   */
  private applyCustomPatterns(text: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const customPattern of this.config.customPatterns) {
      const pattern =
        typeof customPattern.pattern === 'string'
          ? new RegExp(
              customPattern.pattern,
              customPattern.caseSensitive ? 'g' : 'gi'
            )
          : customPattern.pattern;

      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          pattern: customPattern.type,
          confidence:
            0.8 * (customPattern.confidenceMultiplier || 1.0),
          matchedText: match[0],
          position: { start: match.index, end: regex.lastIndex },
          context: {
            customPatternId: customPattern.id,
            customPatternName: customPattern.name,
            ...customPattern.metadata,
          },
        });
      }
    }

    return matches;
  }

  /**
   * Main detection method
   */
  public detect(text: string): DetectionResult {
    // Update statistics
    this.stats.totalAnalyzed++;

    // Truncate text if too long
    if (text.length > this.config.maxTextLength) {
      text = text.substring(0, this.config.maxTextLength);
    }

    // Normalize text
    const normalizedText = this.normalizeText(text);

    const matches: PatternMatch[] = [];

    // Apply pattern-based detection
    for (const rule of this.patternRules) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;

      while ((match = regex.exec(normalizedText)) !== null) {
        const weight = rule.weight[this.config.sensitivityLevel];
        const confidence = Math.min(rule.confidence * weight, 1.0);

        matches.push({
          pattern: rule.type,
          confidence,
          matchedText: match[0],
          position: { start: match.index, end: regex.lastIndex },
          context: { description: rule.description },
        });
      }
    }

    // Apply encoding detection
    const encodingMatches = this.detectEncodingAttacks(normalizedText);
    matches.push(...encodingMatches);

    // Apply custom patterns
    const customMatches = this.applyCustomPatterns(normalizedText);
    matches.push(...customMatches);

    // Analyze heuristics
    const heuristicScore = this.analyzeHeuristics(normalizedText);

    // Calculate overall confidence
    let overallConfidence = 0;
    if (matches.length > 0) {
      // Weight by both confidence and number of matches
      const avgMatchConfidence =
        matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
      const matchCountBonus = Math.min(matches.length * 0.1, 0.3);
      overallConfidence = Math.min(
        avgMatchConfidence + matchCountBonus + heuristicScore * 0.2,
        1.0
      );
    } else {
      // No pattern matches, rely on heuristics alone
      overallConfidence = heuristicScore;
    }

    // Determine if injection detected
    const isInjection = overallConfidence >= this.config.confidenceThreshold;

    // Update statistics
    if (isInjection) {
      this.stats.totalDetected++;
      for (const match of matches) {
        this.stats.patternDistribution[match.pattern] =
          (this.stats.patternDistribution[match.pattern] || 0) + 1;
      }
    }
    this.stats.detectionRate = this.stats.totalDetected / this.stats.totalAnalyzed;
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalAnalyzed - 1) +
        overallConfidence) /
      this.stats.totalAnalyzed;

    // Determine recommendation
    let recommendation: 'allow' | 'warn' | 'block';
    if (overallConfidence >= 0.9) {
      recommendation = 'block';
    } else if (overallConfidence >= this.config.confidenceThreshold) {
      recommendation = 'warn';
    } else {
      recommendation = 'allow';
    }

    // Generate explanation
    let explanation = '';
    if (isInjection) {
      const patternTypes = Array.from(new Set(matches.map((m) => m.pattern)));
      explanation = `Detected ${patternTypes.length} type(s) of injection patterns: ${patternTypes.join(', ')}. `;
      explanation += `Total matches: ${matches.length}. `;
      if (heuristicScore > 0.3) {
        explanation += `High heuristic suspicion score: ${(heuristicScore * 100).toFixed(1)}%.`;
      }
    }

    return {
      isInjection,
      confidence: overallConfidence,
      matches,
      analyzedText: normalizedText,
      sensitivityLevel: this.config.sensitivityLevel,
      timestamp: new Date(),
      recommendation,
      explanation: explanation || undefined,
    };
  }

  /**
   * Batch detection for multiple texts
   */
  public detectBatch(texts: string[]): DetectionResult[] {
    return texts.map((text) => this.detect(text));
  }

  /**
   * Get current detection statistics
   */
  public getStats(): DetectionStats {
    return {
      ...this.stats,
      timestamp: new Date(),
    };
  }

  /**
   * Reset detection statistics
   */
  public resetStats(): void {
    this.stats = {
      totalAnalyzed: 0,
      totalDetected: 0,
      detectionRate: 0,
      patternDistribution: {} as Record<InjectionPattern, number>,
      averageConfidence: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PromptInjectionConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize pattern rules if patterns changed
    if (config.enabledPatterns || config.disabledPatterns) {
      this.patternRules = this.initializePatternRules();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<PromptInjectionConfig> {
    return { ...this.config };
  }

  /**
   * Add a custom pattern
   */
  public addCustomPattern(pattern: CustomPattern): void {
    this.config.customPatterns.push(pattern);
  }

  /**
   * Remove a custom pattern
   */
  public removeCustomPattern(patternId: string): void {
    this.config.customPatterns = this.config.customPatterns.filter(
      (p) => p.id !== patternId
    );
  }

  /**
   * Get all active pattern rules
   */
  public getActivePatterns(): PatternRule[] {
    return [...this.patternRules];
  }
}
