# Migration Checklist: v0.x to v1.0

Use this checklist to ensure a complete and successful migration to AI Kit v1.0.

**Project:** ________________________
**Migration Date:** ________________________
**Completed By:** ________________________

---

## Pre-Migration Preparation

- [ ] Read the full migration guide (`docs/MIGRATION.md`)
- [ ] Review breaking changes section
- [ ] Check current dependencies versions
- [ ] Create a backup branch: `git checkout -b backup/pre-v1-migration`
- [ ] Document current functionality for testing later
- [ ] Notify team members of planned migration
- [ ] Schedule maintenance window (if applicable)

---

## Phase 1: Dependency Updates (5-10 minutes)

### React Package Updates

- [ ] Uninstall old React package:
  ```bash
  npm uninstall @ainative/ai-kit-react
  ```

- [ ] Install new React package:
  ```bash
  npm install @ainative/ai-kit@^1.0.0
  ```

### Core Package Updates

- [ ] Update core package to v1.0:
  ```bash
  npm install @ainative/ai-kit-core@^1.0.0
  ```

### Optional Packages (install if needed)

- [ ] Install safety package (recommended for production):
  ```bash
  npm install @ainative/ai-kit-safety@^1.0.0
  ```

- [ ] Install tools package (if using built-in tools):
  ```bash
  npm install @ainative/ai-kit-tools@^1.0.0
  ```

- [ ] Install video package (if using video features):
  ```bash
  npm install @ainative/ai-kit-video@^1.0.0
  ```

- [ ] Install Next.js package (if using Next.js):
  ```bash
  npm install @ainative/ai-kit-nextjs@^1.0.0
  ```

- [ ] Install observability package (if needed):
  ```bash
  npm install @ainative/ai-kit-observability@^1.0.0
  ```

- [ ] Update CLI globally (if using):
  ```bash
  npm uninstall -g @aikit/cli
  npm install -g @ainative/ai-kit-cli@^1.0.0
  ```

### Verify Dependencies

- [ ] Run `npm install` to update lock file
- [ ] Check for peer dependency warnings
- [ ] Verify no dependency conflicts

---

## Phase 2: Code Updates (10-20 minutes)

### Import Changes

- [ ] Find all imports of `@ainative/ai-kit-react`
- [ ] Replace with `@ainative/ai-kit`:
  ```bash
  find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -exec sed -i '' 's/@ainative\/ai-kit-react/@ainative\/ai-kit/g' {} +
  ```

- [ ] Update safety imports (if applicable):
  ```typescript
  // OLD: import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'
  // NEW: import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
  ```

- [ ] Update tools imports (if applicable):
  ```typescript
  // OLD: import { calculatorTool } from '@ainative/ai-kit-core/tools'
  // NEW: import { calculatorTool } from '@ainative/ai-kit-tools'
  ```

- [ ] Check for any deprecated imports in codebase

### TypeScript Updates

- [ ] Update `tsconfig.json` if needed:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "types": ["@ainative/ai-kit-core", "@ainative/ai-kit"]
    }
  }
  ```

- [ ] Fix any new TypeScript errors from stricter types
- [ ] Add type guards for `undefined` values
- [ ] Update type assertions if necessary

### Test Configuration

- [ ] Update `vitest.config.ts` for React tests:
  ```typescript
  export default defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts']
    }
  })
  ```

- [ ] Create `vitest.setup.ts` if needed:
  ```typescript
  import '@testing-library/jest-dom'
  ```

- [ ] Update test imports if they reference old packages

---

## Phase 3: Testing (15-30 minutes)

### Build & Compile

- [ ] Run type checking:
  ```bash
  npm run type-check
  ```
  **Expected:** No type errors

- [ ] Run linter:
  ```bash
  npm run lint
  ```
  **Expected:** No linting errors

- [ ] Run build:
  ```bash
  npm run build
  ```
  **Expected:** Successful build with no errors

### Unit Tests

- [ ] Run unit tests:
  ```bash
  npm test
  ```
  **Expected:** All tests pass

- [ ] Check for deprecation warnings
- [ ] Review test coverage (should be similar to before)

### Integration Tests

- [ ] Run integration tests (if applicable):
  ```bash
  npm run test:integration
  ```

- [ ] Verify AI streaming works correctly
- [ ] Verify agent execution completes
- [ ] Verify tool calling functions properly
- [ ] Test error handling scenarios

### Manual Testing

- [ ] Start development server:
  ```bash
  npm run dev
  ```

- [ ] Test chat/messaging functionality
- [ ] Test streaming responses
- [ ] Test loading states
- [ ] Test error states
- [ ] Test cost tracking (if enabled)
- [ ] Test any custom features

### Performance Testing

- [ ] Measure first token latency (expect <10ms)
- [ ] Measure state operation latency (expect <10ms)
- [ ] Check memory usage (expect <1MB)
- [ ] Verify bundle size (expect 40-60% smaller)

### Security Testing

- [ ] Run security audit:
  ```bash
  npm audit
  ```
  **Expected:** 0 critical/high vulnerabilities

- [ ] Test security features (if enabled):
  - [ ] Prompt injection detection works
  - [ ] PII detection and redaction works
  - [ ] Content moderation works

---

## Phase 4: Optional Feature Adoption (Variable)

### Multi-Agent Swarms (Optional)

- [ ] Review swarm documentation
- [ ] Identify use cases for swarms
- [ ] Implement swarm for complex tasks
- [ ] Test swarm execution
- [ ] Verify result synthesis
- [ ] Check cost tracking across agents

### RLHF Instrumentation (Recommended)

- [ ] Install RLHF logger:
  ```typescript
  const logger = new RLHFLogger({ storage: new InMemoryStorage() })
  ```

- [ ] Add logger to agent config
- [ ] Verify interactions are logged
- [ ] Test log export functionality
- [ ] Set up log analysis pipeline (if applicable)

### Security Features (Recommended for Production)

- [ ] Install safety package
- [ ] Create prompt injection detector:
  ```typescript
  const detector = new PromptInjectionDetector({ sensitivityLevel: 'HIGH' })
  ```

- [ ] Create PII detector:
  ```typescript
  const piiDetector = new PIIDetector({ redact: true })
  ```

- [ ] Integrate into input validation pipeline
- [ ] Test with various attack vectors
- [ ] Configure alerting for security events

### Video Recording (If Needed)

- [ ] Install video package
- [ ] Implement screen recording
- [ ] Implement camera recording
- [ ] Test MediaStream cleanup
- [ ] Test Blob URL revocation
- [ ] Verify no memory leaks

### Enhanced Error Handling

- [ ] Update catch blocks to use specific error types
- [ ] Implement proper error logging
- [ ] Add error recovery mechanisms
- [ ] Test error scenarios

---

## Phase 5: Documentation & Deployment

### Update Documentation

- [ ] Update README with new package names
- [ ] Update installation instructions
- [ ] Update code examples
- [ ] Document new features being used
- [ ] Update contributing guidelines (if applicable)

### Update CI/CD

- [ ] Update CI dependency installation
- [ ] Update test commands
- [ ] Update build commands
- [ ] Update deployment scripts
- [ ] Test CI/CD pipeline

### Environment Configuration

- [ ] Update `.env` files if needed
- [ ] Update environment variables in production
- [ ] Update Docker configurations (if applicable)
- [ ] Update Kubernetes configs (if applicable)

### Team Communication

- [ ] Document migration changes
- [ ] Share migration guide with team
- [ ] Schedule knowledge sharing session
- [ ] Update onboarding documentation

---

## Phase 6: Production Deployment

### Pre-Deployment

- [ ] Create deployment plan
- [ ] Schedule maintenance window
- [ ] Notify users of maintenance (if applicable)
- [ ] Create rollback plan
- [ ] Backup production database (if applicable)

### Deployment

- [ ] Deploy to staging environment first
- [ ] Run smoke tests in staging
- [ ] Monitor staging for issues
- [ ] Deploy to production
- [ ] Run production smoke tests

### Post-Deployment Monitoring

- [ ] Monitor error logs for 24 hours
- [ ] Monitor performance metrics
- [ ] Check security alerts
- [ ] Verify cost tracking
- [ ] Monitor user feedback

### Rollback (If Needed)

- [ ] Have rollback commands ready:
  ```bash
  npm install @ainative/ai-kit-react@^0.1.0-alpha.4 @ainative/ai-kit-core@^0.1.4
  ```

- [ ] Test rollback procedure in staging
- [ ] Document rollback steps

---

## Phase 7: Post-Migration (Within 1 Week)

### Review & Optimization

- [ ] Review application performance
- [ ] Analyze bundle size improvements
- [ ] Review error logs
- [ ] Collect team feedback
- [ ] Identify optimization opportunities

### Feature Exploration

- [ ] Explore new v1.0 features not yet adopted
- [ ] Plan adoption of additional features
- [ ] Experiment with performance optimizations
- [ ] Test new streaming transports

### Documentation Review

- [ ] Read security audit: `docs/security/security-audit-2026-02-07.md`
- [ ] Read performance audit: `docs/performance/performance-audit-report.md`
- [ ] Review production deployment guide
- [ ] Bookmark relevant documentation

### Planning

- [ ] Plan for v1.1 features (coming Q1 2026)
- [ ] Identify areas for improvement
- [ ] Schedule technical debt review
- [ ] Plan feature enhancements

---

## Verification Checklist

### Critical Checks

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] Application starts without errors
- [ ] Core functionality works as before
- [ ] No critical console errors
- [ ] Performance is same or better
- [ ] Security audit shows 0 high/critical issues

### Quality Checks

- [ ] Code follows project standards
- [ ] Documentation is up-to-date
- [ ] Team is trained on changes
- [ ] Monitoring is in place
- [ ] Rollback plan is tested
- [ ] User experience is maintained or improved

### Production Readiness

- [ ] Security features enabled (production)
- [ ] RLHF logging configured (recommended)
- [ ] Error handling updated
- [ ] Performance optimizations enabled
- [ ] Monitoring and alerts configured
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback plan ready

---

## Issue Tracker

**Issues encountered during migration:**

| Issue | Description | Resolution | Status |
|-------|-------------|------------|--------|
| 1. | | | [ ] |
| 2. | | | [ ] |
| 3. | | | [ ] |

---

## Migration Summary

### Completion Status

- **Phase 1 - Dependencies:** [ ] Complete
- **Phase 2 - Code Updates:** [ ] Complete
- **Phase 3 - Testing:** [ ] Complete
- **Phase 4 - Optional Features:** [ ] Complete
- **Phase 5 - Documentation:** [ ] Complete
- **Phase 6 - Deployment:** [ ] Complete
- **Phase 7 - Post-Migration:** [ ] Complete

### Metrics

- **Time Taken:** __________ hours
- **Issues Found:** __________
- **Issues Resolved:** __________
- **Performance Improvement:** __________%
- **Bundle Size Reduction:** __________%

### Sign-Off

- **Developer:** ________________________ Date: __________
- **Tech Lead:** ________________________ Date: __________
- **QA:** ________________________ Date: __________

---

## Resources

- **Full Migration Guide:** `docs/MIGRATION.md`
- **Quick Reference:** `docs/MIGRATION_QUICKREF.md`
- **API Documentation:** `docs/api/`
- **GitHub Issues:** https://github.com/AINative-Studio/ai-kit/issues
- **Support Email:** support@ainative.studio

---

**Checklist Version:** 1.0.0
**Last Updated:** February 8, 2026
**Compatible with:** AI Kit v1.0.0
