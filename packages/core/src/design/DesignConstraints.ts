/**
 * Design Constraints System
 *
 * Define and enforce design constraints in AI-generated designs through
 * prompt engineering and validation.
 */

import {
  Constraint,
  ConstraintType,
  ConstraintPriority,
  ConstraintSetConfig,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  PromptInstruction,
  PromptGenerationOptions,
  DesignOutput,
  MergeOptions,
  ConflictStrategy,
  LayoutConstraint,
  ColorConstraint,
  TypographyConstraint,
  ComponentConstraint,
  AccessibilityConstraint,
  SpacingConstraint,
  CustomConstraint,
  NaturalLanguageConstraint,
  ConstraintParseResult,
  ConditionalConstraint,
  WCAGLevel,
} from './types';

/**
 * Design Constraints Class
 *
 * Main class for managing design constraints, generating prompt instructions,
 * and validating AI-generated designs.
 */
export class DesignConstraints {
  private constraints: Map<string, Constraint>;
  private conditionalConstraints: ConditionalConstraint[];
  private config: ConstraintSetConfig;

  constructor(config: ConstraintSetConfig) {
    this.config = config;
    this.constraints = new Map();
    this.conditionalConstraints = config.conditionalConstraints || [];

    // Initialize constraints
    config.constraints.forEach((constraint) => {
      this.constraints.set(constraint.id, constraint);
    });
  }

  /**
   * Define a new constraint
   */
  public defineConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Define a layout constraint
   */
  public defineLayoutConstraint(
    id: string,
    rules: LayoutConstraint['rules'],
    options: Partial<Omit<LayoutConstraint, 'type' | 'rules'>> = {}
  ): LayoutConstraint {
    const constraint: LayoutConstraint = {
      id,
      type: ConstraintType.LAYOUT,
      name: options.name || 'Layout Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define a color constraint
   */
  public defineColorConstraint(
    id: string,
    rules: ColorConstraint['rules'],
    options: Partial<Omit<ColorConstraint, 'type' | 'rules'>> = {}
  ): ColorConstraint {
    const constraint: ColorConstraint = {
      id,
      type: ConstraintType.COLOR,
      name: options.name || 'Color Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define a typography constraint
   */
  public defineTypographyConstraint(
    id: string,
    rules: TypographyConstraint['rules'],
    options: Partial<Omit<TypographyConstraint, 'type' | 'rules'>> = {}
  ): TypographyConstraint {
    const constraint: TypographyConstraint = {
      id,
      type: ConstraintType.TYPOGRAPHY,
      name: options.name || 'Typography Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define a component constraint
   */
  public defineComponentConstraint(
    id: string,
    rules: ComponentConstraint['rules'],
    options: Partial<Omit<ComponentConstraint, 'type' | 'rules'>> = {}
  ): ComponentConstraint {
    const constraint: ComponentConstraint = {
      id,
      type: ConstraintType.COMPONENT,
      name: options.name || 'Component Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define an accessibility constraint
   */
  public defineAccessibilityConstraint(
    id: string,
    rules: AccessibilityConstraint['rules'],
    options: Partial<Omit<AccessibilityConstraint, 'type' | 'rules'>> = {}
  ): AccessibilityConstraint {
    const constraint: AccessibilityConstraint = {
      id,
      type: ConstraintType.ACCESSIBILITY,
      name: options.name || 'Accessibility Constraint',
      priority: options.priority || ConstraintPriority.HIGH,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define a spacing constraint
   */
  public defineSpacingConstraint(
    id: string,
    rules: SpacingConstraint['rules'],
    options: Partial<Omit<SpacingConstraint, 'type' | 'rules'>> = {}
  ): SpacingConstraint {
    const constraint: SpacingConstraint = {
      id,
      type: ConstraintType.SPACING,
      name: options.name || 'Spacing Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Define a custom constraint
   */
  public defineCustomConstraint(
    id: string,
    rules: Record<string, unknown>,
    options: Partial<Omit<CustomConstraint, 'type' | 'rules'>> = {}
  ): CustomConstraint {
    const constraint: CustomConstraint = {
      id,
      type: ConstraintType.CUSTOM,
      name: options.name || 'Custom Constraint',
      priority: options.priority || ConstraintPriority.MEDIUM,
      enabled: options.enabled !== undefined ? options.enabled : true,
      description: options.description,
      tags: options.tags,
      metadata: options.metadata,
      rules,
      validator: options.validator,
      promptGenerator: options.promptGenerator,
    };

    this.defineConstraint(constraint);
    return constraint;
  }

  /**
   * Parse natural language constraint
   */
  public parseNaturalLanguage(input: NaturalLanguageConstraint): ConstraintParseResult {
    const constraints: Constraint[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Simple pattern matching for common constraint types
      const description = input.description.toLowerCase();

      // Layout constraints
      if (description.includes('grid') || description.includes('column')) {
        const gridMatch = description.match(/(\d+)\s*columns?/);
        if (gridMatch && gridMatch[1]) {
          const columns = parseInt(gridMatch[1], 10);
          constraints.push(
            this.defineLayoutConstraint(
              `nl_layout_${Date.now()}`,
              { gridColumns: columns },
              { priority: input.priority || ConstraintPriority.MEDIUM }
            )
          );
        }
      }

      // Color constraints
      if (description.includes('color') || description.includes('palette')) {
        const colorMatch = description.match(/#[0-9a-f]{6}/gi);
        if (colorMatch) {
          constraints.push(
            this.defineColorConstraint(
              `nl_color_${Date.now()}`,
              { allowedColors: colorMatch },
              { priority: input.priority || ConstraintPriority.MEDIUM }
            )
          );
        }
      }

      // Typography constraints
      if (description.includes('font') || description.includes('typography')) {
        const fontMatch = description.match(/(?:use|font-family:?)\s*['"]([^'"]+)['"]/i);
        if (fontMatch && fontMatch[1]) {
          constraints.push(
            this.defineTypographyConstraint(
              `nl_typography_${Date.now()}`,
              { fontFamilies: { body: [fontMatch[1]] } },
              { priority: input.priority || ConstraintPriority.MEDIUM }
            )
          );
        }
      }

      // Accessibility constraints
      if (description.includes('accessible') || description.includes('wcag') || description.includes('a11y')) {
        const wcagMatch = description.match(/wcag\s*(a{1,3})/i);
        const level = wcagMatch?.[1] ? (wcagMatch[1].toUpperCase() as WCAGLevel) : WCAGLevel.AA;
        constraints.push(
          this.defineAccessibilityConstraint(
            `nl_a11y_${Date.now()}`,
            { wcagLevel: level, requireAltText: true, requireAriaLabels: true },
            { priority: input.priority || ConstraintPriority.HIGH }
          )
        );
      }

      if (constraints.length === 0) {
        warnings.push('Could not extract specific constraints from description');
        // Create a generic custom constraint
        constraints.push(
          this.defineCustomConstraint(
            `nl_custom_${Date.now()}`,
            { description: input.description },
            { priority: input.priority || ConstraintPriority.LOW }
          )
        );
      }

      return {
        success: true,
        constraints,
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: constraints.length > 1 ? 0.8 : 0.5,
      };
    } catch (error) {
      errors.push(`Failed to parse constraint: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        constraints: [],
        errors,
      };
    }
  }

  /**
   * Convert constraints to prompt instructions
   */
  public toPromptInstructions(options: PromptGenerationOptions = {}): PromptInstruction[] {
    const {
      format = 'structured',
      includeExamples = true,
      groupByType = true,
      priorityThreshold = ConstraintPriority.LOW,
      maxLength,
    } = options;

    const instructions: PromptInstruction[] = [];
    const enabledConstraints = Array.from(this.constraints.values()).filter(
      (c) => c.enabled && this.isPriorityAtLeast(c.priority, priorityThreshold)
    );

    if (groupByType) {
      const grouped = this.groupByType(enabledConstraints);

      for (const [type, constraints] of Array.from(grouped.entries())) {
        const section = this.getTypeSectionName(type);
        const sectionInstructions: string[] = [];

        for (const constraint of constraints) {
          const constraintInstructions = this.generateConstraintInstructions(constraint, format);
          sectionInstructions.push(...constraintInstructions);
        }

        if (sectionInstructions.length > 0) {
          const highestPriority = this.getHighestPriority(constraints);
          instructions.push({
            section,
            priority: highestPriority,
            instructions: maxLength
              ? sectionInstructions.slice(0, maxLength)
              : sectionInstructions,
            examples: includeExamples ? this.generateExamples(type, constraints) : undefined,
          });
        }
      }
    } else {
      const allInstructions: string[] = [];
      for (const constraint of enabledConstraints) {
        const constraintInstructions = this.generateConstraintInstructions(constraint, format);
        allInstructions.push(...constraintInstructions);
      }

      instructions.push({
        section: 'Design Constraints',
        priority: this.getHighestPriority(enabledConstraints),
        instructions: maxLength ? allInstructions.slice(0, maxLength) : allInstructions,
      });
    }

    return instructions;
  }

  /**
   * Generate constraint instructions based on format
   */
  private generateConstraintInstructions(
    constraint: Constraint,
    format: 'structured' | 'natural' | 'mixed'
  ): string[] {
    const instructions: string[] = [];

    switch (constraint.type) {
      case ConstraintType.LAYOUT:
        instructions.push(...this.generateLayoutInstructions(constraint, format));
        break;
      case ConstraintType.COLOR:
        instructions.push(...this.generateColorInstructions(constraint, format));
        break;
      case ConstraintType.TYPOGRAPHY:
        instructions.push(...this.generateTypographyInstructions(constraint, format));
        break;
      case ConstraintType.COMPONENT:
        instructions.push(...this.generateComponentInstructions(constraint, format));
        break;
      case ConstraintType.ACCESSIBILITY:
        instructions.push(...this.generateAccessibilityInstructions(constraint, format));
        break;
      case ConstraintType.SPACING:
        instructions.push(...this.generateSpacingInstructions(constraint, format));
        break;
      case ConstraintType.CUSTOM:
        instructions.push(...this.generateCustomInstructions(constraint, format));
        break;
    }

    return instructions;
  }

  /**
   * Generate layout instructions
   */
  private generateLayoutInstructions(
    constraint: LayoutConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.system) {
        instructions.push(`Use ${rules.system.join(' or ')} layout system`);
      }
      if (rules.gridColumns) {
        const cols = typeof rules.gridColumns === 'number'
          ? rules.gridColumns
          : `${rules.gridColumns.min}-${rules.gridColumns.max}`;
        instructions.push(`Layout should use ${cols} columns`);
      }
      if (rules.maxWidth) {
        instructions.push(`Maximum width should be ${rules.maxWidth}`);
      }
    }

    if (format === 'structured' || format === 'mixed') {
      if (rules.system) {
        instructions.push(`LAYOUT_SYSTEM: ${rules.system.join(', ')}`);
      }
      if (rules.gridColumns) {
        instructions.push(`GRID_COLUMNS: ${JSON.stringify(rules.gridColumns)}`);
      }
      if (rules.gridGap) {
        instructions.push(`GRID_GAP: ${rules.gridGap}`);
      }
      if (rules.alignment) {
        instructions.push(`ALIGNMENT: ${rules.alignment.join(', ')}`);
      }
    }

    return instructions;
  }

  /**
   * Generate color instructions
   */
  private generateColorInstructions(
    constraint: ColorConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.palette) {
        instructions.push(`Use color palette: primary colors ${rules.palette.primary.join(', ')}`);
        if (rules.palette.secondary) {
          instructions.push(`Secondary colors: ${rules.palette.secondary.join(', ')}`);
        }
      }
      if (rules.minContrast) {
        instructions.push(`Maintain minimum contrast ratio of ${rules.minContrast}:1 for accessibility`);
      }
      if (rules.allowedColors) {
        instructions.push(`Only use these colors: ${rules.allowedColors.join(', ')}`);
      }
    }

    if (format === 'structured' || format === 'mixed') {
      if (rules.palette) {
        instructions.push(`COLOR_PALETTE: ${JSON.stringify(rules.palette)}`);
      }
      if (rules.minContrast) {
        instructions.push(`MIN_CONTRAST: ${rules.minContrast}`);
      }
      if (rules.maxColors) {
        instructions.push(`MAX_COLORS: ${rules.maxColors}`);
      }
    }

    return instructions;
  }

  /**
   * Generate typography instructions
   */
  private generateTypographyInstructions(
    constraint: TypographyConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.fontFamilies) {
        if (rules.fontFamilies.heading) {
          instructions.push(`Use ${rules.fontFamilies.heading.join(' or ')} for headings`);
        }
        if (rules.fontFamilies.body) {
          instructions.push(`Use ${rules.fontFamilies.body.join(' or ')} for body text`);
        }
      }
      if (rules.scale) {
        instructions.push(`Typography scale: base ${rules.scale.baseSize}px with ${rules.scale.ratio} ratio`);
      }
      if (rules.maxLevels) {
        instructions.push(`Maximum ${rules.maxLevels} heading levels`);
      }
    }

    if (format === 'structured' || format === 'mixed') {
      if (rules.fontFamilies) {
        instructions.push(`FONT_FAMILIES: ${JSON.stringify(rules.fontFamilies)}`);
      }
      if (rules.scale) {
        instructions.push(`TYPOGRAPHY_SCALE: ${JSON.stringify(rules.scale)}`);
      }
      if (rules.weights) {
        instructions.push(`FONT_WEIGHTS: ${rules.weights.join(', ')}`);
      }
    }

    return instructions;
  }

  /**
   * Generate component instructions
   */
  private generateComponentInstructions(
    constraint: ComponentConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.allowedComponents) {
        instructions.push(`Only use these components: ${rules.allowedComponents.join(', ')}`);
      }
      if (rules.forbiddenComponents) {
        instructions.push(`Do not use: ${rules.forbiddenComponents.join(', ')}`);
      }
      if (rules.maxNestingLevel) {
        instructions.push(`Maximum nesting depth: ${rules.maxNestingLevel} levels`);
      }
    }

    if (format === 'structured' || format === 'mixed') {
      if (rules.allowedComponents) {
        instructions.push(`ALLOWED_COMPONENTS: ${rules.allowedComponents.join(', ')}`);
      }
      if (rules.sizes) {
        instructions.push(`COMPONENT_SIZES: ${JSON.stringify(rules.sizes)}`);
      }
      if (rules.variants) {
        instructions.push(`VARIANTS: ${rules.variants.join(', ')}`);
      }
    }

    return instructions;
  }

  /**
   * Generate accessibility instructions
   */
  private generateAccessibilityInstructions(
    constraint: AccessibilityConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.wcagLevel) {
        instructions.push(`Follow WCAG ${rules.wcagLevel} accessibility standards`);
      }
      if (rules.requireAltText) {
        instructions.push('All images must have descriptive alt text');
      }
      if (rules.requireAriaLabels) {
        instructions.push('Interactive elements must have ARIA labels');
      }
      if (rules.keyboardNavigable) {
        instructions.push('Ensure all interactive elements are keyboard navigable');
      }
      if (rules.minTouchTarget) {
        instructions.push(`Minimum touch target size: ${rules.minTouchTarget}px`);
      }
    }

    if (format === 'structured' || format === 'mixed') {
      instructions.push(`WCAG_LEVEL: ${rules.wcagLevel || 'AA'}`);
      if (rules.minContrast) {
        instructions.push(`MIN_CONTRAST: ${rules.minContrast}`);
      }
      if (rules.minTouchTarget) {
        instructions.push(`MIN_TOUCH_TARGET: ${rules.minTouchTarget}px`);
      }
    }

    return instructions;
  }

  /**
   * Generate spacing instructions
   */
  private generateSpacingInstructions(
    constraint: SpacingConstraint,
    format: string
  ): string[] {
    const instructions: string[] = [];
    const { rules } = constraint;

    if (format === 'natural' || format === 'mixed') {
      if (rules.system) {
        instructions.push(`Use ${rules.system.base}px base spacing with scale: ${rules.system.scale?.join(', ')}`);
      }
      if (rules.consistent) {
        instructions.push('Maintain consistent spacing throughout the design');
      }
    }

    if (format === 'structured' || format === 'mixed') {
      if (rules.system) {
        instructions.push(`SPACING_SYSTEM: ${JSON.stringify(rules.system)}`);
      }
      if (rules.minSpacing) {
        instructions.push(`MIN_SPACING: ${rules.minSpacing}px`);
      }
      if (rules.maxSpacing) {
        instructions.push(`MAX_SPACING: ${rules.maxSpacing}px`);
      }
    }

    return instructions;
  }

  /**
   * Generate custom instructions
   */
  private generateCustomInstructions(
    constraint: CustomConstraint,
    format: string
  ): string[] {
    if (constraint.promptGenerator) {
      return constraint.promptGenerator(constraint.rules);
    }

    return [
      format === 'structured'
        ? `CUSTOM: ${JSON.stringify(constraint.rules)}`
        : constraint.description || 'Apply custom constraint',
    ];
  }

  /**
   * Validate design output against constraints
   */
  public validateOutput(design: DesignOutput): ValidationResult {
    const issues: ValidationIssue[] = [];
    let totalConstraints = 0;
    let passedConstraints = 0;

    const enabledConstraints = Array.from(this.constraints.values()).filter((c) => c.enabled);

    for (const constraint of enabledConstraints) {
      totalConstraints++;
      const constraintIssues = this.validateConstraint(constraint, design);

      if (constraintIssues.length === 0) {
        passedConstraints++;
      } else {
        issues.push(...constraintIssues);
      }
    }

    // Evaluate conditional constraints
    for (const conditional of this.conditionalConstraints) {
      if (this.evaluateCondition(conditional.condition, design)) {
        for (const constraint of conditional.thenConstraints) {
          totalConstraints++;
          const constraintIssues = this.validateConstraint(constraint, design);
          if (constraintIssues.length === 0) {
            passedConstraints++;
          } else {
            issues.push(...constraintIssues);
          }
        }
      } else if (conditional.elseConstraints) {
        for (const constraint of conditional.elseConstraints) {
          totalConstraints++;
          const constraintIssues = this.validateConstraint(constraint, design);
          if (constraintIssues.length === 0) {
            passedConstraints++;
          } else {
            issues.push(...constraintIssues);
          }
        }
      }
    }

    const failedConstraints = totalConstraints - passedConstraints;
    const warnings = issues.filter((i) => i.severity === ValidationSeverity.WARNING).length;
    const score = totalConstraints > 0 ? (passedConstraints / totalConstraints) * 100 : 100;
    const valid = this.config.strict ? issues.length === 0 : failedConstraints === 0;

    return {
      valid,
      score: Math.round(score * 100) / 100,
      issues,
      summary: {
        total: totalConstraints,
        passed: passedConstraints,
        failed: failedConstraints,
        warnings,
      },
    };
  }

  /**
   * Validate a single constraint
   */
  private validateConstraint(constraint: Constraint, design: DesignOutput): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    switch (constraint.type) {
      case ConstraintType.LAYOUT:
        issues.push(...this.validateLayoutConstraint(constraint, design));
        break;
      case ConstraintType.COLOR:
        issues.push(...this.validateColorConstraint(constraint, design));
        break;
      case ConstraintType.TYPOGRAPHY:
        issues.push(...this.validateTypographyConstraint(constraint, design));
        break;
      case ConstraintType.COMPONENT:
        issues.push(...this.validateComponentConstraint(constraint, design));
        break;
      case ConstraintType.ACCESSIBILITY:
        issues.push(...this.validateAccessibilityConstraint(constraint, design));
        break;
      case ConstraintType.SPACING:
        issues.push(...this.validateSpacingConstraint(constraint, design));
        break;
      case ConstraintType.CUSTOM:
        issues.push(...this.validateCustomConstraint(constraint, design));
        break;
    }

    return issues;
  }

  /**
   * Validate layout constraint
   */
  private validateLayoutConstraint(
    constraint: LayoutConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { rules } = constraint;

    if (rules.gridColumns && design.layout) {
      const layout = design.layout as { columns?: number };
      if (layout.columns) {
        const expected = typeof rules.gridColumns === 'number'
          ? rules.gridColumns
          : { min: rules.gridColumns.min, max: rules.gridColumns.max };

        if (typeof expected === 'number' && layout.columns !== expected) {
          issues.push({
            constraintId: constraint.id,
            constraintType: constraint.type,
            severity: this.getSeverity(constraint.priority),
            message: `Layout should have ${expected} columns`,
            path: 'layout.columns',
            expected,
            actual: layout.columns,
          });
        } else if (typeof expected !== 'number') {
          if (layout.columns < expected.min || layout.columns > expected.max) {
            issues.push({
              constraintId: constraint.id,
              constraintType: constraint.type,
              severity: this.getSeverity(constraint.priority),
              message: `Layout columns should be between ${expected.min} and ${expected.max}`,
              path: 'layout.columns',
              expected,
              actual: layout.columns,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate color constraint
   */
  private validateColorConstraint(
    constraint: ColorConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { rules } = constraint;

    if (rules.allowedColors && design.colors) {
      const disallowedColors = design.colors.filter(
        (color) => !rules.allowedColors!.includes(color)
      );

      if (disallowedColors.length > 0) {
        issues.push({
          constraintId: constraint.id,
          constraintType: constraint.type,
          severity: this.getSeverity(constraint.priority),
          message: `Design uses disallowed colors: ${disallowedColors.join(', ')}`,
          path: 'colors',
          expected: rules.allowedColors,
          actual: design.colors,
        });
      }
    }

    if (rules.maxColors && design.colors && design.colors.length > rules.maxColors) {
      issues.push({
        constraintId: constraint.id,
        constraintType: constraint.type,
        severity: this.getSeverity(constraint.priority),
        message: `Design uses too many colors (${design.colors.length} > ${rules.maxColors})`,
        path: 'colors',
        expected: rules.maxColors,
        actual: design.colors.length,
      });
    }

    return issues;
  }

  /**
   * Validate typography constraint
   */
  private validateTypographyConstraint(
    constraint: TypographyConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { rules } = constraint;

    if (rules.fontFamilies && design.typography) {
      const typography = design.typography as { fontFamily?: string };
      if (typography.fontFamily) {
        const allAllowedFonts = [
          ...(rules.fontFamilies.body || []),
          ...(rules.fontFamilies.heading || []),
          ...(rules.fontFamilies.monospace || []),
        ];

        if (!allAllowedFonts.some((font) => typography.fontFamily?.includes(font))) {
          issues.push({
            constraintId: constraint.id,
            constraintType: constraint.type,
            severity: this.getSeverity(constraint.priority),
            message: 'Font family not in allowed list',
            path: 'typography.fontFamily',
            expected: allAllowedFonts,
            actual: typography.fontFamily,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate component constraint
   */
  private validateComponentConstraint(
    constraint: ComponentConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { rules } = constraint;

    if (rules.allowedComponents && design.components) {
      const components = design.components as Array<{ type: string }>;
      const disallowedComponents = components.filter(
        (comp) => !rules.allowedComponents!.includes(comp.type)
      );

      if (disallowedComponents.length > 0) {
        issues.push({
          constraintId: constraint.id,
          constraintType: constraint.type,
          severity: this.getSeverity(constraint.priority),
          message: `Design uses disallowed components: ${disallowedComponents.map((c) => c.type).join(', ')}`,
          path: 'components',
          expected: rules.allowedComponents,
          actual: disallowedComponents.map((c) => c.type),
        });
      }
    }

    return issues;
  }

  /**
   * Validate accessibility constraint
   */
  private validateAccessibilityConstraint(
    constraint: AccessibilityConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { rules } = constraint;

    if (rules.requireAltText && design.components) {
      const components = design.components as Array<{ type: string; alt?: string }>;
      const imagesWithoutAlt = components.filter(
        (comp) => comp.type === 'image' && !comp.alt
      );

      if (imagesWithoutAlt.length > 0) {
        issues.push({
          constraintId: constraint.id,
          constraintType: constraint.type,
          severity: ValidationSeverity.ERROR,
          message: `${imagesWithoutAlt.length} images missing alt text`,
          path: 'components',
          suggestion: 'Add descriptive alt text to all images',
        });
      }
    }

    return issues;
  }

  /**
   * Validate spacing constraint
   */
  private validateSpacingConstraint(
    _constraint: SpacingConstraint,
    _design: DesignOutput
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // Spacing validation would require deep inspection of styles
    // This is a simplified example
    return issues;
  }

  /**
   * Validate custom constraint
   */
  private validateCustomConstraint(
    constraint: CustomConstraint,
    design: DesignOutput
  ): ValidationIssue[] {
    if (constraint.validator) {
      const result = constraint.validator(design);
      return result.issues;
    }
    return [];
  }

  /**
   * Merge constraints from another set
   */
  public merge(other: DesignConstraints, options: MergeOptions = { strategy: ConflictStrategy.MERGE }): DesignConstraints {
    const mergedConfig: ConstraintSetConfig = {
      name: `${this.config.name} + ${other.config.name}`,
      description: `Merged from ${this.config.name} and ${other.config.name}`,
      constraints: [],
      conditionalConstraints: [
        ...this.conditionalConstraints,
        ...(other.conditionalConstraints || []),
      ],
    };

    const mergedConstraints = new Map<string, Constraint>(this.constraints);

    for (const [id, constraint] of Array.from(other.constraints)) {
      if (mergedConstraints.has(id)) {
        // Handle conflict
        const existing = mergedConstraints.get(id)!;
        const resolved = this.resolveConflict(existing, constraint, options.strategy);
        mergedConstraints.set(id, resolved);
      } else {
        mergedConstraints.set(id, constraint);
      }
    }

    mergedConfig.constraints = Array.from(mergedConstraints.values());

    return new DesignConstraints(mergedConfig);
  }

  /**
   * Extend base constraints
   */
  public extend(base: DesignConstraints): DesignConstraints {
    const extendedConfig: ConstraintSetConfig = {
      name: `${base.config.name} (Extended)`,
      baseTemplate: base.config.name,
      constraints: [
        ...Array.from(base.constraints.values()),
        ...Array.from(this.constraints.values()),
      ],
      conditionalConstraints: [
        ...(base.conditionalConstraints || []),
        ...this.conditionalConstraints,
      ],
    };

    return new DesignConstraints(extendedConfig);
  }

  /**
   * Get constraint by ID
   */
  public getConstraint(id: string): Constraint | undefined {
    return this.constraints.get(id);
  }

  /**
   * Get all constraints
   */
  public getAllConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Get constraints by type
   */
  public getConstraintsByType(type: ConstraintType): Constraint[] {
    return Array.from(this.constraints.values()).filter((c) => c.type === type);
  }

  /**
   * Remove constraint
   */
  public removeConstraint(id: string): boolean {
    return this.constraints.delete(id);
  }

  /**
   * Enable/disable constraint
   */
  public setConstraintEnabled(id: string, enabled: boolean): void {
    const constraint = this.constraints.get(id);
    if (constraint) {
      constraint.enabled = enabled;
    }
  }

  /**
   * Get constraint count
   */
  public getConstraintCount(): number {
    return this.constraints.size;
  }

  /**
   * Clear all constraints
   */
  public clear(): void {
    this.constraints.clear();
  }

  // Helper methods

  private groupByType(constraints: Constraint[]): Map<ConstraintType, Constraint[]> {
    const grouped = new Map<ConstraintType, Constraint[]>();

    for (const constraint of constraints) {
      if (!grouped.has(constraint.type)) {
        grouped.set(constraint.type, []);
      }
      grouped.get(constraint.type)!.push(constraint);
    }

    return grouped;
  }

  private getTypeSectionName(type: ConstraintType): string {
    const names: Record<ConstraintType, string> = {
      [ConstraintType.LAYOUT]: 'Layout Constraints',
      [ConstraintType.COLOR]: 'Color Constraints',
      [ConstraintType.TYPOGRAPHY]: 'Typography Constraints',
      [ConstraintType.COMPONENT]: 'Component Constraints',
      [ConstraintType.ACCESSIBILITY]: 'Accessibility Constraints',
      [ConstraintType.SPACING]: 'Spacing Constraints',
      [ConstraintType.SIZING]: 'Sizing Constraints',
      [ConstraintType.ANIMATION]: 'Animation Constraints',
      [ConstraintType.RESPONSIVE]: 'Responsive Constraints',
      [ConstraintType.CUSTOM]: 'Custom Constraints',
    };

    return names[type];
  }

  private getHighestPriority(constraints: Constraint[]): ConstraintPriority {
    const priorityOrder = [
      ConstraintPriority.CRITICAL,
      ConstraintPriority.HIGH,
      ConstraintPriority.MEDIUM,
      ConstraintPriority.LOW,
    ];

    for (const priority of priorityOrder) {
      if (constraints.some((c) => c.priority === priority)) {
        return priority;
      }
    }

    return ConstraintPriority.MEDIUM;
  }

  private isPriorityAtLeast(priority: ConstraintPriority, threshold: ConstraintPriority): boolean {
    const order = {
      [ConstraintPriority.CRITICAL]: 4,
      [ConstraintPriority.HIGH]: 3,
      [ConstraintPriority.MEDIUM]: 2,
      [ConstraintPriority.LOW]: 1,
    };

    return order[priority] >= order[threshold];
  }

  private getSeverity(priority: ConstraintPriority): ValidationSeverity {
    const severityMap: Record<ConstraintPriority, ValidationSeverity> = {
      [ConstraintPriority.CRITICAL]: ValidationSeverity.ERROR,
      [ConstraintPriority.HIGH]: ValidationSeverity.ERROR,
      [ConstraintPriority.MEDIUM]: ValidationSeverity.WARNING,
      [ConstraintPriority.LOW]: ValidationSeverity.INFO,
    };

    return severityMap[priority];
  }

  private generateExamples(type: ConstraintType, _constraints: Constraint[]): string[] | undefined {
    // Generate examples based on constraint type
    const examples: string[] = [];

    switch (type) {
      case ConstraintType.LAYOUT:
        examples.push('Example: <div className="grid grid-cols-12 gap-4">');
        break;
      case ConstraintType.COLOR:
        examples.push('Example: background-color: #3B82F6; color: #FFFFFF;');
        break;
      case ConstraintType.TYPOGRAPHY:
        examples.push('Example: font-family: "Inter", sans-serif; font-size: 16px;');
        break;
    }

    return examples.length > 0 ? examples : undefined;
  }

  private resolveConflict(
    existing: Constraint,
    incoming: Constraint,
    strategy: ConflictStrategy
  ): Constraint {
    switch (strategy) {
      case ConflictStrategy.OVERRIDE:
        return incoming;
      case ConflictStrategy.MERGE:
        return {
          ...existing,
          rules: { ...existing.rules, ...incoming.rules } as any,
          tags: [...(existing.tags || []), ...(incoming.tags || [])],
          metadata: { ...existing.metadata, ...incoming.metadata },
        } as Constraint;
      case ConflictStrategy.PRIORITIZE:
        return this.isPriorityAtLeast(incoming.priority, existing.priority)
          ? incoming
          : existing;
      case ConflictStrategy.IGNORE_DUPLICATES:
        return existing;
      case ConflictStrategy.STRICT:
        throw new Error(`Conflict detected for constraint ${existing.id}`);
      default:
        return existing;
    }
  }

  private evaluateCondition(
    condition: ConditionalConstraint['condition'],
    design: DesignOutput
  ): boolean {
    const value = this.getValueByPath(design, condition.property);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return Array.isArray(value) && value.includes(condition.value);
      case 'greaterThan':
        return typeof value === 'number' && typeof condition.value === 'number' && value > condition.value;
      case 'lessThan':
        return typeof value === 'number' && typeof condition.value === 'number' && value < condition.value;
      case 'matches':
        return typeof value === 'string' && typeof condition.value === 'string' && new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  private getValueByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}
