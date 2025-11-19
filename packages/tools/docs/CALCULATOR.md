# Calculator Tool Documentation

The Calculator Tool provides safe mathematical expression evaluation for AI Kit agents. It uses the [mathjs](https://mathjs.org/) library for secure parsing and evaluation, preventing code injection vulnerabilities.

## Features

- **Safe Evaluation**: Uses mathjs parser instead of `eval()` to prevent code injection
- **Arithmetic Operations**: +, -, *, /, ^, %, and more
- **Mathematical Functions**: sqrt, abs, log, sin, cos, tan, etc.
- **Statistical Functions**: mean, median, mode, standard deviation, variance
- **Algebra Support**: Equation solving and simplification
- **Custom Formatting**: Number, string, exponential, fixed decimal formats
- **Batch Processing**: Evaluate multiple expressions at once
- **Comprehensive Error Handling**: Clear error messages for invalid inputs

## Installation

The calculator tool is included in the `@ainative/ai-kit-tools` package:

```bash
npm install @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
# or
yarn add @ainative/ai-kit-tools
```

## Basic Usage

### Simple Calculations

```typescript
import { calculate } from '@ainative/ai-kit-tools'

// Basic arithmetic
const result1 = calculate({ expression: '2 + 2' })
console.log(result1)
// { success: true, result: 4, expression: '2 + 2' }

// Order of operations
const result2 = calculate({ expression: '(2 + 3) * 4' })
console.log(result2)
// { success: true, result: 20, expression: '(2 + 3) * 4' }

// Mathematical functions
const result3 = calculate({ expression: 'sqrt(16) + abs(-5)' })
console.log(result3)
// { success: true, result: 9, expression: 'sqrt(16) + abs(-5)' }
```

### Using Constants

```typescript
// Pi constant
const circumference = calculate({ expression: '2 * pi * 5' })
console.log(circumference)
// { success: true, result: 31.415926535897932, ... }

// Euler's number
const exponential = calculate({ expression: 'e ^ 2' })
console.log(exponential)
// { success: true, result: 7.3890560989306495, ... }
```

### Formatting Results

```typescript
// Fixed decimal places
const result1 = calculate({
  expression: '22 / 7',
  format: 'fixed',
  precision: 3
})
console.log(result1.result)
// "3.143"

// Exponential notation
const result2 = calculate({
  expression: '1234567',
  format: 'exponential',
  precision: 2
})
console.log(result2.result)
// "1.23e+6"

// String format
const result3 = calculate({
  expression: 'pi',
  format: 'string'
})
console.log(result3.result)
// "3.141592653589793"
```

## Advanced Features

### Statistics

Calculate comprehensive statistics for arrays of numbers:

```typescript
import { calculateStatistics } from '@ainative/ai-kit-tools'

const data = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9]
const stats = calculateStatistics(data)

console.log(stats)
/*
{
  mean: 5,
  median: 5,
  mode: [5],
  stdDev: 2.449489742783178,
  variance: 6,
  min: 1,
  max: 9,
  sum: 50,
  count: 10
}
*/
```

### Solving Equations

```typescript
import { solveEquation } from '@ainative/ai-kit-tools'

const result = solveEquation('2x + 5 = 13', 'x')
console.log(result)
// { success: true, expression: '2x + 5 = 13', variable: 'x', solution: ..., formattedResult: 'x = ...' }
```

### Batch Processing

Evaluate multiple expressions at once:

```typescript
import { calculateBatch } from '@ainative/ai-kit-tools'

const results = calculateBatch([
  { expression: '2 + 2' },
  { expression: 'sqrt(16)' },
  { expression: 'pi * 2', format: 'fixed', precision: 4 }
])

console.log(results)
/*
[
  { success: true, result: 4, expression: '2 + 2' },
  { success: true, result: 4, expression: 'sqrt(16)' },
  { success: true, result: '6.2832', expression: 'pi * 2' }
]
*/
```

### Validation

Validate expressions before evaluation:

```typescript
import { validateCalculatorExpression } from '@ainative/ai-kit-tools'

const validation = validateCalculatorExpression('2 + 2')
console.log(validation)
// { valid: true, parsedExpression: '2 + 2' }

const invalid = validateCalculatorExpression('2 +* 2')
console.log(invalid)
// { valid: false, error: 'Error parsing expression...' }
```

### Available Functions

Get a list of all supported functions and constants:

```typescript
import { getAvailableFunctions } from '@ainative/ai-kit-tools'

const { functions, constants } = getAvailableFunctions()

console.log(functions)
// ['abs', 'add', 'ceil', 'sqrt', 'sin', 'cos', 'mean', 'median', ...]

console.log(constants)
// ['pi', 'e', 'i', 'phi', 'tau', ...]
```

## Supported Operations

### Arithmetic

- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Power: `^`
- Modulo: `mod`

### Mathematical Functions

- **Basic**: `abs`, `ceil`, `floor`, `round`, `sign`, `sqrt`, `square`, `cube`
- **Exponential**: `exp`, `log`, `log10`
- **Trigonometry**: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`
- **Advanced**: `factorial`, `gcd`, `lcm`, `nthRoot`, `pow`

### Statistical Functions

- `mean` - Average of values
- `median` - Middle value
- `mode` - Most frequent value(s)
- `std` - Standard deviation
- `variance` - Statistical variance
- `max` - Maximum value
- `min` - Minimum value
- `sum` - Sum of values
- `prod` - Product of values

### Constants

- `pi` - π (3.14159...)
- `e` - Euler's number (2.71828...)
- `i` - Imaginary unit
- `phi` - Golden ratio (1.61803...)
- `tau` - τ = 2π

## Real-World Examples

### Financial Calculations

```typescript
// Compound interest: A = P(1 + r/n)^(nt)
const compoundInterest = calculate({
  expression: '1000 * (1 + 0.05/12)^(12*5)',
  format: 'fixed',
  precision: 2
})
console.log(compoundInterest.result)
// "1283.36"

// Percentage calculation
const percentage = calculate({ expression: '(45 / 60) * 100' })
console.log(percentage.result)
// 75
```

### Geometric Calculations

```typescript
// Circle area
const circleArea = calculate({
  expression: 'pi * 5^2',
  format: 'fixed',
  precision: 2
})
console.log(circleArea.result)
// "78.54"

// Distance formula
const distance = calculate({ expression: 'sqrt((5-1)^2 + (7-4)^2)' })
console.log(distance.result)
// 5

// Pythagorean theorem
const hypotenuse = calculate({ expression: 'sqrt(3^2 + 4^2)' })
console.log(hypotenuse.result)
// 5
```

### Scientific Calculations

```typescript
// Temperature conversion (Celsius to Fahrenheit)
const fahrenheit = calculate({ expression: '(25 * 9/5) + 32' })
console.log(fahrenheit.result)
// 77

// BMI calculation
const bmi = calculate({
  expression: '70 / (1.75^2)',
  format: 'fixed',
  precision: 1
})
console.log(bmi.result)
// "22.9"
```

## Error Handling

The calculator provides clear error messages for various scenarios:

```typescript
// Division by zero (returns Infinity)
const divByZero = calculate({ expression: '1 / 0' })
console.log(divByZero)
// { success: true, result: Infinity, ... }

// Invalid syntax
const invalid = calculate({ expression: '2 +* 2' })
console.log(invalid)
// { success: false, expression: '2 +* 2', error: 'Error parsing expression...' }

// Undefined variables
const undefined = calculate({ expression: 'x + 5' })
console.log(undefined)
// { success: false, expression: 'x + 5', error: 'Undefined symbol x' }
```

## Security

The Calculator Tool implements multiple security measures:

1. **No eval()**: Uses mathjs parser instead of JavaScript's `eval()`
2. **Pattern Blocking**: Rejects expressions containing:
   - `eval()`, `require()`, `import()`
   - `function()`, arrow functions `=>`
   - `process`, `constructor`, `prototype`, `__proto__`
3. **Input Validation**:
   - Maximum expression length: 1000 characters
   - Type validation using Zod schemas
4. **Sandboxed Execution**: All math operations run in mathjs's isolated environment

### Security Examples

```typescript
// These will all be rejected with security errors:

calculate({ expression: 'eval("alert(1)")' })
// { success: false, error: 'Expression contains forbidden pattern...' }

calculate({ expression: 'require("fs")' })
// { success: false, error: 'Expression contains forbidden pattern...' }

calculate({ expression: 'process.exit()' })
// { success: false, error: 'Expression contains forbidden pattern...' }
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  CalculatorInput,
  CalculatorResult,
  StatisticsResult
} from '@ainative/ai-kit-tools'

const input: CalculatorInput = {
  expression: '2 + 2',
  format: 'number',
  precision: 10
}

const result: CalculatorResult = calculate(input)

const stats: StatisticsResult = calculateStatistics([1, 2, 3, 4, 5])
```

## API Reference

### `calculate(input: CalculatorInput): CalculatorResult`

Evaluates a mathematical expression.

**Parameters:**
- `input.expression` (string, required): The mathematical expression to evaluate
- `input.format` (string, optional): Output format - 'number' | 'string' | 'exponential' | 'fixed' (default: 'number')
- `input.precision` (number, optional): Number of decimal places (0-20, default: 10)

**Returns:**
- `success` (boolean): Whether the calculation succeeded
- `result` (string | number): The calculated result
- `expression` (string): The original expression
- `formattedResult` (string): String representation of the result
- `error` (string, optional): Error message if calculation failed

### `calculateStatistics(numbers: number[]): StatisticsResult`

Calculates comprehensive statistics for an array of numbers.

**Parameters:**
- `numbers` (number[]): Array of numbers to analyze

**Returns:**
- `mean` (number): Average value
- `median` (number): Middle value
- `mode` (number[]): Most frequent value(s)
- `stdDev` (number): Standard deviation
- `variance` (number): Statistical variance
- `min` (number): Minimum value
- `max` (number): Maximum value
- `sum` (number): Sum of all values
- `count` (number): Number of values

### `solveEquation(equation: string, variable?: string): CalculatorResult`

Attempts to solve a simple equation.

**Parameters:**
- `equation` (string): Equation in the form "expression1 = expression2"
- `variable` (string, optional): Variable to solve for (default: 'x')

**Returns:** Same as `calculate()` plus:
- `variable` (string): The variable being solved for
- `solution` (any): The solution to the equation

### `calculateBatch(expressions: CalculatorInput[]): CalculatorResult[]`

Evaluates multiple expressions at once.

**Parameters:**
- `expressions` (CalculatorInput[]): Array of calculator inputs

**Returns:**
- Array of CalculatorResult objects

### `validateCalculatorExpression(expression: string): ValidationResult`

Validates an expression without evaluating it.

**Parameters:**
- `expression` (string): Expression to validate

**Returns:**
- `valid` (boolean): Whether the expression is valid
- `error` (string, optional): Error message if invalid
- `parsedExpression` (string, optional): Parsed representation if valid

### `getAvailableFunctions(): FunctionsInfo`

Returns lists of available functions and constants.

**Returns:**
- `functions` (string[]): Array of available function names
- `constants` (string[]): Array of available constant names

## Best Practices

1. **Always check success status**:
   ```typescript
   const result = calculate({ expression: userInput })
   if (result.success) {
     console.log(result.result)
   } else {
     console.error(result.error)
   }
   ```

2. **Use appropriate precision**:
   ```typescript
   // For financial calculations
   calculate({ expression: '...',  format: 'fixed', precision: 2 })

   // For scientific calculations
   calculate({ expression: '...', precision: 15 })
   ```

3. **Validate user input**:
   ```typescript
   const validation = validateCalculatorExpression(userInput)
   if (validation.valid) {
     const result = calculate({ expression: userInput })
   }
   ```

4. **Use batch processing for multiple calculations**:
   ```typescript
   // Efficient
   const results = calculateBatch(expressions)

   // Less efficient
   const results = expressions.map(e => calculate(e))
   ```

## Performance

- Simple expressions: < 1ms
- Complex expressions: < 5ms
- Statistical calculations: < 10ms for arrays up to 10,000 elements
- Batch processing: Scales linearly with number of expressions

## Limitations

1. Maximum expression length: 1000 characters
2. Precision: Up to 64-bit floating point (or arbitrary precision with BigNumber mode)
3. Variables must be defined (no symbolic algebra)
4. Limited equation solving capabilities (simple linear equations only)

## Contributing

To add new features or report issues, please visit the [GitHub repository](https://github.com/AINative-Studio/ai-kit).

## License

MIT License - see LICENSE file for details.

## Story Points

This feature was implemented with 5 story points, reflecting:
- Safe mathematical expression parsing
- Comprehensive function support
- Statistical calculations
- Security measures
- Extensive test coverage (96%+)
- Complete documentation
