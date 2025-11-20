/**
 * Design Token Types
 *
 * Type definitions for design token extraction, parsing, and normalization.
 * Supports multiple design system formats including Figma, Style Dictionary, and Tokens Studio.
 */

import { z } from 'zod'

/**
 * Token Categories
 * Standard design token categories following W3C Design Tokens Community Group format
 */
export enum TokenCategory {
  COLOR = 'color',
  TYPOGRAPHY = 'typography',
  SPACING = 'spacing',
  SIZING = 'sizing',
  BORDER_RADIUS = 'borderRadius',
  BORDER_WIDTH = 'borderWidth',
  SHADOW = 'shadow',
  OPACITY = 'opacity',
  Z_INDEX = 'zIndex',
  FONT_FAMILY = 'fontFamily',
  FONT_SIZE = 'fontSize',
  FONT_WEIGHT = 'fontWeight',
  LINE_HEIGHT = 'lineHeight',
  LETTER_SPACING = 'letterSpacing',
  BREAKPOINT = 'breakpoint',
  DURATION = 'duration',
  TIMING_FUNCTION = 'timingFunction',
  TRANSITION = 'transition',
  GRADIENT = 'gradient',
  BLUR = 'blur',
}

/**
 * Token Type
 * Specific type identifier for token values
 */
export enum TokenType {
  // Color types
  COLOR = 'color',

  // Typography types
  FONT_FAMILY = 'fontFamily',
  FONT_SIZE = 'fontSize',
  FONT_WEIGHT = 'fontWeight',
  LINE_HEIGHT = 'lineHeight',
  LETTER_SPACING = 'letterSpacing',

  // Dimension types
  DIMENSION = 'dimension',
  SPACING = 'spacing',
  SIZING = 'sizing',
  BORDER_RADIUS = 'borderRadius',
  BORDER_WIDTH = 'borderWidth',

  // Effect types
  SHADOW = 'shadow',
  BLUR = 'blur',
  OPACITY = 'opacity',

  // Composite types
  TYPOGRAPHY = 'typography',
  GRADIENT = 'gradient',
  TRANSITION = 'transition',

  // Index types
  Z_INDEX = 'zIndex',

  // Timing types
  DURATION = 'duration',
  CUBIC_BEZIER = 'cubicBezier',

  // Media query
  BREAKPOINT = 'breakpoint',
}

/**
 * Export Format
 * Supported output formats for design tokens
 */
export enum ExportFormat {
  JSON = 'json',
  CSS = 'css',
  SCSS = 'scss',
  LESS = 'less',
  SASS = 'sass',
  JS = 'js',
  TS = 'ts',
  STYLE_DICTIONARY = 'styleDictionary',
  TOKENS_STUDIO = 'tokensStudio',
  TAILWIND = 'tailwind',
  ANDROID_XML = 'androidXml',
  IOS_PLIST = 'iosPlist',
}

/**
 * Theme Mode
 * Support for different theme variations
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  HIGH_CONTRAST = 'highContrast',
  CUSTOM = 'custom',
}

/**
 * Color Format
 */
export interface ColorValue {
  hex?: string
  rgb?: { r: number; g: number; b: number; a?: number }
  hsl?: { h: number; s: number; l: number; a?: number }
  rgba?: string
  hsla?: string
}

/**
 * Typography Value
 */
export interface TypographyValue {
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  textTransform?: string
  textDecoration?: string
}

/**
 * Shadow Value
 */
export interface ShadowValue {
  x: number
  y: number
  blur: number
  spread?: number
  color: string | ColorValue
  inset?: boolean
}

/**
 * Gradient Stop
 */
export interface GradientStop {
  color: string | ColorValue
  position: number
}

/**
 * Gradient Value
 */
export interface GradientValue {
  type: 'linear' | 'radial' | 'conic'
  angle?: number
  stops: GradientStop[]
}

/**
 * Transition Value
 */
export interface TransitionValue {
  property: string
  duration: string | number
  timingFunction: string
  delay?: string | number
}

/**
 * Design Token
 * Core design token structure following W3C format
 */
export interface DesignToken {
  /** Unique identifier for the token */
  name: string

  /** Token value (can be any type depending on token category) */
  value: any

  /** Token type */
  type: TokenType

  /** Token category */
  category: TokenCategory

  /** Human-readable description */
  description?: string

  /** Reference to another token (for aliases) */
  reference?: string

  /** Tags for categorization */
  tags?: string[]

  /** Theme this token belongs to */
  theme?: ThemeMode

  /** Whether this is a semantic token (vs reference token) */
  semantic?: boolean

  /** Original source of the token */
  source?: 'figma' | 'styleDictionary' | 'tokensStudio' | 'css' | 'website' | 'image' | 'custom'

  /** Platform-specific values */
  platforms?: Record<string, any>

  /** Extensions for custom properties */
  extensions?: Record<string, any>

  /** Metadata from source system */
  metadata?: Record<string, any>
}

/**
 * Token Group
 * Hierarchical grouping of related tokens
 */
export interface TokenGroup {
  name: string
  tokens: DesignToken[]
  subGroups?: TokenGroup[]
  description?: string
  metadata?: Record<string, any>
}

/**
 * Token Collection
 * Complete collection of design tokens
 */
export interface TokenCollection {
  name: string
  version?: string
  tokens: DesignToken[]
  groups?: TokenGroup[]
  themes?: Record<ThemeMode, DesignToken[]>
  metadata?: Record<string, any>
}

/**
 * Figma API Types
 */

export interface FigmaFile {
  document: FigmaNode
  components: Record<string, FigmaComponent>
  styles: Record<string, FigmaStyle>
  name: string
  lastModified: string
  version: string
}

export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  backgroundColor?: FigmaColor
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  effects?: FigmaEffect[]
  style?: FigmaTypeStyle
  absoluteBoundingBox?: FigmaRectangle
  [key: string]: any
}

export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'IMAGE'
  visible?: boolean
  opacity?: number
  color?: FigmaColor
  gradientStops?: FigmaColorStop[]
  gradientHandlePositions?: FigmaVector[]
}

export interface FigmaColorStop {
  position: number
  color: FigmaColor
}

export interface FigmaVector {
  x: number
  y: number
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  visible?: boolean
  radius: number
  color?: FigmaColor
  offset?: FigmaVector
  spread?: number
}

export interface FigmaTypeStyle {
  fontFamily: string
  fontPostScriptName?: string
  fontWeight: number
  fontSize: number
  textAlignHorizontal?: string
  textAlignVertical?: string
  letterSpacing: number
  lineHeightPx: number
  lineHeightPercent?: number
  lineHeightUnit?: string
}

export interface FigmaRectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface FigmaComponent {
  key: string
  name: string
  description: string
  componentSetId?: string
}

export interface FigmaStyle {
  key: string
  name: string
  description: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
}

/**
 * Style Dictionary Types
 */

export interface StyleDictionaryToken {
  value: any
  type?: string
  comment?: string
  name?: string
  path?: string[]
  attributes?: Record<string, any>
  metadata?: Record<string, any>
}

export interface StyleDictionaryConfig {
  source: string[]
  platforms: Record<string, StyleDictionaryPlatform>
  tokens?: Record<string, any>
}

export interface StyleDictionaryPlatform {
  transformGroup?: string
  transforms?: string[]
  buildPath?: string
  files?: StyleDictionaryFile[]
}

export interface StyleDictionaryFile {
  destination: string
  format: string
  filter?: any
}

/**
 * Tokens Studio Types
 */

export interface TokensStudioToken {
  value: any
  type: string
  description?: string
  extensions?: Record<string, any>
  $extensions?: Record<string, any>
}

export interface TokensStudioSet {
  [key: string]: TokensStudioToken | TokensStudioSet
}

export interface TokensStudioFormat {
  [setName: string]: TokensStudioSet
}

/**
 * Extractor Configuration
 */

export interface ExtractorConfig {
  /** Figma configuration */
  figma?: FigmaConfig

  /** Style Dictionary configuration */
  styleDictionary?: StyleDictionaryConfig

  /** Tokens Studio configuration */
  tokensStudio?: TokensStudioConfig

  /** Default theme mode */
  defaultTheme?: ThemeMode

  /** Include semantic tokens */
  includeSemantic?: boolean

  /** Include reference tokens */
  includeReference?: boolean

  /** Token name separator (e.g., '-', '.', '/') */
  nameSeparator?: string

  /** Prefix for token names */
  prefix?: string

  /** Transform options */
  transforms?: TransformConfig

  /** Validation options */
  validation?: ValidationConfig
}

export interface FigmaConfig {
  /** Figma file key */
  fileKey: string

  /** Figma access token */
  accessToken: string

  /** API version to use */
  apiVersion?: string

  /** Node IDs to extract (if not extracting entire file) */
  nodeIds?: string[]

  /** Extract local styles */
  extractStyles?: boolean

  /** Extract components */
  extractComponents?: boolean

  /** Rate limiting configuration */
  rateLimit?: {
    maxRequests: number
    perMilliseconds: number
  }
}

export interface TokensStudioConfig {
  /** JSON object or file path */
  source?: string | TokensStudioFormat

  /** Active theme sets */
  themes?: string[]
}

export interface TransformConfig {
  /** Transform color formats */
  colorFormat?: 'hex' | 'rgb' | 'hsl' | 'all'

  /** Transform dimensions to specific units */
  dimensionUnit?: 'px' | 'rem' | 'em'

  /** Base font size for rem calculations */
  baseFontSize?: number

  /** Convert names to specific case */
  nameCase?: 'camelCase' | 'kebabCase' | 'snakeCase' | 'pascalCase'

  /** Custom transform functions */
  custom?: Record<string, (value: any) => any>
}

export interface ValidationConfig {
  /** Validate color values */
  validateColors?: boolean

  /** Validate references */
  validateReferences?: boolean

  /** Detect circular references */
  detectCircular?: boolean

  /** Detect conflicts */
  detectConflicts?: boolean

  /** Required token categories */
  requiredCategories?: TokenCategory[]

  /** Custom validation rules */
  customRules?: ValidationRule[]
}

export interface ValidationRule {
  name: string
  category?: TokenCategory
  validate: (token: DesignToken) => boolean | string
}

/**
 * Validation Result
 */

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  token: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  token: string
  message: string
  suggestion?: string
}

/**
 * Token Conflict
 */

export interface TokenConflict {
  name: string
  tokens: DesignToken[]
  reason: string
}

/**
 * Export Options
 */

export interface ExportOptions {
  /** Output format */
  format: ExportFormat

  /** Output file path (if writing to file) */
  outputPath?: string

  /** Include comments/descriptions */
  includeComments?: boolean

  /** Pretty print output */
  pretty?: boolean

  /** Indent size for pretty printing */
  indent?: number

  /** CSS/SCSS prefix */
  cssPrefix?: string

  /** Include metadata */
  includeMetadata?: boolean

  /** Theme to export (or 'all') */
  theme?: ThemeMode | 'all'

  /** Platform-specific options */
  platformOptions?: Record<string, any>
}

/**
 * Zod Schemas for Runtime Validation
 */

export const ColorValueSchema = z.object({
  hex: z.string().optional(),
  rgb: z.object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
    a: z.number().min(0).max(1).optional(),
  }).optional(),
  hsl: z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100),
    a: z.number().min(0).max(1).optional(),
  }).optional(),
  rgba: z.string().optional(),
  hsla: z.string().optional(),
})

export const DesignTokenSchema = z.object({
  name: z.string(),
  value: z.any(),
  type: z.nativeEnum(TokenType),
  category: z.nativeEnum(TokenCategory),
  description: z.string().optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).optional(),
  theme: z.nativeEnum(ThemeMode).optional(),
  semantic: z.boolean().optional(),
  source: z.enum(['figma', 'styleDictionary', 'tokensStudio', 'css', 'website', 'image', 'custom']).optional(),
  platforms: z.record(z.any()).optional(),
  extensions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

export const FigmaConfigSchema = z.object({
  fileKey: z.string().min(1, 'Figma file key is required'),
  accessToken: z.string().min(1, 'Figma access token is required'),
  apiVersion: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  extractStyles: z.boolean().optional(),
  extractComponents: z.boolean().optional(),
  rateLimit: z.object({
    maxRequests: z.number().positive(),
    perMilliseconds: z.number().positive(),
  }).optional(),
})

export const ExtractorConfigSchema = z.object({
  figma: FigmaConfigSchema.optional(),
  styleDictionary: z.any().optional(),
  tokensStudio: z.object({
    source: z.union([z.string(), z.any()]),
    themes: z.array(z.string()).optional(),
  }).optional(),
  defaultTheme: z.nativeEnum(ThemeMode).optional(),
  includeSemantic: z.boolean().optional(),
  includeReference: z.boolean().optional(),
  nameSeparator: z.string().optional(),
  prefix: z.string().optional(),
  transforms: z.any().optional(),
  validation: z.any().optional(),
})

export const ExportOptionsSchema = z.object({
  format: z.nativeEnum(ExportFormat),
  outputPath: z.string().optional(),
  includeComments: z.boolean().optional(),
  pretty: z.boolean().optional(),
  indent: z.number().optional(),
  cssPrefix: z.string().optional(),
  includeMetadata: z.boolean().optional(),
  theme: z.union([z.nativeEnum(ThemeMode), z.literal('all')]).optional(),
  platformOptions: z.record(z.any()).optional(),
})
