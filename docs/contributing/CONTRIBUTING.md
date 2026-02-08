# Contributing to AI Kit

Thank you for your interest in contributing to AI Kit! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- Git

### Installation

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-kit.git
   cd ai-kit
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

## Development Setup

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @ainative/ai-kit-core build

# Watch mode for development
pnpm --filter @ainative/ai-kit-core dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @ainative/ai-kit-core test

# Run tests with coverage
pnpm test:coverage
```

### Linting and Formatting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## Project Structure

```
ai-kit/
├── packages/
│   ├── core/              # Core AI functionality
│   ├── react/             # React components and hooks
│   ├── nextjs/            # Next.js utilities
│   ├── tools/             # Built-in tools
│   ├── testing/           # Testing utilities
│   ├── vue/               # Vue components
│   ├── svelte/            # Svelte components
│   ├── cli/               # CLI tools
│   ├── video/             # Video processing
│   └── community/         # Community integrations
├── apps/
│   └── marketing/         # Marketing website
├── examples/              # Example applications
├── docs/                  # Documentation
└── __tests__/            # Integration and E2E tests
```

## Development Workflow

### Creating a Branch

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Use descriptive branch names:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test improvements

### Making Changes

1. Make your changes in logical commits
2. Write clear, descriptive commit messages
3. Follow the existing code style
4. Add tests for new functionality
5. Update documentation as needed

### Commit Message Format

Use conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build process or auxiliary tool changes

Example:
```
feat(core): add streaming response support

Implements streaming responses for better UX with long-running
AI operations. Includes rate limiting and error handling.

Closes #123
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Export types that users will need

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use trailing commas in objects and arrays
- Maximum line length: 100 characters

### Naming Conventions

- Use `camelCase` for variables and functions
- Use `PascalCase` for classes and components
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that convey intent

### Documentation

- Add JSDoc comments for all public APIs
- Include examples in documentation
- Document all parameters and return values
- Keep README files up to date

## Testing Guidelines

### Test Coverage

- Aim for 80%+ test coverage
- All new features must include tests
- All bug fixes must include regression tests

### Test Types

1. **Unit Tests** - Test individual functions and components
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { yourFunction } from './your-module';

   describe('yourFunction', () => {
     it('should do something', () => {
       const result = yourFunction('input');
       expect(result).toBe('expected');
     });
   });
   ```

2. **Integration Tests** - Test package interactions
   ```typescript
   describe('Agent Integration', () => {
     it('should create agent with tools', async () => {
       const agent = createAgent({
         tools: [calculator]
       });
       const result = await agent.run('Calculate 2+2');
       expect(result).toContain('4');
     });
   });
   ```

3. **E2E Tests** - Test real-world scenarios
   ```typescript
   describe('Chat Application', () => {
     it('should send message and receive response', async () => {
       // Test complete user flow
     });
   });
   ```

### Testing Best Practices

- Write tests before fixing bugs (TDD)
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Avoid test interdependencies

## Submitting Changes

### Before Submitting

1. Ensure all tests pass:
   ```bash
   pnpm test
   ```

2. Ensure code is properly formatted:
   ```bash
   pnpm lint
   pnpm format
   ```

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Update documentation if needed

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub

3. Fill out the PR template completely:
   - Clear description of changes
   - Link to related issues
   - Test results and coverage
   - Screenshots/videos if applicable

4. Wait for review and address feedback

### PR Review Process

- At least one maintainer approval required
- All CI checks must pass
- Code review feedback must be addressed
- Documentation must be updated
- Tests must pass with adequate coverage

## Release Process

Releases are managed by maintainers using semantic versioning:

- **Patch** (1.0.x) - Bug fixes
- **Minor** (1.x.0) - New features (backward compatible)
- **Major** (x.0.0) - Breaking changes

## Getting Help

- Check the [documentation](https://github.com/AINative-Studio/ai-kit#readme)
- Join our [Discord community](https://discord.com/invite/paipalooza)
- Ask questions in [GitHub Discussions](https://github.com/AINative-Studio/ai-kit/discussions)
- Report bugs using [issue templates](https://github.com/AINative-Studio/ai-kit/issues/new/choose)

## Recognition

All contributors will be recognized in our [CHANGELOG](../../CHANGELOG.md) and GitHub contributors list.

## License

By contributing to AI Kit, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AI Kit!**

Built by [AINative Studio](https://ainative.studio)
