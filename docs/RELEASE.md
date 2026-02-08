# Release Process Documentation

This document outlines the complete release process for AI Kit, ensuring consistent, repeatable, and high-quality releases.

## Table of Contents

- [Version Numbering Strategy](#version-numbering-strategy)
- [Release Types](#release-types)
- [Pre-Release Checklist](#pre-release-checklist)
- [Release Process](#release-process)
- [Changelog Management](#changelog-management)
- [Tag Creation](#tag-creation)
- [NPM Publishing](#npm-publishing)
- [Release Notes](#release-notes)
- [Post-Release Tasks](#post-release-tasks)
- [Hotfix Process](#hotfix-process)
- [Rollback Procedures](#rollback-procedures)
- [Automation](#automation)

---

## Version Numbering Strategy

AI Kit follows [Semantic Versioning (SemVer) 2.0.0](https://semver.org/):

### Format: MAJOR.MINOR.PATCH

```
1.2.3
│ │ │
│ │ └─── PATCH: Bug fixes and minor changes
│ └───── MINOR: New features, backwards compatible
└─────── MAJOR: Breaking changes
```

### Version Increment Rules

#### MAJOR Version (X.0.0)

Increment when you make **incompatible API changes**:

- Removing or renaming public APIs
- Changing function signatures
- Removing support for Node.js versions
- Breaking changes to configuration format
- Removing deprecated features

**Example:**
```typescript
// v1.x.x
createAgent({ name: 'agent', llm: { provider: 'anthropic' } })

// v2.0.0 - BREAKING CHANGE
createAgent({
  name: 'agent',
  provider: { type: 'anthropic' } // Changed API structure
})
```

#### MINOR Version (x.Y.0)

Increment when you add **backwards-compatible functionality**:

- Adding new features
- Adding new APIs
- Adding optional parameters
- Deprecating features (but not removing)
- Performance improvements

**Example:**
```typescript
// v1.2.0 - New feature added
const agent = createAgent({
  name: 'agent',
  memory: { enabled: true } // New optional feature
})
```

#### PATCH Version (x.y.Z)

Increment when you make **backwards-compatible bug fixes**:

- Bug fixes
- Security patches
- Documentation updates
- Internal refactoring
- Dependency updates (no API changes)

**Example:**
```typescript
// v1.2.1 - Bug fix
// Fixed: Memory leak in streaming connections
```

### Pre-release Versions

For testing before stable release:

- **Alpha**: `1.0.0-alpha.1` - Early testing, unstable
- **Beta**: `1.0.0-beta.1` - Feature complete, testing
- **RC**: `1.0.0-rc.1` - Release candidate, final testing

### Version Examples

```
0.1.0       - Initial development
0.2.0       - Added new features
0.2.1       - Bug fixes
1.0.0-rc.1  - Release candidate
1.0.0       - First stable release
1.1.0       - New features added
1.1.1       - Bug fixes
2.0.0       - Breaking changes
```

---

## Release Types

### 1. Regular Release

Standard release with new features, improvements, and bug fixes.

**Timeline:** Every 4-6 weeks
**Branch:** `release/vX.Y.Z`
**Testing:** Full test suite, E2E tests

### 2. Hotfix Release

Critical bug or security fix.

**Timeline:** As needed (urgent)
**Branch:** `hotfix/vX.Y.Z`
**Testing:** Focused tests on the fix

### 3. Beta Release

Pre-release for testing new features.

**Timeline:** 1-2 weeks before stable
**Branch:** `release/vX.Y.Z-beta.N`
**Testing:** Full test suite + user testing

### 4. Major Release

Breaking changes, major new features.

**Timeline:** Every 6-12 months
**Branch:** `release/vX.0.0`
**Testing:** Extensive testing + migration guides

---

## Pre-Release Checklist

Complete this checklist before starting the release process.

### Code Quality

- [ ] All CI/CD checks passing
- [ ] All tests passing (unit, integration, E2E)
- [ ] Test coverage ≥80% for all packages
- [ ] No failing tests in critical packages (core, safety)
- [ ] Linting passes: `pnpm lint`
- [ ] Type checking passes: `pnpm run type-check`
- [ ] Build succeeds: `pnpm build`

### Security

- [ ] Security audit completed: `pnpm audit`
- [ ] No critical or high-severity vulnerabilities
- [ ] Dependencies up to date (patch versions)
- [ ] No secrets in codebase
- [ ] Security best practices followed

### Documentation

- [ ] CHANGELOG.md updated with all changes
- [ ] API documentation updated
- [ ] README.md reflects current version features
- [ ] Migration guide created (for breaking changes)
- [ ] All code examples tested and working
- [ ] TypeScript types documented

### Package Health

- [ ] All packages build successfully
- [ ] Internal dependencies updated
- [ ] Peer dependencies verified
- [ ] Package.json metadata complete
- [ ] LICENSE file present in all packages
- [ ] README.md present in all packages

### Testing Verification

```bash
# Run full test suite
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage

# Validate packages
pnpm run validate:packages

# Validate coverage thresholds
pnpm run validate:coverage
```

---

## Release Process

### Step 1: Prepare Release Branch

```bash
# Update your local main branch
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v1.2.0

# Or for hotfix
git checkout -b hotfix/v1.1.1
```

### Step 2: Version Bump

We use [Changesets](https://github.com/changesets/changesets) for version management.

#### Using Changesets (Recommended)

```bash
# Add a changeset (do this during development)
pnpm changeset

# When ready to release, update versions
pnpm changeset version

# This will:
# - Update all package.json versions
# - Update CHANGELOG.md automatically
# - Update internal dependencies
```

#### Manual Version Bump (Alternative)

If not using changesets:

```bash
# Update version in root package.json
# Update version in all packages/*/package.json
# Update internal dependencies to match

# Example script
tsx scripts/bump-version.ts 1.2.0
```

### Step 3: Update Changelog

If not using changesets, manually update `CHANGELOG.md`:

```bash
# Edit CHANGELOG.md
# Move entries from [Unreleased] to new version section
# Format:

## [1.2.0] - 2026-02-15

### Added
- Multi-agent swarm orchestration (#123)
- Intelligent memory system (#145)

### Changed
- Improved streaming performance (#167)

### Fixed
- Fixed memory leak in agents (#189)
```

### Step 4: Run Pre-Release Validation

```bash
# Clean all build artifacts
pnpm run clean

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type check
pnpm run type-check

# Lint
pnpm lint

# Dry run publish
pnpm publish:dry-run
```

### Step 5: Commit Release Changes

```bash
# Stage all changes
git add .

# Commit with release message
git commit -m "chore: release v1.2.0

- Updated package versions to 1.2.0
- Updated CHANGELOG.md
- Updated internal dependencies

Release notes: https://github.com/AINative-Studio/ai-kit/releases/tag/v1.2.0"

# Push release branch
git push origin release/v1.2.0
```

### Step 6: Create Pull Request

Create a PR from release branch to main:

**Title:** `Release v1.2.0`

**Description:**
```markdown
## Release v1.2.0

### Changes
- List major changes
- Link to relevant issues/PRs

### Checklist
- [x] All tests passing
- [x] Documentation updated
- [x] CHANGELOG.md updated
- [x] Version bumped in all packages
- [x] Dry run publish successful

### Release Notes
[Link to release notes draft]

### Breaking Changes
None / [List breaking changes]
```

### Step 7: Review and Merge

- [ ] Code review by at least 2 maintainers
- [ ] All checks passing
- [ ] No conflicts with main
- [ ] Merge to main (use "Create a merge commit")

### Step 8: Create Git Tag

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0

AI Kit v1.2.0 brings multi-agent orchestration, intelligent memory,
and enhanced safety features.

Full release notes:
https://github.com/AINative-Studio/ai-kit/releases/tag/v1.2.0"

# Push tag
git push origin v1.2.0

# Verify tag
git tag -l v1.2.0
git show v1.2.0
```

### Step 9: Publish to NPM

```bash
# Verify npm authentication
npm whoami

# If not logged in
npm login

# Prepare packages for publishing
pnpm run prepare:publish

# Final build
pnpm build

# Publish all packages
pnpm run changeset:publish
# Or manually:
# pnpm publish --recursive --access public

# Verify publication
npm view @ainative/ai-kit-core@1.2.0
npm view @ainative/ai-kit@1.2.0

# Restore workspace dependencies
pnpm run restore:workspace
```

### Step 10: Create GitHub Release

Go to: https://github.com/AINative-Studio/ai-kit/releases/new

**Tag:** `v1.2.0`
**Title:** `AI Kit v1.2.0 - [Descriptive Title]`
**Description:** See [Release Notes Template](#release-notes-template)
**Options:**
- [ ] Set as pre-release (for beta/RC)
- [x] Set as latest release (for stable)

---

## Changelog Management

### During Development

Contributors add changeset files when making changes:

```bash
# Add a changeset
pnpm changeset

# Choose packages affected
# Choose version bump type (major/minor/patch)
# Write summary of changes
```

This creates a file in `.changeset/` directory.

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.0] - 2026-02-15

### Added
- New feature description (#123)
- Another feature (#145)

### Changed
- Updated behavior description (#167)

### Deprecated
- Feature X will be removed in v2.0 (#189)

### Removed
- Removed deprecated feature Y (#201)

### Fixed
- Fixed bug description (#212)
- Fixed another bug (#234)

### Security
- Fixed vulnerability CVE-2024-XXXX (#256)
```

### Changelog Categories

- **Added**: New features, APIs, packages
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal
- **Removed**: Removed features or APIs
- **Fixed**: Bug fixes
- **Security**: Security fixes

### Breaking Changes

Mark clearly:

```markdown
### Changed
- **BREAKING**: Renamed `AIStream` to `StreamingAgent`
  - Migration: Replace all `AIStream` imports with `StreamingAgent`
  - See migration guide: docs/migrations/v2.0.0.md
```

---

## Tag Creation

### Tag Naming Convention

- Regular releases: `v1.2.0`
- Pre-releases: `v1.2.0-beta.1`, `v1.2.0-rc.1`
- Hotfixes: `v1.2.1`

### Creating Tags

```bash
# Lightweight tag (not recommended)
git tag v1.2.0

# Annotated tag (recommended)
git tag -a v1.2.0 -m "Release v1.2.0"

# Signed tag (most secure)
git tag -s v1.2.0 -m "Release v1.2.0"
```

### Tag Message Template

```
Release v1.2.0

[One-line summary of the release]

Highlights:
- Major feature 1
- Major feature 2
- Important fix

Full release notes:
https://github.com/AINative-Studio/ai-kit/releases/tag/v1.2.0
```

### Tag Management

```bash
# List tags
git tag -l

# View tag details
git show v1.2.0

# Delete local tag (if mistake)
git tag -d v1.2.0

# Delete remote tag (careful!)
git push origin --delete v1.2.0

# Push specific tag
git push origin v1.2.0

# Push all tags
git push origin --tags
```

---

## NPM Publishing

### Prerequisites

```bash
# Verify npm authentication
npm whoami

# Login if needed
npm login

# Verify organization membership
npm org ls @ainative

# Check package access
npm access ls-packages @ainative
```

### Publishing Process

#### 1. Prepare Packages

```bash
# This script:
# - Removes workspace: protocol
# - Replaces with exact versions
# - Prepares for publishing
pnpm run prepare:publish
```

#### 2. Dry Run

```bash
# Test publishing without actually publishing
pnpm publish:dry-run

# Review output:
# - Check version numbers
# - Verify file inclusion
# - Check dependencies
```

#### 3. Publish

```bash
# Using changesets (recommended)
pnpm run changeset:publish

# Or manually
pnpm publish --recursive --access public

# For beta releases
pnpm run release:beta
# Or
pnpm publish --recursive --access public --tag beta
```

#### 4. Verify Publication

```bash
# Check each package
npm view @ainative/ai-kit-core@1.2.0
npm view @ainative/ai-kit@1.2.0
npm view @ainative/ai-kit-safety@1.2.0

# Test installation
mkdir test-install && cd test-install
npm init -y
npm install @ainative/ai-kit-core@1.2.0
node -e "console.log(require('@ainative/ai-kit-core').version)"
```

#### 5. Restore Workspace

```bash
# Restore workspace: protocol
pnpm run restore:workspace
```

### NPM Tags

- `latest` - Stable releases (default)
- `beta` - Beta releases
- `next` - Pre-release versions
- `canary` - Nightly/experimental builds

```bash
# Publish with specific tag
pnpm publish --tag beta

# Update tag later
npm dist-tag add @ainative/ai-kit-core@1.2.0 latest

# View tags
npm dist-tag ls @ainative/ai-kit-core
```

### Package.json Configuration

Each package should have:

```json
{
  "name": "@ainative/ai-kit-core",
  "version": "1.2.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "package.json"
  ]
}
```

---

## Release Notes

### Release Notes Template

```markdown
# AI Kit v1.2.0 - [Descriptive Title]

**Release Date:** February 15, 2026
**Type:** Minor Release

## Overview

[2-3 paragraph overview of the release, highlighting major themes and improvements]

## Highlights

### Multi-Agent Swarm Orchestration

[Detailed description with code examples]

```typescript
const swarm = new AgentSwarm({
  supervisor: supervisorAgent,
  specialists: [researchAgent, analysisAgent]
})
```

### Intelligent Memory System

[Detailed description with code examples]

## What's New

### Features

- **Multi-Agent Swarms** - Coordinate multiple specialized agents (#123)
- **Intelligent Memory** - Auto-extract facts with contradiction detection (#145)
- **Enhanced Safety** - New prompt injection patterns detected (#167)

### Improvements

- **Performance** - 3x faster streaming performance (#189)
- **TypeScript** - Improved type inference (#201)
- **Error Handling** - Better error messages (#212)

### Bug Fixes

- Fixed memory leak in streaming connections (#234)
- Resolved TypeScript compilation issues (#256)
- Fixed video recording on Safari (#278)

## Breaking Changes

**None** - This release is fully backwards compatible with v1.1.x

## Migration Guide

No migration required for upgrading from v1.1.x.

For users on v1.0.x, see: [Migration Guide](../docs/MIGRATION-v1.2.md)

## Installation

```bash
# Update existing installation
npm install @ainative/ai-kit-core@1.2.0

# Or with pnpm
pnpm add @ainative/ai-kit-core@1.2.0
```

## Documentation

- [API Reference](https://docs.aikit.dev/api)
- [Migration Guide](../docs/MIGRATION-v1.2.md)
- [Examples](../examples/)

## Contributors

Thank you to all contributors who made this release possible:

@contributor1, @contributor2, @contributor3

## Full Changelog

See [CHANGELOG.md](../CHANGELOG.md#120---2026-02-15) for complete details.

## Next Release

v1.3.0 is planned for April 2026 with:
- Vue.js full support
- Enhanced observability
- Distributed tracing

---

**Questions?** Open a [GitHub Discussion](https://github.com/AINative-Studio/ai-kit/discussions)
**Found a bug?** File an [issue](https://github.com/AINative-Studio/ai-kit/issues/new/choose)
```

### Writing Good Release Notes

#### Do's

- ✅ Lead with the most important changes
- ✅ Include code examples for major features
- ✅ Link to relevant issues/PRs
- ✅ Provide migration instructions
- ✅ Acknowledge contributors
- ✅ Be specific about what changed

#### Don'ts

- ❌ Don't use jargon without explanation
- ❌ Don't skip breaking changes
- ❌ Don't forget installation instructions
- ❌ Don't omit migration guides
- ❌ Don't make assumptions about prior knowledge

---

## Post-Release Tasks

### Immediate (Within 1 Hour)

- [ ] Verify all packages published correctly
- [ ] Test installation from npm
- [ ] Create GitHub release with notes
- [ ] Update documentation site
- [ ] Announce on GitHub Discussions

### Same Day

- [ ] Post on social media (Twitter, LinkedIn)
- [ ] Update company blog
- [ ] Send announcement email
- [ ] Update Discord/Slack announcements
- [ ] Close related issues and PRs

### Within 24 Hours

- [ ] Monitor npm download stats
- [ ] Watch for bug reports
- [ ] Check error tracking services
- [ ] Respond to questions
- [ ] Update roadmap

### Within 1 Week

- [ ] Review community feedback
- [ ] Triage new issues
- [ ] Plan patch release if needed
- [ ] Update project board
- [ ] Create milestone for next release

### Monitoring

```bash
# Watch npm downloads
npm info @ainative/ai-kit-core

# Monitor GitHub activity
gh issue list --label "bug" --state "open"
gh pr list --state "open"

# Check CI/CD status
gh run list --workflow "CI"
```

---

## Hotfix Process

For critical bugs or security issues requiring immediate release.

### When to Hotfix

- **Critical bugs** affecting production users
- **Security vulnerabilities** (CVE)
- **Data loss** or corruption issues
- **Breaking functionality** in stable release

### Hotfix Steps

```bash
# 1. Create hotfix branch from latest release tag
git checkout v1.2.0
git checkout -b hotfix/v1.2.1

# 2. Make the fix
# Edit files...
git add .
git commit -m "fix: critical bug in streaming (#301)"

# 3. Update version (patch)
pnpm changeset version
# Or manually bump patch version

# 4. Test thoroughly
pnpm test
pnpm test:integration

# 5. Merge to main
git checkout main
git merge hotfix/v1.2.1

# 6. Tag and publish
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main v1.2.1
pnpm run changeset:publish

# 7. Cherry-pick to develop if needed
git checkout develop
git cherry-pick <commit-hash>
```

### Hotfix Release Notes

```markdown
# AI Kit v1.2.1 - Critical Hotfix

**Release Date:** February 16, 2026
**Type:** Patch Release (Hotfix)

## Critical Fix

This release addresses a critical memory leak in streaming connections
that could cause performance degradation in long-running applications.

### Fixed
- Fixed memory leak in streaming connections (#301)

### Who Should Upgrade

**All users of v1.2.0 should upgrade immediately.**

### Installation

```bash
npm install @ainative/ai-kit-core@1.2.1
```

### Impact

Users running long-lived streaming connections may experience:
- Gradually increasing memory usage
- Performance degradation over time
- Potential crashes after extended use

This release resolves all known issues.
```

---

## Rollback Procedures

### When to Rollback

- Critical bug introduced in latest release
- Security vulnerability in dependencies
- Breaking change not documented
- Widespread user reports of failures

### Rollback Steps

#### 1. Immediate Communication

```markdown
# Post on GitHub, Discord, Twitter

⚠️ URGENT: AI Kit v1.2.0 Rollback Notice

We've identified a critical issue in v1.2.0 affecting [describe impact].

IMMEDIATE ACTIONS:
1. Do not upgrade to v1.2.0
2. Roll back to v1.1.0 if already upgraded
3. We're working on v1.2.1 hotfix

Details: [issue link]
```

#### 2. NPM Deprecation

```bash
# Deprecate the bad version
npm deprecate @ainative/ai-kit-core@1.2.0 "Critical bug - use v1.1.0 or wait for v1.2.1"

# Update latest tag to previous version
npm dist-tag add @ainative/ai-kit-core@1.1.0 latest
```

#### 3. GitHub Release Update

- Edit release on GitHub
- Change to "Pre-release" status
- Add warning banner to description
- Pin issue describing the problem

#### 4. Fix and Re-release

```bash
# Create hotfix
git checkout v1.2.0
git checkout -b hotfix/v1.2.1

# Fix the issue
# ... make changes ...

# Release as v1.2.1
# Follow hotfix process above
```

#### 5. Post-Mortem

Document what went wrong and how to prevent it:

```markdown
# Post-Mortem: v1.2.0 Rollback

## Timeline
- 10:00 AM - v1.2.0 released
- 11:30 AM - First bug reports
- 12:00 PM - Issue confirmed
- 12:15 PM - Rollback initiated
- 2:00 PM - v1.2.1 hotfix released

## Root Cause
[Describe what went wrong]

## Impact
[Number of users affected, severity]

## Resolution
[How it was fixed]

## Prevention
- Add test coverage for [scenario]
- Update release checklist
- Improve [process/tool]
```

---

## Automation

### GitHub Actions Workflows

#### Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Publish to NPM
        run: pnpm run changeset:publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

### Changesets Configuration

Create `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [
    ["@ainative/ai-kit-core", "@ainative/ai-kit"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Release Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "changeset": "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "changeset publish",
    "release": "pnpm prepare:publish && pnpm prepublish && pnpm changeset:version && pnpm changeset:publish && pnpm restore:workspace",
    "release:beta": "pnpm prepare:publish && pnpm prepublish && pnpm changeset:version && pnpm changeset:publish --tag beta && pnpm restore:workspace",
    "publish:dry-run": "pnpm prepare:publish && pnpm prepublish && pnpm changeset:publish --dry-run && pnpm restore:workspace"
  }
}
```

---

## Best Practices

### Release Timing

- **Regular releases**: First Tuesday of each month
- **Hotfixes**: As needed, any time
- **Major releases**: Avoid Fridays and holidays
- **Beta releases**: 1-2 weeks before stable

### Communication

- Announce releases on all channels
- Provide clear migration guides
- Respond to issues quickly
- Thank contributors publicly

### Quality Assurance

- Never skip tests for releases
- Always do dry run publishes
- Test installation from npm
- Monitor first 24 hours closely

### Documentation

- Update docs before release
- Include code examples
- Provide migration paths
- Link to related issues

---

## Troubleshooting

### Common Issues

#### Publishing Fails

```bash
# Error: 402 Payment Required
# Solution: Verify npm organization status

# Error: 403 Forbidden
# Solution: Check package access permissions
npm access ls-packages @ainative

# Error: 401 Unauthorized
# Solution: Re-authenticate
npm logout
npm login
```

#### Tag Already Exists

```bash
# Delete local tag
git tag -d v1.2.0

# Delete remote tag
git push origin --delete v1.2.0

# Recreate with correct version
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

#### Wrong Version Published

```bash
# Deprecate wrong version
npm deprecate @ainative/ai-kit-core@1.2.0 "Wrong version published, use 1.2.1"

# Publish correct version
# Follow normal release process for v1.2.1
```

---

## Resources

### Internal Links

- [Release Checklist](./releases/RELEASE-CHECKLIST.md)
- [Migration Guides](./releases/)
- [Contributing Guide](../CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)

### External Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)

---

## Questions?

For questions about the release process:

- **GitHub Discussions**: https://github.com/AINative-Studio/ai-kit/discussions
- **Issue Tracker**: https://github.com/AINative-Studio/ai-kit/issues
- **Team Chat**: [Internal Slack/Discord]

---

**Document Version:** 1.0
**Last Updated:** February 8, 2026
**Maintained By:** Release Engineering Team
**Next Review:** April 2026
