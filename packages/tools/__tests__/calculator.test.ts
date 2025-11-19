import { describe, it, expect } from 'vitest'
import {
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
} from '../src/calculator'

describe('Calculator Tool', () => {
  describe('calculate - Basic Arithmetic', () => {
    it('should perform addition', () => {
      const result = calculate({ expression: '2 + 2' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(4)
    })

    it('should perform subtraction', () => {
      const result = calculate({ expression: '10 - 3' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(7)
    })

    it('should perform multiplication', () => {
      const result = calculate({ expression: '6 * 7' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(42)
    })

    it('should perform division', () => {
      const result = calculate({ expression: '15 / 3' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(5)
    })

    it('should handle power operations', () => {
      const result = calculate({ expression: '2 ^ 8' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(256)
    })

    it('should handle modulo operations', () => {
      const result = calculate({ expression: '17 mod 5' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(2)
    })

    it('should respect order of operations (PEMDAS)', () => {
      const result = calculate({ expression: '2 + 3 * 4' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(14)
    })

    it('should handle parentheses', () => {
      const result = calculate({ expression: '(2 + 3) * 4' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(20)
    })

    it('should handle nested operations', () => {
      const result = calculate({ expression: '((10 + 5) * 2) / 3' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(10)
    })

    it('should handle decimal numbers', () => {
      const result = calculate({ expression: '3.14 * 2' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(6.28, 1)
    })

    it('should handle negative numbers', () => {
      const result = calculate({ expression: '-5 + 3' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(-2)
    })
  })

  describe('calculate - Mathematical Functions', () => {
    it('should calculate square root', () => {
      const result = calculate({ expression: 'sqrt(16)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(4)
    })

    it('should calculate absolute value', () => {
      const result = calculate({ expression: 'abs(-42)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(42)
    })

    it('should calculate logarithm', () => {
      const result = calculate({ expression: 'log(100, 10)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(2)
    })

    it('should calculate natural logarithm', () => {
      const result = calculate({ expression: 'log(e)' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(1, 5)
    })

    it('should calculate exponential', () => {
      const result = calculate({ expression: 'exp(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(1)
    })

    it('should round numbers', () => {
      const result = calculate({ expression: 'round(3.7)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(4)
    })

    it('should calculate floor', () => {
      const result = calculate({ expression: 'floor(3.9)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(3)
    })

    it('should calculate ceiling', () => {
      const result = calculate({ expression: 'ceil(3.1)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(4)
    })

    it('should calculate factorial', () => {
      const result = calculate({ expression: 'factorial(5)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(120)
    })

    it('should calculate GCD', () => {
      const result = calculate({ expression: 'gcd(48, 18)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(6)
    })

    it('should calculate LCM', () => {
      const result = calculate({ expression: 'lcm(4, 6)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(12)
    })
  })

  describe('calculate - Trigonometry', () => {
    it('should calculate sine', () => {
      const result = calculate({ expression: 'sin(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(0)
    })

    it('should calculate cosine', () => {
      const result = calculate({ expression: 'cos(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(1)
    })

    it('should calculate tangent', () => {
      const result = calculate({ expression: 'tan(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(0)
    })

    it('should calculate arc sine', () => {
      const result = calculate({ expression: 'asin(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(0)
    })

    it('should calculate arc cosine', () => {
      const result = calculate({ expression: 'acos(1)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(0)
    })

    it('should calculate arc tangent', () => {
      const result = calculate({ expression: 'atan(0)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(0)
    })

    it('should work with pi constant', () => {
      const result = calculate({ expression: 'sin(pi/2)' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(1, 5)
    })
  })

  describe('calculate - Constants', () => {
    it('should support pi constant', () => {
      const result = calculate({ expression: 'pi' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(3.14159, 4)
    })

    it('should support e constant', () => {
      const result = calculate({ expression: 'e' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(2.71828, 4)
    })

    it('should support calculations with pi', () => {
      const result = calculate({ expression: '2 * pi' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(6.28318, 4)
    })
  })

  describe('calculate - Formatting Options', () => {
    it('should format as number by default', () => {
      const result = calculate({ expression: '22 / 7', format: 'number' })
      expect(result.success).toBe(true)
      expect(typeof result.result).toBe('number')
    })

    it('should format as string when requested', () => {
      const result = calculate({ expression: '22 / 7', format: 'string' })
      expect(result.success).toBe(true)
      expect(typeof result.result).toBe('string')
    })

    it('should format as exponential notation', () => {
      const result = calculate({ expression: '1234567', format: 'exponential', precision: 2 })
      expect(result.success).toBe(true)
      expect(result.result).toBe('1.23e+6')
    })

    it('should format as fixed decimal places', () => {
      const result = calculate({ expression: '22 / 7', format: 'fixed', precision: 3 })
      expect(result.success).toBe(true)
      expect(result.result).toBe('3.143')
    })

    it('should respect precision setting', () => {
      const result = calculate({ expression: 'pi', format: 'fixed', precision: 5 })
      expect(result.success).toBe(true)
      expect(result.result).toBe('3.14159')
    })
  })

  describe('calculate - Complex Expressions', () => {
    it('should handle complex multi-step calculations', () => {
      const result = calculate({ expression: '(sqrt(16) + 5) * 2 - 10 / 2' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(13)
    })

    it('should handle expressions with multiple functions', () => {
      const result = calculate({ expression: 'sqrt(abs(-16)) + ceil(3.2)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(8)
    })

    it('should handle statistical functions in expressions', () => {
      const result = calculate({ expression: 'mean([1, 2, 3, 4, 5])' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(3)
    })

    it('should handle max/min functions', () => {
      const result = calculate({ expression: 'max(5, 10, 3, 8)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(10)
    })

    it('should handle sum function', () => {
      const result = calculate({ expression: 'sum([1, 2, 3, 4, 5])' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(15)
    })
  })

  describe('calculate - Error Handling', () => {
    it('should handle division by zero', () => {
      const result = calculate({ expression: '1 / 0' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(Infinity)
    })

    it('should handle invalid syntax', () => {
      const result = calculate({ expression: '2 +* 2' })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle empty expression', () => {
      const result = calculate({ expression: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle undefined variables', () => {
      const result = calculate({ expression: 'x + 5' })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject expressions that are too long', () => {
      const longExpr = '1 + '.repeat(500) + '1'
      const result = calculate({ expression: longExpr })
      expect(result.success).toBe(false)
      expect(result.error).toContain('too long')
    })
  })

  describe('calculate - Security', () => {
    it('should reject eval() attempts', () => {
      const result = calculate({ expression: 'eval("alert(1)")' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject require() attempts', () => {
      const result = calculate({ expression: 'require("fs")' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject import() attempts', () => {
      const result = calculate({ expression: 'import("fs")' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject function constructor', () => {
      const result = calculate({ expression: 'function() { return 1; }' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject arrow functions', () => {
      const result = calculate({ expression: '() => 1' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject process access', () => {
      const result = calculate({ expression: 'process.exit()' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject prototype access', () => {
      const result = calculate({ expression: 'prototype.toString()' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject constructor access', () => {
      const result = calculate({ expression: 'constructor.name' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should reject __proto__ access', () => {
      const result = calculate({ expression: '__proto__.toString()' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })
  })

  describe('calculateStatistics', () => {
    it('should calculate mean correctly', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.mean).toBe(3)
    })

    it('should calculate median correctly', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.median).toBe(3)
    })

    it('should calculate median for even-length array', () => {
      const stats = calculateStatistics([1, 2, 3, 4])
      expect(stats.median).toBe(2.5)
    })

    it('should calculate standard deviation', () => {
      const stats = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9])
      expect(stats.stdDev).toBeCloseTo(2, 0)
    })

    it('should calculate variance', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.variance).toBeCloseTo(2.5, 1)
    })

    it('should calculate min and max', () => {
      const stats = calculateStatistics([3, 1, 4, 1, 5, 9, 2, 6])
      expect(stats.min).toBe(1)
      expect(stats.max).toBe(9)
    })

    it('should calculate sum', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.sum).toBe(15)
    })

    it('should calculate count', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.count).toBe(5)
    })

    it('should calculate mode when present', () => {
      const stats = calculateStatistics([1, 2, 2, 3, 4])
      expect(stats.mode).toEqual([2])
    })

    it('should return empty mode when no repeats', () => {
      const stats = calculateStatistics([1, 2, 3, 4, 5])
      expect(stats.mode).toEqual([])
    })

    it('should handle multiple modes', () => {
      const stats = calculateStatistics([1, 1, 2, 2, 3])
      expect(stats.mode).toEqual(expect.arrayContaining([1, 2]))
      expect(stats.mode.length).toBe(2)
    })

    it('should handle single element array', () => {
      const stats = calculateStatistics([42])
      expect(stats.mean).toBe(42)
      expect(stats.median).toBe(42)
      expect(stats.min).toBe(42)
      expect(stats.max).toBe(42)
    })

    it('should throw error for empty array', () => {
      expect(() => calculateStatistics([])).toThrow('non-empty array')
    })

    it('should throw error for non-array input', () => {
      expect(() => calculateStatistics('not an array' as any)).toThrow('array')
    })

    it('should throw error for array with non-numbers', () => {
      expect(() => calculateStatistics([1, 2, 'three' as any, 4])).toThrow('valid numbers')
    })

    it('should throw error for array with NaN', () => {
      expect(() => calculateStatistics([1, 2, NaN, 4])).toThrow('valid numbers')
    })
  })

  describe('solveEquation', () => {
    it('should solve simple linear equation', () => {
      const result = solveEquation('2x + 5 = 13', 'x')
      expect(result.success).toBe(true)
      expect(result.variable).toBe('x')
    })

    it('should handle equations without variable parameter', () => {
      const result = solveEquation('3x = 9')
      expect(result.success).toBe(true)
      expect(result.variable).toBe('x')
    })

    it('should reject equations without equals sign', () => {
      const result = solveEquation('2x + 5')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid equation')
    })

    it('should reject equations with multiple equals signs', () => {
      const result = solveEquation('x = 2 = 3')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid equation')
    })

    it('should reject equations with forbidden patterns', () => {
      const result = solveEquation('eval(x) = 5')
      expect(result.success).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should return formatted result', () => {
      const result = solveEquation('x + 1 = 5', 'x')
      expect(result.success).toBe(true)
      expect(result.formattedResult).toContain('x =')
    })
  })

  describe('calculateBatch', () => {
    it('should calculate multiple expressions', () => {
      const results = calculateBatch([
        { expression: '2 + 2' },
        { expression: 'sqrt(16)' },
        { expression: 'pi * 2' }
      ])

      expect(results.length).toBe(3)
      expect(results[0].success).toBe(true)
      expect(results[0].result).toBe(4)
      expect(results[1].success).toBe(true)
      expect(results[1].result).toBe(4)
      expect(results[2].success).toBe(true)
    })

    it('should handle mix of successful and failed calculations', () => {
      const results = calculateBatch([
        { expression: '2 + 2' },
        { expression: 'invalid syntax +++' },
        { expression: 'sqrt(16)' }
      ])

      expect(results.length).toBe(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })

    it('should handle empty array', () => {
      const results = calculateBatch([])
      expect(results).toEqual([])
    })

    it('should preserve expression in results', () => {
      const results = calculateBatch([
        { expression: '1 + 1' },
        { expression: '2 + 2' }
      ])

      expect(results[0].expression).toBe('1 + 1')
      expect(results[1].expression).toBe('2 + 2')
    })
  })

  describe('validateCalculatorExpression', () => {
    it('should validate correct expression', () => {
      const result = validateCalculatorExpression('2 + 2')
      expect(result.valid).toBe(true)
      expect(result.parsedExpression).toBeDefined()
    })

    it('should validate complex expression', () => {
      const result = validateCalculatorExpression('sqrt(16) + abs(-5)')
      expect(result.valid).toBe(true)
      expect(result.parsedExpression).toBeDefined()
    })

    it('should reject invalid syntax', () => {
      const result = validateCalculatorExpression('2 +* 2')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject forbidden patterns', () => {
      const result = validateCalculatorExpression('eval("alert(1)")')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('forbidden')
    })

    it('should provide parsed expression', () => {
      const result = validateCalculatorExpression('(2+3)*4')
      expect(result.valid).toBe(true)
      expect(result.parsedExpression).toBeTruthy()
    })
  })

  describe('getAvailableFunctions', () => {
    it('should return functions and constants', () => {
      const { functions, constants } = getAvailableFunctions()
      expect(Array.isArray(functions)).toBe(true)
      expect(Array.isArray(constants)).toBe(true)
    })

    it('should include basic math functions', () => {
      const { functions } = getAvailableFunctions()
      expect(functions).toContain('sqrt')
      expect(functions).toContain('abs')
      expect(functions).toContain('sin')
      expect(functions).toContain('cos')
    })

    it('should include statistical functions', () => {
      const { functions } = getAvailableFunctions()
      expect(functions).toContain('mean')
      expect(functions).toContain('median')
      expect(functions).toContain('std')
      expect(functions).toContain('variance')
    })

    it('should include constants', () => {
      const { constants } = getAvailableFunctions()
      expect(constants).toContain('pi')
      expect(constants).toContain('e')
    })

    it('should have non-empty lists', () => {
      const { functions, constants } = getAvailableFunctions()
      expect(functions.length).toBeGreaterThan(0)
      expect(constants.length).toBeGreaterThan(0)
    })
  })

  describe('CalculatorInputSchema', () => {
    it('should validate correct input', () => {
      const input = { expression: '2 + 2' }
      const result = CalculatorInputSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const input = { expression: '2 + 2' }
      const result = CalculatorInputSchema.parse(input)
      expect(result.precision).toBe(10)
      expect(result.format).toBe('number')
    })

    it('should validate precision range', () => {
      const input = { expression: '2 + 2', precision: 25 }
      const result = CalculatorInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should validate format enum', () => {
      const input = { expression: '2 + 2', format: 'invalid' as any }
      const result = CalculatorInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty expression', () => {
      const input = { expression: '' }
      const result = CalculatorInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject too long expression', () => {
      const input = { expression: 'a'.repeat(1001) }
      const result = CalculatorInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept valid format values', () => {
      const formats: Array<'number' | 'string' | 'exponential' | 'fixed'> =
        ['number', 'string', 'exponential', 'fixed']

      formats.forEach(format => {
        const input = { expression: '2 + 2', format }
        const result = CalculatorInputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid precision values', () => {
      [0, 5, 10, 15, 20].forEach(precision => {
        const input = { expression: '2 + 2', precision }
        const result = CalculatorInputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const result = calculate({ expression: '999999999999 * 999999999999' })
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
    })

    it('should handle very small numbers', () => {
      const result = calculate({ expression: '0.0000000001 * 0.0000000001' })
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
    })

    it('should handle negative zero', () => {
      const result = calculate({ expression: '-0' })
      expect(result.success).toBe(true)
    })

    it('should handle infinity', () => {
      const result = calculate({ expression: 'Infinity' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(Infinity)
    })

    it('should handle operations with infinity', () => {
      const result = calculate({ expression: 'Infinity + 1' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(Infinity)
    })
  })

  describe('Real-world Use Cases', () => {
    it('should calculate compound interest', () => {
      // Formula: A = P(1 + r/n)^(nt)
      const result = calculate({ expression: '1000 * (1 + 0.05/12)^(12*5)' })
      expect(result.success).toBe(true)
      expect(result.result).toBeCloseTo(1283.36, 1)
    })

    it('should calculate distance formula', () => {
      // sqrt((x2-x1)^2 + (y2-y1)^2)
      const result = calculate({ expression: 'sqrt((5-1)^2 + (7-4)^2)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(5)
    })

    it('should calculate circle area', () => {
      const result = calculate({ expression: 'pi * 5^2', format: 'fixed', precision: 2 })
      expect(result.success).toBe(true)
      expect(result.result).toBe('78.54')
    })

    it('should calculate percentage', () => {
      const result = calculate({ expression: '(45 / 60) * 100' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(75)
    })

    it('should calculate BMI', () => {
      // BMI = weight(kg) / height(m)^2
      const result = calculate({ expression: '70 / (1.75^2)', format: 'fixed', precision: 1 })
      expect(result.success).toBe(true)
      expect(result.result).toBe('22.9')
    })

    it('should convert temperatures (Celsius to Fahrenheit)', () => {
      const result = calculate({ expression: '(25 * 9/5) + 32' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(77)
    })

    it('should calculate pythagorean theorem', () => {
      const result = calculate({ expression: 'sqrt(3^2 + 4^2)' })
      expect(result.success).toBe(true)
      expect(result.result).toBe(5)
    })
  })
})
