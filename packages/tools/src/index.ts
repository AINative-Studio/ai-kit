/**
 * @ainative/ai-kit-tools
 * Built-in tools for AI Kit agents
 *
 * This package contains built-in tools like:
 * - Calculator - Safe mathematical expression evaluation
 * - Code interpreter
 * - ZeroDB query
 * - Web search - Brave Search API integration
 * - Design Token Extractor - Extract and normalize design tokens from Figma, Style Dictionary, and Tokens Studio
 * - Design Validator - AI-powered design validation for accessibility, branding, and UX
 */

// Version
export const version = '0.0.1'

// Calculator Tool
export {
  calculate,
  calculateStatistics,
  solveEquation,
  calculateBatch,
  validateCalculatorExpression,
  getAvailableFunctions,
  CalculatorInputSchema,
  type CalculatorInput,
  type CalculatorResult,
  type StatisticsResult
} from './calculator'

// Calculator default export
export { default as calculator } from './calculator'

// Code Interpreter Tool
export {
  executeCode,
  codeInterpreterTool,
  codeExecutionSchema,
  type ExecutionResult,
  type CodeExecutionOptions,
  type SupportedLanguage,
} from './code-interpreter'

// ZeroDB Query Tool
export {
  ZeroDBQueryTool,
  QueryParser,
  ResultFormatter,
  QueryType,
  ResultFormat,
  createZeroDBQueryTool,
  ZeroDBConfigSchema,
  type ZeroDBConfig,
  type ParsedQuery,
  type QueryResult,
} from './zerodb-query'

// ZeroDB Tool (Agent Tool)
export {
  ZeroDBTool,
  NaturalLanguageParser,
  SafetyValidator,
  ResultFormatter as ZeroDBResultFormatter,
  createZeroDBTool,
  type ZeroDBToolConfig,
  type DatabaseOperation,
  type SafetyCheck,
  type ToolResult,
  type ParsedNaturalLanguage,
  type TableSchema,
  type ColumnSchema,
  type DatabaseSchema,
  type ValidationResult,
  type ToolCapabilities,
  type OperationStats,
  DatabaseOperationType,
  QueryIntent,
  SafetyLevel,
  ResultFormat as ZeroDBResultFormat,
} from './zerodb-tool'

// ZeroDB Types
export type {
  RateLimitState,
  ExecutionContext,
  SchemaCacheEntry,
  IndexSchema,
  AggregationResult,
  SearchResult as ZeroDBSearchResult,
} from './zerodb-types'

// Web Search Tool
export {
  createWebSearchTool,
  WebSearchClient,
  webSearchParametersSchema,
  type WebSearchConfig,
  type WebSearchParams,
  type WebSearchResponse,
  type SearchResult,
  WebSearchError,
  RateLimitError,
  InvalidAPIKeyError,
} from './web-search'

// Design Token Extractor
export {
  DesignTokenExtractor,
  createDesignTokenExtractor,
} from './design-token-extractor'

// Design Token Types
export {
  TokenCategory,
  TokenType,
  ThemeMode,
  ExportFormat,
  ExtractorConfigSchema,
  FigmaConfigSchema,
  ExportOptionsSchema,
  DesignTokenSchema,
  ColorValueSchema,
} from './design-token-types'

export type {
  DesignToken,
  TokenCollection,
  TokenGroup,
  ExtractorConfig,
  FigmaConfig,
  FigmaFile,
  FigmaNode,
  FigmaStyle,
  FigmaColor,
  FigmaPaint,
  FigmaEffect,
  FigmaTypeStyle,
  FigmaRectangle,
  FigmaComponent,
  FigmaColorStop,
  FigmaVector,
  StyleDictionaryConfig,
  StyleDictionaryToken,
  StyleDictionaryPlatform,
  StyleDictionaryFile,
  TokensStudioFormat,
  TokensStudioToken,
  TokensStudioSet,
  TokensStudioConfig,
  ExportOptions,
  ValidationResult as TokenValidationResult,
  ValidationError as TokenValidationError,
  ValidationWarning,
  ValidationConfig as TokenValidationConfig,
  ValidationRule as TokenValidationRule,
  TokenConflict,
  ColorValue,
  ShadowValue,
  GradientValue,
  GradientStop,
  TypographyValue,
  TransitionValue,
  TransformConfig,
} from './design-token-types'

// Design Validator Tool
export {
  DesignValidator,
  createDesignValidator,
  DesignValidationSchema,
  WCAG_CONTRAST_RATIOS,
  DEFAULT_ACCESSIBILITY_OPTIONS,
  DEFAULT_BRANDING_OPTIONS,
  DEFAULT_UX_OPTIONS,
  DEFAULT_PERFORMANCE_OPTIONS,
  DEFAULT_RESPONSIVE_OPTIONS
} from './design-validator'

// Design Validator Types
export {
  Severity,
  ValidationCategory,
  WCAGLevel,
  type Color,
  type ElementBounds,
  type Typography,
  type SpacingSystem,
  type ColorPalette,
  type BrandGuide,
  type DesignElement,
  type Design,
  type ValidationRule as DesignValidationRule,
  type ValidationContext,
  type ValidationIssue,
  type AutoFixSuggestion,
  type ValidationResult as DesignValidationResult,
  type AccessibilityOptions,
  type BrandingOptions,
  type UXOptions,
  type PerformanceOptions,
  type ResponsiveOptions,
  type ValidatorConfig,
  type RecommendationEngine,
  type AIRecommendation,
  type FixStrategy,
  type BatchValidationResult,
  type ReportConfig,
  type ContrastResult,
  type TouchTargetResult,
  type TypographyResult,
  type SpacingResult,
  type ImageOptimizationResult
} from './design-validator-types'
