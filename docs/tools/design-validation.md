# Design Validation

AI-powered design validation for accessibility, branding, UX patterns, performance, and responsive design best practices.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Validation Categories](#validation-categories)
  - [Accessibility Validation](#accessibility-validation)
  - [Branding Validation](#branding-validation)
  - [UX Pattern Validation](#ux-pattern-validation)
  - [Performance Validation](#performance-validation)
  - [Responsive Design Validation](#responsive-design-validation)
- [Configuration](#configuration)
- [Custom Rules](#custom-rules)
- [AI Recommendations](#ai-recommendations)
- [Batch Validation](#batch-validation)
- [Integration Examples](#integration-examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Design Validator provides comprehensive AI-powered validation for digital designs, ensuring they meet accessibility standards (WCAG 2.1), branding guidelines, UX best practices, performance requirements, and responsive design principles.

### Key Benefits

- **Accessibility Compliance**: Automated WCAG 2.1 AA/AAA compliance checking
- **Brand Consistency**: Validate designs against brand guidelines
- **UX Excellence**: Ensure best practices for user experience
- **Performance Optimization**: Identify opportunities for improvement
- **Responsive Design**: Validate across breakpoints and viewports
- **AI-Powered Recommendations**: Get intelligent suggestions for fixes
- **Auto-Fix Suggestions**: Automated solutions for common issues

## Features

### Comprehensive Validation

- **Color Contrast**: WCAG-compliant contrast ratio checking
- **Typography**: Font family, size, and hierarchy validation
- **Touch Targets**: Minimum size requirements (44x44px)
- **Alt Text**: Image accessibility validation
- **ARIA Labels**: Semantic markup verification
- **Focus Indicators**: Keyboard navigation support
- **Spacing Systems**: Design system adherence
- **Image Optimization**: File size and format recommendations
- **Viewport Overflow**: Responsive design issues
- **Component Consistency**: Style standardization

### AI-Powered Intelligence

- Prioritized issue recommendations
- Impact analysis and scoring
- Automated fix strategies
- Contextual improvement suggestions
- Batch validation analytics

## Installation

```bash
npm install @ainative/ai-kit-tools
# or
yarn add @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
```

## Quick Start

### Basic Usage

```typescript
import { DesignValidator } from '@ainative/ai-kit-tools'

// Create validator
const validator = new DesignValidator()

// Define your design
const design = {
  id: 'screen-1',
  name: 'Login Screen',
  type: 'screen',
  elements: [
    {
      id: 'submit-btn',
      type: 'button',
      name: 'Submit',
      bounds: { x: 0, y: 0, width: 200, height: 50 },
      backgroundColor: { hex: '#007AFF' },
      textColor: { hex: '#FFFFFF' },
      interactive: true,
      focusable: true
    }
  ]
}

// Validate design
const result = validator.validate(design)

console.log(`Total Issues: ${result.summary.totalIssues}`)
console.log(`Errors: ${result.summary.errorCount}`)
console.log(`Warnings: ${result.summary.warningCount}`)
console.log(`WCAG Compliant: ${result.summary.wcagCompliance.compliant}`)

// Display issues
result.issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.message}`)
  console.log(`  Element: ${issue.elementId}`)
  console.log(`  Category: ${issue.category}`)
})
```

### With Configuration

```typescript
import { DesignValidator, WCAGLevel } from '@ainative/ai-kit-tools'

const validator = new DesignValidator({
  accessibility: {
    wcagLevel: WCAGLevel.AAA,
    checkContrast: true,
    checkFocusIndicators: true,
    checkAltText: true,
    checkAriaLabels: true,
    minTouchTargetSize: 48 // Stricter than default 44px
  },
  performance: {
    maxImageSize: 300 * 1024, // 300KB limit
    recommendedFormats: ['webp', 'avif']
  }
})

const result = validator.validate(design)
```

## Validation Categories

### Accessibility Validation

Ensure your designs are accessible to all users, including those with disabilities.

#### WCAG 2.1 Compliance

The validator checks against WCAG 2.1 Success Criteria:

- **Level A**: Basic accessibility features
- **Level AA**: Standard accessibility (recommended)
- **Level AAA**: Enhanced accessibility

```typescript
// Validate accessibility only
const accessibilityResult = validator.validateAccessibility(design)

// Check specific WCAG criteria
const wcagCriteria = accessibilityResult.summary.wcagCompliance.criteria

Object.entries(wcagCriteria).forEach(([criteria, result]) => {
  console.log(`${criteria}: ${result.passed ? 'PASS' : 'FAIL'}`)
  if (!result.passed) {
    console.log(`  Issues: ${result.issues}`)
  }
})
```

#### Color Contrast

Validates text and UI component contrast ratios:

- **Normal Text AA**: 4.5:1 minimum
- **Normal Text AAA**: 7:1 minimum
- **Large Text AA**: 3:1 minimum
- **Large Text AAA**: 4.5:1 minimum
- **UI Components**: 3:1 minimum

```typescript
import { Color } from '@ainative/ai-kit-tools'

// Check contrast manually
const foreground: Color = { hex: '#333333' }
const background: Color = { hex: '#FFFFFF' }

const contrast = validator.calculateContrast(foreground, background)

console.log(`Contrast Ratio: ${contrast.ratio.toFixed(2)}:1`)
console.log(`Passes AA Normal Text: ${contrast.passes.normalAA}`)
console.log(`Passes AAA Normal Text: ${contrast.passes.normalAAA}`)
console.log(`Passes AA Large Text: ${contrast.passes.largeAA}`)
console.log(`Passes AAA Large Text: ${contrast.passes.largeAAA}`)
console.log(`Passes UI Components: ${contrast.passes.uiComponent}`)
```

#### Touch Target Size

Interactive elements should be at least 44x44 pixels (WCAG 2.5.5):

```typescript
const button = {
  id: 'btn-1',
  type: 'button',
  bounds: { x: 0, y: 0, width: 48, height: 48 },
  interactive: true
}

const touchResult = validator.validateTouchTarget(button)

if (!touchResult.meetsMinimum) {
  console.log('Touch target too small!')
  console.log(`Current: ${touchResult.size.width}x${touchResult.size.height}`)
  console.log(`Recommended: ${touchResult.recommended.width}x${touchResult.recommended.height}`)
}
```

#### Alt Text and ARIA Labels

Images and interactive elements need descriptive labels:

```typescript
const image = {
  id: 'hero-image',
  type: 'image',
  url: '/hero.jpg',
  alt: 'Team collaborating in modern office space',
  ariaLabel: undefined
}

const iconButton = {
  id: 'close-btn',
  type: 'button',
  interactive: true,
  ariaLabel: 'Close dialog',
  name: undefined
}

// Both are valid - alt text or aria-label can provide accessibility
```

#### Focus Indicators

Focusable elements need visible focus indicators:

```typescript
const accessibleButton = {
  id: 'btn-accessible',
  type: 'button',
  focusable: true,
  styles: {
    outline: '2px solid #007AFF',
    // Or use box-shadow
    // boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.5)'
  }
}
```

### Branding Validation

Validate designs against your brand guidelines for consistency.

#### Setting Up Brand Guide

```typescript
import { BrandGuide } from '@ainative/ai-kit-tools'

const brandGuide: BrandGuide = {
  name: 'Acme Brand Guidelines',
  version: '2.0',
  colors: {
    primary: [
      { hex: '#007AFF' },
      { hex: '#0051D5' }
    ],
    secondary: [
      { hex: '#5856D6' },
      { hex: '#AF52DE' }
    ],
    neutral: [
      { hex: '#000000' },
      { hex: '#1C1C1E' },
      { hex: '#8E8E93' },
      { hex: '#FFFFFF' }
    ],
    semantic: {
      success: [{ hex: '#34C759' }],
      warning: [{ hex: '#FF9500' }],
      error: [{ hex: '#FF3B30' }],
      info: [{ hex: '#007AFF' }]
    }
  },
  typography: {
    headings: [
      {
        fontFamily: 'SF Pro Display',
        fontSize: 34,
        fontWeight: 700,
        lineHeight: '41px'
      },
      {
        fontFamily: 'SF Pro Display',
        fontSize: 28,
        fontWeight: 700,
        lineHeight: '34px'
      },
      {
        fontFamily: 'SF Pro Display',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: '28px'
      }
    ],
    body: [
      {
        fontFamily: 'SF Pro Text',
        fontSize: 17,
        fontWeight: 400,
        lineHeight: '22px'
      },
      {
        fontFamily: 'SF Pro Text',
        fontSize: 15,
        fontWeight: 400,
        lineHeight: '20px'
      }
    ],
    captions: [
      {
        fontFamily: 'SF Pro Text',
        fontSize: 12,
        fontWeight: 400,
        lineHeight: '16px'
      }
    ]
  },
  spacing: {
    unit: 4,
    scale: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
  },
  logo: {
    variations: ['primary', 'white', 'black'],
    minSize: { width: 120, height: 40 },
    clearSpace: 20,
    allowedBackgrounds: [
      { hex: '#FFFFFF' },
      { hex: '#000000' },
      { hex: '#007AFF' }
    ]
  },
  borderRadius: [4, 8, 12, 16, 24],
  shadows: [
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 4px 6px rgba(0,0,0,0.12)',
    '0 8px 16px rgba(0,0,0,0.12)'
  ],
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  }
}

// Create validator with brand guide
const brandValidator = new DesignValidator({ brandGuide })

// Validate branding
const brandingResult = brandValidator.validateBranding(design, brandGuide)
```

#### Color Palette Validation

```typescript
// Strict mode - no tolerance
const strictValidator = new DesignValidator({
  brandGuide,
  branding: {
    strictMode: true,
    checkColorUsage: true,
    colorTolerance: 0
  }
})

// Flexible mode - allow slight variations
const flexibleValidator = new DesignValidator({
  brandGuide,
  branding: {
    strictMode: false,
    checkColorUsage: true,
    colorTolerance: 10 // Allow ±10 RGB units
  }
})
```

#### Typography Validation

```typescript
const element = {
  id: 'heading-1',
  type: 'heading',
  typography: {
    fontFamily: 'SF Pro Display',
    fontSize: 34,
    fontWeight: 700,
    lineHeight: '41px'
  }
}

const typographyResult = brandValidator.validateTypography(element, brandGuide)

if (!typographyResult.matchesBrandGuide) {
  console.log('Typography deviations:')
  typographyResult.deviations?.forEach(deviation => {
    console.log(`- ${deviation}`)
  })

  console.log('Recommendations:')
  typographyResult.recommendations?.forEach(rec => {
    console.log(`- ${rec}`)
  })
}
```

#### Spacing System

```typescript
// Spacing follows 4px base unit with scale
const spacingConfig = {
  unit: 4,
  scale: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
}

// Valid spacing values: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256
const validElement = {
  id: 'card',
  type: 'container',
  styles: {
    padding: 16, // 4 * 4 = 16 ✓
    margin: 24   // 4 * 6 = 24 ✓
  }
}

const invalidElement = {
  id: 'card-2',
  type: 'container',
  styles: {
    padding: 15, // Not in scale ✗
    margin: 20   // Not in scale ✗
  }
}
```

### UX Pattern Validation

Ensure designs follow UX best practices for optimal user experience.

#### Visual Hierarchy

```typescript
// Good hierarchy - decreasing font sizes
const goodHierarchy = [
  {
    id: 'h1',
    type: 'heading',
    typography: { fontFamily: 'Arial', fontSize: 32 }
  },
  {
    id: 'h2',
    type: 'heading',
    typography: { fontFamily: 'Arial', fontSize: 24 }
  },
  {
    id: 'h3',
    type: 'heading',
    typography: { fontFamily: 'Arial', fontSize: 18 }
  }
]

// Bad hierarchy - inconsistent sizes
const badHierarchy = [
  {
    id: 'h1',
    type: 'heading',
    typography: { fontFamily: 'Arial', fontSize: 24 }
  },
  {
    id: 'h2',
    type: 'heading',
    typography: { fontFamily: 'Arial', fontSize: 28 } // Larger than H1!
  }
]
```

#### Component Consistency

```typescript
// Consistent button styling
const primaryButtons = [
  {
    id: 'btn-1',
    type: 'button',
    styles: {
      padding: 12,
      borderRadius: 8,
      fontSize: 16
    }
  },
  {
    id: 'btn-2',
    type: 'button',
    styles: {
      padding: 12,
      borderRadius: 8,
      fontSize: 16
    }
  }
]

// Inconsistent styling - will be flagged
const inconsistentButtons = [
  {
    id: 'btn-1',
    type: 'button',
    styles: { padding: 12, borderRadius: 8 }
  },
  {
    id: 'btn-2',
    type: 'button',
    styles: { padding: 16, borderRadius: 4 } // Different values
  }
]
```

### Performance Validation

Optimize designs for fast loading and smooth performance.

#### Image Optimization

```typescript
const performanceValidator = new DesignValidator({
  performance: {
    checkImageOptimization: true,
    checkAssetSize: true,
    maxImageSize: 500 * 1024, // 500KB
    recommendedFormats: ['webp', 'avif', 'svg']
  }
})

const images = [
  {
    id: 'hero',
    type: 'image',
    url: '/hero.jpg',
    properties: {
      fileSize: 800 * 1024, // 800KB - too large!
      format: 'jpg'
    }
  },
  {
    id: 'icon',
    type: 'image',
    url: '/icon.png',
    properties: {
      fileSize: 50 * 1024, // 50KB - good
      format: 'png' // Suggest WebP/AVIF
    }
  }
]
```

#### Format Recommendations

Modern formats provide better compression:

- **WebP**: 25-35% smaller than JPEG/PNG
- **AVIF**: 50% smaller than JPEG
- **SVG**: Vector format, scales perfectly

```typescript
// Will suggest modern formats
const pngImage = {
  type: 'image',
  properties: { format: 'png' }
}

// No suggestion for modern formats
const webpImage = {
  type: 'image',
  properties: { format: 'webp' }
}

// No suggestion for vectors
const svgIcon = {
  type: 'image',
  properties: { format: 'svg' }
}
```

### Responsive Design Validation

Ensure designs work across all screen sizes and devices.

#### Viewport Overflow

```typescript
const responsiveValidator = new DesignValidator({
  responsive: {
    breakpoints: {
      mobile: 320,
      tablet: 768,
      desktop: 1024,
      wide: 1440
    },
    checkMobileFirst: true,
    checkFlexibility: true,
    checkOverflow: true
  }
})

// Test on mobile viewport
const mobileDesign = {
  id: 'screen',
  viewport: { width: 320, height: 568 },
  elements: [
    {
      id: 'container',
      bounds: { x: 0, y: 0, width: 400, height: 200 } // Overflows!
    }
  ]
}

const result = responsiveValidator.validateResponsive(mobileDesign)
```

#### Breakpoint Consistency

```typescript
// Standard breakpoints
const standardBreakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440
}

// Elements should use these breakpoints
const responsiveElement = {
  id: 'card',
  styles: {
    mediaQueries: {
      '(min-width: 768px)': {
        width: '50%'
      },
      '(min-width: 1024px)': {
        width: '33.333%'
      }
    }
  }
}
```

## Configuration

### Complete Configuration Example

```typescript
import {
  DesignValidator,
  WCAGLevel,
  ValidatorConfig
} from '@ainative/ai-kit-tools'

const config: ValidatorConfig = {
  // Accessibility settings
  accessibility: {
    wcagLevel: WCAGLevel.AA,
    checkContrast: true,
    checkFocusIndicators: true,
    checkAltText: true,
    checkAriaLabels: true,
    checkKeyboardNavigation: true,
    checkTextSize: true,
    checkTouchTargets: true,
    contrastRatios: {
      normalText: 4.5,
      largeText: 3.0,
      uiComponents: 3.0
    },
    minTextSize: 12,
    minTouchTargetSize: 44
  },

  // Branding settings
  branding: {
    strictMode: false,
    checkColorUsage: true,
    checkTypography: true,
    checkLogoUsage: true,
    checkSpacing: true,
    colorTolerance: 5,
    typographyTolerance: 2
  },

  // UX settings
  ux: {
    checkTouchTargets: true,
    checkSpacing: true,
    checkHierarchy: true,
    checkConsistency: true,
    minTouchTargetSize: 44,
    recommendedSpacing: [4, 8, 12, 16, 24, 32, 48, 64]
  },

  // Performance settings
  performance: {
    checkImageOptimization: true,
    checkAssetSize: true,
    maxImageSize: 500 * 1024,
    maxAssetSize: 200 * 1024,
    recommendedFormats: ['webp', 'avif', 'svg']
  },

  // Responsive settings
  responsive: {
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
  },

  // Custom rules (see below)
  customRules: [],

  // Rules to ignore
  ignoreRules: ['a11y-touch-target'], // Example: ignore touch target checks

  // Brand guide
  brandGuide: myBrandGuide
}

const validator = new DesignValidator(config)
```

## Custom Rules

Create custom validation rules for your specific needs.

### Basic Custom Rule

```typescript
import {
  ValidationRule,
  ValidationCategory,
  Severity,
  DesignElement,
  ValidationContext,
  ValidationIssue
} from '@ainative/ai-kit-tools'

const customRule: ValidationRule = {
  id: 'custom-button-height',
  name: 'Button Height Standard',
  description: 'Ensure all buttons use standard heights',
  category: ValidationCategory.UX_PATTERNS,
  severity: Severity.WARNING,
  enabled: true,

  validate: (element: DesignElement, context: ValidationContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = []

    // Only check buttons
    if (element.type !== 'button' || !element.bounds) {
      return issues
    }

    const standardHeights = [32, 40, 48, 56]
    const { height } = element.bounds

    if (!standardHeights.includes(height)) {
      issues.push({
        id: `${element.id}-button-height`,
        ruleId: 'custom-button-height',
        category: ValidationCategory.UX_PATTERNS,
        severity: Severity.WARNING,
        message: `Button height ${height}px is not standard`,
        description: `Buttons should use standard heights: ${standardHeights.join(', ')}px`,
        elementId: element.id,
        actualValue: height,
        expectedValue: standardHeights,
        impact: 'minor',
        suggestions: [
          `Change height to ${this.findClosest(height, standardHeights)}px`,
          'Use consistent button sizes throughout the design'
        ]
      })
    }

    return issues
  }
}

// Add to validator
validator.addRule(customRule)
```

### Custom Rule with Auto-Fix

```typescript
const customRuleWithFix: ValidationRule = {
  id: 'custom-border-radius',
  name: 'Border Radius Standard',
  description: 'Standardize border radius values',
  category: ValidationCategory.BRANDING,
  severity: Severity.INFO,
  enabled: true,

  validate: (element, context) => {
    const issues: ValidationIssue[] = []
    const standardRadii = [0, 4, 8, 12, 16, 24]

    const radius = element.styles?.borderRadius
    if (radius && !standardRadii.includes(radius)) {
      issues.push({
        id: `${element.id}-border-radius`,
        ruleId: 'custom-border-radius',
        category: ValidationCategory.BRANDING,
        severity: Severity.INFO,
        message: `Non-standard border radius: ${radius}px`,
        elementId: element.id,
        actualValue: radius,
        expectedValue: standardRadii
      })
    }

    return issues
  },

  autoFix: (element, issue) => {
    const standardRadii = [0, 4, 8, 12, 16, 24]
    const current = issue.actualValue as number

    // Find closest standard value
    const closest = standardRadii.reduce((prev, curr) => {
      return Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev
    })

    return {
      issueId: issue.id,
      description: 'Round to nearest standard border radius',
      changes: [{
        property: 'styles.borderRadius',
        currentValue: current,
        suggestedValue: closest,
        reasoning: `${closest}px is the closest standard value to ${current}px`
      }],
      confidence: 0.95,
      requiresManualReview: false
    }
  }
}

validator.addRule(customRuleWithFix)
```

### Advanced Custom Rule

```typescript
const advancedRule: ValidationRule = {
  id: 'custom-color-accessibility',
  name: 'Brand Color Accessibility',
  description: 'Ensure brand colors meet accessibility when combined',
  category: ValidationCategory.ACCESSIBILITY,
  severity: Severity.ERROR,
  wcagCriteria: ['1.4.3'],
  enabled: true,

  validate: (element, context) => {
    const issues: ValidationIssue[] = []

    if (!element.textColor || !element.backgroundColor) {
      return issues
    }

    // Only check brand colors
    const brandGuide = context.brandGuide
    if (!brandGuide) return issues

    const isBrandColor = (color: Color): boolean => {
      // Check if color is in brand palette
      const allColors = [
        ...(brandGuide.colors.primary || []),
        ...(brandGuide.colors.secondary || [])
      ]
      return allColors.some(brandColor =>
        this.colorsMatch(color, brandColor)
      )
    }

    if (isBrandColor(element.textColor) && isBrandColor(element.backgroundColor)) {
      // Both are brand colors, check contrast
      const contrast = validator.calculateContrast(
        element.textColor,
        element.backgroundColor
      )

      if (!contrast.passes.normalAA) {
        issues.push({
          id: `${element.id}-brand-color-contrast`,
          ruleId: 'custom-color-accessibility',
          category: ValidationCategory.ACCESSIBILITY,
          severity: Severity.ERROR,
          message: 'Brand color combination fails accessibility',
          description: 'This combination of brand colors does not provide sufficient contrast',
          elementId: element.id,
          wcagCriteria: ['1.4.3'],
          actualValue: contrast.ratio,
          expectedValue: 4.5,
          impact: 'serious',
          suggestions: [
            'Use a different brand color combination',
            'Add a background shade to improve contrast',
            'Consider updating brand colors for better accessibility'
          ]
        })
      }
    }

    return issues
  }
}
```

## AI Recommendations

Get intelligent recommendations for improving your designs.

### Basic Recommendations

```typescript
const design = createDesign() // Your design
const result = validator.validate(design)

// Get AI recommendations
const recommendations = validator.getRecommendations(result.issues)

recommendations.forEach(rec => {
  console.log(`\n${rec.type.toUpperCase()}: ${rec.title}`)
  console.log(`Priority: ${rec.priority}`)
  console.log(`Confidence: ${(rec.confidence * 100).toFixed(0)}%`)
  console.log(`\nDescription: ${rec.description}`)
  console.log(`\nRationale: ${rec.rationale}`)

  console.log(`\nImpact:`)
  console.log(`  Accessibility: ${(rec.impact.accessibility || 0) * 100}%`)
  console.log(`  UX: ${(rec.impact.ux || 0) * 100}%`)
  console.log(`  Branding: ${(rec.impact.branding || 0) * 100}%`)
  console.log(`  Performance: ${(rec.impact.performance || 0) * 100}%`)

  console.log(`\nImplementation:`)
  console.log(`  Difficulty: ${rec.implementation.difficulty}`)
  console.log(`  Estimated Effort: ${rec.implementation.estimatedEffort}`)
  console.log(`  Steps:`)
  rec.implementation.steps.forEach((step, i) => {
    console.log(`    ${i + 1}. ${step}`)
  })
})
```

### Recommendation Types

- **fix**: Addresses specific issues
- **improvement**: Suggests enhancements
- **insight**: Provides analysis and context

### Impact Scoring

Recommendations include impact scores (0-1) for:

- **accessibility**: Improves accessibility
- **ux**: Enhances user experience
- **branding**: Strengthens brand consistency
- **performance**: Optimizes performance

### Implementation Details

Each recommendation includes:

- **difficulty**: easy, medium, or hard
- **estimatedEffort**: Time estimate (e.g., "30-60 minutes")
- **steps**: Ordered implementation steps

## Batch Validation

Validate multiple designs simultaneously for comprehensive analysis.

### Basic Batch Validation

```typescript
const designs = [
  loginScreen,
  dashboardScreen,
  profileScreen,
  settingsScreen
]

const batchResult = await validator.validateBatch(designs)

console.log(`Total Designs: ${batchResult.totalDesigns}`)
console.log(`Total Issues: ${batchResult.aggregatedSummary.totalIssues}`)
console.log(`Average Issues per Design: ${batchResult.aggregatedSummary.averageIssuesPerDesign.toFixed(1)}`)

console.log(`\nMost Common Issues:`)
batchResult.aggregatedSummary.mostCommonIssues.forEach((issue, i) => {
  console.log(`${i + 1}. ${issue.ruleId}: ${issue.count} occurrences (${issue.severity})`)
})

// Individual results
batchResult.results.forEach((result, i) => {
  console.log(`\nDesign ${i + 1}: ${result.design.name}`)
  console.log(`  Issues: ${result.summary.totalIssues}`)
  console.log(`  Errors: ${result.summary.errorCount}`)
  console.log(`  Warnings: ${result.summary.warningCount}`)
})
```

### Batch Analytics

```typescript
const batchResult = await validator.validateBatch(designs)

// Aggregate statistics
const stats = batchResult.aggregatedSummary

console.log('Batch Validation Report')
console.log('======================')
console.log(`Designs Validated: ${batchResult.totalDesigns}`)
console.log(`Completed: ${batchResult.completedAt.toISOString()}`)
console.log('')
console.log('Issue Summary:')
console.log(`  Total Issues: ${stats.totalIssues}`)
console.log(`  Errors: ${stats.errorCount}`)
console.log(`  Warnings: ${stats.warningCount}`)
console.log(`  Info: ${stats.infoCount}`)
console.log(`  Average per Design: ${stats.averageIssuesPerDesign.toFixed(2)}`)
console.log('')
console.log('Top Issues:')
stats.mostCommonIssues.slice(0, 5).forEach((issue, i) => {
  const percentage = ((issue.count / stats.totalIssues) * 100).toFixed(1)
  console.log(`  ${i + 1}. ${issue.ruleId}`)
  console.log(`     Count: ${issue.count} (${percentage}%)`)
  console.log(`     Severity: ${issue.severity}`)
})
```

## Integration Examples

### Figma Plugin Integration

```typescript
// Figma plugin code
async function validateFigmaSelection() {
  const selection = figma.currentPage.selection

  if (selection.length === 0) {
    figma.notify('Please select a frame or component')
    return
  }

  // Convert Figma node to design format
  const design = convertFigmaNodeToDesign(selection[0])

  // Validate
  const validator = new DesignValidator({
    accessibility: { wcagLevel: WCAGLevel.AA },
    brandGuide: loadBrandGuide()
  })

  const result = validator.validate(design)

  // Display results in Figma UI
  figma.ui.postMessage({
    type: 'validation-results',
    data: {
      totalIssues: result.summary.totalIssues,
      issues: result.issues,
      recommendations: validator.getRecommendations(result.issues)
    }
  })
}

function convertFigmaNodeToDesign(node: SceneNode): Design {
  // Convert Figma node properties to Design format
  return {
    id: node.id,
    name: node.name,
    type: 'component',
    elements: convertChildren(node)
  }
}
```

### Sketch Plugin Integration

```typescript
// Sketch plugin code
function validateSketchArtboard(artboard) {
  const design = convertSketchArtboardToDesign(artboard)

  const validator = new DesignValidator()
  const result = validator.validate(design)

  // Show results in Sketch
  displayResults(result)
}

function convertSketchArtboardToDesign(artboard) {
  return {
    id: String(artboard.id),
    name: artboard.name,
    type: 'screen',
    viewport: {
      width: artboard.frame.width,
      height: artboard.frame.height
    },
    elements: artboard.layers.map(convertSketchLayer)
  }
}
```

### CI/CD Integration

```typescript
// ci-validation.ts
import { DesignValidator } from '@ainative/ai-kit-tools'
import { loadDesignsFromFiles } from './utils'

async function validateInCI() {
  const designs = await loadDesignsFromFiles('./designs')
  const validator = new DesignValidator({
    accessibility: { wcagLevel: WCAGLevel.AA }
  })

  const batchResult = await validator.validateBatch(designs)

  // Fail CI if there are errors
  const hasErrors = batchResult.aggregatedSummary.errorCount > 0

  if (hasErrors) {
    console.error(`❌ Validation failed with ${batchResult.aggregatedSummary.errorCount} errors`)
    process.exit(1)
  } else {
    console.log(`✅ All designs passed validation`)

    if (batchResult.aggregatedSummary.warningCount > 0) {
      console.warn(`⚠️  ${batchResult.aggregatedSummary.warningCount} warnings found`)
    }
  }

  // Generate report
  generateHTMLReport(batchResult, './reports/design-validation.html')
}

validateInCI()
```

### React Component Validation

```typescript
import React, { useEffect, useState } from 'react'
import { DesignValidator } from '@ainative/ai-kit-tools'

function DesignValidationPanel({ design }) {
  const [result, setResult] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    const validator = new DesignValidator()
    const validationResult = validator.validate(design)

    setResult(validationResult)
    setRecommendations(validator.getRecommendations(validationResult.issues))
  }, [design])

  if (!result) return <div>Validating...</div>

  return (
    <div className="validation-panel">
      <h2>Validation Results</h2>

      <div className="summary">
        <div className="stat">
          <span className="label">Total Issues</span>
          <span className="value">{result.summary.totalIssues}</span>
        </div>
        <div className="stat error">
          <span className="label">Errors</span>
          <span className="value">{result.summary.errorCount}</span>
        </div>
        <div className="stat warning">
          <span className="label">Warnings</span>
          <span className="value">{result.summary.warningCount}</span>
        </div>
        <div className="stat info">
          <span className="label">Info</span>
          <span className="value">{result.summary.infoCount}</span>
        </div>
      </div>

      <div className="wcag-compliance">
        <h3>WCAG {result.summary.wcagCompliance.level} Compliance</h3>
        <span className={result.summary.wcagCompliance.compliant ? 'pass' : 'fail'}>
          {result.summary.wcagCompliance.compliant ? '✓ Compliant' : '✗ Non-compliant'}
        </span>
      </div>

      <div className="issues">
        <h3>Issues</h3>
        {result.issues.map(issue => (
          <div key={issue.id} className={`issue ${issue.severity}`}>
            <div className="issue-header">
              <span className="severity">{issue.severity}</span>
              <span className="category">{issue.category}</span>
            </div>
            <div className="issue-message">{issue.message}</div>
            <div className="issue-description">{issue.description}</div>
            {issue.suggestions && (
              <div className="suggestions">
                <h4>Suggestions:</h4>
                <ul>
                  {issue.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="recommendations">
        <h3>AI Recommendations</h3>
        {recommendations.map(rec => (
          <div key={rec.id} className="recommendation">
            <h4>{rec.title}</h4>
            <p>{rec.description}</p>
            <div className="implementation">
              <span className="difficulty">{rec.implementation.difficulty}</span>
              <span className="effort">{rec.implementation.estimatedEffort}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

### DesignValidator

Main class for validating designs.

#### Constructor

```typescript
constructor(config?: ValidatorConfig)
```

#### Methods

##### validate(design: Design): ValidationResult

Run complete validation with all enabled rules.

##### validateAccessibility(design: Design): ValidationResult

Validate accessibility compliance only.

##### validateBranding(design: Design, brandGuide?: BrandGuide): ValidationResult

Validate branding consistency. Requires brand guide.

##### validateUX(design: Design): ValidationResult

Validate UX patterns only.

##### validateResponsive(design: Design): ValidationResult

Validate responsive design only.

##### validatePerformance(design: Design): ValidationResult

Validate performance optimization only.

##### calculateContrast(foreground: Color, background: Color): ContrastResult

Calculate WCAG color contrast ratio.

##### validateTouchTarget(element: DesignElement): TouchTargetResult

Validate touch target size for element.

##### validateTypography(element: DesignElement, brandGuide: BrandGuide): TypographyResult

Validate typography against brand guide.

##### getRecommendations(issues: ValidationIssue[]): AIRecommendation[]

Get AI-powered recommendations for issues.

##### validateBatch(designs: Design[]): Promise<BatchValidationResult>

Validate multiple designs simultaneously.

##### addRule(rule: ValidationRule): void

Add custom validation rule.

##### removeRule(ruleId: string): void

Remove validation rule by ID.

##### getRules(): ValidationRule[]

Get all active validation rules.

### Factory Functions

#### createDesignValidator(config?: ValidatorConfig): DesignValidator

Create a new design validator instance.

## Best Practices

### 1. Start with Accessibility

Always prioritize accessibility validation:

```typescript
// Run accessibility first
const a11yResult = validator.validateAccessibility(design)

if (a11yResult.summary.errorCount > 0) {
  console.error('Fix accessibility errors before continuing')
  // Handle errors
}
```

### 2. Use Brand Guides

Define comprehensive brand guidelines:

```typescript
const brandGuide = {
  // Be specific and complete
  colors: { /* all color variants */ },
  typography: { /* all text styles */ },
  spacing: { /* complete scale */ }
}
```

### 3. Configure for Your Needs

Customize validation settings:

```typescript
// Stricter for public-facing apps
const strictValidator = new DesignValidator({
  accessibility: { wcagLevel: WCAGLevel.AAA },
  branding: { strictMode: true }
})

// More flexible for internal tools
const flexibleValidator = new DesignValidator({
  accessibility: { wcagLevel: WCAGLevel.AA },
  branding: { strictMode: false, colorTolerance: 10 }
})
```

### 4. Automate Validation

Integrate into your workflow:

```typescript
// CI/CD pipeline
// pre-commit hook
// design tool plugin
```

### 5. Act on Recommendations

Prioritize by impact and difficulty:

```typescript
const recs = validator.getRecommendations(issues)

// Sort by priority and filter by difficulty
const highPriorityEasyFixes = recs
  .filter(r => r.implementation.difficulty === 'easy')
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 5)

// Tackle these first
```

## Troubleshooting

### Common Issues

#### "Brand guide is required for branding validation"

```typescript
// Solution: Provide brand guide
const validator = new DesignValidator({ brandGuide: myBrandGuide })
// Or pass to method
validator.validateBranding(design, myBrandGuide)
```

#### Too Many False Positives

```typescript
// Solution: Adjust tolerance or ignore rules
const validator = new DesignValidator({
  branding: {
    colorTolerance: 10, // More flexible
    typographyTolerance: 5
  },
  ignoreRules: ['brand-spacing'] // Skip problematic rules
})
```

#### Performance with Large Designs

```typescript
// Solution: Validate specific categories
// Instead of full validation:
const result = validator.validate(hugeDesign) // Slow

// Do targeted validation:
const a11yResult = validator.validateAccessibility(hugeDesign) // Faster
```

#### Custom Rule Not Working

```typescript
// Ensure rule is added and enabled
validator.addRule(myRule)

// Check it's not in ignore list
const config = {
  customRules: [myRule],
  ignoreRules: [] // Make sure your rule ID isn't here
}
```

### Getting Help

- Check the [examples](../../examples/)
- Review [test cases](../../packages/tools/__tests__/design-validator.test.ts)
- Open an issue on [GitHub](https://github.com/AINative-Studio/ai-kit)

## Next Steps

- Explore [Code Interpreter](./code-interpreter.md)
- Learn about [ZeroDB Integration](./zerodb-integration.md)
- Check out [Web Search](./web-search.md)
