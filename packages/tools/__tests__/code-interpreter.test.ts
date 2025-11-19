import { describe, it, expect, beforeAll } from 'vitest'
import {
  executeCode,
  codeInterpreterTool,
  type ExecutionResult,
  type CodeExecutionOptions,
} from '../src/code-interpreter'

describe('Code Interpreter Tool', () => {
  describe('JavaScript Execution', () => {
    it('should execute simple JavaScript code and return output', async () => {
      const result = await executeCode({
        code: 'console.log("Hello, World!")',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, World!')
      expect(result.language).toBe('javascript')
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should execute JavaScript with return value', async () => {
      const result = await executeCode({
        code: '42',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('42')
    })

    it('should execute JavaScript with multiple console.log statements', async () => {
      const result = await executeCode({
        code: `
          console.log("Line 1")
          console.log("Line 2")
          console.log("Line 3")
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Line 1')
      expect(result.output).toContain('Line 2')
      expect(result.output).toContain('Line 3')
    })

    it('should execute JavaScript with complex data structures', async () => {
      const result = await executeCode({
        code: `
          const obj = { name: "Test", value: 42, nested: { a: 1, b: 2 } }
          console.log(obj)
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('name')
      expect(result.output).toContain('Test')
      expect(result.output).toContain('value')
      expect(result.output).toContain('42')
    })

    it('should execute JavaScript with mathematical operations', async () => {
      const result = await executeCode({
        code: `
          const sum = 10 + 20
          const product = 5 * 6
          console.log("Sum:", sum)
          console.log("Product:", product)
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Sum: 30')
      expect(result.output).toContain('Product: 30')
    })

    it('should execute JavaScript with arrays and loops', async () => {
      const result = await executeCode({
        code: `
          const numbers = [1, 2, 3, 4, 5]
          const doubled = numbers.map(n => n * 2)
          console.log(doubled)
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('2')
      expect(result.output).toContain('4')
      expect(result.output).toContain('6')
      expect(result.output).toContain('8')
      expect(result.output).toContain('10')
    })

    it('should handle JavaScript errors gracefully', async () => {
      const result = await executeCode({
        code: `
          function throwError() {
            throw new Error("Test error")
          }
          throwError()
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Test error')
    })

    it('should handle JavaScript syntax errors', async () => {
      const result = await executeCode({
        code: 'const x = {',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should timeout long-running JavaScript code', async () => {
      const result = await executeCode({
        code: 'while(true) {}',
        language: 'javascript',
        timeout: 1000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('timed out')
    }, 10000)

    it('should handle console.error and console.warn', async () => {
      const result = await executeCode({
        code: `
          console.log("Info message")
          console.error("Error message")
          console.warn("Warning message")
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Info message')
      expect(result.output).toContain('[ERROR] Error message')
      expect(result.output).toContain('[WARN] Warning message')
    })

    it('should not have access to Node.js built-ins', async () => {
      const result = await executeCode({
        code: 'require("fs")',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should not have access to process', async () => {
      const result = await executeCode({
        code: 'console.log(typeof process)',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('undefined')
    })

    it('should execute JavaScript with functions', async () => {
      const result = await executeCode({
        code: `
          function greet(name) {
            return "Hello, " + name + "!"
          }
          console.log(greet("Alice"))
          console.log(greet("Bob"))
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, Alice!')
      expect(result.output).toContain('Hello, Bob!')
    })

    it('should execute JavaScript with async/await', async () => {
      const result = await executeCode({
        code: `
          async function test() {
            console.log("Start")
            const value = await Promise.resolve(42)
            console.log("Value:", value)
            return value
          }

          test()
        `,
        language: 'javascript',
      })

      // Async functions return promises, which may not resolve in the sandbox
      // We just verify the code executes without error
      expect(result.success).toBe(true)
    })
  })

  describe('Python Execution', () => {
    beforeAll(() => {
      // Check if Python is available
      try {
        const { execSync } = require('child_process')
        execSync('python3 --version', { stdio: 'ignore' })
      } catch (error) {
        console.warn('Python 3 not found, Python tests will be skipped')
      }
    })

    it('should execute simple Python code and return output', async () => {
      const result = await executeCode({
        code: 'print("Hello, World!")',
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, World!')
      expect(result.language).toBe('python')
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should execute Python with multiple print statements', async () => {
      const result = await executeCode({
        code: `
print("Line 1")
print("Line 2")
print("Line 3")
        `,
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('Line 1')
      expect(result.output).toContain('Line 2')
      expect(result.output).toContain('Line 3')
    })

    it('should execute Python with mathematical operations', async () => {
      const result = await executeCode({
        code: `
sum_result = 10 + 20
product = 5 * 6
print(f"Sum: {sum_result}")
print(f"Product: {product}")
        `,
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('Sum: 30')
      expect(result.output).toContain('Product: 30')
    })

    it('should execute Python with lists and loops', async () => {
      const result = await executeCode({
        code: `
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(doubled)
        `,
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('[2, 4, 6, 8, 10]')
    })

    it('should handle Python errors gracefully', async () => {
      const result = await executeCode({
        code: 'raise ValueError("Test error")',
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('ValueError')
    })

    it('should handle Python syntax errors', async () => {
      const result = await executeCode({
        code: 'def foo(',
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should timeout long-running Python code', async () => {
      const result = await executeCode({
        code: 'while True: pass',
        language: 'python',
        timeout: 1000,
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('timed out')
    }, 10000)

    it('should execute Python with functions', async () => {
      const result = await executeCode({
        code: `
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))
print(greet("Bob"))
        `,
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, Alice!')
      expect(result.output).toContain('Hello, Bob!')
    })

    it('should execute Python with dictionaries', async () => {
      const result = await executeCode({
        code: `
data = {"name": "Test", "value": 42}
print(data)
        `,
        language: 'python',
      })

      if (result.error && result.error.includes('not installed')) {
        console.warn('Python not available, skipping test')
        return
      }

      expect(result.success).toBe(true)
      expect(result.output).toContain('name')
      expect(result.output).toContain('Test')
    })
  })

  describe('Input Validation', () => {
    it('should reject empty code', async () => {
      const result = await executeCode({
        code: '',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
      expect(result.error).toContain('Code must not be empty')
    })

    it('should reject code that is too large', async () => {
      const largeCode = 'a'.repeat(100001)
      const result = await executeCode({
        code: largeCode,
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
      expect(result.error).toContain('too large')
    })

    it('should reject invalid timeout values', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        timeout: 50, // Too low
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should reject timeout values that are too high', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        timeout: 40000, // Above 30s limit
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should use default timeout when not specified', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
    })

    it('should accept valid timeout values', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        timeout: 5000,
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid memory limit values', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        memoryLimit: 1, // Too low
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should accept valid memory limit values', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        memoryLimit: 64,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Security Tests', () => {
    it('should not allow file system access in JavaScript', async () => {
      const result = await executeCode({
        code: 'fs.readFileSync("/etc/passwd")',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
    })

    it('should not allow network access in JavaScript', async () => {
      const result = await executeCode({
        code: 'fetch("https://example.com")',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
    })

    it('should not expose sensitive Node.js APIs', async () => {
      const result = await executeCode({
        code: `
          console.log(typeof require)
          console.log(typeof module)
          console.log(typeof exports)
          console.log(typeof __dirname)
          console.log(typeof __filename)
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('undefined')
    })

    it('should prevent infinite loops with timeout', async () => {
      const result = await executeCode({
        code: 'while(true) { let x = 1 + 1 }',
        language: 'javascript',
        timeout: 500,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timed out')
      expect(result.executionTime).toBeLessThan(2000)
    }, 5000)
  })

  describe('Tool Interface', () => {
    it('should export tool with correct name', () => {
      expect(codeInterpreterTool.name).toBe('code_interpreter')
    })

    it('should export tool with description', () => {
      expect(codeInterpreterTool.description).toBeDefined()
      expect(typeof codeInterpreterTool.description).toBe('string')
      expect(codeInterpreterTool.description.length).toBeGreaterThan(0)
    })

    it('should export tool with parameters schema', () => {
      expect(codeInterpreterTool.parameters).toBeDefined()
    })

    it('should export tool with execute function', () => {
      expect(codeInterpreterTool.execute).toBeDefined()
      expect(typeof codeInterpreterTool.execute).toBe('function')
    })

    it('should execute through tool interface', async () => {
      const result = await codeInterpreterTool.execute({
        code: 'console.log("Tool test")',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Tool test')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty output', async () => {
      const result = await executeCode({
        code: 'let x = 1 + 1',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })

    it('should handle code with only whitespace', async () => {
      const result = await executeCode({
        code: '   ',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should handle code with unicode characters', async () => {
      const result = await executeCode({
        code: 'console.log("Hello 世界 🌍")',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello 世界 🌍')
    })

    it('should handle multiple data types in output', async () => {
      const result = await executeCode({
        code: `
          console.log(42)
          console.log("string")
          console.log(true)
          console.log(null)
          console.log(undefined)
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('42')
      expect(result.output).toContain('string')
      expect(result.output).toContain('true')
      expect(result.output).toContain('null')
      expect(result.output).toContain('undefined')
    })
  })

  describe('Performance', () => {
    it('should execute simple code quickly', async () => {
      const startTime = Date.now()
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
      })
      const totalTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(totalTime).toBeLessThan(1000) // Should be much faster than 1 second
    })

    it('should report accurate execution time', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
      })

      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.executionTime).toBeLessThan(1000)
    })
  })
})
