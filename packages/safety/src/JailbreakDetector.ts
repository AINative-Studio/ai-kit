/**
 * JailbreakDetector - Detects jailbreak attempts in LLM applications
 *
 * This system identifies common jailbreak patterns and techniques used to
 * bypass AI safety guardrails through pattern matching, behavioral analysis,
 * and heuristics.
 */

/**
 * Detection result for a jailbreak check
 */
export interface JailbreakDetectionResult {
  /** Whether a jailbreak attempt was detected */
  isJailbreak: boolean
  /** Confidence score (0-1) of the detection */
  confidence: number
  /** Patterns that were detected */
  detectedPatterns: DetectedPattern[]
  /** Overall risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Detailed analysis of the input */
  analysis: {
    /** Behavioral flags detected */
    behavioralFlags: string[]
    /** Matched pattern categories */
    matchedCategories: string[]
    /** Suspicious indicators found */
    indicators: string[]
  }
}

/**
 * A detected jailbreak pattern
 */
export interface DetectedPattern {
  /** Type of jailbreak pattern */
  type: JailbreakPatternType
  /** Specific pattern that matched */
  pattern: string
  /** Confidence of this specific match (0-1) */
  confidence: number
  /** Description of why this is concerning */
  description: string
  /** Severity of this pattern */
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Types of jailbreak patterns
 */
export type JailbreakPatternType =
  | 'dan' // Do Anything Now
  | 'roleplay' // Roleplay-based jailbreaks
  | 'token_manipulation' // Token/encoding manipulation
  | 'character_bypass' // Character-based bypasses
  | 'hypothetical' // Hypothetical scenarios
  | 'indirect' // Indirect instruction patterns
  | 'prompt_injection' // Direct prompt injection
  | 'cognitive' // Cognitive manipulation
  | 'ethical_override' // Ethics override attempts
  | 'system_override' // System instruction override

/**
 * Configuration for the JailbreakDetector
 */
export interface JailbreakDetectorConfig {
  /** Minimum confidence threshold to flag as jailbreak (0-1) */
  threshold?: number
  /** Enable strict mode (lower thresholds, more sensitive) */
  strictMode?: boolean
  /** Custom patterns to add to detection */
  customPatterns?: JailbreakPattern[]
  /** Pattern types to enable (all enabled by default) */
  enabledPatternTypes?: JailbreakPatternType[]
  /** Maximum input length to analyze (longer inputs truncated) */
  maxInputLength?: number
  /** Enable behavioral analysis */
  enableBehavioralAnalysis?: boolean
  /** Enable heuristic detection */
  enableHeuristicDetection?: boolean
}

/**
 * A jailbreak pattern definition
 */
export interface JailbreakPattern {
  /** Pattern type */
  type: JailbreakPatternType
  /** Regex pattern or string to match */
  pattern: RegExp | string
  /** Base confidence for this pattern (0-1) */
  confidence: number
  /** Description of the pattern */
  description: string
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Whether pattern is case-sensitive */
  caseSensitive?: boolean
}

/**
 * JailbreakDetector - Main class for detecting jailbreak attempts
 */
export class JailbreakDetector {
  private config: Required<JailbreakDetectorConfig>
  private patterns: JailbreakPattern[]

  constructor(config: JailbreakDetectorConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 0.7,
      strictMode: config.strictMode ?? false,
      customPatterns: config.customPatterns ?? [],
      enabledPatternTypes: config.enabledPatternTypes ?? [
        'dan',
        'roleplay',
        'token_manipulation',
        'character_bypass',
        'hypothetical',
        'indirect',
        'prompt_injection',
        'cognitive',
        'ethical_override',
        'system_override',
      ],
      maxInputLength: config.maxInputLength ?? 10000,
      enableBehavioralAnalysis: config.enableBehavioralAnalysis ?? true,
      enableHeuristicDetection: config.enableHeuristicDetection ?? true,
    }

    // Adjust threshold for strict mode
    if (this.config.strictMode && !config.threshold) {
      this.config.threshold = 0.5
    }

    this.patterns = this.initializePatterns()
  }

  /**
   * Detect jailbreak attempts in the input text
   */
  detect(input: string): JailbreakDetectionResult {
    // Truncate long inputs
    const truncatedInput = input.slice(0, this.config.maxInputLength)

    // Initialize result
    const detectedPatterns: DetectedPattern[] = []
    const behavioralFlags: string[] = []
    const matchedCategories = new Set<string>()
    const indicators: string[] = []

    // Pattern matching
    for (const pattern of this.patterns) {
      const matches = this.matchPattern(truncatedInput, pattern)
      if (matches) {
        detectedPatterns.push({
          type: pattern.type,
          pattern: pattern.pattern.toString(),
          confidence: pattern.confidence,
          description: pattern.description,
          severity: pattern.severity,
        })
        matchedCategories.add(pattern.type)
      }
    }

    // Behavioral analysis
    if (this.config.enableBehavioralAnalysis) {
      const behavioral = this.analyzeBehavior(truncatedInput)
      behavioralFlags.push(...behavioral.flags)
      indicators.push(...behavioral.indicators)
    }

    // Heuristic detection
    if (this.config.enableHeuristicDetection) {
      const heuristic = this.applyHeuristics(truncatedInput)
      if (heuristic.detected) {
        detectedPatterns.push(...heuristic.patterns)
        indicators.push(...heuristic.indicators)
      }
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      detectedPatterns,
      behavioralFlags,
      indicators
    )

    // Determine risk level
    const riskLevel = this.determineRiskLevel(confidence, detectedPatterns)

    // Check if this is a jailbreak
    const isJailbreak = confidence >= this.config.threshold

    return {
      isJailbreak,
      confidence,
      detectedPatterns,
      riskLevel,
      analysis: {
        behavioralFlags,
        matchedCategories: Array.from(matchedCategories),
        indicators,
      },
    }
  }

  /**
   * Batch detect jailbreak attempts
   */
  detectBatch(inputs: string[]): JailbreakDetectionResult[] {
    return inputs.map((input) => this.detect(input))
  }

  /**
   * Get information about available patterns
   */
  getPatternInfo(): {
    total: number
    byType: Record<string, number>
    patterns: JailbreakPattern[]
  } {
    const byType: Record<string, number> = {}

    for (const pattern of this.patterns) {
      byType[pattern.type] = (byType[pattern.type] || 0) + 1
    }

    return {
      total: this.patterns.length,
      byType,
      patterns: this.patterns,
    }
  }

  /**
   * Initialize the pattern library
   */
  private initializePatterns(): JailbreakPattern[] {
    const basePatterns: JailbreakPattern[] = [
      // DAN (Do Anything Now) patterns
      {
        type: 'dan',
        pattern: /\b(DAN|do anything now)\b/i,
        confidence: 0.95,
        description: 'Classic DAN jailbreak pattern',
        severity: 'critical',
      },
      {
        type: 'dan',
        pattern: /pretend (you are|to be|you're) (not bound|unrestricted|without (limits|restrictions))/i,
        confidence: 0.85,
        description: 'DAN-style unrestricted mode request',
        severity: 'high',
      },
      {
        type: 'dan',
        pattern: /from now on.*?(no (restrictions|limits|rules)|ignore (rules|guidelines|policies))/i,
        confidence: 0.9,
        description: 'DAN mode activation attempt',
        severity: 'critical',
      },

      // Roleplay-based jailbreaks
      {
        type: 'roleplay',
        pattern: /act as (if|though).*?(evil|unethical|illegal|harmful)/i,
        confidence: 0.85,
        description: 'Roleplay request with harmful intent',
        severity: 'high',
      },
      {
        type: 'roleplay',
        pattern: /you (are|will be).*?(villain|criminal|hacker|terrorist)/i,
        confidence: 0.9,
        description: 'Malicious roleplay assignment',
        severity: 'critical',
      },
      {
        type: 'roleplay',
        pattern: /in (this|the) (story|scenario|game).*?(no (ethics|morals|rules)|anything goes)/i,
        confidence: 0.8,
        description: 'Roleplay scenario with ethics bypass',
        severity: 'high',
      },
      {
        type: 'roleplay',
        pattern: /character (that|who).*?(ignores|bypasses|doesn't follow).*(safety|ethics|guidelines)/i,
        confidence: 0.85,
        description: 'Character-based safety bypass',
        severity: 'high',
      },

      // Token manipulation
      {
        type: 'token_manipulation',
        pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
        confidence: 0.95,
        description: 'Special token injection attempt',
        severity: 'critical',
      },
      {
        type: 'token_manipulation',
        pattern: /###\s*(Human|Assistant|System|Instruction):/i,
        confidence: 0.85,
        description: 'Role token manipulation',
        severity: 'high',
      },
      {
        type: 'token_manipulation',
        pattern: /<s>|<\/s>|\[BOS\]|\[EOS\]/i,
        confidence: 0.9,
        description: 'Special sequence token injection',
        severity: 'high',
      },

      // Character-based bypasses
      {
        type: 'character_bypass',
        pattern: /[a-z][\u0300-\u036f]{3,}|[a-z](\s[a-z]){5,}/i,
        confidence: 0.75,
        description: 'Character obfuscation detected',
        severity: 'medium',
      },
      {
        type: 'character_bypass',
        pattern: /[\uFF01-\uFF5E]{10,}/, // Fullwidth characters
        confidence: 0.8,
        description: 'Fullwidth character bypass attempt',
        severity: 'medium',
      },
      {
        type: 'character_bypass',
        pattern: /\ud83d[\ude00-\ude4f]{5,}/, // Excessive emojis
        confidence: 0.7,
        description: 'Excessive emoji usage (possible obfuscation)',
        severity: 'low',
      },

      // Hypothetical scenarios
      {
        type: 'hypothetical',
        pattern: /hypothetically.*?(how to|instructions for).*(harm|illegal|unethical)/i,
        confidence: 0.85,
        description: 'Hypothetical harmful scenario',
        severity: 'high',
      },
      {
        type: 'hypothetical',
        pattern: /(imagine|suppose|what if).*?(rules didn't apply|no consequences|not illegal)/i,
        confidence: 0.8,
        description: 'Hypothetical ethics bypass',
        severity: 'medium',
      },
      {
        type: 'hypothetical',
        pattern: /in a (fictional|hypothetical) (world|universe).*?(no (laws|rules|ethics))/i,
        confidence: 0.85,
        description: 'Fictional world ethics bypass',
        severity: 'high',
      },

      // Indirect instruction patterns
      {
        type: 'indirect',
        pattern: /ignore (all )?(previous|above|prior) (instructions|prompts|rules)/i,
        confidence: 0.95,
        description: 'Direct instruction override attempt',
        severity: 'critical',
      },
      {
        type: 'indirect',
        pattern: /disregard (your|the) (programming|instructions|guidelines)/i,
        confidence: 0.9,
        description: 'Programming override attempt',
        severity: 'critical',
      },
      {
        type: 'indirect',
        pattern: /forget (everything|all|what).*?(you were told|your training)/i,
        confidence: 0.85,
        description: 'Memory/training override attempt',
        severity: 'high',
      },

      // Prompt injection
      {
        type: 'prompt_injection',
        pattern: /---\s*END\s*(SYSTEM|INSTRUCTIONS|PROMPT)/i,
        confidence: 0.95,
        description: 'System prompt termination attempt',
        severity: 'critical',
      },
      {
        type: 'prompt_injection',
        pattern: /new (system )?instructions?:/i,
        confidence: 0.9,
        description: 'System instruction injection',
        severity: 'critical',
      },
      {
        type: 'prompt_injection',
        pattern: /\[\s*SYSTEM\s*\].*?override/i,
        confidence: 0.95,
        description: 'System mode override injection',
        severity: 'critical',
      },

      // Cognitive manipulation
      {
        type: 'cognitive',
        pattern: /you (must|have to|are required to) (obey|follow|comply)/i,
        confidence: 0.8,
        description: 'Authority exploitation attempt',
        severity: 'medium',
      },
      {
        type: 'cognitive',
        pattern: /(everyone|all users) (get|gets|is allowed).*(harmful|illegal|unethical)/i,
        confidence: 0.85,
        description: 'Social proof manipulation',
        severity: 'high',
      },
      {
        type: 'cognitive',
        pattern: /it's (okay|fine|safe|legal) (because|since|as)/i,
        confidence: 0.7,
        description: 'Rationalization attempt',
        severity: 'low',
      },

      // Ethical override
      {
        type: 'ethical_override',
        pattern: /(ethics|morals|safety).*?(don't (apply|matter)|are optional)/i,
        confidence: 0.9,
        description: 'Ethics dismissal',
        severity: 'critical',
      },
      {
        type: 'ethical_override',
        pattern: /disable (your )?(safety|ethical|moral) (guidelines|filters|restrictions)/i,
        confidence: 0.95,
        description: 'Safety system disable request',
        severity: 'critical',
      },
      {
        type: 'ethical_override',
        pattern: /override (safety|ethical) (protocols|guidelines)/i,
        confidence: 0.95,
        description: 'Safety protocol override',
        severity: 'critical',
      },

      // System override
      {
        type: 'system_override',
        pattern: /developer mode|god mode|admin mode/i,
        confidence: 0.9,
        description: 'Special mode activation attempt',
        severity: 'critical',
      },
      {
        type: 'system_override',
        pattern: /\[DEBUG\]|\[DEV\]|\[ADMIN\]/i,
        confidence: 0.85,
        description: 'Debug/admin mode injection',
        severity: 'high',
      },
      {
        type: 'system_override',
        pattern: /sudo|root access|elevated privileges/i,
        confidence: 0.8,
        description: 'Privilege escalation attempt',
        severity: 'high',
      },
    ]

    // Filter by enabled pattern types
    const enabledPatterns = basePatterns.filter((p) =>
      this.config.enabledPatternTypes.includes(p.type)
    )

    // Add custom patterns
    return [...enabledPatterns, ...this.config.customPatterns]
  }

  /**
   * Match a pattern against input
   */
  private matchPattern(input: string, pattern: JailbreakPattern): boolean {
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(input)
    } else {
      const searchStr = pattern.caseSensitive ? input : input.toLowerCase()
      const patternStr = pattern.caseSensitive ? pattern.pattern : pattern.pattern.toLowerCase()
      return searchStr.includes(patternStr)
    }
  }

  /**
   * Analyze behavioral characteristics
   */
  private analyzeBehavior(input: string): {
    flags: string[]
    indicators: string[]
  } {
    const flags: string[] = []
    const indicators: string[] = []

    // Length analysis
    if (input.length > 5000) {
      flags.push('excessive_length')
      indicators.push('Input length exceeds 5000 characters')
    }

    // Repetition detection
    const words = input.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    const repetitionRatio = 1 - uniqueWords.size / words.length
    if (repetitionRatio > 0.3) {
      flags.push('high_repetition')
      indicators.push('High word repetition detected (possible pattern flooding)')
    }

    // Excessive punctuation
    const punctuationCount = (input.match(/[!?]{2,}/g) || []).length
    if (punctuationCount > 5) {
      flags.push('excessive_punctuation')
      indicators.push('Excessive punctuation detected')
    }

    // ALL CAPS detection
    const capsWords = input.match(/\b[A-Z]{3,}\b/g) || []
    if (capsWords.length > 10) {
      flags.push('excessive_caps')
      indicators.push('Excessive capital letters (possible emphasis manipulation)')
    }

    // Multiple language mixing (can indicate obfuscation)
    const hasMultipleScripts =
      /[a-zA-Z]/.test(input) &&
      /[\u4e00-\u9fff]/.test(input) &&
      /[\u0400-\u04ff]/.test(input)
    if (hasMultipleScripts) {
      flags.push('mixed_scripts')
      indicators.push('Multiple writing systems detected')
    }

    // Bracketed content analysis
    const bracketedSections = input.match(/\[.*?\]/g) || []
    if (bracketedSections.length > 10) {
      flags.push('excessive_brackets')
      indicators.push('Excessive bracketed sections (possible instruction injection)')
    }

    // Instruction-like keywords
    const instructionKeywords = [
      'ignore',
      'disregard',
      'forget',
      'override',
      'bypass',
      'disable',
      'pretend',
      'act as',
      'you are now',
      'new instructions',
    ]
    const keywordCount = instructionKeywords.filter((keyword) =>
      input.toLowerCase().includes(keyword)
    ).length
    if (keywordCount >= 3) {
      flags.push('instruction_keywords')
      indicators.push('Multiple instruction-override keywords detected')
    }

    return { flags, indicators }
  }

  /**
   * Apply heuristic detection rules
   */
  private applyHeuristics(input: string): {
    detected: boolean
    patterns: DetectedPattern[]
    indicators: string[]
  } {
    const patterns: DetectedPattern[] = []
    const indicators: string[] = []

    // Check for concatenated suspicious phrases
    const suspiciousPhrases = [
      'ignore all previous',
      'disregard your programming',
      'pretend you have no',
      'act as if you',
      'you are now free',
      'no ethical constraints',
      'without any restrictions',
    ]

    for (const phrase of suspiciousPhrases) {
      if (input.toLowerCase().includes(phrase)) {
        patterns.push({
          type: 'indirect',
          pattern: phrase,
          confidence: 0.85,
          description: `Heuristic match: "${phrase}"`,
          severity: 'high',
        })
        indicators.push(`Suspicious phrase detected: "${phrase}"`)
      }
    }

    // Check for role reversal attempts
    if (
      /you are (the user|human|person)/.test(input.toLowerCase()) &&
      /(i am|i'm) (the )?(assistant|ai|bot)/.test(input.toLowerCase())
    ) {
      patterns.push({
        type: 'cognitive',
        pattern: 'role_reversal',
        confidence: 0.9,
        description: 'Role reversal attempt detected',
        severity: 'high',
      })
      indicators.push('Role reversal pattern detected')
    }

    // Check for base64/encoding patterns (common in bypasses)
    if (/[A-Za-z0-9+/]{50,}={0,2}/.test(input)) {
      patterns.push({
        type: 'character_bypass',
        pattern: 'base64_encoding',
        confidence: 0.75,
        description: 'Possible encoded content (base64-like pattern)',
        severity: 'medium',
      })
      indicators.push('Base64-like encoding detected')
    }

    // Check for system delimiter patterns
    const systemDelimiters = ['---', '===', '###', '\\*\\*\\*']
    const delimiterCount = systemDelimiters.reduce(
      (count, delim) => count + (input.match(new RegExp(delim + '{3,}', 'g')) || []).length,
      0
    )
    if (delimiterCount >= 3) {
      patterns.push({
        type: 'prompt_injection',
        pattern: 'delimiter_injection',
        confidence: 0.8,
        description: 'Multiple system delimiters detected',
        severity: 'high',
      })
      indicators.push('Excessive system-like delimiters detected')
    }

    return {
      detected: patterns.length > 0,
      patterns,
      indicators,
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    detectedPatterns: DetectedPattern[],
    behavioralFlags: string[],
    indicators: string[]
  ): number {
    if (detectedPatterns.length === 0 && behavioralFlags.length === 0) {
      return 0
    }

    // Base confidence from patterns
    let maxPatternConfidence = 0
    let avgPatternConfidence = 0

    if (detectedPatterns.length > 0) {
      const confidences = detectedPatterns.map((p) => p.confidence)
      maxPatternConfidence = Math.max(...confidences)
      avgPatternConfidence =
        confidences.reduce((a, b) => a + b, 0) / confidences.length
    }

    // Boost from behavioral analysis
    const behavioralBoost = Math.min(behavioralFlags.length * 0.05, 0.2)

    // Boost from additional indicators
    const indicatorBoost = Math.min(indicators.length * 0.03, 0.15)

    // Multiple pattern boost
    const multiPatternBoost = detectedPatterns.length > 1 ? 0.1 : 0

    // Calculate final confidence (weighted combination)
    const confidence =
      maxPatternConfidence * 0.6 +
      avgPatternConfidence * 0.2 +
      behavioralBoost +
      indicatorBoost +
      multiPatternBoost

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Determine risk level based on confidence and patterns
   */
  private determineRiskLevel(
    confidence: number,
    detectedPatterns: DetectedPattern[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Check for critical patterns
    const hasCritical = detectedPatterns.some((p) => p.severity === 'critical')
    if (hasCritical && confidence >= 0.8) {
      return 'critical'
    }

    // Risk based on confidence
    if (confidence >= 0.9) {
      return 'critical'
    } else if (confidence >= 0.75) {
      return 'high'
    } else if (confidence >= 0.5) {
      return 'medium'
    } else {
      return 'low'
    }
  }
}
