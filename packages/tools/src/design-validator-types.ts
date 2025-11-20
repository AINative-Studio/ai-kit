/**
 * Design Validator Types for AI Kit
 *
 * Comprehensive type definitions for AI-powered design validation
 * covering accessibility, branding, UX patterns, performance, and responsive design.
 */

/**
 * Severity levels for validation issues
 */
export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Validation categories
 */
export enum ValidationCategory {
  ACCESSIBILITY = 'accessibility',
  BRANDING = 'branding',
  UX_PATTERNS = 'ux_patterns',
  PERFORMANCE = 'performance',
  RESPONSIVE = 'responsive',
  TYPOGRAPHY = 'typography',
  COLOR = 'color',
  SPACING = 'spacing'
}

/**
 * WCAG compliance levels
 */
export enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA'
}

/**
 * Color representation
 */
export interface Color {
  hex?: string
  rgb?: { r: number; g: number; b: number; a?: number }
  hsl?: { h: number; s: number; l: number; a?: number }
  name?: string
}

/**
 * Design element position and dimensions
 */
export interface ElementBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Typography definition
 */
export interface Typography {
  fontFamily: string
  fontSize: number
  fontWeight?: number | string
  lineHeight?: number | string
  letterSpacing?: number | string
  textTransform?: string
  fontStyle?: string
}

/**
 * Spacing system
 */
export interface SpacingSystem {
  unit: number
  scale: number[]
  customValues?: { [key: string]: number }
}

/**
 * Color palette definition
 */
export interface ColorPalette {
  primary: Color[]
  secondary?: Color[]
  accent?: Color[]
  neutral?: Color[]
  semantic?: {
    success?: Color[]
    warning?: Color[]
    error?: Color[]
    info?: Color[]
  }
}

/**
 * Brand guide configuration
 */
export interface BrandGuide {
  name: string
  version?: string
  colors: ColorPalette
  typography: {
    headings: Typography[]
    body: Typography[]
    captions?: Typography[]
    custom?: { [key: string]: Typography }
  }
  spacing: SpacingSystem
  logo?: {
    variations: string[]
    minSize: { width: number; height: number }
    clearSpace: number
    allowedBackgrounds?: Color[]
  }
  iconography?: {
    style: string
    sizes: number[]
    strokeWidth?: number
  }
  borderRadius?: number[]
  shadows?: string[]
  breakpoints?: { [key: string]: number }
}

/**
 * Design element (component, screen, etc.)
 */
export interface DesignElement {
  id: string
  type: string
  name?: string
  bounds?: ElementBounds
  backgroundColor?: Color
  textColor?: Color
  typography?: Typography
  children?: DesignElement[]
  properties?: { [key: string]: any }
  styles?: { [key: string]: any }
  url?: string
  alt?: string
  ariaLabel?: string
  role?: string
  focusable?: boolean
  interactive?: boolean
}

/**
 * Full design structure
 */
export interface Design {
  id: string
  name: string
  type: 'component' | 'screen' | 'page' | 'layout'
  version?: string
  elements: DesignElement[]
  viewport?: {
    width: number
    height: number
  }
  metadata?: {
    platform?: string
    theme?: string
    [key: string]: any
  }
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string
  name: string
  description: string
  category: ValidationCategory
  severity: Severity
  wcagCriteria?: string[]
  enabled: boolean
  validate: (element: DesignElement, context: ValidationContext) => ValidationIssue[]
  autoFix?: (element: DesignElement, issue: ValidationIssue) => AutoFixSuggestion | null
}

/**
 * Validation context for rules
 */
export interface ValidationContext {
  design: Design
  brandGuide?: BrandGuide
  parentElement?: DesignElement
  siblingElements?: DesignElement[]
  wcagLevel: WCAGLevel
  targetPlatform?: string
  viewport?: { width: number; height: number }
  theme?: 'light' | 'dark'
}

/**
 * Validation issue found
 */
export interface ValidationIssue {
  id: string
  ruleId: string
  category: ValidationCategory
  severity: Severity
  message: string
  description?: string
  elementId?: string
  elementPath?: string
  wcagCriteria?: string[]
  location?: ElementBounds
  actualValue?: any
  expectedValue?: any
  impact?: 'critical' | 'serious' | 'moderate' | 'minor'
  helpUrl?: string
  suggestions?: string[]
}

/**
 * Auto-fix suggestion
 */
export interface AutoFixSuggestion {
  issueId: string
  description: string
  changes: {
    property: string
    currentValue: any
    suggestedValue: any
    reasoning: string
  }[]
  confidence: number
  requiresManualReview: boolean
}

/**
 * Validation result
 */
export interface ValidationResult {
  design: Design
  summary: {
    totalIssues: number
    errorCount: number
    warningCount: number
    infoCount: number
    passedRules: number
    failedRules: number
    wcagCompliance: {
      level: WCAGLevel
      compliant: boolean
      criteria: {
        [criteriaId: string]: {
          passed: boolean
          issues: number
        }
      }
    }
  }
  issues: ValidationIssue[]
  autoFixSuggestions?: AutoFixSuggestion[]
  validatedAt: Date
  duration: number
}

/**
 * Accessibility validation options
 */
export interface AccessibilityOptions {
  wcagLevel: WCAGLevel
  checkContrast: boolean
  checkFocusIndicators: boolean
  checkAltText: boolean
  checkAriaLabels: boolean
  checkKeyboardNavigation: boolean
  checkTextSize: boolean
  checkTouchTargets: boolean
  contrastRatios?: {
    normalText: number
    largeText: number
    uiComponents: number
  }
  minTextSize?: number
  minTouchTargetSize?: number
}

/**
 * Branding validation options
 */
export interface BrandingOptions {
  strictMode: boolean
  checkColorUsage: boolean
  checkTypography: boolean
  checkLogoUsage: boolean
  checkSpacing: boolean
  colorTolerance?: number
  typographyTolerance?: number
}

/**
 * UX validation options
 */
export interface UXOptions {
  checkTouchTargets: boolean
  checkSpacing: boolean
  checkHierarchy: boolean
  checkConsistency: boolean
  minTouchTargetSize?: number
  recommendedSpacing?: number[]
}

/**
 * Performance validation options
 */
export interface PerformanceOptions {
  checkImageOptimization: boolean
  checkAssetSize: boolean
  maxImageSize?: number
  maxAssetSize?: number
  recommendedFormats?: string[]
}

/**
 * Responsive validation options
 */
export interface ResponsiveOptions {
  breakpoints: { [key: string]: number }
  checkMobileFirst: boolean
  checkFlexibility: boolean
  checkOverflow: boolean
  minViewportWidth?: number
  maxViewportWidth?: number
}

/**
 * Validator configuration
 */
export interface ValidatorConfig {
  accessibility?: AccessibilityOptions
  branding?: BrandingOptions
  ux?: UXOptions
  performance?: PerformanceOptions
  responsive?: ResponsiveOptions
  customRules?: ValidationRule[]
  ignoreRules?: string[]
  brandGuide?: BrandGuide
}

/**
 * AI recommendation engine interface
 */
export interface RecommendationEngine {
  analyzeIssues: (issues: ValidationIssue[]) => AIRecommendation[]
  suggestImprovements: (design: Design, context: ValidationContext) => AIRecommendation[]
  prioritizeIssues: (issues: ValidationIssue[]) => ValidationIssue[]
  generateFixStrategies: (issues: ValidationIssue[]) => FixStrategy[]
}

/**
 * AI-powered recommendation
 */
export interface AIRecommendation {
  id: string
  type: 'fix' | 'improvement' | 'insight'
  title: string
  description: string
  rationale: string
  relatedIssues?: string[]
  impact: {
    accessibility?: number
    ux?: number
    branding?: number
    performance?: number
  }
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedEffort: string
    steps: string[]
  }
  examples?: {
    before?: string
    after?: string
    code?: string
  }
  priority: number
  confidence: number
}

/**
 * Fix strategy for multiple issues
 */
export interface FixStrategy {
  id: string
  name: string
  description: string
  targetIssues: string[]
  approach: string
  benefits: string[]
  tradeoffs?: string[]
  steps: {
    order: number
    action: string
    affectedElements: string[]
    changes: any
  }[]
  estimatedImpact: {
    issuesResolved: number
    issuesMitigated: number
    newIssuesIntroduced?: number
  }
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  totalDesigns: number
  results: ValidationResult[]
  aggregatedSummary: {
    totalIssues: number
    errorCount: number
    warningCount: number
    infoCount: number
    averageIssuesPerDesign: number
    mostCommonIssues: {
      ruleId: string
      count: number
      severity: Severity
    }[]
  }
  completedAt: Date
}

/**
 * Validation report configuration
 */
export interface ReportConfig {
  format: 'json' | 'html' | 'markdown' | 'pdf'
  includeScreenshots?: boolean
  includeAutoFixes?: boolean
  includeRecommendations?: boolean
  groupBy?: 'severity' | 'category' | 'element'
  sortBy?: 'severity' | 'impact' | 'location'
  filterSeverity?: Severity[]
  filterCategories?: ValidationCategory[]
}

/**
 * Color contrast result
 */
export interface ContrastResult {
  ratio: number
  passes: {
    normalAA: boolean
    normalAAA: boolean
    largeAA: boolean
    largeAAA: boolean
    uiComponent: boolean
  }
  foreground: Color
  background: Color
}

/**
 * Touch target validation result
 */
export interface TouchTargetResult {
  elementId: string
  size: { width: number; height: number }
  meetsMinimum: boolean
  recommended: { width: number; height: number }
  adjacent: {
    elementId: string
    distance: number
    tooClose: boolean
  }[]
}

/**
 * Typography validation result
 */
export interface TypographyResult {
  elementId: string
  typography: Typography
  matchesBrandGuide: boolean
  deviations?: {
    property: string
    expected: any
    actual: any
    tolerance: number
  }[]
  recommendations?: string[]
}

/**
 * Spacing validation result
 */
export interface SpacingResult {
  elementId: string
  spacing: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  followsSystem: boolean
  deviations?: {
    side: string
    value: number
    nearestSystemValue: number
    difference: number
  }[]
}

/**
 * Image optimization result
 */
export interface ImageOptimizationResult {
  elementId: string
  url: string
  currentSize: number
  currentFormat: string
  optimized: boolean
  recommendations?: {
    suggestedFormat: string
    estimatedSize: number
    savings: number
    compressionLevel?: string
    responsive?: boolean
  }
}
