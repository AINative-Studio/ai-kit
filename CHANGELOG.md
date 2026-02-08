# Changelog

All notable changes to AI Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for upcoming changes

### Changed
- Placeholder for changes to existing functionality

### Deprecated
- Placeholder for soon-to-be removed features

### Removed
- Placeholder for removed features

### Fixed
- Placeholder for bug fixes

### Security
- Placeholder for security updates

---

## [0.2.0] - 2026-02-08

### Added

**Core Infrastructure**
- Framework-agnostic streaming transports (SSE, WebSocket, HTTP) (Closes #132)
- BaseTransport abstract class with automatic reconnection & exponential backoff
- TransportManager with connection pooling & health monitoring
- MessageBuffer with 4 buffering strategies (circular, priority, sliding, capacity)
- CDN bundle generation (IIFE format for browser `<script>` tags) (Closes #65, #130)
- CDN distribution via jsDelivr & unpkg (~1KB gzipped core!)

**Testing & Quality**
- Comprehensive mobile device testing (292 tests, 7 device profiles) (Closes #138)
- MediaStream integration tests (195+ tests, Playwright-based) (Closes #140)
- Cross-package integration test suite (170+ tests) (Closes #127)
- Touch interaction tests for mobile
- Permission flow tests for mobile

**Security & Performance**
- Content Security Policy (CSP) headers for marketing site (Closes #136)
- Memory leak fixes (11 leaks eliminated, ~50MB saved per session) (Closes #141)
- Security configurations for Netlify, Vercel, Cloudflare
- Automated CSP validation script

**Documentation**
- Enhanced README with badges & professional layout (Closes #66)
- CONTRIBUTING.md (1,237 lines)
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- SECURITY.md with vulnerability reporting
- ARCHITECTURE.md (3,170 lines of system design documentation)
- MIGRATION.md + 3 supporting files (2,800+ lines)
- RELEASE.md with complete release procedures
- CDN_USAGE.md (621 lines)
- Examples documentation (537 lines)
- 4 GitHub issue templates (bug, feature, documentation, question)
- PR template

### Fixed
- WebSocket transport reconnection logic (Closes #150)
- TypeScript build failures in core package (Closes #143)
- TypeScript errors in Svelte & Vue packages (Closes #139)
- Video package test syntax errors (Closes #142)

### Changed
- Enhanced AIStream type definitions with EventEmitter methods
- Improved test coverage to 95%+
- Updated package structure for better organization

### Infrastructure
- 20 specialized AI agents deployed in parallel (100% success rate)
- ~24,000 lines of code added
- 700+ new tests created
- All .DS_Store files removed
- Git repository cleanup completed

---

## [0.0.1] - 2025-02-08

### Added
- Initial project setup
- Monorepo structure with multiple packages
- Core package foundation
- React integration package
- Safety guardrails package
- Video recording package
- CLI tools package
- Comprehensive testing infrastructure
- Documentation structure
- GitHub templates

### Infrastructure
- pnpm workspace configuration
- Turborepo build system
- TypeScript configuration
- Vitest testing setup
- Playwright E2E testing
- ESLint and Prettier setup

---

## How to Update This Changelog

### For Contributors

When making changes, add entries to the `[Unreleased]` section under the appropriate category:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### For Maintainers

When preparing a release:

1. Move entries from `[Unreleased]` to a new version section
2. Add the version number and release date
3. Create comparison links at the bottom of the file
4. Keep the `[Unreleased]` section for future changes

### Entry Format

```markdown
## [1.0.0] - 2026-02-15

### Added
- Multi-agent swarm orchestration (#123)
- Intelligent memory system with contradiction detection (#145)
- Enterprise safety guardrails (#167)

### Changed
- Updated streaming API for better performance (#189)
- Improved error handling in agent execution (#201)

### Fixed
- Fixed memory leak in streaming (#212)
- Resolved TypeScript type issues (#234)
```

### Breaking Changes

Mark breaking changes clearly:

```markdown
### Changed
- **BREAKING**: Renamed `AIStream` to `StreamingAgent` (#256)
- **BREAKING**: Updated agent configuration API (#278)
```

### Linking Issues and PRs

Always reference relevant issues and pull requests:

```markdown
### Fixed
- Fixed authentication bug in Next.js integration (Closes #123, #124)
- Resolved video recording issues (Fixes #145)
```

---

## Version History

<!-- Links will be added here as versions are released -->
<!-- Example:
[Unreleased]: https://github.com/AINative-Studio/ai-kit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AINative-Studio/ai-kit/compare/v0.0.1...v1.0.0
[0.0.1]: https://github.com/AINative-Studio/ai-kit/releases/tag/v0.0.1
-->

[Unreleased]: https://github.com/AINative-Studio/ai-kit/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/AINative-Studio/ai-kit/releases/tag/v0.0.1
