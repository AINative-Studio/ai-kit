/**
 * @ainative/ai-kit-tools
 * Built-in tools for AI Kit agents
 *
 * This package contains built-in tools like:
 * - Calculator - Safe mathematical expression evaluation
 * - Code interpreter
 * - ZeroDB query
 * - Web search - Brave Search API integration
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
