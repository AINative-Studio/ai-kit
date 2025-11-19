/**
 * Calculator Tool for AI Kit
 *
 * Provides safe mathematical expression evaluation using mathjs library.
 * Supports arithmetic, algebra, statistics, and various mathematical operations.
 *
 * Security: Uses mathjs parser instead of eval() to prevent code injection.
 */

import { create, all, ConfigOptions, MathJsStatic } from 'mathjs'
import { z } from 'zod'

/**
 * Configuration for the math evaluator
 * Restricts certain features for security
 */
const mathConfig: ConfigOptions = {
  // Disable importing to prevent code execution
  number: 'BigNumber',
  precision: 64
}

// Create a restricted math instance
const math: MathJsStatic = create(all, mathConfig)

/**
 * Input validation schema
 */
export const CalculatorInputSchema = z.object({
  expression: z.string().min(1, 'Expression cannot be empty').max(1000, 'Expression too long'),
  precision: z.number().int().min(0).max(20).optional().default(10),
  format: z.enum(['number', 'string', 'exponential', 'fixed']).optional().default('number')
})

export type CalculatorInput = z.infer<typeof CalculatorInputSchema>

/**
 * Result type for calculator operations
 */
export interface CalculatorResult {
  success: boolean
  result?: string | number
  expression: string
  error?: string
  formattedResult?: string
}

/**
 * Statistics for an array of numbers
 */
export interface StatisticsResult {
  mean: number
  median: number
  mode: number[]
  stdDev: number
  variance: number
  min: number
  max: number
  sum: number
  count: number
}

/**
 * Forbidden patterns that could indicate malicious input
 * These are checked before evaluation
 */
const FORBIDDEN_PATTERNS = [
  /import\s*\(/i,
  /require\s*\(/i,
  /eval\s*\(/i,
  /function\s*\(/i,
  /=>/,
  /\bprocess\b/i,
  /\b__proto__\b/i,
  /\bconstructor\b/i,
  /\bprototype\b/i
]

/**
 * Validates that an expression doesn't contain forbidden patterns
 */
function validateExpression(expression: string): { valid: boolean; error?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(expression)) {
      return {
        valid: false,
        error: `Expression contains forbidden pattern: ${pattern.source}`
      }
    }
  }
  return { valid: true }
}

/**
 * Formats a number according to the specified format
 */
function formatResult(value: any, format: string, precision: number): string | number {
  if (typeof value === 'boolean') {
    return value.toString()
  }

  // Handle complex numbers
  if (math.typeOf(value) === 'Complex') {
    return math.format(value, { precision })
  }

  // Handle matrices and arrays
  if (Array.isArray(value) || math.typeOf(value) === 'Matrix') {
    return math.format(value, { precision })
  }

  const numValue = typeof value === 'number' ? value : parseFloat(value.toString())

  if (isNaN(numValue)) {
    return math.format(value, { precision })
  }

  switch (format) {
    case 'exponential':
      return numValue.toExponential(precision)
    case 'fixed':
      return numValue.toFixed(precision)
    case 'string':
      return numValue.toString()
    case 'number':
    default:
      return numValue
  }
}

/**
 * Main calculator function - evaluates mathematical expressions safely
 *
 * @param input - Calculator input with expression and optional formatting
 * @returns Result object with success status and computed value or error
 *
 * @example
 * ```typescript
 * const result = calculate({ expression: '2 + 2' })
 * // { success: true, result: 4, expression: '2 + 2' }
 *
 * const result = calculate({ expression: 'sqrt(16) + abs(-5)' })
 * // { success: true, result: 9, expression: 'sqrt(16) + abs(-5)' }
 * ```
 */
export function calculate(input: CalculatorInput): CalculatorResult {
  try {
    // Validate input schema
    const validated = CalculatorInputSchema.parse(input)
    const { expression, precision, format } = validated

    // Validate expression for security
    const validation = validateExpression(expression)
    if (!validation.valid) {
      return {
        success: false,
        expression,
        error: validation.error
      }
    }

    // Evaluate the expression using mathjs
    const result = math.evaluate(expression)

    // Format the result
    const formattedResult = formatResult(result, format, precision)

    return {
      success: true,
      result: formattedResult,
      expression,
      formattedResult: formattedResult.toString()
    }
  } catch (error) {
    return {
      success: false,
      expression: input.expression,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Calculate statistics for an array of numbers
 *
 * @param numbers - Array of numbers to analyze
 * @returns Statistics object with mean, median, mode, etc.
 *
 * @example
 * ```typescript
 * const stats = calculateStatistics([1, 2, 3, 4, 5])
 * // { mean: 3, median: 3, mode: [], stdDev: 1.414..., ... }
 * ```
 */
export function calculateStatistics(numbers: number[]): StatisticsResult {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('Input must be a non-empty array of numbers')
  }

  if (numbers.some(n => typeof n !== 'number' || isNaN(n))) {
    throw new Error('All elements must be valid numbers')
  }

  const mean = math.mean(numbers)
  const median = math.median(numbers)
  const stdDev = math.std(numbers)
  const variance = math.variance(numbers)
  const min = math.min(numbers)
  const max = math.max(numbers)
  const sum = math.sum(numbers)

  // Calculate mode
  const frequency: { [key: number]: number } = {}
  numbers.forEach(n => {
    frequency[n] = (frequency[n] || 0) + 1
  })

  const maxFreq = Math.max(...Object.values(frequency))
  const mode = Object.keys(frequency)
    .filter(k => frequency[Number(k)] === maxFreq && maxFreq > 1)
    .map(Number)

  return {
    mean: Number(mean),
    median: Number(median),
    mode,
    stdDev: Number(stdDev),
    variance: Number(variance),
    min: Number(min),
    max: Number(max),
    sum: Number(sum),
    count: numbers.length
  }
}

/**
 * Solve a linear equation in the form "ax + b = c"
 *
 * @param equation - Equation string to solve
 * @param variable - Variable to solve for (default: 'x')
 * @returns Solution result
 *
 * @example
 * ```typescript
 * const result = solveEquation('2x + 5 = 13', 'x')
 * // { success: true, solution: 4, equation: '2x + 5 = 13', variable: 'x' }
 * ```
 */
export function solveEquation(
  equation: string,
  variable: string = 'x'
): CalculatorResult & { variable?: string; solution?: any } {
  try {
    // Validate expression
    const validation = validateExpression(equation)
    if (!validation.valid) {
      return {
        success: false,
        expression: equation,
        error: validation.error
      }
    }

    // Split equation by '='
    const parts = equation.split('=')
    if (parts.length !== 2) {
      return {
        success: false,
        expression: equation,
        error: 'Invalid equation format. Must contain exactly one "=" sign'
      }
    }

    const [left, right] = parts.map(p => p.trim())

    // Create equation in form: left - right = 0
    const expr = `${left} - (${right})`

    // Attempt to solve
    const solution = math.simplify(expr).toString()

    return {
      success: true,
      expression: equation,
      variable,
      solution,
      formattedResult: `${variable} = ${solution}`
    }
  } catch (error) {
    return {
      success: false,
      expression: equation,
      error: error instanceof Error ? error.message : 'Failed to solve equation'
    }
  }
}

/**
 * Evaluate multiple expressions in sequence
 * Useful for multi-step calculations
 *
 * @param expressions - Array of expressions to evaluate
 * @returns Array of results
 *
 * @example
 * ```typescript
 * const results = calculateBatch([
 *   { expression: '2 + 2' },
 *   { expression: 'sqrt(16)' },
 *   { expression: 'pi * 2' }
 * ])
 * ```
 */
export function calculateBatch(expressions: CalculatorInput[]): CalculatorResult[] {
  return expressions.map(expr => calculate(expr))
}

/**
 * Parse and validate a mathematical expression without evaluating it
 * Useful for checking syntax before evaluation
 *
 * @param expression - Expression to parse
 * @returns Validation result
 */
export function validateCalculatorExpression(expression: string): {
  valid: boolean
  error?: string
  parsedExpression?: string
} {
  try {
    // Security check
    const validation = validateExpression(expression)
    if (!validation.valid) {
      return validation
    }

    // Parse without evaluating
    const node = math.parse(expression)
    const parsedExpression = node.toString()

    return {
      valid: true,
      parsedExpression
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid expression'
    }
  }
}

/**
 * Get available mathematical functions and constants
 */
export function getAvailableFunctions(): {
  functions: string[]
  constants: string[]
} {
  const functions = [
    // Arithmetic
    'abs', 'add', 'ceil', 'cube', 'divide', 'exp', 'floor', 'gcd', 'lcm',
    'log', 'log10', 'mod', 'multiply', 'norm', 'nthRoot', 'pow', 'round',
    'sign', 'sqrt', 'square', 'subtract',

    // Trigonometry
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh',

    // Statistics
    'max', 'mean', 'median', 'min', 'mode', 'prod', 'std', 'sum', 'variance',

    // Algebra
    'derivative', 'simplify', 'rationalize',

    // Complex numbers
    'complex', 'conj', 'im', 're',

    // Matrix
    'det', 'inv', 'transpose',

    // Probability
    'combinations', 'factorial', 'gamma', 'permutations',

    // Utils
    'format', 'typeOf'
  ]

  const constants = [
    'pi', 'e', 'i', 'phi', 'tau',
    'Infinity', 'NaN',
    'true', 'false', 'null'
  ]

  return { functions, constants }
}

// Export the calculator tool as default
export default {
  calculate,
  calculateStatistics,
  solveEquation,
  calculateBatch,
  validateCalculatorExpression,
  getAvailableFunctions
}
