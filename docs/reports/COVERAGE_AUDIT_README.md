# Test Coverage Audit - Quick Start Guide

This directory contains a comprehensive test coverage audit conducted on February 7, 2026.

## Summary

- **Overall Coverage:** 55.8% (Target: 80%)
- **Status:** FAILED - Not Production Ready
- **Uncovered Files:** 69 files
- **Critical Blockers:** 10 files
- **Estimated Effort:** 320 story points (11-15 sprints)

## Files Generated

### 1. Executive Summary
**File:** `COVERAGE-AUDIT-SUMMARY.md`
**Purpose:** Quick reference for management and leads
**Contents:** 
- Production blockers list
- Package coverage breakdown
- Effort estimates
- Immediate actions required

### 2. Complete Issues List
**File:** `COVERAGE-ISSUES-LIST.md`
**Purpose:** Detailed breakdown of all 69 issues to create
**Contents:**
- Issue priorities and story points
- File details and complexity
- Assignment strategy
- Success metrics

### 3. Comprehensive Audit Report
**File:** `docs/testing/coverage-audit-2026-02-07.md`
**Purpose:** Detailed technical audit (300+ lines)
**Contents:**
- Package-by-package analysis
- Missing test case documentation
- Risk assessment matrix
- Mutation testing recommendations
- GitHub issue templates

### 4. Coverage Analysis Data
**File:** `coverage-analysis.json`
**Purpose:** Machine-readable coverage data
**Contents:**
- File-by-file analysis
- Complexity scores
- Critical path flags
- Test file mappings

### 5. Analysis Script
**File:** `scripts/analyze-coverage.ts`
**Purpose:** Automated coverage analysis tool
**Usage:** `pnpm exec tsx scripts/analyze-coverage.ts`
**Output:** Generates coverage-analysis.json

### 6. Issue Generator Script
**File:** `scripts/create-coverage-issues.ts`
**Purpose:** Generate GitHub issue templates
**Usage:** `pnpm exec tsx scripts/create-coverage-issues.ts`
**Output:** Creates issue templates and shell script

## Quick Actions

### For Engineering Leads

1. **Read Executive Summary:**
   ```bash
   cat COVERAGE-AUDIT-SUMMARY.md
   ```

2. **Review Critical Blockers:**
   See "Production Blockers" section - 10 files that MUST be tested

3. **Plan Sprints:**
   - Sprint 1-2: Address 10 critical files (50 points)
   - Sprint 3-8: Address 35 high-priority files (180 points)

### For Developers

1. **View Issues to Create:**
   ```bash
   cat COVERAGE-ISSUES-LIST.md
   ```

2. **Run Coverage Analysis:**
   ```bash
   pnpm exec tsx scripts/analyze-coverage.ts
   ```

3. **Start with Critical Files:**
   - `core/src/session/*SessionStore.ts` (3 files)
   - `core/src/agents/llm/*Provider.ts` (3 files)
   - `video/src/recording/pip-*.ts` (2 files)
   - `react/src/hooks/useScreenRecording.ts` (1 file)

### For QA

1. **Review Detailed Audit:**
   ```bash
   cat docs/testing/coverage-audit-2026-02-07.md
   ```

2. **Set up Mutation Testing:**
   See "Mutation Testing Recommendations" section

3. **Monitor Coverage:**
   ```bash
   pnpm test:coverage
   ```

## Priority Packages

### CRITICAL
1. **packages/video/** - 55.6% coverage
   - NEW merged code
   - 4 files without tests (PiP recording)
   
2. **packages/react/src/hooks/** - 50% coverage
   - NEW hook: useScreenRecording
   - 1 file without tests

### HIGH
3. **packages/core/** - 60% coverage
   - 20 files without tests
   - Session stores, LLM providers, RLHF storage

4. **packages/observability/** - 28.6% coverage
   - 15 files without tests
   - Report formatters, pricing calculations

5. **packages/testing/** - 29.4% coverage
   - 12 files without tests
   - Test utilities lack self-tests

6. **packages/cli/** - 60.9% coverage
   - 9 files without tests
   - Prompt engineering tools

## Creating GitHub Issues

### Option 1: Manual (Recommended for Critical Issues)

Use the templates in:
- `docs/testing/coverage-audit-2026-02-07.md`
- `COVERAGE-ISSUES-LIST.md`

Each issue should have:
- Labels: `testing`, `coverage`, `priority:[level]`, `[package]`
- Story point estimate
- Missing test cases list
- Acceptance criteria

### Option 2: Batch Create (All 69 Issues)

```bash
# 1. Generate issue script
pnpm exec tsx scripts/create-coverage-issues.ts

# 2. Install GitHub CLI (if not installed)
brew install gh

# 3. Authenticate
gh auth login

# 4. Run batch creation (if script was generated)
# ./create-coverage-issues.sh <owner/repo> <github-token>
```

### Option 3: Manual GitHub CLI

```bash
gh issue create \
  --repo owner/repo \
  --title "Add test coverage for <file>" \
  --label "testing,coverage,priority:critical,core" \
  --body "See COVERAGE-ISSUES-LIST.md for details"
```

## Success Criteria

### Sprint 1-2 Goals (Critical Blockers)
- [ ] All 10 critical files have tests
- [ ] Coverage for core package reaches 70%+
- [ ] Coverage for video package reaches 75%+
- [ ] Coverage for react hooks reaches 80%+

### Sprint 3-4 Goals (High Priority)
- [ ] 15+ high-priority files tested
- [ ] Mutation testing implemented for auth/safety
- [ ] Integration tests added for recording workflows

### Long-term Goals
- [ ] Overall coverage reaches 80%+
- [ ] All packages at 80%+ coverage
- [ ] No critical path files without tests
- [ ] Coverage gates enforced in CI/CD

## FAQ

**Q: Why is coverage so low?**
A: The project has extensive source code (156 files) but many implementation files lack corresponding tests. Focus has been on core functionality with extensive tests (100% for nextjs, safety, tools, vue, svelte packages).

**Q: What are the biggest risks?**
A: 
1. Session stores (data loss, security)
2. LLM providers (cost overruns, API failures)
3. Video recording (memory leaks, compatibility)
4. New hooks (resource leaks, state bugs)

**Q: Can we ship to production now?**
A: NO. 10 critical path files have zero tests. This creates unacceptable risk for session management, LLM integration, and new video features.

**Q: How long will it take to reach 80%?**
A: Estimated 11-15 sprints for full 80% coverage across all packages. Critical blockers can be addressed in 2-3 sprints.

**Q: What should we test first?**
A: Prioritize in this order:
1. Session stores (authentication/data integrity)
2. LLM providers (core functionality/costs)
3. Video recording (new features)
4. React hooks (user-facing APIs)

## Next Steps

1. **This Week:**
   - Review audit with team
   - Create 10 critical blocker issues
   - Assign to senior engineers
   - Block production deployment

2. **Next Sprint:**
   - Complete 5+ critical blocker tests
   - Set up mutation testing
   - Add coverage gates to CI/CD

3. **Ongoing:**
   - Weekly coverage reviews
   - Track metrics dashboard
   - Continuous improvement

## Contact

**Audit Completed By:** QA Engineer / Bug Hunter
**Date:** February 7, 2026
**Next Audit:** After Sprint 2 (post-critical fixes)

---

For detailed information, see:
- Executive Summary: `COVERAGE-AUDIT-SUMMARY.md`
- Complete Audit: `docs/testing/coverage-audit-2026-02-07.md`
- Issues List: `COVERAGE-ISSUES-LIST.md`
