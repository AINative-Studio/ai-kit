# Contributing to AI Kit

Thank you for your interest in contributing to AI Kit! We're thrilled to have you here. Whether you're fixing a bug, adding a feature, improving documentation, or just asking questions, every contribution makes AI Kit better for everyone.

This guide will help you get started with contributing to the project. We strive to make the contribution process as smooth and welcoming as possible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Improving Documentation](#improving-documentation)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
  - [TypeScript Guidelines](#typescript-guidelines)
  - [Code Style](#code-style)
  - [Naming Conventions](#naming-conventions)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Review Process](#review-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. We are committed to providing a welcoming and inspiring community for all.

**Key Principles:**
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

Please report unacceptable behavior to the project maintainers through GitHub issues or discussions.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as [GitHub issues](https://github.com/AINative-Studio/ai-kit/issues). Before creating a bug report:

1. **Search existing issues** - Someone might have already reported it
2. **Test with the latest version** - The bug might already be fixed
3. **Gather information** - Collect details about your environment and steps to reproduce

When you're ready to create a bug report, use our [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- **Clear title** - Summarize the issue in one line
- **Detailed description** - What happened and what you expected
- **Steps to reproduce** - Minimal steps to trigger the bug
- **Code sample** - A minimal example that demonstrates the issue
- **Environment details** - Package version, Node.js version, OS, etc.
- **Error messages** - Full stack traces if available

**Example of a good bug report:**
```
Title: [Bug]: AgentSwarm fails with TypeError when parallelExecution is true

Description: When creating an AgentSwarm with parallelExecution: true and
more than 2 specialists, I get a TypeError about undefined property access.

Steps to reproduce:
1. Create AgentSwarm with 3+ specialists
2. Set parallelExecution: true
3. Call swarm.execute("test query")
4. TypeError is thrown

Environment:
- @ainative/ai-kit-core: 0.0.1
- Node.js: 18.17.0
- OS: macOS 14.2
```

### Suggesting Features

We love feature suggestions! They help us understand what users need. Before suggesting a feature:

1. **Check existing feature requests** - It might already be proposed
2. **Consider the scope** - Does it fit AI Kit's goals?
3. **Think about others** - Would this benefit the broader community?

Use our [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- **Problem statement** - What problem does this solve?
- **Proposed solution** - How would you like it to work?
- **Alternatives considered** - What other approaches did you consider?
- **Use cases** - Real-world scenarios where this helps
- **Examples** - Code examples showing the desired API

**Tips for great feature requests:**
- Focus on the "why" not just the "what"
- Provide concrete use cases
- Consider backwards compatibility
- Think about the developer experience

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we'd especially appreciate help
- `documentation` - Help improve our docs
- `bug` - Fix known bugs

**First-time contributor tips:**
1. Start small - Pick a simple issue to get familiar with the codebase
2. Ask questions - Comment on the issue if anything is unclear
3. Communicate - Let others know you're working on it
4. Don't worry about perfection - We'll help you refine your contribution

### Improving Documentation

Documentation is just as important as code! You can help by:

- Fixing typos and grammatical errors
- Clarifying confusing explanations
- Adding examples and use cases
- Improving API documentation
- Writing guides and tutorials
- Translating documentation

Even small improvements make a big difference!

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 8.0.0 or higher (we use pnpm for package management)
- **Git**: For version control
- **TypeScript knowledge**: Helpful but not required for documentation contributions

### Initial Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy of the repository.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-kit.git
   cd ai-kit
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/AINative-Studio/ai-kit.git
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   ```
   This will install all dependencies for the monorepo and all packages.

5. **Build all packages**
   ```bash
   pnpm build
   ```
   This builds all packages in the correct order.

6. **Verify your setup**
   ```bash
   pnpm test
   ```
   All tests should pass!

### Development Workflow

1. **Keep your fork synchronized**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   ```bash
   # Run in watch mode while developing
   pnpm dev

   # Run tests as you work
   pnpm test:watch
   ```

4. **Verify your changes**
   ```bash
   # Run all tests
   pnpm test

   # Check types
   pnpm type-check

   # Lint your code
   pnpm lint

   # Run specific package tests
   pnpm test --filter @ainative/ai-kit-core
   ```

### Package Structure

AI Kit is a monorepo with multiple packages:

```
ai-kit/
├── packages/
│   ├── core/              # Core framework (agents, streaming, memory)
│   ├── react/             # React hooks and components
│   ├── vue/               # Vue composables and components
│   ├── svelte/            # Svelte stores and components
│   ├── nextjs/            # Next.js integration
│   ├── safety/            # Safety guardrails
│   ├── tools/             # Built-in tools
│   ├── rlhf/              # RLHF instrumentation
│   ├── zerodb/            # Encrypted database
│   ├── video/             # Video recording primitives
│   ├── auth/              # Authentication utilities
│   ├── testing/           # Testing utilities
│   ├── observability/     # Observability tools
│   ├── design-system/     # Design system components
│   └── cli/               # CLI tool
├── docs/                  # Documentation
├── examples/              # Example applications
├── scripts/               # Build and utility scripts
└── e2e/                   # End-to-end tests
```

### Working on Specific Packages

To work on a specific package:

```bash
# Navigate to the package
cd packages/core

# Run tests for this package only
pnpm test

# Build this package only
pnpm build

# Watch mode for development
pnpm dev
```

### Common Commands

```bash
# Development
pnpm dev                         # Start all packages in watch mode
pnpm build                       # Build all packages
pnpm clean                       # Clean all build artifacts

# Testing
pnpm test                        # Run all tests
pnpm test:watch                  # Run tests in watch mode
pnpm test:coverage               # Run tests with coverage
pnpm test:ui                     # Run tests with Vitest UI
pnpm test:integration            # Run integration tests
pnpm test:e2e                    # Run end-to-end tests

# Code quality
pnpm lint                        # Lint all packages
pnpm type-check                  # Type check all packages

# Documentation
pnpm docs                        # Generate documentation
pnpm docs:api                    # Generate API docs
```

## Coding Standards

We maintain high code quality standards to ensure the codebase is maintainable and consistent.

### TypeScript Guidelines

1. **Use TypeScript strict mode**
   ```typescript
   // tsconfig.json includes "strict": true
   ```

2. **Provide explicit types for public APIs**
   ```typescript
   // Good
   export function createAgent(config: AgentConfig): Agent {
     // ...
   }

   // Avoid
   export function createAgent(config: any): any {
     // ...
   }
   ```

3. **Avoid `any` - use `unknown` when type is truly unknown**
   ```typescript
   // Good
   function processData(data: unknown): ProcessedData {
     if (typeof data === 'object' && data !== null) {
       // Type narrowing
     }
   }

   // Avoid
   function processData(data: any): ProcessedData {
     // ...
   }
   ```

4. **Use interfaces for object shapes**
   ```typescript
   // Good
   interface AgentConfig {
     name: string
     model: string
     maxSteps?: number
   }
   ```

5. **Use type aliases for unions and complex types**
   ```typescript
   // Good
   type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed'
   type Result<T> = { success: true; data: T } | { success: false; error: Error }
   ```

6. **Leverage type inference where it improves readability**
   ```typescript
   // Good - type is obvious
   const count = 42
   const message = 'Hello'

   // Good - type is explicit where helpful
   const config: AgentConfig = {
     name: 'Assistant',
     model: 'claude-3-sonnet-20240229'
   }
   ```

### Code Style

We use **Prettier** and **ESLint** to maintain consistent code style.

**Prettier configuration** (`.prettierrc.json`):
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

**Key style points:**
- No semicolons
- Single quotes for strings
- 2 spaces for indentation
- 100 character line length
- ES5 trailing commas
- Arrow function parentheses always

**Before committing:**
```bash
# Format your code
pnpm lint

# Or manually
npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
```

### Naming Conventions

Consistent naming makes code easier to understand and maintain.

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `agent-executor.ts`, `use-ai-stream.ts` |
| **Folders** | kebab-case | `agent-swarm/`, `test-utils/` |
| **Classes** | PascalCase | `AgentExecutor`, `UserMemory` |
| **Interfaces** | PascalCase | `AgentConfig`, `StreamOptions` |
| **Types** | PascalCase | `ExecutionResult`, `ToolDefinition` |
| **Functions** | camelCase | `createAgent`, `executeSwarm` |
| **Variables** | camelCase | `agentConfig`, `streamOptions` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| **React Hooks** | use + camelCase | `useAIStream`, `useAgent` |
| **React Components** | PascalCase | `ChatMessage`, `StreamDisplay` |

**Examples:**

```typescript
// Files
agent-executor.ts
user-memory.ts
use-ai-stream.ts

// Classes and Interfaces
class AgentExecutor { }
interface AgentConfig { }
type ExecutionResult = { }

// Functions and Variables
const MAX_RETRIES = 3
const defaultConfig = { }
function createAgent(config: AgentConfig) { }

// React
function useAIStream(options: StreamOptions) { }
function ChatMessage({ content }: Props) { }
```

### Code Organization

1. **Group related code together**
   ```typescript
   // Group imports
   import { type1, type2 } from './types'
   import { util1, util2 } from './utils'

   // Group constants
   const MAX_RETRIES = 3
   const DEFAULT_TIMEOUT = 5000

   // Group related functions
   function helper1() { }
   function helper2() { }

   // Main export
   export function mainFunction() { }
   ```

2. **Keep functions focused and small**
   - Each function should do one thing well
   - Aim for functions under 50 lines
   - Extract complex logic into helper functions

3. **Use meaningful variable names**
   ```typescript
   // Good
   const userMemories = await memory.getMemories(userId)
   const isAuthenticated = checkAuth(token)

   // Avoid
   const data = await memory.getMemories(userId)
   const flag = checkAuth(token)
   ```

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and consistent commit history. This enables automatic changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semi-colons, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools
- `ci:` - Changes to CI configuration files and scripts
- `build:` - Changes that affect the build system or dependencies

### Scope (Optional)

The scope specifies which package or area is affected:

- `core` - Core package
- `react` - React package
- `safety` - Safety package
- `cli` - CLI package
- etc.

### Examples

**Simple commits:**
```bash
feat: add video recording support
fix: resolve memory leak in AgentSwarm
docs: update installation instructions
test: add tests for UserMemory
```

**With scope:**
```bash
feat(core): add parallel execution to AgentSwarm
fix(react): resolve infinite loop in useAIStream
docs(safety): add examples for PromptInjectionDetector
perf(zerodb): optimize vector search performance
```

**With body:**
```bash
feat(core): add support for streaming tool calls

This enables real-time feedback for long-running tool executions.
The streaming mechanism uses Server-Sent Events and maintains
backward compatibility with non-streaming tools.

Closes #123
```

**Breaking changes:**
```bash
feat(core)!: change AgentConfig interface

BREAKING CHANGE: The `model` field is now required in AgentConfig.
Previously optional, it must now be explicitly specified.

Migration:
- Before: createAgent({ name: 'agent' })
- After:  createAgent({ name: 'agent', model: 'claude-3-sonnet' })

Closes #456
```

### Commit Message Guidelines

1. **Use imperative mood** - "add feature" not "added feature"
2. **Keep the first line under 72 characters**
3. **Capitalize the first letter** of the description
4. **No period at the end** of the description
5. **Reference issues** in the footer (e.g., "Closes #123")
6. **Explain why, not what** in the body (the diff shows what changed)

**Good examples:**
```bash
feat: add retry logic with exponential backoff
fix: prevent race condition in stream cleanup
docs: clarify AgentSwarm parallelization behavior
```

**Avoid:**
```bash
Fixed stuff
Updated code
changes
WIP
```

## Pull Request Process

### Before Submitting

Complete this checklist before creating your PR:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass locally (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] New tests added for new functionality
- [ ] Documentation updated (code comments, README, API docs)
- [ ] Commit messages follow Conventional Commits
- [ ] No merge conflicts with main branch
- [ ] Self-review completed

### Creating a Pull Request

1. **Push your branch to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create the PR on GitHub**
   - Go to the original AI Kit repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

3. **Write a clear PR title**

   Use the Conventional Commits format:
   ```
   feat: add video recording support
   fix: resolve memory leak in AgentSwarm
   docs: improve AgentExecutor examples
   ```

4. **Complete the PR template**

   Our [PR template](./.github/pull_request_template.md) includes:
   - Summary of changes
   - Type of change (feature, bug fix, etc.)
   - Related issues (use "Closes #123" to auto-close)
   - Testing performed
   - Breaking changes (if any)
   - Documentation updates
   - Screenshots/videos (if applicable)

### PR Guidelines

**Size and Scope:**
- Keep PRs focused on a single feature or fix
- Aim for PRs under 400 lines of changes
- Large features should be split into multiple PRs
- Each PR should be independently reviewable

**Quality:**
- Write clear, self-documenting code
- Add comments for complex logic
- Include tests for new functionality
- Update relevant documentation

**Communication:**
- Respond to review comments promptly
- Ask questions if feedback is unclear
- Mark conversations as resolved when addressed
- Keep discussions professional and constructive

### PR Review Checklist

Reviewers will evaluate:

**Functionality:**
- [ ] Code works as intended
- [ ] No regressions introduced
- [ ] Edge cases handled

**Code Quality:**
- [ ] Follows coding standards
- [ ] Well-structured and readable
- [ ] No unnecessary complexity
- [ ] Proper error handling

**Testing:**
- [ ] Tests are comprehensive
- [ ] Tests are readable and maintainable
- [ ] Coverage meets requirements (80%+)

**Documentation:**
- [ ] Code comments are clear
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Examples provided for complex features

**Performance:**
- [ ] No obvious performance issues
- [ ] Benchmarks included for perf improvements

**Security:**
- [ ] No security vulnerabilities introduced
- [ ] Input validation where needed
- [ ] No exposed credentials or secrets

**Breaking Changes:**
- [ ] Breaking changes clearly documented
- [ ] Migration guide provided
- [ ] Version bump appropriate

### After Submission

1. **Wait for review** - Maintainers typically review within 2-3 business days
2. **Address feedback** - Make requested changes and push updates
3. **Be patient** - Reviews take time, especially for complex changes
4. **Celebrate** - Once approved and merged, your contribution is part of AI Kit!

### Handling Review Feedback

When you receive review comments:

1. **Read carefully** - Understand what's being requested
2. **Ask questions** - If something is unclear, ask!
3. **Make changes** - Address the feedback in new commits
4. **Respond to comments** - Let reviewers know what you changed
5. **Mark resolved** - Mark conversations as resolved after addressing them

**Example response:**
```
Good catch! I've updated the error handling to check for null values
before accessing properties. See commit abc123.
```

## Testing Requirements

Testing is crucial for maintaining code quality and preventing regressions.

### Coverage Requirements

- **Minimum 80% code coverage** for all packages
- **100% coverage for critical paths** (safety, security, authentication)
- **All tests must pass** before merging

Check coverage:
```bash
pnpm test:coverage
```

### Test Types

**1. Unit Tests** (`*.test.ts`)

Test individual functions and classes in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createAgent } from './agent'

describe('createAgent', () => {
  it('should create agent with default config', () => {
    const agent = createAgent({ name: 'test' })
    expect(agent.name).toBe('test')
    expect(agent.maxSteps).toBe(10) // default value
  })

  it('should override defaults with provided config', () => {
    const agent = createAgent({ name: 'test', maxSteps: 20 })
    expect(agent.maxSteps).toBe(20)
  })

  it('should throw error for invalid config', () => {
    expect(() => createAgent({ name: '' })).toThrow('Name cannot be empty')
  })
})
```

**2. Integration Tests** (`*.integration.test.ts`)

Test interactions between components:

```typescript
import { describe, it, expect } from 'vitest'
import { AgentExecutor, createAgent } from '@ainative/ai-kit-core'
import { calculatorTool } from '@ainative/ai-kit-tools'

describe('AgentExecutor Integration', () => {
  it('should execute agent with tools', async () => {
    const agent = createAgent({
      name: 'Math Assistant',
      llm: { provider: 'mock' },
      tools: [calculatorTool]
    })

    const executor = new AgentExecutor(agent)
    const result = await executor.execute('What is 42 + 58?')

    expect(result.response).toContain('100')
    expect(result.trace.stats.totalSteps).toBeGreaterThan(0)
  })
})
```

**3. E2E Tests** (`e2e/`)

Test complete user workflows using Playwright:

```typescript
import { test, expect } from '@playwright/test'

test('chat interface sends and receives messages', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await page.fill('[data-testid="chat-input"]', 'Hello!')
  await page.click('[data-testid="send-button"]')

  await expect(page.locator('[data-testid="message"]')).toContainText('Hello!')
})
```

### Writing Good Tests

**Best Practices:**

1. **Test behavior, not implementation**
   ```typescript
   // Good - tests behavior
   it('should return user memories for valid user ID', async () => {
     const memories = await memory.getMemories('user-123')
     expect(memories).toHaveLength(3)
   })

   // Avoid - tests implementation details
   it('should call database.query with correct SQL', async () => {
     await memory.getMemories('user-123')
     expect(database.query).toHaveBeenCalledWith('SELECT ...')
   })
   ```

2. **Use descriptive test names**
   ```typescript
   // Good
   it('should throw error when agent config is missing required fields')
   it('should retry failed API calls up to 3 times')

   // Avoid
   it('test 1')
   it('should work')
   ```

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('should calculate total cost correctly', () => {
     // Arrange
     const usage = { tokens: 1000, model: 'claude-3-sonnet' }

     // Act
     const cost = calculateCost(usage)

     // Assert
     expect(cost).toBe(0.015)
   })
   ```

4. **Test edge cases**
   ```typescript
   describe('divide', () => {
     it('should divide positive numbers', () => {
       expect(divide(10, 2)).toBe(5)
     })

     it('should handle division by zero', () => {
       expect(() => divide(10, 0)).toThrow('Division by zero')
     })

     it('should handle negative numbers', () => {
       expect(divide(-10, 2)).toBe(-5)
     })
   })
   ```

5. **Keep tests isolated and independent**
   ```typescript
   // Good - each test is independent
   describe('UserMemory', () => {
     let memory: UserMemory

     beforeEach(() => {
       memory = new UserMemory({ store: new InMemoryStore() })
     })

     it('should store memory', async () => {
       await memory.store('user-1', 'fact')
       expect(await memory.get('user-1')).toContain('fact')
     })
   })
   ```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @ainative/ai-kit-core

# Run specific test file
pnpm test agent-executor.test.ts

# Run in watch mode (great for development)
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run with UI
pnpm test:ui

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
pnpm test:e2e:ui           # With Playwright UI
pnpm test:e2e:debug        # In debug mode
```

### Test Organization

```
packages/core/
├── src/
│   ├── agent.ts
│   └── __tests__/
│       ├── agent.test.ts           # Unit tests
│       └── agent.integration.test.ts # Integration tests
└── package.json

e2e/
├── chat-interface.spec.ts
└── agent-workflow.spec.ts
```

## Documentation Requirements

Good documentation helps users understand and use AI Kit effectively.

### Code Documentation

**JSDoc for Public APIs:**

```typescript
/**
 * Creates a new AI agent with the specified configuration.
 *
 * The agent can execute tasks using LLMs, call tools, and maintain
 * conversation context. Configure the agent's behavior through the
 * provided options.
 *
 * @param config - Agent configuration options
 * @param config.name - Unique identifier for the agent
 * @param config.systemPrompt - System prompt to guide agent behavior
 * @param config.llm - LLM provider configuration
 * @param config.tools - Optional array of tools the agent can use
 * @param config.maxSteps - Maximum execution steps (default: 10)
 * @returns A configured agent instance ready for execution
 * @throws {ValidationError} If configuration is invalid or missing required fields
 *
 * @example
 * Basic agent without tools:
 * ```typescript
 * const agent = createAgent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are a helpful assistant.',
 *   llm: {
 *     provider: 'anthropic',
 *     model: 'claude-3-sonnet-20240229'
 *   }
 * })
 * ```
 *
 * @example
 * Agent with tools:
 * ```typescript
 * const agent = createAgent({
 *   name: 'Research Assistant',
 *   systemPrompt: 'You help users research topics.',
 *   llm: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
 *   tools: [webSearchTool, calculatorTool],
 *   maxSteps: 15
 * })
 * ```
 */
export function createAgent(config: AgentConfig): Agent {
  // implementation
}
```

**Inline Comments for Complex Logic:**

```typescript
// Good - explains why, not what
// Use exponential backoff to avoid overwhelming the API
// during temporary outages or rate limiting
const delay = Math.min(1000 * Math.pow(2, attempt), 10000)

// Avoid - obvious from the code
// Multiply 1000 by 2 to the power of attempt
const delay = 1000 * Math.pow(2, attempt)
```

### Package Documentation

Every package must have a comprehensive README.md:

```markdown
# @ainative/ai-kit-core

Core functionality for AI Kit including agents, streaming, and memory.

## Installation

\`\`\`bash
npm install @ainative/ai-kit-core
\`\`\`

## Quick Start

\`\`\`typescript
import { createAgent } from '@ainative/ai-kit-core'

const agent = createAgent({
  name: 'Assistant',
  // ... config
})
\`\`\`

## Features

- Feature 1
- Feature 2

## API Reference

### createAgent(config)

Description...

## Examples

See [examples](../../examples/) for complete examples.
```

### API Documentation

We use **TypeDoc** to generate API documentation from TypeScript code:

```bash
# Generate API docs
pnpm docs:api

# Generate TypeDoc
pnpm docs:typedoc
```

**TypeDoc comments:**

```typescript
/**
 * Configuration options for AI agent.
 *
 * @public
 */
export interface AgentConfig {
  /**
   * Unique identifier for the agent.
   * Used for logging and tracing.
   */
  name: string

  /**
   * System prompt that guides the agent's behavior.
   * This sets the agent's role and capabilities.
   *
   * @example
   * "You are a helpful research assistant..."
   */
  systemPrompt: string

  /**
   * Maximum number of execution steps before stopping.
   * Prevents infinite loops in agent reasoning.
   *
   * @defaultValue 10
   */
  maxSteps?: number
}
```

### Documentation Updates Required

When making changes, update:

1. **Code comments** - JSDoc for public APIs, inline comments for complex logic
2. **README files** - Package READMEs and main README if needed
3. **API documentation** - TypeDoc comments for new/changed APIs
4. **Examples** - Add or update examples in `examples/` directory
5. **Migration guides** - For breaking changes
6. **Changelog** - Will be generated from commits, but verify correctness

## Review Process

### How Reviews Work

1. **Automated Checks** (must pass)
   - Tests (`pnpm test`)
   - Type checking (`pnpm type-check`)
   - Linting (`pnpm lint`)
   - Build (`pnpm build`)

2. **Maintainer Review**
   - Code quality and style
   - Architecture and design
   - Test coverage and quality
   - Documentation completeness
   - Security implications

3. **Approval and Merge**
   - At least one maintainer approval required
   - All checks must pass
   - No unresolved conversations
   - Up to date with main branch

### Review Timeline

- **Initial response**: Within 2-3 business days
- **Full review**: Depends on PR complexity
- **Follow-up reviews**: Within 1-2 business days

**Please be patient!** Maintainers review PRs in their spare time.

### Making Review Easier

Help reviewers by:

1. **Keeping PRs focused** - One feature/fix per PR
2. **Writing clear descriptions** - Explain what and why
3. **Adding tests** - Demonstrate your code works
4. **Self-reviewing first** - Catch obvious issues
5. **Being responsive** - Address feedback promptly
6. **Adding context** - Screenshots, examples, explanations

### What Reviewers Look For

**Code Quality:**
- Clean, readable, maintainable code
- Follows project conventions
- No obvious bugs or issues
- Proper error handling
- Good variable and function names

**Testing:**
- Adequate test coverage
- Tests actually test the feature
- Edge cases covered
- Tests are maintainable

**Documentation:**
- Public APIs documented
- Complex logic explained
- README updated if needed
- Examples provided

**Impact:**
- No breaking changes without good reason
- Performance considerations
- Security implications
- Backwards compatibility

## Community

### Getting Help

**Questions?** We're here to help!

- **GitHub Discussions**: Ask questions, share ideas, discuss features
- **GitHub Issues**: Report bugs and request features
- **Pull Request Comments**: Discuss specific code changes

**Before asking:**
- Search existing discussions and issues
- Check the documentation
- Review examples in the `examples/` directory

**When asking:**
- Be specific about your question or problem
- Provide context (what you're trying to do, what you've tried)
- Include code samples and error messages
- Be respectful and patient

### Recognition and Credits

We value all contributions! Contributors are recognized:

- **CHANGELOG.md**: Listed in release notes
- **Git history**: Your commits preserve your authorship
- **GitHub**: Contributor badge on your profile
- **Release announcements**: Highlighted for significant contributions

### Ways to Contribute Beyond Code

Not a developer? No problem! You can contribute by:

- **Reporting bugs** - Help us identify and fix issues
- **Suggesting features** - Share ideas for improvements
- **Writing documentation** - Improve guides and examples
- **Creating tutorials** - Help others learn AI Kit
- **Answering questions** - Help others in Discussions
- **Sharing your work** - Show us what you've built!
- **Spreading the word** - Star the repo, share on social media

Every contribution, big or small, makes AI Kit better!

### Maintainer Responsibilities

For core maintainers and collaborators:

**Issue Management:**
- Triage new issues within 2 business days
- Label appropriately (`bug`, `feature`, `good first issue`, etc.)
- Close duplicates and stale issues
- Keep issue tracker organized

**PR Review:**
- Review PRs within 2-3 business days
- Provide constructive feedback
- Test changes locally when needed
- Approve or request changes clearly

**Releases:**
- Follow semantic versioning strictly
- Use changesets for version management
- Write comprehensive release notes
- Update CHANGELOG.md
- Test before releasing

**Community:**
- Be welcoming to new contributors
- Answer questions promptly
- Encourage participation
- Lead by example

## Questions?

Still have questions? Here's what to do:

1. **Check the docs** - [Documentation](./docs/)
2. **Search issues** - Someone might have asked already
3. **Ask in Discussions** - [GitHub Discussions](https://github.com/AINative-Studio/ai-kit/discussions)
4. **Open an issue** - If you found a bug or have a feature request

---

## Thank You!

Thank you for contributing to AI Kit! Your time and effort help make this project better for everyone. We're excited to see what you'll build and contribute.

Whether you're fixing a typo, adding a feature, or just asking questions, you're making a difference. Welcome to the AI Kit community!

**Happy coding!**

---

**Built with love by [AINative Studio](https://ainative.studio) and our amazing contributors.**
