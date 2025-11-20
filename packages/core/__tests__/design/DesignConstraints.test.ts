/**
 * DesignConstraints Test Suite
 *
 * Comprehensive tests for the design constraints system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DesignConstraints } from '../../src/design/DesignConstraints';
import {
  ConstraintType,
  ConstraintPriority,
  ConstraintSetConfig,
  LayoutSystem,
  ColorFormat,
  WCAGLevel,
  ValidationSeverity,
  ConflictStrategy,
} from '../../src/design/types';
import {
  createMaterialDesignTemplate,
  createiOSTemplate,
  createTailwindTemplate,
  createMinimalTemplate,
} from '../../src/design/templates';

describe('DesignConstraints', () => {
  let constraints: DesignConstraints;

  beforeEach(() => {
    const config: ConstraintSetConfig = {
      name: 'Test Constraints',
      description: 'Test constraint set',
      constraints: [],
    };
    constraints = new DesignConstraints(config);
  });

  describe('Constraint Definition', () => {
    it('should define a layout constraint', () => {
      const constraint = constraints.defineLayoutConstraint(
        'test-layout',
        {
          system: [LayoutSystem.GRID],
          gridColumns: 12,
          gridGap: '16px',
        },
        {
          name: 'Test Layout',
          priority: ConstraintPriority.HIGH,
        }
      );

      expect(constraint.type).toBe(ConstraintType.LAYOUT);
      expect(constraint.id).toBe('test-layout');
      expect(constraint.rules.gridColumns).toBe(12);
      expect(constraint.priority).toBe(ConstraintPriority.HIGH);
    });

    it('should define a color constraint', () => {
      const constraint = constraints.defineColorConstraint(
        'test-color',
        {
          palette: {
            primary: ['#3B82F6', '#2563EB'],
            secondary: ['#6B7280'],
          },
          minContrast: 4.5,
        },
        {
          name: 'Test Color',
          priority: ConstraintPriority.MEDIUM,
        }
      );

      expect(constraint.type).toBe(ConstraintType.COLOR);
      expect(constraint.rules.palette?.primary).toHaveLength(2);
      expect(constraint.rules.minContrast).toBe(4.5);
    });

    it('should define a typography constraint', () => {
      const constraint = constraints.defineTypographyConstraint(
        'test-typography',
        {
          fontFamilies: {
            heading: ['Roboto', 'sans-serif'],
            body: ['Inter', 'sans-serif'],
          },
          scale: {
            baseSize: 16,
            ratio: 1.25,
          },
          weights: [400, 700],
        },
        {
          name: 'Test Typography',
          priority: ConstraintPriority.HIGH,
        }
      );

      expect(constraint.type).toBe(ConstraintType.TYPOGRAPHY);
      expect(constraint.rules.fontFamilies?.heading).toContain('Roboto');
      expect(constraint.rules.scale?.baseSize).toBe(16);
    });

    it('should define a component constraint', () => {
      const constraint = constraints.defineComponentConstraint(
        'test-component',
        {
          allowedComponents: ['Button', 'Input', 'Card'],
          maxNestingLevel: 5,
        },
        {
          name: 'Test Component',
          priority: ConstraintPriority.MEDIUM,
        }
      );

      expect(constraint.type).toBe(ConstraintType.COMPONENT);
      expect(constraint.rules.allowedComponents).toHaveLength(3);
      expect(constraint.rules.maxNestingLevel).toBe(5);
    });

    it('should define an accessibility constraint', () => {
      const constraint = constraints.defineAccessibilityConstraint(
        'test-a11y',
        {
          wcagLevel: WCAGLevel.AA,
          requireAltText: true,
          minTouchTarget: 44,
        },
        {
          name: 'Test A11y',
          priority: ConstraintPriority.CRITICAL,
        }
      );

      expect(constraint.type).toBe(ConstraintType.ACCESSIBILITY);
      expect(constraint.rules.wcagLevel).toBe(WCAGLevel.AA);
      expect(constraint.rules.requireAltText).toBe(true);
      expect(constraint.priority).toBe(ConstraintPriority.CRITICAL);
    });

    it('should define a spacing constraint', () => {
      const constraint = constraints.defineSpacingConstraint(
        'test-spacing',
        {
          system: {
            base: 8,
            scale: [4, 8, 16, 32],
          },
          consistent: true,
        },
        {
          name: 'Test Spacing',
          priority: ConstraintPriority.MEDIUM,
        }
      );

      expect(constraint.type).toBe(ConstraintType.SPACING);
      expect(constraint.rules.system?.base).toBe(8);
      expect(constraint.rules.consistent).toBe(true);
    });

    it('should define a custom constraint', () => {
      const constraint = constraints.defineCustomConstraint(
        'test-custom',
        {
          customRule: 'value',
        },
        {
          name: 'Test Custom',
          priority: ConstraintPriority.LOW,
          validator: (design) => ({
            valid: true,
            score: 100,
            issues: [],
            summary: { total: 1, passed: 1, failed: 0, warnings: 0 },
          }),
        }
      );

      expect(constraint.type).toBe(ConstraintType.CUSTOM);
      expect(constraint.rules.customRule).toBe('value');
      expect(constraint.validator).toBeDefined();
    });
  });

  describe('Constraint Management', () => {
    beforeEach(() => {
      constraints.defineLayoutConstraint('layout-1', {
        system: [LayoutSystem.GRID],
      });
      constraints.defineColorConstraint('color-1', {
        palette: { primary: ['#000000'] },
      });
    });

    it('should get constraint by ID', () => {
      const constraint = constraints.getConstraint('layout-1');
      expect(constraint).toBeDefined();
      expect(constraint?.type).toBe(ConstraintType.LAYOUT);
    });

    it('should get all constraints', () => {
      const all = constraints.getAllConstraints();
      expect(all).toHaveLength(2);
    });

    it('should get constraints by type', () => {
      const layoutConstraints = constraints.getConstraintsByType(ConstraintType.LAYOUT);
      expect(layoutConstraints).toHaveLength(1);
      expect(layoutConstraints[0].id).toBe('layout-1');
    });

    it('should remove constraint', () => {
      expect(constraints.removeConstraint('layout-1')).toBe(true);
      expect(constraints.getConstraint('layout-1')).toBeUndefined();
      expect(constraints.getConstraintCount()).toBe(1);
    });

    it('should enable/disable constraint', () => {
      constraints.setConstraintEnabled('layout-1', false);
      const constraint = constraints.getConstraint('layout-1');
      expect(constraint?.enabled).toBe(false);

      constraints.setConstraintEnabled('layout-1', true);
      expect(constraints.getConstraint('layout-1')?.enabled).toBe(true);
    });

    it('should get constraint count', () => {
      expect(constraints.getConstraintCount()).toBe(2);
    });

    it('should clear all constraints', () => {
      constraints.clear();
      expect(constraints.getConstraintCount()).toBe(0);
    });
  });

  describe('Prompt Generation', () => {
    beforeEach(() => {
      constraints.defineLayoutConstraint(
        'layout',
        {
          system: [LayoutSystem.GRID],
          gridColumns: 12,
          gridGap: '16px',
        },
        { priority: ConstraintPriority.HIGH }
      );

      constraints.defineColorConstraint(
        'color',
        {
          palette: {
            primary: ['#3B82F6'],
          },
          minContrast: 4.5,
        },
        { priority: ConstraintPriority.MEDIUM }
      );
    });

    it('should generate structured prompt instructions', () => {
      const instructions = constraints.toPromptInstructions({ format: 'structured' });
      expect(instructions.length).toBeGreaterThan(0);
      expect(instructions.some((i) => i.section.includes('Layout'))).toBe(true);
      expect(instructions.some((i) => i.section.includes('Color'))).toBe(true);
    });

    it('should generate natural language prompt instructions', () => {
      const instructions = constraints.toPromptInstructions({ format: 'natural' });
      expect(instructions.length).toBeGreaterThan(0);
      expect(
        instructions.some((i) =>
          i.instructions.some((inst) => inst.toLowerCase().includes('column'))
        )
      ).toBe(true);
    });

    it('should generate mixed format prompt instructions', () => {
      const instructions = constraints.toPromptInstructions({ format: 'mixed' });
      expect(instructions.length).toBeGreaterThan(0);
    });

    it('should group instructions by type', () => {
      const instructions = constraints.toPromptInstructions({ groupByType: true });
      const sections = instructions.map((i) => i.section);
      expect(sections).toContain('Layout Constraints');
      expect(sections).toContain('Color Constraints');
    });

    it('should filter by priority threshold', () => {
      const instructions = constraints.toPromptInstructions({
        priorityThreshold: ConstraintPriority.HIGH,
      });

      // Should only include high priority constraints
      expect(
        instructions.every((i) =>
          [ConstraintPriority.CRITICAL, ConstraintPriority.HIGH].includes(i.priority)
        )
      ).toBe(true);
    });

    it('should include examples when requested', () => {
      const instructions = constraints.toPromptInstructions({ includeExamples: true });
      expect(instructions.some((i) => i.examples && i.examples.length > 0)).toBe(true);
    });

    it('should respect max length', () => {
      const instructions = constraints.toPromptInstructions({ maxLength: 1 });
      expect(instructions.every((i) => i.instructions.length <= 1)).toBe(true);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      constraints.defineLayoutConstraint(
        'layout',
        { gridColumns: 12 },
        { priority: ConstraintPriority.HIGH }
      );

      constraints.defineColorConstraint(
        'color',
        {
          allowedColors: ['#000000', '#FFFFFF'],
          maxColors: 2,
        },
        { priority: ConstraintPriority.MEDIUM }
      );

      constraints.defineAccessibilityConstraint(
        'a11y',
        { requireAltText: true },
        { priority: ConstraintPriority.CRITICAL }
      );
    });

    it('should validate valid design output', () => {
      const design = {
        layout: { columns: 12 },
        colors: ['#000000', '#FFFFFF'],
        components: [
          { type: 'image', alt: 'Description' },
        ],
      };

      const result = constraints.validateOutput(design);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect layout violations', () => {
      const design = {
        layout: { columns: 8 },
        colors: ['#000000'],
      };

      const result = constraints.validateOutput(design);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.constraintType === ConstraintType.LAYOUT)).toBe(true);
    });

    it('should detect color violations', () => {
      const design = {
        layout: { columns: 12 },
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      };

      const result = constraints.validateOutput(design);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.constraintType === ConstraintType.COLOR)).toBe(true);
    });

    it('should detect accessibility violations', () => {
      const design = {
        layout: { columns: 12 },
        colors: ['#000000'],
        components: [
          { type: 'image' }, // Missing alt text
        ],
      };

      const result = constraints.validateOutput(design);
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((i) => i.constraintType === ConstraintType.ACCESSIBILITY)
      ).toBe(true);
      expect(
        result.issues.some((i) => i.severity === ValidationSeverity.ERROR)
      ).toBe(true);
    });

    it('should calculate validation score correctly', () => {
      const design = {
        layout: { columns: 8 }, // Violates 1 constraint
        colors: ['#000000'],
        components: [
          { type: 'image', alt: 'Description' },
        ],
      };

      const result = constraints.validateOutput(design);
      expect(result.score).toBeLessThan(100);
      expect(result.summary.total).toBe(3);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.passed).toBe(2);
    });

    it('should provide validation summary', () => {
      const design = {
        layout: { columns: 12 },
        colors: ['#000000'],
      };

      const result = constraints.validateOutput(design);
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Merging Constraints', () => {
    let constraints1: DesignConstraints;
    let constraints2: DesignConstraints;

    beforeEach(() => {
      const config1: ConstraintSetConfig = {
        name: 'Set 1',
        constraints: [],
      };
      constraints1 = new DesignConstraints(config1);
      constraints1.defineLayoutConstraint('layout', { gridColumns: 12 });
      constraints1.defineColorConstraint('color', { palette: { primary: ['#000000'] } });

      const config2: ConstraintSetConfig = {
        name: 'Set 2',
        constraints: [],
      };
      constraints2 = new DesignConstraints(config2);
      constraints2.defineLayoutConstraint('layout', { gridColumns: 16 }); // Conflict
      constraints2.defineTypographyConstraint('typography', {
        fontFamilies: { body: ['Arial'] },
      });
    });

    it('should merge constraints with override strategy', () => {
      const merged = constraints1.merge(constraints2, {
        strategy: ConflictStrategy.OVERRIDE,
      });

      const layout = merged.getConstraint('layout');
      expect(layout?.rules.gridColumns).toBe(16); // Should use constraints2 value
      expect(merged.getConstraintCount()).toBe(3); // layout, color, typography
    });

    it('should merge constraints with merge strategy', () => {
      const merged = constraints1.merge(constraints2, {
        strategy: ConflictStrategy.MERGE,
      });

      expect(merged.getConstraintCount()).toBe(3);
    });

    it('should merge constraints with ignore duplicates strategy', () => {
      const merged = constraints1.merge(constraints2, {
        strategy: ConflictStrategy.IGNORE_DUPLICATES,
      });

      const layout = merged.getConstraint('layout');
      expect(layout?.rules.gridColumns).toBe(12); // Should keep constraints1 value
    });

    it('should merge constraints with prioritize strategy', () => {
      // Add priorities
      constraints1.defineLayoutConstraint(
        'layout-priority',
        { gridColumns: 12 },
        { priority: ConstraintPriority.HIGH }
      );
      constraints2.defineLayoutConstraint(
        'layout-priority',
        { gridColumns: 16 },
        { priority: ConstraintPriority.MEDIUM }
      );

      const merged = constraints1.merge(constraints2, {
        strategy: ConflictStrategy.PRIORITIZE,
      });

      const layout = merged.getConstraint('layout-priority');
      expect(layout?.rules.gridColumns).toBe(12); // Should use higher priority
    });

    it('should throw error with strict strategy on conflict', () => {
      expect(() => {
        constraints1.merge(constraints2, {
          strategy: ConflictStrategy.STRICT,
        });
      }).toThrow();
    });
  });

  describe('Extending Constraints', () => {
    it('should extend base constraints', () => {
      const base = new DesignConstraints({
        name: 'Base',
        constraints: [],
      });
      base.defineLayoutConstraint('base-layout', { gridColumns: 12 });

      const extended = new DesignConstraints({
        name: 'Extended',
        constraints: [],
      });
      extended.defineColorConstraint('extended-color', {
        palette: { primary: ['#000000'] },
      });

      const result = extended.extend(base);

      expect(result.getConstraintCount()).toBe(2);
      expect(result.getConstraint('base-layout')).toBeDefined();
      expect(result.getConstraint('extended-color')).toBeDefined();
    });
  });

  describe('Natural Language Parsing', () => {
    it('should parse grid column constraint', () => {
      const result = constraints.parseNaturalLanguage({
        description: 'Use a 12 column grid layout',
        priority: ConstraintPriority.HIGH,
      });

      expect(result.success).toBe(true);
      expect(result.constraints.length).toBeGreaterThan(0);
      expect(result.constraints[0].type).toBe(ConstraintType.LAYOUT);
    });

    it('should parse color constraint', () => {
      const result = constraints.parseNaturalLanguage({
        description: 'Use colors #3B82F6 and #2563EB',
        priority: ConstraintPriority.MEDIUM,
      });

      expect(result.success).toBe(true);
      expect(result.constraints.some((c) => c.type === ConstraintType.COLOR)).toBe(true);
    });

    it('should parse typography constraint', () => {
      const result = constraints.parseNaturalLanguage({
        description: 'Use font-family: "Roboto" for all text',
        priority: ConstraintPriority.MEDIUM,
      });

      expect(result.success).toBe(true);
      expect(result.constraints.some((c) => c.type === ConstraintType.TYPOGRAPHY)).toBe(true);
    });

    it('should parse accessibility constraint', () => {
      const result = constraints.parseNaturalLanguage({
        description: 'Must be WCAG AAA accessible',
        priority: ConstraintPriority.CRITICAL,
      });

      expect(result.success).toBe(true);
      expect(result.constraints.some((c) => c.type === ConstraintType.ACCESSIBILITY)).toBe(true);
    });

    it('should handle unparseable constraints gracefully', () => {
      const result = constraints.parseNaturalLanguage({
        description: 'Some random text that does not match patterns',
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.constraints.some((c) => c.type === ConstraintType.CUSTOM)).toBe(true);
    });
  });

  describe('Templates', () => {
    it('should create Material Design template', () => {
      const material = createMaterialDesignTemplate();
      expect(material.getConstraintCount()).toBeGreaterThan(0);
      expect(material.getConstraintsByType(ConstraintType.LAYOUT).length).toBeGreaterThan(0);
      expect(material.getConstraintsByType(ConstraintType.COLOR).length).toBeGreaterThan(0);
      expect(material.getConstraintsByType(ConstraintType.TYPOGRAPHY).length).toBeGreaterThan(0);
      expect(material.getConstraintsByType(ConstraintType.ACCESSIBILITY).length).toBeGreaterThan(0);
    });

    it('should create iOS template', () => {
      const ios = createiOSTemplate();
      expect(ios.getConstraintCount()).toBeGreaterThan(0);
      expect(ios.getConstraintsByType(ConstraintType.LAYOUT).length).toBeGreaterThan(0);
      expect(ios.getConstraintsByType(ConstraintType.COLOR).length).toBeGreaterThan(0);
    });

    it('should create Tailwind template', () => {
      const tailwind = createTailwindTemplate();
      expect(tailwind.getConstraintCount()).toBeGreaterThan(0);
      expect(tailwind.getConstraintsByType(ConstraintType.SPACING).length).toBeGreaterThan(0);
    });

    it('should create Minimal template', () => {
      const minimal = createMinimalTemplate();
      expect(minimal.getConstraintCount()).toBeGreaterThan(0);
      const colorConstraints = minimal.getConstraintsByType(ConstraintType.COLOR);
      expect(colorConstraints.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle layout constraint with range', () => {
      constraints.defineLayoutConstraint('flexible-layout', {
        gridColumns: { min: 8, max: 16 },
      });

      const validDesign = {
        layout: { columns: 12 },
      };

      const invalidDesign = {
        layout: { columns: 20 },
      };

      expect(constraints.validateOutput(validDesign).valid).toBe(true);
      expect(constraints.validateOutput(invalidDesign).valid).toBe(false);
    });

    it('should handle component nesting validation', () => {
      constraints.defineComponentConstraint('nesting', {
        maxNestingLevel: 3,
      });

      const design = {
        components: [
          { type: 'Container', children: [{ type: 'Box' }] },
        ],
      };

      const result = constraints.validateOutput(design);
      expect(result).toBeDefined();
    });

    it('should combine multiple constraint types', () => {
      constraints.defineLayoutConstraint('layout', { gridColumns: 12 });
      constraints.defineColorConstraint('color', { maxColors: 5 });
      constraints.defineTypographyConstraint('typography', {
        fontFamilies: { body: ['Arial'] },
      });
      constraints.defineAccessibilityConstraint('a11y', { requireAltText: true });

      const instructions = constraints.toPromptInstructions();
      expect(instructions.length).toBeGreaterThan(0);

      const design = {
        layout: { columns: 12 },
        colors: ['#000000'],
        typography: { fontFamily: 'Arial' },
        components: [{ type: 'image', alt: 'Test' }],
      };

      const result = constraints.validateOutput(design);
      expect(result.valid).toBe(true);
    });

    it('should handle disabled constraints', () => {
      constraints.defineLayoutConstraint('disabled-layout', { gridColumns: 12 });
      constraints.setConstraintEnabled('disabled-layout', false);

      const instructions = constraints.toPromptInstructions();
      const hasDisabledConstraint = instructions.some((i) =>
        i.instructions.some((inst) => inst.includes('disabled-layout'))
      );

      expect(hasDisabledConstraint).toBe(false);
    });

    it('should provide detailed validation issues', () => {
      constraints.defineColorConstraint(
        'color',
        { allowedColors: ['#000000'] },
        { priority: ConstraintPriority.HIGH }
      );

      const design = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = constraints.validateOutput(design);
      expect(result.issues.length).toBeGreaterThan(0);

      const issue = result.issues[0];
      expect(issue.constraintId).toBe('color');
      expect(issue.constraintType).toBe(ConstraintType.COLOR);
      expect(issue.severity).toBe(ValidationSeverity.ERROR);
      expect(issue.message).toBeDefined();
      expect(issue.expected).toBeDefined();
      expect(issue.actual).toBeDefined();
    });
  });
});
