# Coverage Issues - Complete List

**Total Issues:** 69
**Created:** February 7, 2026

---

## Issue Priority Breakdown

- 🔴 **CRITICAL:** 10 issues (Production Blockers)
- 🟡 **HIGH:** 35 issues (High Complexity/Risk)
- 🟠 **MEDIUM:** 19 issues (Medium Complexity)
- 🟢 **LOW:** 5 issues (Low Complexity)

---

## Critical Priority Issues (10)

### ISSUE #COVERAGE-001: ZeroDBSessionStore.ts
- **Package:** core
- **File:** `src/session/ZeroDBSessionStore.ts`
- **LOC:** 378
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** Session data persistence, authentication state

### ISSUE #COVERAGE-002: AnthropicProvider.ts
- **Package:** core
- **File:** `src/agents/llm/AnthropicProvider.ts`
- **LOC:** 337
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** LLM API integration, core functionality

### ISSUE #COVERAGE-003: RedisSessionStore.ts
- **Package:** core
- **File:** `src/session/RedisSessionStore.ts`
- **LOC:** 317
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** Session data persistence

### ISSUE #COVERAGE-004: pip-recorder.ts
- **Package:** video
- **File:** `src/recording/pip-recorder.ts`
- **LOC:** 303
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `video`
- **Why Critical:** NEW FEATURE - Picture-in-picture recording

### ISSUE #COVERAGE-005: InMemorySessionStore.ts
- **Package:** core
- **File:** `src/session/InMemorySessionStore.ts`
- **LOC:** 293
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** Session data persistence

### ISSUE #COVERAGE-006: OpenAIProvider.ts
- **Package:** core
- **File:** `src/agents/llm/OpenAIProvider.ts`
- **LOC:** 285
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** LLM API integration, core functionality

### ISSUE #COVERAGE-007: pip-compositor.ts
- **Package:** video
- **File:** `src/recording/pip-compositor.ts`
- **LOC:** 230
- **Complexity:** HIGH
- **Story Points:** 14
- **Labels:** `testing`, `coverage`, `priority: critical`, `video`
- **Why Critical:** NEW FEATURE - Video stream composition

### ISSUE #COVERAGE-008: useScreenRecording.ts
- **Package:** react
- **File:** `src/hooks/useScreenRecording.ts`
- **LOC:** 168
- **Complexity:** MEDIUM
- **Story Points:** 8
- **Labels:** `testing`, `coverage`, `priority: critical`, `react`
- **Why Critical:** NEW HOOK - User-facing recording API

### ISSUE #COVERAGE-009: LLMProvider.ts
- **Package:** core
- **File:** `src/agents/llm/LLMProvider.ts`
- **LOC:** 60
- **Complexity:** MEDIUM
- **Story Points:** 8
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** Base provider interface

### ISSUE #COVERAGE-010: ProviderAdapter.ts
- **Package:** core
- **File:** `src/streaming/adapters/ProviderAdapter.ts`
- **LOC:** 60
- **Complexity:** MEDIUM
- **Story Points:** 8
- **Labels:** `testing`, `coverage`, `priority: critical`, `core`
- **Why Critical:** Base streaming adapter

---

## High Priority Issues (35)

### Core Package (9 files)

1. **template-generator.ts** - 1098 LOC, HIGH complexity, 13 points
2. **utils.ts (types)** - 706 LOC, HIGH complexity, 13 points
3. **templates.ts (design)** - 673 LOC, HIGH complexity, 12 points
4. **LocalStorage.ts (RLHF)** - 445 LOC, HIGH complexity, 12 points
5. **ZeroDBMemoryStore.ts** - 384 LOC, HIGH complexity, 12 points
6. **RedisMemoryStore.ts** - 381 LOC, HIGH complexity, 12 points
7. **MemoryStorage.ts (RLHF)** - 377 LOC, HIGH complexity, 12 points
8. **ZeroDBStorage.ts (RLHF)** - 354 LOC, HIGH complexity, 12 points
9. **InMemoryMemoryStore.ts** - 303 LOC, HIGH complexity, 12 points

### Video Package (2 files)

10. **highlight-detector.ts** - 570 LOC, HIGH complexity, 12 points
11. **text-formatter.ts** - 264 LOC, HIGH complexity, 12 points

### CLI Package (6 files)

12. **optimizer.ts (prompt)** - 451 LOC, HIGH complexity, 12 points
13. **history.ts (prompt)** - 449 LOC, HIGH complexity, 12 points
14. **tester.ts (prompt)** - 414 LOC, HIGH complexity, 12 points
15. **batch.ts (prompt)** - 367 LOC, HIGH complexity, 12 points
16. **comparator.ts (prompt)** - 365 LOC, HIGH complexity, 12 points
17. **utils.ts (prompt)** - 222 LOC, HIGH complexity, 8 points

### Testing Package (3 files)

18. **MockUsageTracker.ts** - 397 LOC, HIGH complexity, 12 points
19. **MockAgentExecutor.ts** - 363 LOC, HIGH complexity, 12 points
20. **helpers.ts (test-utils)** - 383 LOC, HIGH complexity, 12 points

### React Package (6 files)

21. **StreamingMessage.tsx** - 388 LOC, HIGH complexity, 12 points
22. **ToolResult.tsx** - 301 LOC, HIGH complexity, 12 points
23. **UnknownTool.tsx** - 298 LOC, HIGH complexity, 12 points
24. **MarkdownRenderer.tsx** - 262 LOC, HIGH complexity, 12 points
25. **VideoRecorder.tsx** - 229 LOC, HIGH complexity, 8 points
26. **ProgressBar.tsx** - 220 LOC, HIGH complexity, 8 points

### Observability Package (9 files)

27. **HTMLFormatter.ts** - 592 LOC, HIGH complexity, 12 points
28. **utils.ts (tracking)** - 357 LOC, HIGH complexity, 12 points
29. **MarkdownFormatter.ts** - 350 LOC, HIGH complexity, 12 points
30. **CSVFormatter.ts** - 304 LOC, HIGH complexity, 12 points
31. **pricing.ts** - 266 LOC, HIGH complexity, 8 points
32. **streamHelpers.ts (testing)** - 279 LOC, HIGH complexity, 8 points
33. **fixtures.ts (testing)** - 314 LOC, HIGH complexity, 8 points
34. **QueryBuilder.ts (core)** - 251 LOC, HIGH complexity, 8 points
35. **browser.ts (core)** - 218 LOC, HIGH complexity, 8 points

---

## Medium Priority Issues (19)

1. **conversations.ts (testing)** - 191 LOC, MEDIUM complexity, 5 points
2. **networkHelpers.ts (testing)** - 180 LOC, MEDIUM complexity, 5 points
3. **StreamingIndicator.tsx (react)** - 174 LOC, MEDIUM complexity, 5 points
4. **usageRecords.ts (testing)** - 172 LOC, MEDIUM complexity, 5 points
5. **assertions.ts (testing)** - 162 LOC, MEDIUM complexity, 5 points
6. **toMatchTokenCount.ts (testing)** - 161 LOC, MEDIUM complexity, 5 points
7. **toHaveError.ts (testing)** - 160 LOC, MEDIUM complexity, 5 points
8. **ConversationStore.ts (core)** - 157 LOC, MEDIUM complexity, 5 points
9. **ModelComparison.tsx (observability)** - 134 LOC, MEDIUM complexity, 5 points
10. **setup.ts (testing)** - 131 LOC, MEDIUM complexity, 5 points
11. **CodeBlock.tsx (react)** - 131 LOC, MEDIUM complexity, 5 points
12. **UsageMetrics.tsx (observability)** - 99 LOC, MEDIUM complexity, 5 points
13. **Overview.tsx (observability)** - 86 LOC, MEDIUM complexity, 5 points
14. **FileStorage.ts (observability)** - 84 LOC, MEDIUM complexity, 5 points
15. **vscode.ts (cli)** - 80 LOC, MEDIUM complexity, 5 points
16. **CostAnalysis.tsx (observability)** - 77 LOC, MEDIUM complexity, 5 points
17. **docker.ts (cli)** - 75 LOC, MEDIUM complexity, 5 points
18. **InMemoryStorage.ts (observability)** - 64 LOC, MEDIUM complexity, 5 points
19. **MemoryStorage.ts (observability)** - 56 LOC, MEDIUM complexity, 5 points

---

## Low Priority Issues (5)

1. **id.ts (observability/utils)** - 32 LOC, LOW complexity, 2 points
2. **server.ts (core)** - 32 LOC, LOW complexity, 2 points
3. **UsageTrackerAdapter.ts (observability)** - 27 LOC, LOW complexity, 2 points
4. **id.ts (core/utils)** - 21 LOC, LOW complexity, 2 points
5. **JSONFormatter.ts (observability)** - 12 LOC, LOW complexity, 2 points

---

## How to Create Issues

### Option 1: Manual Creation (Recommended for small batches)

Use the detailed issue templates in the generated coverage audit report:
- `/Users/aideveloper/ai-kit/docs/testing/coverage-audit-2026-02-07.md`

Each issue should include:
- File path and metrics
- Missing test cases
- Story point estimate
- Acceptance criteria
- Labels: `testing`, `coverage`, `priority: [level]`, `[package]`

### Option 2: Batch Creation (For all 69 issues)

1. Install GitHub CLI: `brew install gh`
2. Authenticate: `gh auth login`
3. Run the generation script again to create the shell script:
   ```bash
   pnpm exec tsx scripts/create-coverage-issues.ts
   ```
4. Execute the generated script:
   ```bash
   ./create-coverage-issues.sh <owner/repo> <github-token>
   ```

### Option 3: Using GitHub API

```bash
for issue in <issue-data>; do
  gh issue create \
    --repo ainative/ai-kit \
    --title "Add test coverage for $FILE" \
    --body "$BODY" \
    --label "testing,coverage,priority:$PRIORITY,$PACKAGE"
done
```

---

## Issue Assignment Strategy

### Sprint 1-2: Critical Blockers (10 issues, 50 points)

**Assign to:** Senior engineers with domain expertise

1. Session stores (3 issues) → Backend team
2. LLM providers (3 issues) → AI/ML team
3. Video recording (2 issues) → Media team
4. React hooks (1 issue) → Frontend team
5. Adapters (1 issue) → Platform team

### Sprint 3-4: High Priority (35 issues, 180 points)

**Assign to:** Mixed team (senior + mid-level)

- Distribute across teams based on package ownership
- Pair junior developers with seniors for complex files
- Focus on one package at a time for context efficiency

### Sprint 5+: Medium/Low Priority (24 issues, 110 points)

**Assign to:** All team members

- Good candidates for junior developers
- Can be parallelized across teams
- Lower risk, easier to verify

---

## Success Metrics

Track progress weekly using these metrics:

1. **Coverage Percentage**
   - Overall: Target 80% (currently 55.8%)
   - Per package: Target 80%

2. **Critical Blockers**
   - Target: 0 critical files without tests
   - Current: 10 critical files

3. **Issue Velocity**
   - Target: 5-7 issues per sprint
   - Track story points completed

4. **Test Quality**
   - Mutation score: 75%+ for tested code
   - No flaky tests
   - All tests passing in CI/CD

---

## Related Documentation

- **Comprehensive Audit:** `/Users/aideveloper/ai-kit/docs/testing/coverage-audit-2026-02-07.md`
- **Executive Summary:** `/Users/aideveloper/ai-kit/COVERAGE-AUDIT-SUMMARY.md`
- **Coverage Data:** `/Users/aideveloper/ai-kit/coverage-analysis.json`
- **Analysis Script:** `/Users/aideveloper/ai-kit/scripts/analyze-coverage.ts`
- **Issue Generator:** `/Users/aideveloper/ai-kit/scripts/create-coverage-issues.ts`

---

**Generated:** February 7, 2026
**Last Updated:** February 7, 2026
**Status:** Ready for issue creation
