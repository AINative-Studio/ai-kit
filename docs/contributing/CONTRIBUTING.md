# Contributing to AI Kit

Thank you for your interest in contributing to AI Kit! We welcome contributions from the community and are excited to work with you.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors. We expect:

- Respectful communication
- Constructive feedback
- Focus on what is best for the community
- Empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+ (for package management)
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-kit.git
   cd ai-kit
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Create a new branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

Build all packages:
```bash
pnpm build
```

Build in watch mode during development:
```bash
pnpm dev
```

### Running Tests

Run all tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

Run tests in watch mode:
```bash
pnpm test:watch
```

Run tests with UI:
```bash
pnpm test:ui
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Properly type all functions, parameters, and return values
- Avoid `any` types unless absolutely necessary

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### File Organization

- Group related functionality together
- Keep files focused and reasonably sized (< 300 lines)
- Use index.ts for clean package exports
- Place tests next to the code they test (`__tests__` directory)

### Naming Conventions

- **Files**: kebab-case (e.g., `use-ai-chat.ts`)
- **Classes**: PascalCase (e.g., `AgentExecutor`)
- **Functions/Methods**: camelCase (e.g., `processMessage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces/Types**: PascalCase (e.g., `ChatMessage`)

## Testing

### Test Requirements

- All new features must include tests
- Aim for 80%+ code coverage
- Write unit tests for individual functions/components
- Write integration tests for complex workflows
- Use descriptive test names

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  })

  it('should do something specific', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = myFunction(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### Running Specific Tests

```bash
# Run tests for specific package
pnpm --filter @ainative/ai-kit-core test

# Run specific test file
pnpm test path/to/test-file.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="pattern"
```

## Submitting Changes

### Commit Messages

Write clear, descriptive commit messages following this format:

```
type(scope): brief description

Detailed explanation if needed

Refs #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, tooling, dependencies

**Examples:**
```
feat(core): add streaming support for Anthropic models

Implements Claude streaming with proper token counting
and error handling.

Refs #123
```

```
fix(react): resolve infinite loop in useAIChat hook

The effect was running on every render due to missing
dependency. Added proper dependency array.

Fixes #456
```

### Branch Naming

- Feature: `feature/short-description` or `feature/issue-number-description`
- Bug fix: `fix/short-description` or `fix/issue-number-description`
- Documentation: `docs/short-description`
- Refactor: `refactor/short-description`

## Issue Guidelines

### Before Creating an Issue

1. Search existing issues to avoid duplicates
2. Check documentation for solutions
3. Gather relevant information (error messages, environment details)

### Issue Template

When creating an issue, include:

- **Clear title**: Describe the issue concisely
- **Description**: Detailed explanation of the issue
- **Steps to reproduce**: For bugs, provide minimal reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node version, package versions
- **Screenshots/Logs**: If applicable

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `pnpm test`
2. Verify type checking: `pnpm type-check`
3. Check linting: `pnpm lint`
4. Update documentation if needed
5. Add tests for new functionality
6. Update CHANGELOG.md if applicable

### PR Description

Include in your PR:

- **Summary**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Changes**: List of changes made
- **Testing**: How was this tested?
- **Screenshots**: For UI changes
- **Breaking changes**: If any, list them clearly
- **Related issues**: Reference issue numbers (Closes #123)

### PR Review Process

1. Automated checks must pass (tests, linting, type checking)
2. At least one maintainer approval required
3. Address review feedback promptly
4. Keep PR focused on a single concern
5. Squash commits if requested

### After PR Approval

- Maintainers will merge your PR
- Your changes will be included in the next release
- Thank you for your contribution!

## Release Process

Releases are managed by maintainers using Changesets:

1. Contributors add changesets for their changes
2. Maintainers review and merge PRs
3. Changesets bot creates release PR
4. Maintainers review and merge release PR
5. Packages are published to npm

### Adding a Changeset

If your change should trigger a release:

```bash
pnpm changeset
```

Follow the prompts to:
- Select packages affected
- Choose version bump type (major/minor/patch)
- Write a description of changes

## Questions?

- Check our [documentation](../../README.md)
- Open a [Discussion](https://github.com/AINative-Studio/ai-kit/discussions)
- Join our [Discord](https://discord.gg/ainative)

## License

By contributing to AI Kit, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI Kit! Your efforts help make AI development more accessible and powerful for everyone.
