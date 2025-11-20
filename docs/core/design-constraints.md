# Design Constraints

Comprehensive system for defining and enforcing design constraints in AI-generated designs through prompt engineering.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Constraint Types](#constraint-types)
- [Prompt Engineering](#prompt-engineering)
- [Validation](#validation)
- [Templates](#templates)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The Design Constraints system enables you to define, enforce, and validate design rules in AI-generated interfaces. By converting constraints into optimized prompt instructions, you can guide AI models to produce designs that adhere to your brand guidelines, design systems, and accessibility requirements.

### Key Features

- **Comprehensive Constraint Types**: Layout, color, typography, components, accessibility, spacing, and custom constraints
- **Prompt Generation**: Automatically convert constraints into AI-friendly prompt instructions
- **Validation Engine**: Validate AI-generated designs against defined constraints
- **Template Library**: Pre-built templates for Material Design, iOS, Tailwind, Bootstrap, and more
- **Natural Language Parsing**: Define constraints using natural language descriptions
- **Constraint Composition**: Merge, extend, and layer constraint sets
- **Conflict Resolution**: Intelligent handling of conflicting constraints
- **Priority System**: Define critical, high, medium, and low priority constraints

### Use Cases

- **AI-Powered Design Tools**: Ensure AI-generated UIs follow design system guidelines
- **Design System Enforcement**: Validate designs against brand standards
- **Accessibility Compliance**: Enforce WCAG requirements in AI designs
- **Rapid Prototyping**: Guide AI to create consistent, on-brand prototypes
- **Design QA**: Automated validation of design outputs

## Installation

```bash
npm install @ainative/ai-kit-core
# or
yarn add @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-core
```

## Quick Start

### Basic Usage

```typescript
import { DesignConstraints, ConstraintType, ConstraintPriority } from '@ainative/ai-kit-core/design';

// Create a constraint set
const constraints = new DesignConstraints({
  name: 'My Design System',
  description: 'Company brand guidelines',
  constraints: [],
});

// Define layout constraints
constraints.defineLayoutConstraint('main-layout', {
  system: ['grid'],
  gridColumns: 12,
  maxWidth: '1200px',
}, {
  priority: ConstraintPriority.HIGH,
});

// Define color constraints
constraints.defineColorConstraint('brand-colors', {
  palette: {
    primary: ['#3B82F6', '#2563EB'],
    secondary: ['#6B7280'],
  },
  minContrast: 4.5,
}, {
  priority: ConstraintPriority.HIGH,
});

// Generate prompt instructions
const instructions = constraints.toPromptInstructions({
  format: 'natural',
  includeExamples: true,
});

console.log(instructions);
// Use these instructions in your AI prompts

// Validate AI output
const design = {
  layout: { columns: 12 },
  colors: ['#3B82F6', '#6B7280'],
};

const validation = constraints.validateOutput(design);
console.log(`Valid: ${validation.valid}`);
console.log(`Score: ${validation.score}%`);
```

### Using Templates

```typescript
import { createMaterialDesignTemplate } from '@ainative/ai-kit-core/design';

// Create a Material Design constraint set
const materialConstraints = createMaterialDesignTemplate();

// Generate prompts
const prompts = materialConstraints.toPromptInstructions();

// Validate against Material Design guidelines
const validation = materialConstraints.validateOutput(myDesign);
```

## Core Concepts

### Constraint Sets

A `ConstraintSet` is a collection of design rules that work together to define a design system. Each set has:

- **Name**: Identifier for the constraint set
- **Description**: Purpose and context
- **Constraints**: Array of individual constraints
- **Conditional Constraints**: Rules that apply based on conditions
- **Configuration**: Strictness, partial compliance options

### Constraint Types

The system supports seven core constraint types:

1. **Layout**: Grid systems, flexbox, spacing, alignment
2. **Color**: Palettes, contrast ratios, color harmony
3. **Typography**: Font families, scales, weights, hierarchy
4. **Component**: Allowed components, variants, nesting
5. **Accessibility**: WCAG compliance, touch targets, ARIA
6. **Spacing**: Spacing systems, consistency rules
7. **Custom**: User-defined constraints with custom validators

### Priority Levels

Constraints have four priority levels:

- **CRITICAL**: Must be followed; validation fails if violated
- **HIGH**: Strongly recommended; generates errors
- **MEDIUM**: Recommended; generates warnings
- **LOW**: Optional; generates suggestions

### Validation Results

Validation produces:

- **Valid**: Boolean indicating overall compliance
- **Score**: 0-100 percentage of constraints met
- **Issues**: Detailed list of violations with severity
- **Summary**: Total, passed, failed, and warning counts

## Constraint Types

### Layout Constraints

Control layout systems, grid configurations, and spatial organization.

```typescript
constraints.defineLayoutConstraint('responsive-grid', {
  system: ['grid', 'flexbox'],
  gridColumns: 12,
  gridGap: '16px',
  maxWidth: '1200px',
  minWidth: '320px',
  alignment: ['left', 'center'],
  direction: ['row', 'column'],
  wrap: true,
}, {
  name: 'Responsive Grid System',
  description: '12-column responsive grid with flexbox fallback',
  priority: ConstraintPriority.HIGH,
});
```

**Layout Rules:**

- `system`: Allowed layout systems (grid, flexbox, stack, absolute, float)
- `gridColumns`: Number of columns or range (e.g., `{ min: 8, max: 16 }`)
- `gridGap`: Gap between grid items
- `maxWidth` / `minWidth`: Container width constraints
- `aspectRatio`: Aspect ratio requirements
- `alignment`: Allowed alignment options
- `direction`: Layout direction options
- `wrap`: Whether wrapping is allowed

**Prompt Generation:**

```
Layout should use grid or flexbox layout system
Layout should use 12 columns
Maximum width should be 1200px
```

### Color Constraints

Define color palettes, ensure contrast ratios, and enforce color harmony.

```typescript
constraints.defineColorConstraint('accessible-palette', {
  palette: {
    primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
    secondary: ['#6B7280', '#4B5563'],
    accent: ['#10B981'],
    neutral: ['#FFFFFF', '#F3F4F6', '#E5E7EB', '#000000'],
    semantic: {
      success: ['#10B981'],
      warning: ['#F59E0B'],
      error: ['#EF4444'],
      info: ['#3B82F6'],
    },
  },
  formats: ['hex', 'rgb'],
  maxColors: 8,
  minContrast: 4.5, // WCAG AA standard
  colorHarmony: ['analogous', 'complementary'],
}, {
  priority: ConstraintPriority.HIGH,
});
```

**Color Rules:**

- `palette`: Defined color palette with categories
- `formats`: Allowed color formats (hex, rgb, rgba, hsl, hsla, named)
- `maxColors`: Maximum number of colors in design
- `minContrast`: Minimum WCAG contrast ratio
- `allowedColors` / `forbiddenColors`: Color allowlists/blocklists
- `colorHarmony`: Preferred color harmony types

**Prompt Generation:**

```
Use color palette: primary colors #3B82F6, #2563EB, #1D4ED8
Secondary colors: #6B7280, #4B5563
Maintain minimum contrast ratio of 4.5:1 for accessibility
```

### Typography Constraints

Control font families, type scales, weights, and hierarchy.

```typescript
constraints.defineTypographyConstraint('brand-typography', {
  fontFamilies: {
    heading: ['Montserrat', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    monospace: ['Fira Code', 'monospace'],
  },
  scale: {
    baseSize: 16,
    ratio: 1.25, // Major third
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 20,
      xl: 25,
      '2xl': 31,
      '3xl': 39,
      '4xl': 49,
    },
  },
  weights: [400, 600, 700],
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
  maxLevels: 6, // h1-h6
}, {
  priority: ConstraintPriority.HIGH,
});
```

**Typography Rules:**

- `fontFamilies`: Font stacks for different text types
- `scale`: Type scale with base size and ratio
- `weights`: Allowed font weights
- `lineHeights`: Line height options
- `letterSpacing`: Letter spacing options
- `maxLevels`: Maximum heading hierarchy levels

**Modular Type Scale:**

The `ratio` property supports standard typographic scales:

- 1.067 (Minor Second)
- 1.125 (Major Second)
- 1.200 (Minor Third)
- 1.250 (Major Third)
- 1.333 (Perfect Fourth)
- 1.414 (Augmented Fourth)
- 1.500 (Perfect Fifth)
- 1.618 (Golden Ratio)

### Component Constraints

Define allowed components, variants, and composition rules.

```typescript
constraints.defineComponentConstraint('ui-components', {
  allowedComponents: [
    'Button',
    'Input',
    'Card',
    'Modal',
    'Dropdown',
    'Tabs',
  ],
  forbiddenComponents: ['Accordion', 'Carousel'],
  sizes: {
    sm: { height: '32px', padding: '8px 16px' },
    md: { height: '40px', padding: '10px 24px' },
    lg: { height: '48px', padding: '12px 32px' },
  },
  variants: ['filled', 'outlined', 'ghost', 'link'],
  maxNestingLevel: 5,
  composition: {
    maxChildren: 10,
    allowedChildren: ['Button', 'Input'],
  },
}, {
  priority: ConstraintPriority.MEDIUM,
});
```

**Component Rules:**

- `allowedComponents`: Whitelist of allowed component types
- `forbiddenComponents`: Blacklist of forbidden components
- `sizes`: Size variants with dimensions
- `variants`: Style variants
- `maxNestingLevel`: Maximum component nesting depth
- `composition`: Rules for component children

### Accessibility Constraints

Enforce WCAG compliance and accessibility best practices.

```typescript
constraints.defineAccessibilityConstraint('wcag-aa', {
  wcagLevel: 'AA', // 'A', 'AA', or 'AAA'
  minContrast: 4.5, // 4.5 for AA, 7.0 for AAA
  requireAltText: true,
  requireAriaLabels: true,
  keyboardNavigable: true,
  focusVisible: true,
  screenReaderOptimized: true,
  colorBlindSafe: true,
  minTouchTarget: 44, // iOS: 44px, Material: 48px
}, {
  priority: ConstraintPriority.CRITICAL,
});
```

**Accessibility Rules:**

- `wcagLevel`: WCAG conformance level (A, AA, AAA)
- `minContrast`: Minimum color contrast ratio
- `requireAltText`: Images must have alt text
- `requireAriaLabels`: Interactive elements need ARIA labels
- `keyboardNavigable`: Full keyboard navigation support
- `focusVisible`: Visible focus indicators required
- `screenReaderOptimized`: Screen reader optimization
- `colorBlindSafe`: Color-blind friendly design
- `minTouchTarget`: Minimum touch target size in pixels

### Spacing Constraints

Define spacing systems and ensure consistency.

```typescript
constraints.defineSpacingConstraint('8pt-grid', {
  system: {
    base: 8,
    scale: [4, 8, 12, 16, 24, 32, 40, 48, 56, 64],
    custom: {
      'section-gap': 96,
      'page-margin': 24,
    },
  },
  minSpacing: 4,
  maxSpacing: 128,
  consistent: true, // Enforce consistent spacing
}, {
  priority: ConstraintPriority.MEDIUM,
});
```

**Spacing Rules:**

- `system`: Spacing system with base unit and scale
- `minSpacing` / `maxSpacing`: Spacing bounds
- `consistent`: Require consistent spacing throughout

### Custom Constraints

Define custom validation logic and prompt generation.

```typescript
constraints.defineCustomConstraint('no-inline-styles', {
  rule: 'No inline styles allowed',
}, {
  name: 'No Inline Styles',
  priority: ConstraintPriority.MEDIUM,
  validator: (design) => {
    const hasInlineStyles = design.components?.some(
      (comp: any) => comp.style
    );

    if (hasInlineStyles) {
      return {
        valid: false,
        score: 0,
        issues: [{
          constraintId: 'no-inline-styles',
          constraintType: ConstraintType.CUSTOM,
          severity: ValidationSeverity.WARNING,
          message: 'Components should not use inline styles',
          suggestion: 'Use CSS classes or styled components',
        }],
        summary: { total: 1, passed: 0, failed: 1, warnings: 1 },
      };
    }

    return {
      valid: true,
      score: 100,
      issues: [],
      summary: { total: 1, passed: 1, failed: 0, warnings: 0 },
    };
  },
  promptGenerator: (rules) => [
    'Do not use inline styles',
    'Use CSS classes or styled-components',
    'Separate presentation from structure',
  ],
});
```

## Prompt Engineering

The core value of the Design Constraints system is converting constraints into effective AI prompts.

### Prompt Formats

#### Structured Format

Clear, machine-readable format for AI models:

```typescript
const instructions = constraints.toPromptInstructions({
  format: 'structured',
});

// Output:
// LAYOUT_SYSTEM: grid, flexbox
// GRID_COLUMNS: 12
// COLOR_PALETTE: {"primary":["#3B82F6"],"secondary":["#6B7280"]}
// MIN_CONTRAST: 4.5
```

#### Natural Language Format

Human-readable format that's easier to understand:

```typescript
const instructions = constraints.toPromptInstructions({
  format: 'natural',
});

// Output:
// Use grid or flexbox layout system
// Layout should use 12 columns
// Use color palette: primary colors #3B82F6
// Maintain minimum contrast ratio of 4.5:1 for accessibility
```

#### Mixed Format

Combines both approaches for clarity and precision:

```typescript
const instructions = constraints.toPromptInstructions({
  format: 'mixed',
});

// Output combines natural language with structured data
```

### Prompt Options

```typescript
interface PromptGenerationOptions {
  format?: 'structured' | 'natural' | 'mixed';
  includeExamples?: boolean;
  groupByType?: boolean;
  priorityThreshold?: ConstraintPriority;
  maxLength?: number;
}
```

**Example:**

```typescript
const instructions = constraints.toPromptInstructions({
  format: 'natural',
  includeExamples: true,
  groupByType: true,
  priorityThreshold: ConstraintPriority.MEDIUM,
  maxLength: 50,
});
```

### Integration with AI Models

#### OpenAI

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const instructions = constraints.toPromptInstructions({
  format: 'natural',
  includeExamples: true,
});

const systemPrompt = `
You are a UI designer. Generate a design following these constraints:

${instructions.map(section => `
${section.section}:
${section.instructions.join('\n')}
${section.examples ? '\nExamples:\n' + section.examples.join('\n') : ''}
`).join('\n\n')}
`;

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Create a login page' },
  ],
});
```

#### Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const instructions = constraints.toPromptInstructions({
  format: 'structured',
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  system: `Design constraints:\n${JSON.stringify(instructions, null, 2)}`,
  messages: [
    { role: 'user', content: 'Design a dashboard interface' },
  ],
});
```

## Validation

Validate AI-generated designs against constraints.

### Basic Validation

```typescript
const design = {
  layout: { columns: 12 },
  colors: ['#3B82F6', '#6B7280'],
  components: [
    { type: 'Button', variant: 'filled' },
    { type: 'Input', size: 'md' },
  ],
};

const result = constraints.validateOutput(design);

console.log(result.valid); // true/false
console.log(result.score); // 0-100
console.log(result.issues); // Array of validation issues
console.log(result.summary); // Summary statistics
```

### Validation Results

```typescript
interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface ValidationIssue {
  constraintId: string;
  constraintType: ConstraintType;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  expected?: any;
  actual?: any;
  suggestion?: string;
}
```

### Handling Validation Issues

```typescript
const result = constraints.validateOutput(design);

if (!result.valid) {
  console.log(`Design validation failed (${result.score}% compliant)`);

  // Group by severity
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => {
      console.log(`- ${error.message}`);
      if (error.suggestion) {
        console.log(`  Suggestion: ${error.suggestion}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => {
      console.log(`- ${warning.message}`);
    });
  }
}
```

## Templates

Pre-built constraint sets for popular design systems.

### Available Templates

- **Material Design 3**: Google's design system
- **iOS Human Interface Guidelines**: Apple's design system
- **Tailwind CSS**: Utility-first CSS framework
- **Bootstrap 5**: Popular responsive framework
- **Minimal Design**: Clean, minimal aesthetic

### Using Templates

```typescript
import {
  createMaterialDesignTemplate,
  createiOSTemplate,
  createTailwindTemplate,
  createBootstrapTemplate,
  createMinimalTemplate,
} from '@ainative/ai-kit-core/design';

// Create template
const material = createMaterialDesignTemplate();

// Use directly
const prompts = material.toPromptInstructions();

// Or customize
material.defineColorConstraint('brand-override', {
  palette: {
    primary: ['#YOUR_BRAND_COLOR'],
  },
}, {
  priority: ConstraintPriority.CRITICAL,
});
```

### Template Registry

```typescript
import { createFromTemplate, getAvailableTemplates } from '@ainative/ai-kit-core/design';

// List available templates
const templates = getAvailableTemplates();
console.log(templates); // ['material', 'ios', 'tailwind', 'bootstrap', 'minimal']

// Create from registry
const constraints = createFromTemplate('material');
```

## Advanced Features

### Natural Language Parsing

Define constraints using natural language:

```typescript
const result = constraints.parseNaturalLanguage({
  description: 'Use a 12 column grid with colors #3B82F6 and #6B7280, must be WCAG AA accessible',
  priority: ConstraintPriority.HIGH,
});

if (result.success) {
  result.constraints.forEach(constraint => {
    constraints.defineConstraint(constraint);
  });
}
```

### Merging Constraint Sets

Combine multiple constraint sets:

```typescript
const baseConstraints = createMaterialDesignTemplate();
const customConstraints = new DesignConstraints({
  name: 'Custom',
  constraints: [],
});

customConstraints.defineColorConstraint('brand', {
  palette: { primary: ['#YOUR_COLOR'] },
});

// Merge with different strategies
const merged = baseConstraints.merge(customConstraints, {
  strategy: ConflictStrategy.OVERRIDE, // or MERGE, STRICT, PRIORITIZE, IGNORE_DUPLICATES
});
```

### Extending Constraints

Create specialized versions of base constraints:

```typescript
const base = createMaterialDesignTemplate();

const specialized = new DesignConstraints({
  name: 'Specialized',
  constraints: [],
});

specialized.defineComponentConstraint('custom', {
  allowedComponents: ['MyCustomComponent'],
});

const extended = specialized.extend(base);
// Extended now has all base constraints plus specialized ones
```

### Conditional Constraints

Apply constraints based on conditions:

```typescript
const config: ConstraintSetConfig = {
  name: 'Responsive Design',
  constraints: [],
  conditionalConstraints: [
    {
      condition: {
        property: 'viewport.width',
        operator: 'lessThan',
        value: 768,
      },
      thenConstraints: [
        {
          id: 'mobile-layout',
          type: ConstraintType.LAYOUT,
          name: 'Mobile Layout',
          priority: ConstraintPriority.HIGH,
          enabled: true,
          rules: {
            system: ['stack'],
            gridColumns: 4,
          },
        },
      ],
      elseConstraints: [
        {
          id: 'desktop-layout',
          type: ConstraintType.LAYOUT,
          name: 'Desktop Layout',
          priority: ConstraintPriority.HIGH,
          enabled: true,
          rules: {
            system: ['grid'],
            gridColumns: 12,
          },
        },
      ],
    },
  ],
};
```

## API Reference

### DesignConstraints

#### Constructor

```typescript
constructor(config: ConstraintSetConfig)
```

#### Methods

**Constraint Definition:**

- `defineConstraint(constraint: Constraint): void`
- `defineLayoutConstraint(id, rules, options): LayoutConstraint`
- `defineColorConstraint(id, rules, options): ColorConstraint`
- `defineTypographyConstraint(id, rules, options): TypographyConstraint`
- `defineComponentConstraint(id, rules, options): ComponentConstraint`
- `defineAccessibilityConstraint(id, rules, options): AccessibilityConstraint`
- `defineSpacingConstraint(id, rules, options): SpacingConstraint`
- `defineCustomConstraint(id, rules, options): CustomConstraint`

**Constraint Management:**

- `getConstraint(id: string): Constraint | undefined`
- `getAllConstraints(): Constraint[]`
- `getConstraintsByType(type: ConstraintType): Constraint[]`
- `removeConstraint(id: string): boolean`
- `setConstraintEnabled(id: string, enabled: boolean): void`
- `getConstraintCount(): number`
- `clear(): void`

**Prompt Generation:**

- `toPromptInstructions(options?: PromptGenerationOptions): PromptInstruction[]`

**Validation:**

- `validateOutput(design: DesignOutput): ValidationResult`

**Composition:**

- `merge(other: DesignConstraints, options?: MergeOptions): DesignConstraints`
- `extend(base: DesignConstraints): DesignConstraints`

**Natural Language:**

- `parseNaturalLanguage(input: NaturalLanguageConstraint): ConstraintParseResult`

## Best Practices

### 1. Start with Templates

Use pre-built templates as a foundation:

```typescript
const constraints = createMaterialDesignTemplate();
// Then customize as needed
```

### 2. Set Appropriate Priorities

Use priority levels strategically:

- **CRITICAL**: Accessibility, legal requirements
- **HIGH**: Brand guidelines, design system rules
- **MEDIUM**: Best practices, recommendations
- **LOW**: Nice-to-have suggestions

### 3. Group Related Constraints

Organize constraints logically:

```typescript
// Good: Separate concerns
constraints.defineColorConstraint('palette', { ... });
constraints.defineColorConstraint('contrast', { ... });

// Avoid: Too many rules in one constraint
```

### 4. Include Examples in Prompts

Examples improve AI understanding:

```typescript
const instructions = constraints.toPromptInstructions({
  includeExamples: true,
});
```

### 5. Validate Early and Often

Validate designs during generation, not just at the end:

```typescript
// After each AI generation step
const result = constraints.validateOutput(partialDesign);
if (!result.valid && result.score < 80) {
  // Regenerate or adjust
}
```

### 6. Use Natural Language for Complex Rules

When structured constraints are insufficient:

```typescript
constraints.parseNaturalLanguage({
  description: 'Buttons should have rounded corners with 8px radius and subtle shadow',
  priority: ConstraintPriority.MEDIUM,
});
```

### 7. Document Custom Constraints

Always document custom validation logic:

```typescript
constraints.defineCustomConstraint('custom', rules, {
  description: 'Detailed explanation of what this validates and why',
  validator: customValidator,
});
```

## Examples

### Example 1: E-commerce Design System

```typescript
const ecommerce = new DesignConstraints({
  name: 'E-commerce Design System',
  constraints: [],
});

// Layout
ecommerce.defineLayoutConstraint('product-grid', {
  system: ['grid'],
  gridColumns: { min: 2, max: 4 },
  gridGap: '24px',
  maxWidth: '1400px',
});

// Colors
ecommerce.defineColorConstraint('brand-colors', {
  palette: {
    primary: ['#FF6B6B'], // Red for CTA
    secondary: ['#4ECDC4'], // Teal for accents
    neutral: ['#F7F7F7', '#E0E0E0', '#333333'],
    semantic: {
      success: ['#51CF66'],
      error: ['#FF6B6B'],
    },
  },
  minContrast: 4.5,
});

// Typography
ecommerce.defineTypographyConstraint('typography', {
  fontFamilies: {
    heading: ['Montserrat', 'sans-serif'],
    body: ['Open Sans', 'sans-serif'],
  },
  scale: {
    baseSize: 16,
    ratio: 1.25,
  },
  weights: [400, 600, 700],
});

// Components
ecommerce.defineComponentConstraint('components', {
  allowedComponents: [
    'ProductCard',
    'AddToCartButton',
    'PriceTag',
    'Rating',
    'ImageGallery',
  ],
  sizes: {
    sm: { height: '36px', padding: '8px 16px' },
    md: { height: '44px', padding: '12px 24px' },
    lg: { height: '52px', padding: '16px 32px' },
  },
});

// Accessibility
ecommerce.defineAccessibilityConstraint('a11y', {
  wcagLevel: 'AA',
  requireAltText: true,
  minTouchTarget: 44,
});

// Generate prompts
const prompts = ecommerce.toPromptInstructions({
  format: 'mixed',
  includeExamples: true,
});
```

### Example 2: SaaS Dashboard

```typescript
const dashboard = new DesignConstraints({
  name: 'SaaS Dashboard',
  constraints: [],
});

// Use Tailwind as base
const tailwind = createTailwindTemplate();
const combined = dashboard.extend(tailwind);

// Add dashboard-specific constraints
combined.defineLayoutConstraint('sidebar', {
  system: ['flexbox'],
  maxWidth: '280px',
  minWidth: '240px',
});

combined.defineComponentConstraint('charts', {
  allowedComponents: [
    'LineChart',
    'BarChart',
    'PieChart',
    'MetricCard',
  ],
});

combined.defineCustomConstraint('dark-mode', {
  supportsDarkMode: true,
}, {
  validator: (design) => {
    const hasDarkColors = design.colors?.some(
      (color: string) => color.startsWith('#1') || color.startsWith('#2')
    );

    return {
      valid: hasDarkColors,
      score: hasDarkColors ? 100 : 0,
      issues: hasDarkColors ? [] : [{
        constraintId: 'dark-mode',
        constraintType: ConstraintType.CUSTOM,
        severity: ValidationSeverity.WARNING,
        message: 'Design should include dark mode colors',
      }],
      summary: {
        total: 1,
        passed: hasDarkColors ? 1 : 0,
        failed: hasDarkColors ? 0 : 1,
        warnings: hasDarkColors ? 0 : 1,
      },
    };
  },
});
```

### Example 3: Mobile App (iOS)

```typescript
const mobileApp = createiOSTemplate();

// Customize for specific app
mobileApp.defineColorConstraint('app-colors', {
  palette: {
    primary: ['#007AFF'],
    accent: ['#FF9500'],
  },
}, {
  priority: ConstraintPriority.CRITICAL,
});

mobileApp.defineComponentConstraint('ios-components', {
  allowedComponents: [
    'NavigationBar',
    'TabBar',
    'List',
    'Card',
    'Button',
  ],
  variants: ['filled', 'outlined', 'plain'],
});

mobileApp.defineAccessibilityConstraint('ios-a11y', {
  wcagLevel: 'AA',
  minTouchTarget: 44, // iOS requirement
  requireAltText: true,
  requireAriaLabels: true,
}, {
  priority: ConstraintPriority.CRITICAL,
});

// Generate iOS-specific prompts
const iosPrompts = mobileApp.toPromptInstructions({
  format: 'natural',
  includeExamples: true,
});
```

---

## Summary

The Design Constraints system provides a comprehensive framework for:

1. **Defining** design rules across layout, color, typography, components, and more
2. **Converting** constraints into AI-optimized prompt instructions
3. **Validating** AI-generated designs against defined standards
4. **Composing** constraint sets through merging and extension
5. **Templating** common design systems for rapid adoption

This enables AI-powered design tools to produce consistent, on-brand, accessible designs at scale.

For more information, see the [API Reference](#api-reference) or explore the [Examples](#examples).
