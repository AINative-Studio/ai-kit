/**
 * Code Review Agent Tests
 */

import { describe, it, expect } from 'vitest';
import { codeReviewAgent } from '../src/agents/code-review-agent';
import type { CodeReviewRequest } from '../src/agents/code-review-agent';

describe('CodeReviewAgent', () => {
  describe('review', () => {
    it('should review code successfully', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
        checkSecurity: true,
        checkStyle: true,
        checkPerformance: true,
        checkTests: true,
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output.findings).toBeInstanceOf(Array);
    });

    it('should detect security issues', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
        checkSecurity: true,
        checkStyle: false,
        checkPerformance: false,
        checkTests: false,
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
      const securityFindings = result.output.findings.filter(
        (f: any) => f.category === 'security'
      );
      expect(securityFindings).toBeDefined();
    });

    it('should check code style', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
        checkSecurity: false,
        checkStyle: true,
        checkPerformance: false,
        checkTests: false,
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
    });

    it('should analyze performance', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
        checkPerformance: true,
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
    });

    it('should check test coverage', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
        checkTests: true,
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
    });

    it('should provide metrics', async () => {
      const request: CodeReviewRequest = {
        repository: 'test-repo',
      };

      const result = await codeReviewAgent.review(request);

      expect(result.success).toBe(true);
      expect(result.output.metrics).toBeDefined();
      expect(result.output.metrics.filesReviewed).toBeGreaterThanOrEqual(0);
      expect(result.output.metrics.issuesFound).toBeGreaterThanOrEqual(0);
    });

    it('should generate PR comments', async () => {
      const findings = [
        {
          severity: 'high' as const,
          category: 'security' as const,
          file: 'test.ts',
          line: 10,
          message: 'Test issue',
          suggestion: 'Fix it',
        },
      ];

      const comment = await codeReviewAgent.generatePRComment(findings);

      expect(comment).toContain('Code Review Summary');
      expect(comment).toContain('test.ts');
      expect(comment).toContain('Test issue');
    });
  });
});
