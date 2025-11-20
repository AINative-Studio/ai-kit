/**
 * ContentModerator - Comprehensive Content Moderation System
 *
 * Provides multi-category content filtering for LLM applications including:
 * - Profanity and offensive language detection
 * - Hate speech and discrimination detection
 * - Violence and threat detection
 * - Sexual/adult content detection
 * - Spam and promotional content detection
 * - PII detection (integration with PIIDetector)
 *
 * Features:
 * - Configurable severity levels
 * - Multi-language support
 * - Context-aware filtering to reduce false positives
 * - Customizable word lists and patterns
 * - Integration with existing security modules
 */

import { PIIDetector } from './PIIDetector';
import {
  ModerationCategory,
  SeverityLevel,
  ModerationAction,
  Language,
  ModerationMatch,
  ModerationResult,
  ModerationPattern,
  ContextRule,
  ModerationThresholds,
  ContentModeratorConfig,
  WordList,
  PIIDetectorConfig,
} from './types';

/**
 * ContentModerator class for filtering inappropriate content
 */
export class ContentModerator {
  private config: Required<ContentModeratorConfig>;
  private patterns: Map<string, ModerationPattern>;
  private wordLists: Map<string, WordList>;
  private piiDetector?: PIIDetector;
  private thresholds: ModerationThresholds;

  constructor(config: ContentModeratorConfig = {}) {
    // Initialize configuration with defaults
    this.config = {
      enabledCategories: config.enabledCategories || Object.values(ModerationCategory),
      languages: config.languages || [Language.ENGLISH],
      customPatterns: config.customPatterns || [],
      thresholds: config.thresholds || {},
      sanitize: config.sanitize ?? false,
      sanitizationChar: config.sanitizationChar || '*',
      contextAwareFiltering: config.contextAwareFiltering ?? true,
      maxTextLength: config.maxTextLength || 10000,
      enablePIIDetection: config.enablePIIDetection ?? true,
      minConfidence: config.minConfidence || 0.6,
    };

    // Set thresholds
    this.thresholds = {
      blockThreshold: config.thresholds?.blockThreshold ?? 0.8,
      warnThreshold: config.thresholds?.warnThreshold ?? 0.6,
      autoBlockSeverity: config.thresholds?.autoBlockSeverity ?? SeverityLevel.CRITICAL,
    };

    // Initialize patterns and word lists
    this.patterns = new Map();
    this.wordLists = new Map();

    // Initialize PII detector if enabled
    if (this.config.enablePIIDetection) {
      const piiConfig: PIIDetectorConfig = {
        minConfidence: this.config.minConfidence,
        redact: false,
      };
      this.piiDetector = new PIIDetector(piiConfig);
    }

    // Load built-in patterns and word lists
    this.initializeBuiltInPatterns();
    this.initializeBuiltInWordLists();

    // Register custom patterns
    for (const pattern of this.config.customPatterns) {
      this.registerPattern(pattern);
    }
  }

  /**
   * Initialize built-in moderation patterns
   */
  private initializeBuiltInPatterns(): void {
    // Profanity patterns
    if (this.isCategoryEnabled(ModerationCategory.PROFANITY)) {
      this.patterns.set('profanity-strong', {
        id: 'profanity-strong',
        category: ModerationCategory.PROFANITY,
        pattern: /\b(f+u+c+k+i*n*g*|s+h+i+t+|b+i+t+c+h+|a+s+s+h+o+l+e+|c+u+n+t+)\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.9,
        description: 'Strong profanity',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });

      this.patterns.set('profanity-mild', {
        id: 'profanity-mild',
        category: ModerationCategory.PROFANITY,
        pattern: /\b(crap|stupid|idiot|moron|dumb|sucks)\b/gi,
        severity: SeverityLevel.LOW,
        confidence: 0.7,
        description: 'Mild profanity',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });
    }

    // Hate speech patterns
    if (this.isCategoryEnabled(ModerationCategory.HATE_SPEECH)) {
      this.patterns.set('hate-slurs', {
        id: 'hate-slurs',
        category: ModerationCategory.HATE_SPEECH,
        pattern:
          /\b(n[i1!]gg[e3]r|f[a@]gg[o0]t|r[e3]t[a@]rd|sp[i1!]c|ch[i1!]nk|k[i1!]k[e3])\b/gi,
        severity: SeverityLevel.CRITICAL,
        confidence: 0.95,
        description: 'Hate speech slurs',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });

      this.patterns.set('hate-rhetoric', {
        id: 'hate-rhetoric',
        category: ModerationCategory.HATE_SPEECH,
        pattern:
          /\b(hate|despise|scum|vermin|subhuman|inferior)\s+(all\s+)?(blacks|whites|jews|muslims|asians|hispanics|gays|women|men)\b/gi,
        severity: SeverityLevel.CRITICAL,
        confidence: 0.9,
        description: 'Hate speech rhetoric',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });
    }

    // Violence patterns
    if (this.isCategoryEnabled(ModerationCategory.VIOLENCE)) {
      this.patterns.set('violence-threats', {
        id: 'violence-threats',
        category: ModerationCategory.VIOLENCE,
        pattern:
          /\b(kill|murder|shoot|stab|attack|assault|bomb|destroy|hurt|harm|beat up|blow up)\s+(you|them|him|her|everyone)\b/gi,
        severity: SeverityLevel.CRITICAL,
        confidence: 0.9,
        description: 'Direct threats of violence',
        languages: [Language.ENGLISH],
        caseSensitive: false,
        contextRules: [
          {
            type: 'whitelist',
            pattern: /\b(game|movie|fiction|story|novel|book|hypothetical)\b/gi,
            action: 'allow',
            windowSize: 100,
          },
        ],
      });

      this.patterns.set('violence-graphic', {
        id: 'violence-graphic',
        category: ModerationCategory.VIOLENCE,
        pattern:
          /\b(torture|mutilate|dismember|decapitate|maim|behead|gore|brutal|savage|massacre)\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.85,
        description: 'Graphic violence descriptions',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });

      this.patterns.set('violence-weapons', {
        id: 'violence-weapons',
        category: ModerationCategory.VIOLENCE,
        pattern:
          /\b(how to (make|build|create|construct) (a )?(bomb|explosive|weapon|gun|knife|poison))\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.9,
        description: 'Weapon creation instructions',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });
    }

    // Sexual content patterns
    if (this.isCategoryEnabled(ModerationCategory.SEXUAL_CONTENT)) {
      this.patterns.set('sexual-explicit', {
        id: 'sexual-explicit',
        category: ModerationCategory.SEXUAL_CONTENT,
        pattern:
          /\b(porn|xxx|sex|nude|naked|erotic|masturbat|orgasm|penis|vagina|breast|dick|cock|pussy)\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.85,
        description: 'Explicit sexual content',
        languages: [Language.ENGLISH],
        caseSensitive: false,
        contextRules: [
          {
            type: 'whitelist',
            pattern: /\b(medical|health|education|anatomy|biology|doctor)\b/gi,
            action: 'allow',
            windowSize: 100,
          },
        ],
      });

      this.patterns.set('sexual-solicitation', {
        id: 'sexual-solicitation',
        category: ModerationCategory.SEXUAL_CONTENT,
        pattern: /\b(hookup|meet (for )?sex|looking for sex|want to have sex|sexting)\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.9,
        description: 'Sexual solicitation',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });
    }

    // Spam patterns
    if (this.isCategoryEnabled(ModerationCategory.SPAM)) {
      this.patterns.set('spam-promotional', {
        id: 'spam-promotional',
        category: ModerationCategory.SPAM,
        pattern:
          /\b(buy now|click here|limited time|act now|special offer|discount|sale|promo|coupon)\b/gi,
        severity: SeverityLevel.MEDIUM,
        confidence: 0.75,
        description: 'Promotional spam',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });

      this.patterns.set('spam-urls', {
        id: 'spam-urls',
        category: ModerationCategory.SPAM,
        pattern:
          /(?:(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|net|org|io|co)(?:\/[^\s]*)?(?:\s+and\s+|\s+)){2,}/gi,
        severity: SeverityLevel.MEDIUM,
        confidence: 0.7,
        description: 'Multiple URLs (potential spam)',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });

      this.patterns.set('spam-repetitive', {
        id: 'spam-repetitive',
        category: ModerationCategory.SPAM,
        pattern: /\b(\w+)\s+\1\s+\1/gi,
        severity: SeverityLevel.LOW,
        confidence: 0.6,
        description: 'Repetitive text',
        languages: [Language.ENGLISH],
        caseSensitive: false,
      });
    }
  }

  /**
   * Initialize built-in word lists for multiple languages
   */
  private initializeBuiltInWordLists(): void {
    // English profanity
    if (this.isCategoryEnabled(ModerationCategory.PROFANITY)) {
      this.wordLists.set('profanity-en-high', {
        category: ModerationCategory.PROFANITY,
        language: Language.ENGLISH,
        severity: SeverityLevel.HIGH,
        words: [
          'fuck',
          'fucking',
          'fucked',
          'shit',
          'bitch',
          'asshole',
          'cunt',
          'motherfucker',
          'bastard',
          'prick',
          'dickhead',
          'cocksucker',
        ],
        caseSensitive: false,
      });

      this.wordLists.set('profanity-en-medium', {
        category: ModerationCategory.PROFANITY,
        language: Language.ENGLISH,
        severity: SeverityLevel.MEDIUM,
        words: ['damn', 'hell', 'ass', 'crap', 'piss', 'tits', 'slut', 'whore'],
        caseSensitive: false,
      });

      // Spanish profanity
      this.wordLists.set('profanity-es-high', {
        category: ModerationCategory.PROFANITY,
        language: Language.SPANISH,
        severity: SeverityLevel.HIGH,
        words: [
          'puta',
          'mierda',
          'carajo',
          'pendejo',
          'cabrón',
          'joder',
          'coño',
          'hijo de puta',
        ],
        caseSensitive: false,
      });

      // French profanity
      this.wordLists.set('profanity-fr-high', {
        category: ModerationCategory.PROFANITY,
        language: Language.FRENCH,
        severity: SeverityLevel.HIGH,
        words: ['merde', 'putain', 'con', 'salaud', 'connard', 'enculé', 'bordel'],
        caseSensitive: false,
      });

      // German profanity
      this.wordLists.set('profanity-de-high', {
        category: ModerationCategory.PROFANITY,
        language: Language.GERMAN,
        severity: SeverityLevel.HIGH,
        words: [
          'scheiße',
          'scheisse',
          'arschloch',
          'fotze',
          'hurensohn',
          'verdammt',
          'schwuchtel',
        ],
        caseSensitive: false,
      });

      // Portuguese profanity
      this.wordLists.set('profanity-pt-high', {
        category: ModerationCategory.PROFANITY,
        language: Language.PORTUGUESE,
        severity: SeverityLevel.HIGH,
        words: [
          'puta',
          'merda',
          'caralho',
          'foda-se',
          'filho da puta',
          'porra',
          'buceta',
          'cacete',
        ],
        caseSensitive: false,
      });
    }

    // Hate speech word lists
    if (this.isCategoryEnabled(ModerationCategory.HATE_SPEECH)) {
      this.wordLists.set('hate-en-critical', {
        category: ModerationCategory.HATE_SPEECH,
        language: Language.ENGLISH,
        severity: SeverityLevel.CRITICAL,
        words: [
          'nigger',
          'nigga',
          'faggot',
          'retard',
          'spic',
          'chink',
          'gook',
          'kike',
          'wetback',
          'towelhead',
        ],
        caseSensitive: false,
      });
    }
  }

  /**
   * Moderate content and return detailed results
   */
  public moderate(text: string): ModerationResult {
    // Truncate if too long
    const analyzedText =
      text.length > this.config.maxTextLength
        ? text.substring(0, this.config.maxTextLength)
        : text;

    const matches: ModerationMatch[] = [];

    // Check against patterns
    for (const pattern of this.patterns.values()) {
      if (!this.isCategoryEnabled(pattern.category)) continue;
      if (!this.isLanguageSupported(pattern.languages)) continue;

      const patternMatches = this.matchPattern(analyzedText, pattern);
      matches.push(...patternMatches);
    }

    // Check against word lists
    for (const wordList of this.wordLists.values()) {
      if (!this.isCategoryEnabled(wordList.category)) continue;
      if (!this.isLanguageInConfig(wordList.language)) continue;

      const wordMatches = this.matchWordList(analyzedText, wordList);
      matches.push(...wordMatches);
    }

    // Check for PII if enabled
    if (this.config.enablePIIDetection && this.piiDetector) {
      const piiMatches = this.detectPII(analyzedText);
      matches.push(...piiMatches);
    }

    // Apply context-aware filtering
    const filteredMatches = this.config.contextAwareFiltering
      ? this.applyContextFiltering(analyzedText, matches)
      : matches;

    // Remove duplicates and overlapping matches
    const uniqueMatches = this.deduplicateMatches(filteredMatches);

    // Filter by minimum confidence
    const confidenceFilteredMatches = uniqueMatches.filter(
      (m) => m.confidence >= this.config.minConfidence
    );

    // Calculate overall severity and confidence
    const overallSeverity = this.calculateOverallSeverity(confidenceFilteredMatches);
    const overallConfidence = this.calculateOverallConfidence(confidenceFilteredMatches);

    // Determine action
    const action = this.determineAction(overallSeverity, overallConfidence);

    // Generate summary
    const violationsByCategory: Partial<Record<ModerationCategory, number>> = {};
    for (const match of confidenceFilteredMatches) {
      violationsByCategory[match.category] = (violationsByCategory[match.category] || 0) + 1;
    }

    const highestSeverity = this.getHighestSeverity(confidenceFilteredMatches);

    // Sanitize if enabled
    let sanitizedText: string | undefined;
    if (this.config.sanitize && confidenceFilteredMatches.length > 0) {
      sanitizedText = this.sanitizeText(analyzedText, confidenceFilteredMatches);
    }

    return {
      text: analyzedText,
      flagged: confidenceFilteredMatches.length > 0,
      action,
      overallSeverity,
      confidence: overallConfidence,
      matches: confidenceFilteredMatches,
      summary: {
        totalViolations: confidenceFilteredMatches.length,
        violationsByCategory,
        highestSeverity,
      },
      timestamp: new Date(),
      sanitizedText,
    };
  }

  /**
   * Match a pattern against text
   */
  private matchPattern(text: string, pattern: ModerationPattern): ModerationMatch[] {
    const matches: ModerationMatch[] = [];

    if (pattern.pattern instanceof RegExp) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const start = match.index;
        const end = start + matchedText.length;

        matches.push({
          category: pattern.category,
          severity: pattern.severity,
          confidence: pattern.confidence,
          matchedText,
          start,
          end,
          reason: pattern.description,
          metadata: {
            patternId: pattern.id,
            context: this.extractContext(text, start, end),
          },
        });
      }
    } else if (Array.isArray(pattern.pattern)) {
      // Handle array of keywords
      for (const keyword of pattern.pattern) {
        const regex = new RegExp(
          `\\b${this.escapeRegex(keyword)}\\b`,
          pattern.caseSensitive ? 'g' : 'gi'
        );
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const matchedText = match[0];
          const start = match.index;
          const end = start + matchedText.length;

          matches.push({
            category: pattern.category,
            severity: pattern.severity,
            confidence: pattern.confidence,
            matchedText,
            start,
            end,
            reason: pattern.description,
            metadata: {
              patternId: pattern.id,
              context: this.extractContext(text, start, end),
            },
          });
        }
      }
    }

    return matches;
  }

  /**
   * Match a word list against text
   */
  private matchWordList(text: string, wordList: WordList): ModerationMatch[] {
    const matches: ModerationMatch[] = [];

    for (const word of wordList.words) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(word)}\\b`,
        wordList.caseSensitive ? 'g' : 'gi'
      );
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const start = match.index;
        const end = start + matchedText.length;

        matches.push({
          category: wordList.category,
          severity: wordList.severity,
          confidence: 0.9,
          matchedText,
          start,
          end,
          reason: `${wordList.category} detected`,
          metadata: {
            language: wordList.language,
            context: this.extractContext(text, start, end),
          },
        });
      }
    }

    return matches;
  }

  /**
   * Detect PII in text
   */
  private detectPII(text: string): ModerationMatch[] {
    if (!this.piiDetector) return [];

    const piiResult = this.piiDetector.detect(text);
    const matches: ModerationMatch[] = [];

    for (const piiMatch of piiResult.matches) {
      matches.push({
        category: ModerationCategory.PII,
        severity: SeverityLevel.HIGH,
        confidence: piiMatch.confidence,
        matchedText: piiMatch.value,
        start: piiMatch.start,
        end: piiMatch.end,
        reason: `PII detected: ${piiMatch.type}`,
        metadata: {
          piiType: piiMatch.type,
          context: this.extractContext(text, piiMatch.start, piiMatch.end),
        },
      });
    }

    return matches;
  }

  /**
   * Apply context-aware filtering to reduce false positives
   */
  private applyContextFiltering(text: string, matches: ModerationMatch[]): ModerationMatch[] {
    const filtered: ModerationMatch[] = [];

    for (const match of matches) {
      const pattern = this.patterns.get(match.metadata?.patternId || '');
      if (!pattern || !pattern.contextRules || pattern.contextRules.length === 0) {
        filtered.push(match);
        continue;
      }

      let shouldInclude = true;

      for (const rule of pattern.contextRules) {
        const ruleMatches = this.checkContextRule(text, match, rule);

        if (ruleMatches && rule.action === 'allow') {
          shouldInclude = false;
          break;
        } else if (ruleMatches && rule.action === 'block') {
          shouldInclude = true;
          break;
        }
      }

      if (shouldInclude) {
        filtered.push(match);
      }
    }

    return filtered;
  }

  /**
   * Check if a context rule matches
   */
  private checkContextRule(
    text: string,
    match: ModerationMatch,
    rule: ContextRule
  ): boolean {
    const windowSize = rule.windowSize || 100;
    let contextText = '';

    switch (rule.type) {
      case 'surrounding':
        const surroundStart = Math.max(0, match.start - windowSize);
        const surroundEnd = Math.min(text.length, match.end + windowSize);
        contextText = text.substring(surroundStart, surroundEnd);
        break;

      case 'preceding':
        const precedeStart = Math.max(0, match.start - windowSize);
        contextText = text.substring(precedeStart, match.start);
        break;

      case 'following':
        const followEnd = Math.min(text.length, match.end + windowSize);
        contextText = text.substring(match.end, followEnd);
        break;

      case 'whitelist':
      case 'blacklist':
        // For whitelist/blacklist, check the entire surrounding context
        const start = Math.max(0, match.start - windowSize);
        const end = Math.min(text.length, match.end + windowSize);
        contextText = text.substring(start, end);
        break;
    }

    const pattern =
      typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;

    return pattern.test(contextText);
  }

  /**
   * Remove duplicate and overlapping matches
   */
  private deduplicateMatches(matches: ModerationMatch[]): ModerationMatch[] {
    if (matches.length === 0) return [];

    // Sort by position and confidence
    const sorted = [...matches].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.confidence - a.confidence;
    });

    const result: ModerationMatch[] = [];
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
   * Calculate overall severity from matches
   */
  private calculateOverallSeverity(matches: ModerationMatch[]): SeverityLevel {
    if (matches.length === 0) return SeverityLevel.LOW;

    const severityScores = {
      [SeverityLevel.LOW]: 1,
      [SeverityLevel.MEDIUM]: 2,
      [SeverityLevel.HIGH]: 3,
      [SeverityLevel.CRITICAL]: 4,
    };

    let maxScore = 0;
    for (const match of matches) {
      const score = severityScores[match.severity];
      if (score > maxScore) {
        maxScore = score;
      }
    }

    const scoreToSeverity: Record<number, SeverityLevel> = {
      1: SeverityLevel.LOW,
      2: SeverityLevel.MEDIUM,
      3: SeverityLevel.HIGH,
      4: SeverityLevel.CRITICAL,
    };

    return scoreToSeverity[maxScore] || SeverityLevel.LOW;
  }

  /**
   * Calculate overall confidence from matches
   */
  private calculateOverallConfidence(matches: ModerationMatch[]): number {
    if (matches.length === 0) return 0;

    const sum = matches.reduce((acc, match) => acc + match.confidence, 0);
    return sum / matches.length;
  }

  /**
   * Determine action based on severity and confidence
   */
  private determineAction(severity: SeverityLevel, confidence: number): ModerationAction {
    // Auto-block based on severity
    const severityOrder = [
      SeverityLevel.LOW,
      SeverityLevel.MEDIUM,
      SeverityLevel.HIGH,
      SeverityLevel.CRITICAL,
    ];
    const currentIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(this.thresholds.autoBlockSeverity);

    if (currentIndex >= thresholdIndex) {
      return ModerationAction.BLOCK;
    }

    // Block based on confidence threshold
    if (confidence >= this.thresholds.blockThreshold) {
      return ModerationAction.BLOCK;
    }

    // Warn based on confidence threshold
    if (confidence >= this.thresholds.warnThreshold) {
      return ModerationAction.WARN;
    }

    return ModerationAction.ALLOW;
  }

  /**
   * Get highest severity from matches
   */
  private getHighestSeverity(matches: ModerationMatch[]): SeverityLevel {
    if (matches.length === 0) return SeverityLevel.LOW;

    const severityOrder = [
      SeverityLevel.LOW,
      SeverityLevel.MEDIUM,
      SeverityLevel.HIGH,
      SeverityLevel.CRITICAL,
    ];

    let highest = SeverityLevel.LOW;
    let highestIndex = 0;

    for (const match of matches) {
      const index = severityOrder.indexOf(match.severity);
      if (index > highestIndex) {
        highest = match.severity;
        highestIndex = index;
      }
    }

    return highest;
  }

  /**
   * Sanitize text by replacing flagged content
   */
  private sanitizeText(text: string, matches: ModerationMatch[]): string {
    // Sort matches by position (descending) to replace from end to start
    const sorted = [...matches].sort((a, b) => b.start - a.start);

    let result = text;
    for (const match of sorted) {
      const replacement = this.config.sanitizationChar.repeat(match.matchedText.length);
      result = result.substring(0, match.start) + replacement + result.substring(match.end);
    }

    return result;
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string, start: number, end: number, windowSize = 50): string {
    const contextStart = Math.max(0, start - windowSize);
    const contextEnd = Math.min(text.length, end + windowSize);
    return text.substring(contextStart, contextEnd);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if a category is enabled
   */
  private isCategoryEnabled(category: ModerationCategory): boolean {
    return this.config.enabledCategories.includes(category);
  }

  /**
   * Check if languages are supported
   */
  private isLanguageSupported(languages?: Language[]): boolean {
    if (!languages || languages.length === 0) return true;
    return languages.some((lang) => this.config.languages.includes(lang));
  }

  /**
   * Check if a specific language is in config
   */
  private isLanguageInConfig(language: Language): boolean {
    return this.config.languages.includes(language);
  }

  /**
   * Register a custom pattern
   */
  public registerPattern(pattern: ModerationPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Unregister a pattern
   */
  public unregisterPattern(patternId: string): boolean {
    return this.patterns.delete(patternId);
  }

  /**
   * Register a custom word list
   */
  public registerWordList(wordList: WordList): void {
    const key = `${wordList.category}-${wordList.language}-${wordList.severity}`;
    this.wordLists.set(key, wordList);
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<ContentModeratorConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ContentModeratorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    if (config.thresholds) {
      this.thresholds = {
        ...this.thresholds,
        ...config.thresholds,
      };
    }

    // Reinitialize PII detector if setting changed
    if (config.enablePIIDetection !== undefined) {
      if (config.enablePIIDetection && !this.piiDetector) {
        const piiConfig: PIIDetectorConfig = {
          minConfidence: this.config.minConfidence,
          redact: false,
        };
        this.piiDetector = new PIIDetector(piiConfig);
      } else if (!config.enablePIIDetection) {
        this.piiDetector = undefined;
      }
    }
  }

  /**
   * Get statistics about patterns and word lists
   */
  public getStats(): {
    totalPatterns: number;
    totalWordLists: number;
    patternsByCategory: Partial<Record<ModerationCategory, number>>;
    wordListsByLanguage: Partial<Record<Language, number>>;
  } {
    const patternsByCategory: Partial<Record<ModerationCategory, number>> = {};
    const wordListsByLanguage: Partial<Record<Language, number>> = {};

    for (const pattern of this.patterns.values()) {
      patternsByCategory[pattern.category] = (patternsByCategory[pattern.category] || 0) + 1;
    }

    for (const wordList of this.wordLists.values()) {
      wordListsByLanguage[wordList.language] =
        (wordListsByLanguage[wordList.language] || 0) + 1;
    }

    return {
      totalPatterns: this.patterns.size,
      totalWordLists: this.wordLists.size,
      patternsByCategory,
      wordListsByLanguage,
    };
  }

  /**
   * Batch moderate multiple texts
   */
  public moderateBatch(texts: string[]): ModerationResult[] {
    return texts.map((text) => this.moderate(text));
  }
}

export default ContentModerator;
