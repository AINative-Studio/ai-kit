/**
 * Design Validator for AI Kit
 *
 * AI-powered design validation for accessibility, branding, UX patterns,
 * performance, and responsive design best practices.
 *
 * Features:
 * - WCAG 2.1 AA/AAA compliance checking
 * - Brand consistency validation
 * - UX pattern analysis
 * - Performance optimization recommendations
 * - Responsive design validation
 * - AI-powered recommendations and auto-fix suggestions
 */

import { z } from 'zod'
import {
  Design,
  DesignElement,
  ValidationResult,
  ValidationIssue,
  ValidationRule,
  ValidationCategory,
  Severity,
  WCAGLevel,
  BrandGuide,
  ValidatorConfig,
  AccessibilityOptions,
  BrandingOptions,
  UXOptions,
  PerformanceOptions,
  ResponsiveOptions,
  ValidationContext,
  AutoFixSuggestion,
  AIRecommendation,
  RecommendationEngine,
  BatchValidationResult,
  ReportConfig,
  ContrastResult,
  TouchTargetResult,
  TypographyResult,
  SpacingResult,
  ImageOptimizationResult,
  Color,
  FixStrategy
} from './design-validator-types'

/**
 * Zod schema for design validation input
 */
export const DesignValidationSchema = z.object({
  design: z.any(),
  config: z.object({
    accessibility: z.any().optional(),
    branding: z.any().optional(),
    ux: z.any().optional(),
    performance: z.any().optional(),
    responsive: z.any().optional(),
    customRules: z.array(z.any()).optional(),
    ignoreRules: z.array(z.string()).optional(),
    brandGuide: z.any().optional()
  }).optional()
})

/**
 * Default WCAG contrast ratios
 */
export const WCAG_CONTRAST_RATIOS = {
  AA: {
    normalText: 4.5,
    largeText: 3.0,
    uiComponents: 3.0
  },
  AAA: {
    normalText: 7.0,
    largeText: 4.5,
    uiComponents: 3.0
  }
}

/**
 * Default accessibility options
 */
export const DEFAULT_ACCESSIBILITY_OPTIONS: AccessibilityOptions = {
  wcagLevel: WCAGLevel.AA,
  checkContrast: true,
  checkFocusIndicators: true,
  checkAltText: true,
  checkAriaLabels: true,
  checkKeyboardNavigation: true,
  checkTextSize: true,
  checkTouchTargets: true,
  contrastRatios: WCAG_CONTRAST_RATIOS.AA,
  minTextSize: 12,
  minTouchTargetSize: 44
}

/**
 * Default branding options
 */
export const DEFAULT_BRANDING_OPTIONS: BrandingOptions = {
  strictMode: false,
  checkColorUsage: true,
  checkTypography: true,
  checkLogoUsage: true,
  checkSpacing: true,
  colorTolerance: 5,
  typographyTolerance: 2
}

/**
 * Default UX options
 */
export const DEFAULT_UX_OPTIONS: UXOptions = {
  checkTouchTargets: true,
  checkSpacing: true,
  checkHierarchy: true,
  checkConsistency: true,
  minTouchTargetSize: 44,
  recommendedSpacing: [4, 8, 12, 16, 24, 32, 48, 64]
}

/**
 * Default performance options
 */
export const DEFAULT_PERFORMANCE_OPTIONS: PerformanceOptions = {
  checkImageOptimization: true,
  checkAssetSize: true,
  maxImageSize: 500 * 1024, // 500KB
  maxAssetSize: 200 * 1024, // 200KB
  recommendedFormats: ['webp', 'avif', 'svg']
}

/**
 * Default responsive options
 */
export const DEFAULT_RESPONSIVE_OPTIONS: ResponsiveOptions = {
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  },
  checkMobileFirst: true,
  checkFlexibility: true,
  checkOverflow: true,
  minViewportWidth: 320,
  maxViewportWidth: 1920
}

/**
 * DesignValidator class
 * Main class for validating designs against accessibility, branding, and UX standards
 */
export class DesignValidator {
  private config: ValidatorConfig
  private rules: ValidationRule[]
  private recommendationEngine: RecommendationEngine

  constructor(config?: ValidatorConfig) {
    this.config = {
      accessibility: { ...DEFAULT_ACCESSIBILITY_OPTIONS, ...config?.accessibility },
      branding: { ...DEFAULT_BRANDING_OPTIONS, ...config?.branding },
      ux: { ...DEFAULT_UX_OPTIONS, ...config?.ux },
      performance: { ...DEFAULT_PERFORMANCE_OPTIONS, ...config?.performance },
      responsive: { ...DEFAULT_RESPONSIVE_OPTIONS, ...config?.responsive },
      customRules: config?.customRules || [],
      ignoreRules: config?.ignoreRules || [],
      brandGuide: config?.brandGuide
    }

    this.rules = this.initializeRules()
    this.recommendationEngine = new AIRecommendationEngine()
  }

  /**
   * Initialize built-in validation rules
   */
  private initializeRules(): ValidationRule[] {
    return [
      ...this.createAccessibilityRules(),
      ...this.createBrandingRules(),
      ...this.createUXRules(),
      ...this.createPerformanceRules(),
      ...this.createResponsiveRules(),
      ...(this.config.customRules || [])
    ].filter(rule => !this.config.ignoreRules?.includes(rule.id))
  }

  /**
   * Create accessibility validation rules
   */
  private createAccessibilityRules(): ValidationRule[] {
    return [
      {
        id: 'a11y-color-contrast',
        name: 'Color Contrast',
        description: 'Ensure text has sufficient contrast against background',
        category: ValidationCategory.ACCESSIBILITY,
        severity: Severity.ERROR,
        wcagCriteria: ['1.4.3', '1.4.6'],
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (element.textColor && element.backgroundColor) {
            const contrast = this.calculateContrast(element.textColor, element.backgroundColor)
            const minRatio = this.getMinContrastRatio(element, context)

            if (contrast.ratio < minRatio) {
              issues.push({
                id: `${element.id}-contrast`,
                ruleId: 'a11y-color-contrast',
                category: ValidationCategory.ACCESSIBILITY,
                severity: Severity.ERROR,
                message: `Insufficient color contrast ratio: ${contrast.ratio.toFixed(2)}:1`,
                description: `The contrast ratio should be at least ${minRatio}:1 for WCAG ${context.wcagLevel} compliance`,
                elementId: element.id,
                wcagCriteria: ['1.4.3'],
                actualValue: contrast.ratio,
                expectedValue: minRatio,
                impact: 'serious',
                suggestions: [
                  'Darken the text color',
                  'Lighten the background color',
                  'Use a different color combination'
                ]
              })
            }
          }

          return issues
        },
        autoFix: (element, issue) => {
          if (!element.textColor || !element.backgroundColor) return null

          const suggestedColor = this.suggestContrastColor(
            element.textColor,
            element.backgroundColor,
            issue.expectedValue as number
          )

          return {
            issueId: issue.id,
            description: 'Adjust text color to meet contrast requirements',
            changes: [{
              property: 'textColor',
              currentValue: element.textColor,
              suggestedValue: suggestedColor,
              reasoning: 'Increases contrast ratio to meet WCAG standards'
            }],
            confidence: 0.9,
            requiresManualReview: false
          }
        }
      },
      {
        id: 'a11y-alt-text',
        name: 'Alt Text',
        description: 'Ensure images have descriptive alt text',
        category: ValidationCategory.ACCESSIBILITY,
        severity: Severity.ERROR,
        wcagCriteria: ['1.1.1'],
        enabled: true,
        validate: (element) => {
          const issues: ValidationIssue[] = []

          if (element.type === 'image' && !element.alt && !element.ariaLabel) {
            issues.push({
              id: `${element.id}-alt-text`,
              ruleId: 'a11y-alt-text',
              category: ValidationCategory.ACCESSIBILITY,
              severity: Severity.ERROR,
              message: 'Image is missing alt text',
              description: 'All images must have descriptive alternative text',
              elementId: element.id,
              wcagCriteria: ['1.1.1'],
              impact: 'critical',
              suggestions: [
                'Add alt attribute describing the image',
                'Add aria-label if image is decorative',
                'Use aria-hidden="true" for purely decorative images'
              ]
            })
          }

          return issues
        }
      },
      {
        id: 'a11y-touch-target',
        name: 'Touch Target Size',
        description: 'Ensure interactive elements are large enough to tap',
        category: ValidationCategory.ACCESSIBILITY,
        severity: Severity.WARNING,
        wcagCriteria: ['2.5.5'],
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []
          const minSize = this.config.accessibility?.minTouchTargetSize || 44

          if (element.interactive && element.bounds) {
            const { width, height } = element.bounds

            if (width < minSize || height < minSize) {
              issues.push({
                id: `${element.id}-touch-target`,
                ruleId: 'a11y-touch-target',
                category: ValidationCategory.ACCESSIBILITY,
                severity: Severity.WARNING,
                message: `Touch target too small: ${width}x${height}px`,
                description: `Interactive elements should be at least ${minSize}x${minSize}px`,
                elementId: element.id,
                wcagCriteria: ['2.5.5'],
                actualValue: { width, height },
                expectedValue: { width: minSize, height: minSize },
                impact: 'moderate',
                suggestions: [
                  `Increase width to at least ${minSize}px`,
                  `Increase height to at least ${minSize}px`,
                  'Add padding around the element'
                ]
              })
            }
          }

          return issues
        }
      },
      {
        id: 'a11y-focus-indicator',
        name: 'Focus Indicator',
        description: 'Ensure interactive elements have visible focus indicators',
        category: ValidationCategory.ACCESSIBILITY,
        severity: Severity.ERROR,
        wcagCriteria: ['2.4.7'],
        enabled: true,
        validate: (element) => {
          const issues: ValidationIssue[] = []

          if (element.focusable && !element.styles?.outline && !element.styles?.boxShadow) {
            issues.push({
              id: `${element.id}-focus-indicator`,
              ruleId: 'a11y-focus-indicator',
              category: ValidationCategory.ACCESSIBILITY,
              severity: Severity.ERROR,
              message: 'Interactive element lacks focus indicator',
              description: 'Focusable elements must have a visible focus indicator',
              elementId: element.id,
              wcagCriteria: ['2.4.7'],
              impact: 'serious',
              suggestions: [
                'Add outline style for focus state',
                'Add box-shadow for focus state',
                'Use :focus-visible CSS pseudo-class'
              ]
            })
          }

          return issues
        }
      },
      {
        id: 'a11y-aria-labels',
        name: 'ARIA Labels',
        description: 'Ensure proper ARIA labels for interactive elements',
        category: ValidationCategory.ACCESSIBILITY,
        severity: Severity.WARNING,
        wcagCriteria: ['4.1.2'],
        enabled: true,
        validate: (element) => {
          const issues: ValidationIssue[] = []

          if (element.interactive && element.type === 'button' && !element.ariaLabel && !element.name) {
            issues.push({
              id: `${element.id}-aria-label`,
              ruleId: 'a11y-aria-labels',
              category: ValidationCategory.ACCESSIBILITY,
              severity: Severity.WARNING,
              message: 'Interactive element missing accessible label',
              description: 'Interactive elements should have aria-label or accessible text',
              elementId: element.id,
              wcagCriteria: ['4.1.2'],
              impact: 'moderate',
              suggestions: [
                'Add aria-label attribute',
                'Add visible text content',
                'Use aria-labelledby to reference label'
              ]
            })
          }

          return issues
        }
      }
    ]
  }

  /**
   * Create branding validation rules
   */
  private createBrandingRules(): ValidationRule[] {
    return [
      {
        id: 'brand-color-palette',
        name: 'Color Palette Adherence',
        description: 'Ensure colors match brand palette',
        category: ValidationCategory.BRANDING,
        severity: Severity.WARNING,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (!context.brandGuide) return issues

          if (element.backgroundColor) {
            const matches = this.colorMatchesPalette(
              element.backgroundColor,
              context.brandGuide.colors,
              this.config.branding?.colorTolerance
            )

            if (!matches) {
              issues.push({
                id: `${element.id}-color-palette`,
                ruleId: 'brand-color-palette',
                category: ValidationCategory.BRANDING,
                severity: Severity.WARNING,
                message: 'Color not found in brand palette',
                description: 'Background color does not match approved brand colors',
                elementId: element.id,
                actualValue: element.backgroundColor,
                impact: 'minor',
                suggestions: [
                  'Use a color from the brand palette',
                  'Add this color to the brand guide if intentional'
                ]
              })
            }
          }

          return issues
        }
      },
      {
        id: 'brand-typography',
        name: 'Typography Consistency',
        description: 'Ensure typography matches brand guidelines',
        category: ValidationCategory.BRANDING,
        severity: Severity.WARNING,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (!context.brandGuide || !element.typography) return issues

          const matches = this.typographyMatchesBrand(
            element.typography,
            context.brandGuide.typography,
            this.config.branding?.typographyTolerance
          )

          if (!matches.isMatch) {
            issues.push({
              id: `${element.id}-typography`,
              ruleId: 'brand-typography',
              category: ValidationCategory.BRANDING,
              severity: Severity.WARNING,
              message: 'Typography does not match brand guidelines',
              description: matches.deviations?.join(', ') || 'Font family or size mismatch',
              elementId: element.id,
              impact: 'minor',
              suggestions: [
                'Use approved font family from brand guide',
                'Adjust font size to match scale',
                'Review typography guidelines'
              ]
            })
          }

          return issues
        }
      },
      {
        id: 'brand-spacing',
        name: 'Spacing System',
        description: 'Ensure spacing follows brand system',
        category: ValidationCategory.BRANDING,
        severity: Severity.INFO,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (!context.brandGuide?.spacing || !element.styles?.padding) return issues

          const padding = element.styles.padding
          const matches = this.spacingMatchesSystem(
            padding,
            context.brandGuide.spacing
          )

          if (!matches) {
            issues.push({
              id: `${element.id}-spacing`,
              ruleId: 'brand-spacing',
              category: ValidationCategory.BRANDING,
              severity: Severity.INFO,
              message: 'Spacing does not follow system',
              description: 'Padding values do not align with spacing scale',
              elementId: element.id,
              actualValue: padding,
              impact: 'minor',
              suggestions: [
                'Use values from spacing scale',
                'Round to nearest system value'
              ]
            })
          }

          return issues
        }
      }
    ]
  }

  /**
   * Create UX pattern validation rules
   */
  private createUXRules(): ValidationRule[] {
    return [
      {
        id: 'ux-visual-hierarchy',
        name: 'Visual Hierarchy',
        description: 'Ensure proper visual hierarchy',
        category: ValidationCategory.UX_PATTERNS,
        severity: Severity.INFO,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (element.type === 'heading' && element.typography) {
            const siblingHeadings = context.siblingElements?.filter(
              e => e.type === 'heading'
            ) || []

            const hasHierarchyIssue = this.checkHierarchyConsistency(
              element,
              siblingHeadings
            )

            if (hasHierarchyIssue) {
              issues.push({
                id: `${element.id}-hierarchy`,
                ruleId: 'ux-visual-hierarchy',
                category: ValidationCategory.UX_PATTERNS,
                severity: Severity.INFO,
                message: 'Inconsistent visual hierarchy',
                description: 'Heading sizes should follow logical hierarchy',
                elementId: element.id,
                impact: 'minor',
                suggestions: [
                  'Ensure H1 is largest, followed by H2, H3, etc.',
                  'Maintain consistent sizing within heading levels'
                ]
              })
            }
          }

          return issues
        }
      },
      {
        id: 'ux-consistency',
        name: 'Component Consistency',
        description: 'Ensure consistent styling across similar components',
        category: ValidationCategory.UX_PATTERNS,
        severity: Severity.INFO,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          const similarElements = context.design.elements.filter(
            e => e.type === element.type && e.id !== element.id
          )

          if (similarElements.length > 0) {
            const inconsistencies = this.findStyleInconsistencies(
              element,
              similarElements
            )

            if (inconsistencies.length > 0) {
              issues.push({
                id: `${element.id}-consistency`,
                ruleId: 'ux-consistency',
                category: ValidationCategory.UX_PATTERNS,
                severity: Severity.INFO,
                message: `Inconsistent styling: ${inconsistencies.join(', ')}`,
                description: 'Similar components should have consistent styling',
                elementId: element.id,
                impact: 'minor',
                suggestions: [
                  'Standardize component styles',
                  'Create reusable component variants'
                ]
              })
            }
          }

          return issues
        }
      }
    ]
  }

  /**
   * Create performance validation rules
   */
  private createPerformanceRules(): ValidationRule[] {
    return [
      {
        id: 'perf-image-size',
        name: 'Image Size',
        description: 'Ensure images are optimized',
        category: ValidationCategory.PERFORMANCE,
        severity: Severity.WARNING,
        enabled: true,
        validate: (element) => {
          const issues: ValidationIssue[] = []

          if (element.type === 'image' && element.properties?.fileSize) {
            const maxSize = this.config.performance?.maxImageSize || 500 * 1024

            if (element.properties.fileSize > maxSize) {
              issues.push({
                id: `${element.id}-image-size`,
                ruleId: 'perf-image-size',
                category: ValidationCategory.PERFORMANCE,
                severity: Severity.WARNING,
                message: `Image too large: ${(element.properties.fileSize / 1024).toFixed(0)}KB`,
                description: `Images should be under ${(maxSize / 1024).toFixed(0)}KB`,
                elementId: element.id,
                actualValue: element.properties.fileSize,
                expectedValue: maxSize,
                impact: 'moderate',
                suggestions: [
                  'Compress the image',
                  'Use modern formats (WebP, AVIF)',
                  'Implement responsive images'
                ]
              })
            }
          }

          return issues
        }
      },
      {
        id: 'perf-image-format',
        name: 'Image Format',
        description: 'Recommend modern image formats',
        category: ValidationCategory.PERFORMANCE,
        severity: Severity.INFO,
        enabled: true,
        validate: (element) => {
          const issues: ValidationIssue[] = []
          const recommendedFormats = this.config.performance?.recommendedFormats || []

          if (element.type === 'image' && element.properties?.format) {
            const format = element.properties.format.toLowerCase()

            if (!recommendedFormats.includes(format) && format !== 'svg') {
              issues.push({
                id: `${element.id}-image-format`,
                ruleId: 'perf-image-format',
                category: ValidationCategory.PERFORMANCE,
                severity: Severity.INFO,
                message: `Consider using modern format instead of ${format}`,
                description: 'Modern formats provide better compression',
                elementId: element.id,
                actualValue: format,
                impact: 'minor',
                suggestions: [
                  'Convert to WebP for better compression',
                  'Use AVIF for maximum compression',
                  'Keep original as fallback'
                ]
              })
            }
          }

          return issues
        }
      }
    ]
  }

  /**
   * Create responsive design validation rules
   */
  private createResponsiveRules(): ValidationRule[] {
    return [
      {
        id: 'responsive-breakpoints',
        name: 'Breakpoint Consistency',
        description: 'Ensure consistent breakpoint usage',
        category: ValidationCategory.RESPONSIVE,
        severity: Severity.INFO,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (element.styles?.mediaQueries) {
            const breakpoints = this.config.responsive?.breakpoints || {}
            const inconsistent = this.checkBreakpointConsistency(
              element.styles.mediaQueries,
              Object.values(breakpoints)
            )

            if (inconsistent) {
              issues.push({
                id: `${element.id}-breakpoints`,
                ruleId: 'responsive-breakpoints',
                category: ValidationCategory.RESPONSIVE,
                severity: Severity.INFO,
                message: 'Breakpoints do not match system',
                description: 'Use consistent breakpoints across design',
                elementId: element.id,
                impact: 'minor',
                suggestions: [
                  'Use standard breakpoints',
                  'Align with design system values'
                ]
              })
            }
          }

          return issues
        }
      },
      {
        id: 'responsive-overflow',
        name: 'Content Overflow',
        description: 'Check for potential overflow issues',
        category: ValidationCategory.RESPONSIVE,
        severity: Severity.WARNING,
        enabled: true,
        validate: (element, context) => {
          const issues: ValidationIssue[] = []

          if (element.bounds && context.viewport) {
            if (element.bounds.width > context.viewport.width) {
              issues.push({
                id: `${element.id}-overflow`,
                ruleId: 'responsive-overflow',
                category: ValidationCategory.RESPONSIVE,
                severity: Severity.WARNING,
                message: 'Element wider than viewport',
                description: 'Content may overflow on smaller screens',
                elementId: element.id,
                actualValue: element.bounds.width,
                expectedValue: context.viewport.width,
                impact: 'moderate',
                suggestions: [
                  'Use responsive width (%, vw)',
                  'Add max-width constraint',
                  'Implement horizontal scrolling'
                ]
              })
            }
          }

          return issues
        }
      }
    ]
  }

  /**
   * Validate accessibility compliance
   */
  public validateAccessibility(design: Design): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA
    }

    const accessibilityRules = this.rules.filter(
      rule => rule.category === ValidationCategory.ACCESSIBILITY && rule.enabled
    )

    return this.runValidation(design, accessibilityRules, context)
  }

  /**
   * Validate branding consistency
   */
  public validateBranding(design: Design, brandGuide?: BrandGuide): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: brandGuide || this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA
    }

    if (!context.brandGuide) {
      throw new Error('Brand guide is required for branding validation')
    }

    const brandingRules = this.rules.filter(
      rule => rule.category === ValidationCategory.BRANDING && rule.enabled
    )

    return this.runValidation(design, brandingRules, context)
  }

  /**
   * Validate UX patterns
   */
  public validateUX(design: Design): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA
    }

    const uxRules = this.rules.filter(
      rule => rule.category === ValidationCategory.UX_PATTERNS && rule.enabled
    )

    return this.runValidation(design, uxRules, context)
  }

  /**
   * Validate responsive design
   */
  public validateResponsive(design: Design): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA,
      viewport: design.viewport
    }

    const responsiveRules = this.rules.filter(
      rule => rule.category === ValidationCategory.RESPONSIVE && rule.enabled
    )

    return this.runValidation(design, responsiveRules, context)
  }

  /**
   * Validate performance optimization
   */
  public validatePerformance(design: Design): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA
    }

    const performanceRules = this.rules.filter(
      rule => rule.category === ValidationCategory.PERFORMANCE && rule.enabled
    )

    return this.runValidation(design, performanceRules, context)
  }

  /**
   * Run complete validation with all enabled rules
   */
  public validate(design: Design): ValidationResult {
    const context: ValidationContext = {
      design,
      brandGuide: this.config.brandGuide,
      wcagLevel: this.config.accessibility?.wcagLevel || WCAGLevel.AA,
      viewport: design.viewport
    }

    return this.runValidation(design, this.rules, context)
  }

  /**
   * Run validation with specific rules
   */
  private runValidation(
    design: Design,
    rules: ValidationRule[],
    context: ValidationContext
  ): ValidationResult {
    const startTime = Date.now()
    const allIssues: ValidationIssue[] = []
    const autoFixSuggestions: AutoFixSuggestion[] = []

    // Validate all elements
    const validateElement = (element: DesignElement, parent?: DesignElement) => {
      const elementContext = {
        ...context,
        parentElement: parent,
        siblingElements: parent?.children || design.elements
      }

      rules.forEach(rule => {
        try {
          const issues = rule.validate(element, elementContext)
          allIssues.push(...issues)

          // Generate auto-fix suggestions if available
          if (rule.autoFix) {
            issues.forEach(issue => {
              const fix = rule.autoFix!(element, issue)
              if (fix) {
                autoFixSuggestions.push(fix)
              }
            })
          }
        } catch (error) {
          console.error(`Error in rule ${rule.id}:`, error)
        }
      })

      // Recursively validate children
      element.children?.forEach(child => validateElement(child, element))
    }

    design.elements.forEach(element => validateElement(element))

    // Calculate summary
    const errorCount = allIssues.filter(i => i.severity === Severity.ERROR).length
    const warningCount = allIssues.filter(i => i.severity === Severity.WARNING).length
    const infoCount = allIssues.filter(i => i.severity === Severity.INFO).length
    const failedRules = new Set(allIssues.map(i => i.ruleId)).size
    const passedRules = rules.length - failedRules

    // WCAG compliance summary
    const wcagCriteria: { [key: string]: { passed: boolean; issues: number } } = {}
    allIssues.forEach(issue => {
      issue.wcagCriteria?.forEach(criteria => {
        if (!wcagCriteria[criteria]) {
          wcagCriteria[criteria] = { passed: true, issues: 0 }
        }
        wcagCriteria[criteria].passed = false
        wcagCriteria[criteria].issues++
      })
    })

    const wcagCompliant = errorCount === 0 && warningCount === 0

    return {
      design,
      summary: {
        totalIssues: allIssues.length,
        errorCount,
        warningCount,
        infoCount,
        passedRules,
        failedRules,
        wcagCompliance: {
          level: context.wcagLevel,
          compliant: wcagCompliant,
          criteria: wcagCriteria
        }
      },
      issues: allIssues,
      autoFixSuggestions,
      validatedAt: new Date(),
      duration: Date.now() - startTime
    }
  }

  /**
   * Get AI-powered recommendations for issues
   */
  public getRecommendations(issues: ValidationIssue[]): AIRecommendation[] {
    return this.recommendationEngine.analyzeIssues(issues)
  }

  /**
   * Batch validate multiple designs
   */
  public async validateBatch(designs: Design[]): Promise<BatchValidationResult> {
    const results = designs.map(design => this.validate(design))

    const totalIssues = results.reduce((sum, r) => sum + r.summary.totalIssues, 0)
    const errorCount = results.reduce((sum, r) => sum + r.summary.errorCount, 0)
    const warningCount = results.reduce((sum, r) => sum + r.summary.warningCount, 0)
    const infoCount = results.reduce((sum, r) => sum + r.summary.infoCount, 0)

    // Find most common issues
    const issueFrequency: { [ruleId: string]: { count: number; severity: Severity } } = {}
    results.forEach(result => {
      result.issues.forEach(issue => {
        if (!issueFrequency[issue.ruleId]) {
          issueFrequency[issue.ruleId] = { count: 0, severity: issue.severity }
        }
        issueFrequency[issue.ruleId].count++
      })
    })

    const mostCommonIssues = Object.entries(issueFrequency)
      .map(([ruleId, data]) => ({ ruleId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalDesigns: designs.length,
      results,
      aggregatedSummary: {
        totalIssues,
        errorCount,
        warningCount,
        infoCount,
        averageIssuesPerDesign: totalIssues / designs.length,
        mostCommonIssues
      },
      completedAt: new Date()
    }
  }

  /**
   * Add custom validation rule
   */
  public addRule(rule: ValidationRule): void {
    if (!this.config.ignoreRules?.includes(rule.id)) {
      this.rules.push(rule)
    }
  }

  /**
   * Remove validation rule
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
  }

  /**
   * Get all active rules
   */
  public getRules(): ValidationRule[] {
    return this.rules
  }

  /**
   * Calculate color contrast ratio
   */
  public calculateContrast(foreground: Color, background: Color): ContrastResult {
    const fg = this.colorToRgb(foreground)
    const bg = this.colorToRgb(background)

    const fgLum = this.relativeLuminance(fg.r, fg.g, fg.b)
    const bgLum = this.relativeLuminance(bg.r, bg.g, bg.b)

    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)

    return {
      ratio,
      passes: {
        normalAA: ratio >= WCAG_CONTRAST_RATIOS.AA.normalText,
        normalAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA.normalText,
        largeAA: ratio >= WCAG_CONTRAST_RATIOS.AA.largeText,
        largeAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA.largeText,
        uiComponent: ratio >= WCAG_CONTRAST_RATIOS.AA.uiComponents
      },
      foreground,
      background
    }
  }

  /**
   * Validate touch target size
   */
  public validateTouchTarget(element: DesignElement): TouchTargetResult {
    const minSize = this.config.accessibility?.minTouchTargetSize || 44
    const size = element.bounds
      ? { width: element.bounds.width, height: element.bounds.height }
      : { width: 0, height: 0 }

    return {
      elementId: element.id,
      size,
      meetsMinimum: size.width >= minSize && size.height >= minSize,
      recommended: { width: minSize, height: minSize },
      adjacent: []
    }
  }

  /**
   * Validate typography against brand guide
   */
  public validateTypography(
    element: DesignElement,
    brandGuide: BrandGuide
  ): TypographyResult {
    if (!element.typography) {
      return {
        elementId: element.id,
        typography: element.typography!,
        matchesBrandGuide: false
      }
    }

    const match = this.typographyMatchesBrand(
      element.typography,
      brandGuide.typography,
      this.config.branding?.typographyTolerance
    )

    return {
      elementId: element.id,
      typography: element.typography,
      matchesBrandGuide: match.isMatch,
      deviations: match.deviations ? match.deviations.map(d => ({
        property: 'font',
        expected: 'brand font',
        actual: element.typography?.fontFamily,
        tolerance: 0
      })) : undefined,
      recommendations: match.recommendations
    }
  }

  /**
   * Helper: Convert color to RGB
   */
  private colorToRgb(color: Color): { r: number; g: number; b: number } {
    if (color.rgb) {
      return color.rgb
    }

    if (color.hex) {
      const hex = color.hex.replace('#', '')
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      }
    }

    return { r: 0, g: 0, b: 0 }
  }

  /**
   * Helper: Calculate relative luminance
   */
  private relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  /**
   * Helper: Get minimum contrast ratio for element
   */
  private getMinContrastRatio(element: DesignElement, context: ValidationContext): number {
    const isLargeText = element.typography && element.typography.fontSize >= 18
    const level = context.wcagLevel === WCAGLevel.AAA ? 'AAA' : 'AA'

    if (isLargeText) {
      return WCAG_CONTRAST_RATIOS[level].largeText
    }
    return WCAG_CONTRAST_RATIOS[level].normalText
  }

  /**
   * Helper: Suggest color with better contrast
   */
  private suggestContrastColor(
    foreground: Color,
    background: Color,
    minRatio: number
  ): Color {
    const fg = this.colorToRgb(foreground)
    const bg = this.colorToRgb(background)

    // Simple approach: darken or lighten foreground
    const bgLum = this.relativeLuminance(bg.r, bg.g, bg.b)
    const shouldDarken = bgLum > 0.5

    let factor = shouldDarken ? 0.8 : 1.2
    const newRgb = {
      r: Math.max(0, Math.min(255, Math.round(fg.r * factor))),
      g: Math.max(0, Math.min(255, Math.round(fg.g * factor))),
      b: Math.max(0, Math.min(255, Math.round(fg.b * factor)))
    }

    return { rgb: newRgb }
  }

  /**
   * Helper: Check if color matches palette
   */
  private colorMatchesPalette(
    color: Color,
    palette: any,
    tolerance?: number
  ): boolean {
    const rgb = this.colorToRgb(color)
    const tol = tolerance || 5

    const allColors: Color[] = [
      ...(palette.primary || []),
      ...(palette.secondary || []),
      ...(palette.accent || []),
      ...(palette.neutral || [])
    ]

    return allColors.some(paletteColor => {
      const pRgb = this.colorToRgb(paletteColor)
      return (
        Math.abs(rgb.r - pRgb.r) <= tol &&
        Math.abs(rgb.g - pRgb.g) <= tol &&
        Math.abs(rgb.b - pRgb.b) <= tol
      )
    })
  }

  /**
   * Helper: Check if typography matches brand
   */
  private typographyMatchesBrand(
    typography: any,
    brandTypography: any,
    tolerance?: number
  ): { isMatch: boolean; deviations?: string[]; recommendations?: string[] } {
    const deviations: string[] = []

    // Check font family
    const allFamilies = [
      ...brandTypography.headings.map((h: any) => h.fontFamily),
      ...brandTypography.body.map((b: any) => b.fontFamily)
    ]

    if (!allFamilies.includes(typography.fontFamily)) {
      deviations.push('Font family not in brand guide')
    }

    return {
      isMatch: deviations.length === 0,
      deviations: deviations.length > 0 ? deviations : undefined,
      recommendations: deviations.length > 0
        ? ['Use approved font family', 'Check typography guidelines']
        : undefined
    }
  }

  /**
   * Helper: Check if spacing matches system
   */
  private spacingMatchesSystem(spacing: any, system: any): boolean {
    const values = typeof spacing === 'object'
      ? Object.values(spacing)
      : [spacing]

    return values.every((val: any) => {
      if (typeof val !== 'number') return true
      return system.scale.some((s: number) => Math.abs(val - s * system.unit) <= 2)
    })
  }

  /**
   * Helper: Check hierarchy consistency
   */
  private checkHierarchyConsistency(
    element: DesignElement,
    siblings: DesignElement[]
  ): boolean {
    // Simplified check - could be more sophisticated
    return false
  }

  /**
   * Helper: Find style inconsistencies
   */
  private findStyleInconsistencies(
    element: DesignElement,
    similar: DesignElement[]
  ): string[] {
    const inconsistencies: string[] = []

    // Check common style properties
    const referenceStyles = similar[0]?.styles
    if (referenceStyles && element.styles) {
      ['padding', 'margin', 'borderRadius'].forEach(prop => {
        if (element.styles![prop] !== referenceStyles[prop]) {
          inconsistencies.push(prop)
        }
      })
    }

    return inconsistencies
  }

  /**
   * Helper: Check breakpoint consistency
   */
  private checkBreakpointConsistency(
    mediaQueries: any,
    systemBreakpoints: number[]
  ): boolean {
    // Simplified implementation
    return false
  }
}

/**
 * AI Recommendation Engine
 * Provides intelligent recommendations based on validation issues
 */
class AIRecommendationEngine implements RecommendationEngine {
  analyzeIssues(issues: ValidationIssue[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    // Group issues by category
    const byCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = []
      acc[issue.category].push(issue)
      return acc
    }, {} as { [key: string]: ValidationIssue[] })

    // Generate recommendations for each category
    Object.entries(byCategory).forEach(([category, categoryIssues], index) => {
      if (categoryIssues.length > 0) {
        recommendations.push({
          id: `rec-${category}-${index}`,
          type: 'fix',
          title: `Address ${categoryIssues.length} ${category} issue${categoryIssues.length > 1 ? 's' : ''}`,
          description: this.generateCategoryDescription(category as ValidationCategory, categoryIssues),
          rationale: this.generateRationale(category as ValidationCategory),
          relatedIssues: categoryIssues.map(i => i.id),
          impact: this.calculateImpact(category as ValidationCategory, categoryIssues),
          implementation: {
            difficulty: this.estimateDifficulty(categoryIssues),
            estimatedEffort: this.estimateEffort(categoryIssues),
            steps: this.generateSteps(categoryIssues)
          },
          priority: this.calculatePriority(categoryIssues),
          confidence: 0.85
        })
      }
    })

    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  suggestImprovements(design: Design, context: ValidationContext): AIRecommendation[] {
    // Future: AI-powered proactive suggestions
    return []
  }

  prioritizeIssues(issues: ValidationIssue[]): ValidationIssue[] {
    return issues.sort((a, b) => {
      // Prioritize by severity first
      const severityOrder = { error: 3, warning: 2, info: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff

      // Then by impact
      const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 }
      const aImpact = a.impact ? impactOrder[a.impact] : 0
      const bImpact = b.impact ? impactOrder[b.impact] : 0
      return bImpact - aImpact
    })
  }

  generateFixStrategies(issues: ValidationIssue[]): FixStrategy[] {
    const strategies: FixStrategy[] = []

    // Group related issues
    const contrastIssues = issues.filter(i => i.ruleId.includes('contrast'))
    if (contrastIssues.length > 0) {
      strategies.push({
        id: 'strategy-contrast',
        name: 'Improve Color Contrast',
        description: 'Systematically improve color contrast across all elements',
        targetIssues: contrastIssues.map(i => i.id),
        approach: 'Adjust colors to meet WCAG requirements while maintaining brand identity',
        benefits: [
          'Improved readability for all users',
          'Better accessibility for visually impaired users',
          'WCAG compliance'
        ],
        steps: contrastIssues.map((issue, index) => ({
          order: index + 1,
          action: `Adjust contrast for element ${issue.elementId}`,
          affectedElements: [issue.elementId!],
          changes: { contrast: issue.expectedValue }
        })),
        estimatedImpact: {
          issuesResolved: contrastIssues.length,
          issuesMitigated: 0
        }
      })
    }

    return strategies
  }

  private generateCategoryDescription(category: ValidationCategory, issues: ValidationIssue[]): string {
    const descriptions = {
      [ValidationCategory.ACCESSIBILITY]: `Improve accessibility by addressing ${issues.length} issues including contrast, alt text, and focus indicators`,
      [ValidationCategory.BRANDING]: `Ensure brand consistency by aligning colors, typography, and spacing with brand guidelines`,
      [ValidationCategory.UX_PATTERNS]: `Enhance user experience by improving visual hierarchy and component consistency`,
      [ValidationCategory.PERFORMANCE]: `Optimize performance by compressing images and using modern formats`,
      [ValidationCategory.RESPONSIVE]: `Improve responsive design by fixing overflow and breakpoint issues`,
      [ValidationCategory.TYPOGRAPHY]: `Standardize typography across the design`,
      [ValidationCategory.COLOR]: `Improve color usage and contrast`,
      [ValidationCategory.SPACING]: `Ensure consistent spacing following the design system`
    }
    return descriptions[category] || `Address ${issues.length} ${category} issues`
  }

  private generateRationale(category: ValidationCategory): string {
    const rationales = {
      [ValidationCategory.ACCESSIBILITY]: 'Accessibility ensures your design is usable by everyone, including users with disabilities',
      [ValidationCategory.BRANDING]: 'Consistent branding builds trust and recognition with your users',
      [ValidationCategory.UX_PATTERNS]: 'Good UX patterns make your interface intuitive and easy to use',
      [ValidationCategory.PERFORMANCE]: 'Performance optimization ensures fast load times and smooth interactions',
      [ValidationCategory.RESPONSIVE]: 'Responsive design provides optimal experience across all devices',
      [ValidationCategory.TYPOGRAPHY]: 'Consistent typography improves readability and visual hierarchy',
      [ValidationCategory.COLOR]: 'Proper color usage enhances usability and aesthetics',
      [ValidationCategory.SPACING]: 'Consistent spacing creates visual rhythm and balance'
    }
    return rationales[category] || 'Following best practices improves overall design quality'
  }

  private calculateImpact(category: ValidationCategory, issues: ValidationIssue[]) {
    const baseImpact = {
      accessibility: 0,
      ux: 0,
      branding: 0,
      performance: 0
    }

    const weight = issues.length / 10

    switch (category) {
      case ValidationCategory.ACCESSIBILITY:
        baseImpact.accessibility = Math.min(1, 0.8 * weight)
        baseImpact.ux = Math.min(1, 0.3 * weight)
        break
      case ValidationCategory.BRANDING:
        baseImpact.branding = Math.min(1, 0.9 * weight)
        break
      case ValidationCategory.UX_PATTERNS:
        baseImpact.ux = Math.min(1, 0.8 * weight)
        break
      case ValidationCategory.PERFORMANCE:
        baseImpact.performance = Math.min(1, 0.8 * weight)
        baseImpact.ux = Math.min(1, 0.3 * weight)
        break
    }

    return baseImpact
  }

  private estimateDifficulty(issues: ValidationIssue[]): 'easy' | 'medium' | 'hard' {
    const errorCount = issues.filter(i => i.severity === Severity.ERROR).length
    if (errorCount > 5) return 'hard'
    if (errorCount > 2) return 'medium'
    return 'easy'
  }

  private estimateEffort(issues: ValidationIssue[]): string {
    const count = issues.length
    if (count > 10) return '2-4 hours'
    if (count > 5) return '1-2 hours'
    return '30-60 minutes'
  }

  private generateSteps(issues: ValidationIssue[]): string[] {
    const steps: string[] = []
    const byCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.ruleId]) acc[issue.ruleId] = []
      acc[issue.ruleId].push(issue)
      return acc
    }, {} as { [key: string]: ValidationIssue[] })

    Object.entries(byCategory).forEach(([ruleId, ruleIssues]) => {
      steps.push(`Fix ${ruleIssues.length} ${ruleId} issue${ruleIssues.length > 1 ? 's' : ''}`)
    })

    steps.push('Test changes across different devices and screen sizes')
    steps.push('Validate with accessibility tools')

    return steps
  }

  private calculatePriority(issues: ValidationIssue[]): number {
    let priority = 0
    issues.forEach(issue => {
      switch (issue.severity) {
        case Severity.ERROR:
          priority += 10
          break
        case Severity.WARNING:
          priority += 5
          break
        case Severity.INFO:
          priority += 1
          break
      }
    })
    return priority
  }
}

/**
 * Create a design validator with configuration
 */
export function createDesignValidator(config?: ValidatorConfig): DesignValidator {
  return new DesignValidator(config)
}

/**
 * Export all types and utilities
 */
export * from './design-validator-types'

/**
 * Default export
 */
export default {
  DesignValidator,
  createDesignValidator,
  WCAG_CONTRAST_RATIOS,
  DEFAULT_ACCESSIBILITY_OPTIONS,
  DEFAULT_BRANDING_OPTIONS,
  DEFAULT_UX_OPTIONS,
  DEFAULT_PERFORMANCE_OPTIONS,
  DEFAULT_RESPONSIVE_OPTIONS
}
