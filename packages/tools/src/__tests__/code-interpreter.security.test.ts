/**
 * Security Tests for Code Interpreter
 *
 * Tests for:
 * - Sandbox escape prevention
 * - File system access blocking
 * - Network access blocking
 * - Resource limits
 * - Timeout enforcement
 * - Code injection attacks
 *
 * Refs #67
 */

import { describe, it, expect } from 'vitest'
import { executeCode, type CodeExecutionOptions } from '../code-interpreter'

describe('Code Interpreter Security Tests', () => {
  describe('Sandbox Escape Prevention', () => {
    it('should prevent access to require() in JavaScript', async () => {
      const result = await executeCode({
        code: 'require("fs")',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should prevent access to process object in JavaScript', async () => {
      const result = await executeCode({
        code: 'process.env',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should prevent access to global object pollution', async () => {
      const result = await executeCode({
        code: 'global.malicious = true; global',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should prevent constructor escape attempts', async () => {
      const result = await executeCode({
        code: 'this.constructor.constructor("return process")()',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should prevent prototype pollution attempts', async () => {
      const result = await executeCode({
        code: 'Object.prototype.polluted = true',
        language: 'javascript',
      })

      // This should execute but not affect the host environment
      expect(result.success).toBe(true)
      // Verify host is not polluted
      expect((Object.prototype as any).polluted).toBeUndefined()
    })
  })

  describe('File System Access Blocking', () => {
    it('should prevent fs module access in Python', async () => {
      const result = await executeCode({
        code: 'import os; os.system("ls")',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('import')
    })

    it('should prevent file operations in Python', async () => {
      const result = await executeCode({
        code: 'open("/etc/passwd", "r")',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('open')
    })
  })

  describe('Network Access Blocking', () => {
    it('should prevent network requests in Python', async () => {
      const result = await executeCode({
        code: 'import urllib; urllib.request.urlopen("http://example.com")',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('import')
    })

    it('should prevent subprocess execution in Python', async () => {
      const result = await executeCode({
        code: 'import subprocess; subprocess.call(["ls"])',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('import')
    })
  })

  describe('Resource Limits', () => {
    it('should enforce memory limits for JavaScript', async () => {
      const result = await executeCode({
        code: 'const arr = []; while(true) arr.push(new Array(1000000))',
        language: 'javascript',
        memoryLimit: 8, // 8MB limit
        timeout: 5000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/memory|allocation/i)
    })

    it('should enforce timeout for infinite loops in JavaScript', async () => {
      const result = await executeCode({
        code: 'while(true) {}',
        language: 'javascript',
        timeout: 1000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timed out')
      expect(result.executionTime).toBeGreaterThanOrEqual(1000)
    })

    it('should enforce timeout for Python execution', async () => {
      const result = await executeCode({
        code: 'import time; time.sleep(10)',
        language: 'python',
        timeout: 2000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timed out')
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
    })

    it('should reject code that is too large', async () => {
      const largeCode = 'a'.repeat(200000) // 200KB
      const result = await executeCode({
        code: largeCode,
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should validate timeout parameter', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        timeout: 50, // Too small
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should validate memory limit parameter', async () => {
      const result = await executeCode({
        code: 'console.log("test")',
        language: 'javascript',
        memoryLimit: 2, // Too small
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })
  })

  describe('Code Injection Prevention', () => {
    it('should safely handle code with backticks in JavaScript', async () => {
      const result = await executeCode({
        code: 'const str = `Hello ${1 + 1}`; str',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello 2')
    })

    it('should safely handle code with special characters', async () => {
      const result = await executeCode({
        code: 'const str = "Hello\\nWorld"; str',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello')
      expect(result.output).toContain('World')
    })

    it('should safely handle code with quotes in Python', async () => {
      const result = await executeCode({
        code: 'print("Hello \\"World\\"")',
        language: 'python',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello "World"')
    })
  })

  describe('Safe Execution', () => {
    it('should successfully execute safe JavaScript code', async () => {
      const result = await executeCode({
        code: 'console.log("Hello, World!"); 42',
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, World!')
      expect(result.output).toContain('42')
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should successfully execute safe Python code', async () => {
      const result = await executeCode({
        code: 'print("Hello from Python")',
        language: 'python',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello from Python')
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should capture console output in JavaScript', async () => {
      const result = await executeCode({
        code: `
          console.log("line 1");
          console.warn("warning");
          console.error("error");
          console.info("info");
        `,
        language: 'javascript',
      })

      expect(result.success).toBe(true)
      expect(result.output).toContain('line 1')
      expect(result.output).toContain('warning')
      expect(result.output).toContain('error')
      expect(result.output).toContain('info')
    })
  })

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully in JavaScript', async () => {
      const result = await executeCode({
        code: 'const x = ;',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle runtime errors gracefully in JavaScript', async () => {
      const result = await executeCode({
        code: 'throw new Error("test error")',
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('test error')
    })

    it('should handle Python syntax errors gracefully', async () => {
      const result = await executeCode({
        code: 'def invalid syntax',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle Python runtime errors gracefully', async () => {
      const result = await executeCode({
        code: 'raise ValueError("test error")',
        language: 'python',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('ValueError')
    })
  })

  describe('Isolation Verification', () => {
    it('should isolate multiple executions from each other', async () => {
      // First execution sets a variable
      const result1 = await executeCode({
        code: 'globalThis.testVar = "set"; testVar',
        language: 'javascript',
      })
      expect(result1.success).toBe(true)

      // Second execution should not see the variable
      const result2 = await executeCode({
        code: 'typeof testVar',
        language: 'javascript',
      })
      expect(result2.success).toBe(true)
      expect(result2.output).toContain('undefined')
    })

    it('should not affect host environment after execution', async () => {
      const originalConsoleLog = console.log

      await executeCode({
        code: 'console.log = function() { return "hacked" }',
        language: 'javascript',
      })

      // Verify host console.log is unchanged
      expect(console.log).toBe(originalConsoleLog)
    })
  })
})
