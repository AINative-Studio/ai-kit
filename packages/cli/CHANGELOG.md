# Changelog

All notable changes to @ainative/ai-kit-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING**: Renamed package from `@aikit/cli` to `@ainative/ai-kit-cli` for brand consistency
  - All AINative packages now use `@ainative/ai-kit-*` naming convention
  - CLI command itself (`aikit`) remains unchanged
  - Migration: Uninstall old package and install new one
  - See README.md for migration instructions

## [0.1.0] - 2024-11-20

### Added

- Initial release of AI Kit CLI
- `create` command with 12+ production-ready templates
  - Next.js Chat App
  - React Dashboard
  - Express API
  - Agent System
  - Multi-Agent Swarm
  - Tool Integration Example
  - Full-Stack App
  - Minimal Starter
  - TypeScript Library
  - Monorepo Setup
  - Vue.js App
  - Svelte App
- `add` command for generating features
  - Component generation
  - Agent scaffolding
  - Tool creation
  - Route/API endpoint generation
  - Test file generation
- `test` command with Vitest integration
  - Watch mode
  - Coverage reports
  - UI mode
  - Test filtering
- `dev` command for development server
  - Port configuration
  - Environment validation
  - Auto-reload
- `build` command for production builds
  - Type checking
  - Bundle optimization
  - Source map generation
  - Bundle analysis
- `deploy` command with multi-platform support
  - Vercel integration
  - Railway integration
  - Docker support
  - Netlify integration
- `upgrade` command for dependency management
  - Breaking change detection
  - Interactive upgrade
  - Automated migrations
- Interactive prompts with Inquirer
- Smart defaults and auto-detection
- Package manager detection (npm, yarn, pnpm)
- Git initialization
- VS Code configuration generation
- Environment validation
- Update notifications
- Comprehensive error handling
- Rich terminal UI with Chalk, Ora, and Listr2
- 50+ comprehensive tests
- Detailed documentation (800+ lines)

### Features

- Project scaffolding with best practices
- Framework-agnostic architecture
- TypeScript-first approach
- Docker support
- Environment variable management
- Configuration file (aikit.config.ts)
- Template system with optional features
- Automated dependency installation
- Generated README and documentation
- ESLint and Prettier integration

### Developer Experience

- Beautiful CLI interface
- Progress indicators and spinners
- Colored output
- Helpful error messages
- Clear next steps after operations
- Update notifications

### Documentation

- Complete README with examples
- Command reference
- Template documentation
- Configuration guide
- Troubleshooting section
- Best practices
- FAQ
- Plugin development guide

### Testing

- 50+ unit tests
- Integration tests
- Command tests
- Template validation tests
- Utility function tests
- Configuration tests

## [Unreleased]

### Planned

- More templates (Remix, Astro, Qwik)
- Plugin system
- Migration commands
- Environment management commands
- Analytics and telemetry (opt-in)
- Template marketplace
- Custom template support
- GitHub Actions integration
- CI/CD configuration generation
- Database migration tools
- API documentation generation
- Performance optimization
- Bundle size tracking

[0.1.0]: https://github.com/ai-native/ai-kit/releases/tag/cli-v0.1.0
