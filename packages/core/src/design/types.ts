/**
 * Design Constraints Type Definitions
 *
 * Type system for defining and enforcing design constraints in AI-generated designs
 * through prompt engineering.
 */

/**
 * Types of design constraints
 */
export enum ConstraintType {
  LAYOUT = 'layout',
  COLOR = 'color',
  TYPOGRAPHY = 'typography',
  COMPONENT = 'component',
  ACCESSIBILITY = 'accessibility',
  SPACING = 'spacing',
  SIZING = 'sizing',
  ANIMATION = 'animation',
  RESPONSIVE = 'responsive',
  CUSTOM = 'custom',
}

/**
 * Priority levels for constraints
 */
export enum ConstraintPriority {
  CRITICAL = 'critical',     // Must be followed, validation fails if violated
  HIGH = 'high',             // Strongly recommended, generates warnings
  MEDIUM = 'medium',         // Recommended, generates suggestions
  LOW = 'low',               // Optional, nice to have
}

/**
 * Layout system types
 */
export enum LayoutSystem {
  GRID = 'grid',
  FLEXBOX = 'flexbox',
  STACK = 'stack',
  ABSOLUTE = 'absolute',
  FLOAT = 'float',
}

/**
 * Color format types
 */
export enum ColorFormat {
  HEX = 'hex',
  RGB = 'rgb',
  RGBA = 'rgba',
  HSL = 'hsl',
  HSLA = 'hsla',
  NAMED = 'named',
}

/**
 * WCAG compliance levels
 */
export enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
}

/**
 * Base constraint interface
 */
export interface BaseConstraint {
  id: string;
  type: ConstraintType;
  name: string;
  description?: string;
  priority: ConstraintPriority;
  enabled: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Layout constraint definition
 */
export interface LayoutConstraint extends BaseConstraint {
  type: ConstraintType.LAYOUT;
  rules: {
    system?: LayoutSystem[];
    gridColumns?: number | { min: number; max: number };
    gridGap?: string | number;
    maxWidth?: string | number;
    minWidth?: string | number;
    maxHeight?: string | number;
    minHeight?: string | number;
    aspectRatio?: string;
    alignment?: ('left' | 'center' | 'right' | 'justify')[];
    direction?: ('row' | 'column' | 'row-reverse' | 'column-reverse')[];
    wrap?: boolean;
    customRules?: Record<string, unknown>;
  };
}

/**
 * Color palette definition
 */
export interface ColorPalette {
  primary: string[];
  secondary?: string[];
  accent?: string[];
  neutral?: string[];
  semantic?: {
    success?: string[];
    warning?: string[];
    error?: string[];
    info?: string[];
  };
  custom?: Record<string, string[]>;
}

/**
 * Color constraint definition
 */
export interface ColorConstraint extends BaseConstraint {
  type: ConstraintType.COLOR;
  rules: {
    palette?: ColorPalette;
    formats?: ColorFormat[];
    maxColors?: number;
    minContrast?: number; // WCAG contrast ratio
    allowedColors?: string[];
    forbiddenColors?: string[];
    colorHarmony?: ('monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic')[];
    customRules?: Record<string, unknown>;
  };
}

/**
 * Typography scale
 */
export interface TypographyScale {
  baseSize: number;
  ratio: number; // e.g., 1.25 for major third
  sizes?: {
    xs?: number;
    sm?: number;
    base?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
    '3xl'?: number;
    '4xl'?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Typography constraint definition
 */
export interface TypographyConstraint extends BaseConstraint {
  type: ConstraintType.TYPOGRAPHY;
  rules: {
    fontFamilies?: {
      heading?: string[];
      body?: string[];
      monospace?: string[];
      custom?: Record<string, string[]>;
    };
    scale?: TypographyScale;
    weights?: number[];
    lineHeights?: {
      tight?: number;
      normal?: number;
      relaxed?: number;
      loose?: number;
      custom?: Record<string, number>;
    };
    letterSpacing?: {
      tight?: string;
      normal?: string;
      wide?: string;
      custom?: Record<string, string>;
    };
    maxLevels?: number; // Maximum hierarchy levels
    customRules?: Record<string, unknown>;
  };
}

/**
 * Component size variants
 */
export interface ComponentSizes {
  xs?: { width?: string; height?: string; padding?: string };
  sm?: { width?: string; height?: string; padding?: string };
  md?: { width?: string; height?: string; padding?: string };
  lg?: { width?: string; height?: string; padding?: string };
  xl?: { width?: string; height?: string; padding?: string };
  [key: string]: { width?: string; height?: string; padding?: string } | undefined;
}

/**
 * Component constraint definition
 */
export interface ComponentConstraint extends BaseConstraint {
  type: ConstraintType.COMPONENT;
  rules: {
    allowedComponents?: string[];
    forbiddenComponents?: string[];
    sizes?: ComponentSizes;
    variants?: string[];
    maxNestingLevel?: number;
    composition?: {
      maxChildren?: number;
      allowedChildren?: string[];
      forbiddenChildren?: string[];
    };
    customRules?: Record<string, unknown>;
  };
}

/**
 * Accessibility constraint definition
 */
export interface AccessibilityConstraint extends BaseConstraint {
  type: ConstraintType.ACCESSIBILITY;
  rules: {
    wcagLevel?: WCAGLevel;
    minContrast?: number;
    requireAltText?: boolean;
    requireAriaLabels?: boolean;
    keyboardNavigable?: boolean;
    focusVisible?: boolean;
    screenReaderOptimized?: boolean;
    colorBlindSafe?: boolean;
    minTouchTarget?: number; // in pixels
    customRules?: Record<string, unknown>;
  };
}

/**
 * Spacing system
 */
export interface SpacingSystem {
  base: number;
  scale?: number[];
  custom?: Record<string, number>;
}

/**
 * Spacing constraint definition
 */
export interface SpacingConstraint extends BaseConstraint {
  type: ConstraintType.SPACING;
  rules: {
    system?: SpacingSystem;
    minSpacing?: number;
    maxSpacing?: number;
    consistent?: boolean; // Enforce consistent spacing
    customRules?: Record<string, unknown>;
  };
}

/**
 * Custom constraint definition
 */
export interface CustomConstraint extends BaseConstraint {
  type: ConstraintType.CUSTOM;
  rules: Record<string, unknown>;
  validator?: (design: unknown) => ValidationResult;
  promptGenerator?: (rules: Record<string, unknown>) => string[];
}

/**
 * Union type for all constraints
 */
export type Constraint =
  | LayoutConstraint
  | ColorConstraint
  | TypographyConstraint
  | ComponentConstraint
  | AccessibilityConstraint
  | SpacingConstraint
  | CustomConstraint;

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  constraintId: string;
  constraintType: ConstraintType;
  severity: ValidationSeverity;
  message: string;
  path?: string; // Path to the violating element
  expected?: unknown;
  actual?: unknown;
  suggestion?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100, percentage of constraints met
  issues: ValidationIssue[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Prompt instruction format
 */
export interface PromptInstruction {
  section: string;
  priority: ConstraintPriority;
  instructions: string[];
  examples?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Constraint template
 */
export interface ConstraintTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  constraints: Constraint[];
  metadata?: Record<string, unknown>;
}

/**
 * Conditional constraint
 */
export interface ConditionalConstraint {
  condition: {
    property: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'matches';
    value: unknown;
  };
  thenConstraints: Constraint[];
  elseConstraints?: Constraint[];
}

/**
 * Constraint set configuration
 */
export interface ConstraintSetConfig {
  name: string;
  description?: string;
  baseTemplate?: string; // Template ID to extend
  constraints: Constraint[];
  conditionalConstraints?: ConditionalConstraint[];
  strict?: boolean; // Fail validation on any error
  allowPartial?: boolean; // Allow partial compliance
  metadata?: Record<string, unknown>;
}

/**
 * Conflict resolution strategy
 */
export enum ConflictStrategy {
  OVERRIDE = 'override',         // Later constraint overrides earlier
  MERGE = 'merge',               // Merge constraint rules
  STRICT = 'strict',             // Fail on conflicts
  PRIORITIZE = 'prioritize',     // Use higher priority constraint
  IGNORE_DUPLICATES = 'ignore_duplicates', // Skip duplicate constraints
}

/**
 * Merge options
 */
export interface MergeOptions {
  strategy: ConflictStrategy;
  preserveIds?: boolean;
  mergeTags?: boolean;
  mergeMetadata?: boolean;
}

/**
 * Natural language constraint input
 */
export interface NaturalLanguageConstraint {
  description: string;
  type?: ConstraintType;
  priority?: ConstraintPriority;
  examples?: string[];
}

/**
 * Constraint parsing result
 */
export interface ConstraintParseResult {
  success: boolean;
  constraints: Constraint[];
  errors?: string[];
  warnings?: string[];
  confidence?: number; // 0-1
}

/**
 * Design output for validation
 */
export interface DesignOutput {
  components?: unknown[];
  styles?: Record<string, unknown>;
  layout?: unknown;
  colors?: string[];
  typography?: unknown;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Prompt generation options
 */
export interface PromptGenerationOptions {
  format?: 'structured' | 'natural' | 'mixed';
  includeExamples?: boolean;
  groupByType?: boolean;
  priorityThreshold?: ConstraintPriority;
  maxLength?: number;
  template?: string;
}

