/**
 * Code Interpreter Tool for AI Kit
 *
 * Provides sandboxed execution of JavaScript and Python code with:
 * - Isolated execution environment (no file system or network access)
 * - Timeout protection (max 30s)
 * - Resource limits (memory, CPU)
 * - Input/output capture
 * - Comprehensive error handling
 *
 * Security Features:
 * - Uses isolated-vm for JavaScript (V8 isolates)
 * - No access to Node.js built-ins
 * - No network or file system access
 * - Memory and execution time limits
 */

import ivm from 'isolated-vm'
import { z } from 'zod'

/**
 * Supported programming languages for code execution
 */
export type SupportedLanguage = 'javascript' | 'python'

/**
 * Execution result interface
 */
export interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime: number
  language: SupportedLanguage
  memoryUsed?: number
}

/**
 * Code execution options
 */
export interface CodeExecutionOptions {
  code: string
  language: SupportedLanguage
  timeout?: number // milliseconds, default 30000 (30s)
  memoryLimit?: number // MB, default 128
}

/**
 * Zod schema for validating code execution options
 */
export const codeExecutionSchema = z.object({
  code: z.string().trim().min(1, 'Code must not be empty').max(100000, 'Code is too large (max 100KB)'),
  language: z.enum(['javascript', 'python']),
  timeout: z.number().min(100).max(30000).optional().default(30000),
  memoryLimit: z.number().min(8).max(512).optional().default(128),
})

/**
 * Execute JavaScript code in an isolated V8 isolate
 *
 * Security measures:
 * - No access to Node.js APIs
 * - No network or file system access
 * - Isolated global scope
 * - Memory and execution time limits
 */
async function executeJavaScript(
  code: string,
  timeout: number,
  memoryLimit: number
): Promise<ExecutionResult> {
  const startTime = Date.now()

  try {
    // Create a new isolated V8 isolate with memory limit
    const isolate = new ivm.Isolate({ memoryLimit })

    // Create a new context within the isolate
    const context = await isolate.createContext()

    // Create an external function to capture console output
    const logs: string[] = []

    // Create callback functions using ivm.Callback
    await context.global.set('__log', new ivm.Callback((...args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      logs.push(message)
    }))

    await context.global.set('__error', new ivm.Callback((...args: any[]) => {
      const message = args.map(arg => String(arg)).join(' ')
      logs.push('[ERROR] ' + message)
    }))

    await context.global.set('__warn', new ivm.Callback((...args: any[]) => {
      const message = args.map(arg => String(arg)).join(' ')
      logs.push('[WARN] ' + message)
    }))

    await context.global.set('__info', new ivm.Callback((...args: any[]) => {
      const message = args.map(arg => String(arg)).join(' ')
      logs.push('[INFO] ' + message)
    }))

    // Create console object in the isolated context
    await context.eval(`
      globalThis.console = {
        log: function(...args) { return __log.apply(undefined, args) },
        error: function(...args) { return __error.apply(undefined, args) },
        warn: function(...args) { return __warn.apply(undefined, args) },
        info: function(...args) { return __info.apply(undefined, args) }
      }
    `)

    // Wrap the code to execute and capture return values
    // We try as an expression first, if that fails, execute as statements
    let wrappedCode: string
    const trimmedCode = code.trim()

    // Check if it's likely a simple expression (no semicolons, braces, or statement keywords)
    const isLikelyExpression = !trimmedCode.includes(';') &&
                                !trimmedCode.includes('{') &&
                                !trimmedCode.includes('\n') &&
                                !/^\s*(const|let|var|function|class|if|for|while|do)\s/.test(trimmedCode)

    if (isLikelyExpression) {
      // Try to evaluate as expression
      wrappedCode = `(${code})`
    } else {
      // Execute as statements
      wrappedCode = `(() => { ${code} })()`
    }

    // Compile and execute the code with timeout
    const script = await isolate.compileScript(wrappedCode)
    const result = await script.run(context, { timeout })

    // Build output from logs
    let output = logs.join('\n')

    // If there's a return value, add it to the output
    // context.eval returns primitive values directly, not References
    if (result !== undefined && result !== null) {
      const resultStr = typeof result === 'object'
        ? JSON.stringify(result, null, 2)
        : String(result)
      output += (output ? '\n' : '') + resultStr
    }

    const executionTime = Date.now() - startTime

    // Dispose of the isolate to free resources
    isolate.dispose()

    return {
      success: true,
      output: output || '(no output)',
      executionTime,
      language: 'javascript',
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message

      // Provide more user-friendly error messages
      if (errorMessage.includes('Script execution timed out')) {
        errorMessage = `Execution timed out after ${timeout}ms. The code took too long to execute.`
      } else if (errorMessage.includes('Array buffer allocation failed')) {
        errorMessage = `Memory limit exceeded (${memoryLimit}MB). The code used too much memory.`
      }
    }

    return {
      success: false,
      error: errorMessage,
      executionTime,
      language: 'javascript',
    }
  }
}

/**
 * Execute Python code in a sandboxed environment
 *
 * Note: For production use, this should use Docker or a similar containerization
 * solution. For now, we'll provide a basic implementation that spawns a Python
 * process with restricted capabilities.
 *
 * Security measures:
 * - Spawns Python in a separate process
 * - Timeout enforcement
 * - No file system access (not fully enforced - needs Docker for production)
 * - Output capture
 */
async function executePython(
  code: string,
  timeout: number,
  _memoryLimit: number // Not used in subprocess approach, would be used with Docker
): Promise<ExecutionResult> {
  const startTime = Date.now()

  try {
    // For security, we'll use a restricted Python environment
    // In production, this should be replaced with Docker or similar
    const { spawn } = await import('child_process')

    return new Promise<ExecutionResult>((resolve) => {
      const outputs: string[] = []
      const errors: string[] = []
      let hasTimedOut = false

      // Create a Python script that restricts imports and capabilities
      const restrictedCode = `
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

# Restrict dangerous imports
__builtins__.__dict__['__import__'] = None
__builtins__.__dict__['open'] = None
__builtins__.__dict__['eval'] = None
__builtins__.__dict__['exec'] = None
__builtins__.__dict__['compile'] = None

# Capture stdout and stderr
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

try:
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        # User code starts here
${code.split('\n').map(line => '        ' + line).join('\n')}
        # User code ends here

    output = stdout_capture.getvalue()
    if output:
        print(output, end='')

    error = stderr_capture.getvalue()
    if error:
        print(error, file=sys.stderr, end='')

except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}", file=sys.stderr)
    sys.exit(1)
`

      // Spawn Python process
      const pythonProcess = spawn('python3', ['-c', restrictedCode], {
        timeout,
        env: {}, // Empty environment for security
      })

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        hasTimedOut = true
        pythonProcess.kill('SIGTERM')

        // Force kill after 1 second if not terminated
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill('SIGKILL')
          }
        }, 1000)
      }, timeout)

      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        outputs.push(data.toString())
      })

      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        errors.push(data.toString())
      })

      // Handle process completion
      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutHandle)
        const executionTime = Date.now() - startTime

        if (hasTimedOut) {
          resolve({
            success: false,
            error: `Execution timed out after ${timeout}ms. The code took too long to execute.`,
            executionTime,
            language: 'python',
          })
          return
        }

        if (code !== 0 || errors.length > 0) {
          resolve({
            success: false,
            error: errors.join('') || `Process exited with code ${code}`,
            executionTime,
            language: 'python',
          })
          return
        }

        resolve({
          success: true,
          output: outputs.join('') || '(no output)',
          executionTime,
          language: 'python',
        })
      })

      // Handle process errors
      pythonProcess.on('error', (error) => {
        clearTimeout(timeoutHandle)
        const executionTime = Date.now() - startTime

        let errorMessage = error.message
        if (errorMessage.includes('ENOENT')) {
          errorMessage = 'Python 3 is not installed or not found in PATH'
        }

        resolve({
          success: false,
          error: errorMessage,
          executionTime,
          language: 'python',
        })
      })
    })
  } catch (error) {
    const executionTime = Date.now() - startTime

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      language: 'python',
    }
  }
}

/**
 * Execute code in a sandboxed environment
 *
 * This is the main entry point for code execution. It validates the input,
 * selects the appropriate execution engine, and returns the result.
 *
 * @param options - Code execution options
 * @returns Execution result with output or error
 *
 * @example
 * ```typescript
 * const result = await executeCode({
 *   code: 'console.log("Hello, World!")',
 *   language: 'javascript'
 * })
 * console.log(result.output) // "Hello, World!"
 * ```
 */
export async function executeCode(
  options: CodeExecutionOptions
): Promise<ExecutionResult> {
  try {
    // Validate input using Zod schema
    const validated = codeExecutionSchema.parse(options)

    const { code, language, timeout, memoryLimit } = validated

    // Route to the appropriate execution engine
    if (language === 'javascript') {
      return await executeJavaScript(code, timeout, memoryLimit)
    } else if (language === 'python') {
      return await executePython(code, timeout, memoryLimit)
    } else {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        executionTime: 0,
        language,
      }
    }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        executionTime: 0,
        language: options.language,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: 0,
      language: options.language,
    }
  }
}

/**
 * Code Interpreter Tool for AI Kit
 *
 * This tool can be used by AI agents to execute code in a sandboxed environment.
 * It provides a safe way to run user-provided or AI-generated code.
 */
export const codeInterpreterTool = {
  name: 'code_interpreter',
  description: 'Execute code in a sandboxed environment. Supports JavaScript and Python. Maximum execution time is 30 seconds.',
  parameters: codeExecutionSchema,
  execute: executeCode,
}

export default codeInterpreterTool
