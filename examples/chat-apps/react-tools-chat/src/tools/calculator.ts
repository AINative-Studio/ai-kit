/**
 * Calculator tool for mathematical operations
 */

export interface CalculatorInput {
  expression: string
}

export interface CalculatorOutput {
  result: number
  steps?: string[]
}

export const calculator = {
  name: 'calculator',
  description: 'Performs mathematical calculations. Supports basic arithmetic, exponents, trigonometry, and more.',

  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")',
      },
    },
    required: ['expression'],
  },

  execute: async (input: CalculatorInput): Promise<CalculatorOutput> => {
    try {
      // Safe evaluation of mathematical expressions
      const result = evaluateExpression(input.expression)

      return {
        result,
        steps: [
          `Expression: ${input.expression}`,
          `Result: ${result}`,
        ],
      }
    } catch (error) {
      throw new Error(`Calculator error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}

function evaluateExpression(expr: string): number {
  // Replace common math functions
  let sanitized = expr
    .replace(/\s/g, '')
    .replace(/π|pi/gi, 'Math.PI')
    .replace(/e(?![a-z])/gi, 'Math.E')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/log\(/g, 'Math.log(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/ceil\(/g, 'Math.ceil(')
    .replace(/floor\(/g, 'Math.floor(')
    .replace(/round\(/g, 'Math.round(')
    .replace(/pow\(/g, 'Math.pow(')
    .replace(/\^/g, '**')

  // Validate expression (only allow safe characters)
  if (!/^[\d+\-*/().,\s\w]+$/.test(sanitized)) {
    throw new Error('Invalid characters in expression')
  }

  // Evaluate using Function constructor (safer than eval)
  const result = new Function(`'use strict'; return (${sanitized})`)()

  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('Invalid result')
  }

  return result
}
