/**
 * Code Review Agent
 * Automated code review with security scanning and best practices
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger, globalStateManager, globalMetricsCollector } from '@examples/shared';
import type { AgentResult, StepResult } from '@examples/shared';
import { securityScanTool } from '../tools/security-scan';
import { styleCheckTool } from '../tools/style-check';
import { performanceTool } from '../tools/performance';
import { testCoverageTool } from '../tools/test-coverage';

const logger = createLogger('CodeReviewAgent');

export interface CodeReviewRequest {
  repository: string;
  pullRequestNumber?: number;
  branch?: string;
  files?: string[];
  checkSecurity?: boolean;
  checkStyle?: boolean;
  checkPerformance?: boolean;
  checkTests?: boolean;
}

export interface CodeReviewResult {
  repository: string;
  summary: string;
  findings: ReviewFinding[];
  metrics: ReviewMetrics;
  recommendations: string[];
  generatedAt: Date;
}

export interface ReviewFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'style' | 'performance' | 'tests' | 'best-practice';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  code?: string;
}

export interface ReviewMetrics {
  filesReviewed: number;
  issuesFound: number;
  criticalIssues: number;
  securityVulnerabilities: number;
  codeQualityScore: number;
  testCoverage: number;
}

export class CodeReviewAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'CodeReviewer',
      systemPrompt: `You are an expert code reviewer. Your role is to:
1. Analyze code for security vulnerabilities
2. Check code style and best practices
3. Identify performance issues
4. Assess test coverage
5. Provide actionable recommendations
6. Generate PR comments with specific suggestions

Be thorough but constructive. Focus on issues that matter.`,
      model: 'claude-sonnet-4',
      tools: [securityScanTool, styleCheckTool, performanceTool, testCoverageTool],
      maxIterations: 15,
      temperature: 0.3,
    });
  }

  async review(request: CodeReviewRequest): Promise<AgentResult> {
    const executionId = `review-${Date.now()}`;
    const state = globalStateManager.createState(executionId, { request });

    logger.info('Starting code review', { repository: request.repository });
    globalMetricsCollector.startExecution(executionId);

    const steps: StepResult[] = [];
    const findings: ReviewFinding[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Fetch code from repository
      globalStateManager.updateState(executionId, {
        status: 'running',
        currentStep: 1,
        totalSteps: 6,
        stepName: 'Fetching Code',
      });

      logger.info('Step 1: Fetching code');
      const fetchStart = Date.now();
      const codeFiles = await this.fetchCode(request);
      const fetchDuration = Date.now() - fetchStart;

      steps.push({
        stepName: 'Fetch Code',
        success: true,
        output: codeFiles,
        tokensUsed: 0,
        durationMs: fetchDuration,
      });

      globalMetricsCollector.recordStep(executionId);

      // Step 2: Security scan
      if (request.checkSecurity !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 2,
          stepName: 'Security Scan',
        });

        logger.info('Step 2: Running security scan');
        const securityStart = Date.now();
        const securityFindings = await this.runSecurityScan(codeFiles);
        const securityDuration = Date.now() - securityStart;

        findings.push(...securityFindings);

        steps.push({
          stepName: 'Security Scan',
          success: true,
          output: securityFindings,
          tokensUsed: 2000,
          durationMs: securityDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 2000, 0.02);
        globalMetricsCollector.recordToolCall(executionId);
      }

      // Step 3: Style check
      if (request.checkStyle !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 3,
          stepName: 'Style Check',
        });

        logger.info('Step 3: Checking code style');
        const styleStart = Date.now();
        const styleFindings = await this.runStyleCheck(codeFiles);
        const styleDuration = Date.now() - styleStart;

        findings.push(...styleFindings);

        steps.push({
          stepName: 'Style Check',
          success: true,
          output: styleFindings,
          tokensUsed: 1500,
          durationMs: styleDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 1500, 0.015);
        globalMetricsCollector.recordToolCall(executionId);
      }

      // Step 4: Performance analysis
      if (request.checkPerformance !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 4,
          stepName: 'Performance Analysis',
        });

        logger.info('Step 4: Analyzing performance');
        const perfStart = Date.now();
        const perfFindings = await this.runPerformanceAnalysis(codeFiles);
        const perfDuration = Date.now() - perfStart;

        findings.push(...perfFindings);

        steps.push({
          stepName: 'Performance Analysis',
          success: true,
          output: perfFindings,
          tokensUsed: 1800,
          durationMs: perfDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 1800, 0.018);
        globalMetricsCollector.recordToolCall(executionId);
      }

      // Step 5: Test coverage check
      if (request.checkTests !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 5,
          stepName: 'Test Coverage',
        });

        logger.info('Step 5: Checking test coverage');
        const testStart = Date.now();
        const testFindings = await this.runTestCoverageCheck(codeFiles);
        const testDuration = Date.now() - testStart;

        findings.push(...testFindings);

        steps.push({
          stepName: 'Test Coverage',
          success: true,
          output: testFindings,
          tokensUsed: 1000,
          durationMs: testDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 1000, 0.01);
        globalMetricsCollector.recordToolCall(executionId);
      }

      // Step 6: Generate summary and recommendations
      globalStateManager.updateState(executionId, {
        currentStep: 6,
        stepName: 'Generating Report',
      });

      logger.info('Step 6: Generating report');
      const reportStart = Date.now();
      const { summary, recommendations, metrics } = await this.generateReport(findings, codeFiles.length);
      const reportDuration = Date.now() - reportStart;

      steps.push({
        stepName: 'Generate Report',
        success: true,
        output: { summary, recommendations, metrics },
        tokensUsed: 1200,
        durationMs: reportDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1200, 0.012);

      const totalDuration = Date.now() - startTime;
      const totalTokens = steps.reduce((sum, step) => sum + step.tokensUsed, 0);

      const result: CodeReviewResult = {
        repository: request.repository,
        summary,
        findings,
        metrics,
        recommendations,
        generatedAt: new Date(),
      };

      globalStateManager.updateState(executionId, {
        status: 'completed',
        result,
      });

      globalMetricsCollector.endExecution(executionId);

      logger.info('Code review completed', {
        filesReviewed: codeFiles.length,
        issuesFound: findings.length,
        durationMs: totalDuration,
      });

      return {
        success: true,
        output: result,
        steps,
        totalTokens,
        totalCost: totalTokens * 0.00001,
        durationMs: totalDuration,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Code review failed', { error: err.message });

      globalStateManager.updateState(executionId, {
        status: 'failed',
        error: err,
      });

      globalMetricsCollector.recordError(executionId);
      globalMetricsCollector.endExecution(executionId);

      return {
        success: false,
        output: null,
        steps,
        totalTokens: steps.reduce((sum, step) => sum + step.tokensUsed, 0),
        totalCost: 0,
        durationMs: Date.now() - startTime,
        error: err,
      };
    }
  }

  private async fetchCode(request: CodeReviewRequest): Promise<any[]> {
    // Simulate fetching code files
    return [
      { path: 'src/index.ts', content: 'const x = 1;' },
      { path: 'src/api/users.ts', content: 'export function getUsers() {}' },
    ];
  }

  private async runSecurityScan(files: any[]): Promise<ReviewFinding[]> {
    return [
      {
        severity: 'high',
        category: 'security',
        file: 'src/api/users.ts',
        line: 42,
        message: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries instead of string concatenation',
        code: 'const query = "SELECT * FROM users WHERE id = " + userId;',
      },
    ];
  }

  private async runStyleCheck(files: any[]): Promise<ReviewFinding[]> {
    return [
      {
        severity: 'low',
        category: 'style',
        file: 'src/index.ts',
        line: 10,
        message: 'Unused variable detected',
        suggestion: 'Remove unused variable or prefix with underscore',
      },
    ];
  }

  private async runPerformanceAnalysis(files: any[]): Promise<ReviewFinding[]> {
    return [
      {
        severity: 'medium',
        category: 'performance',
        file: 'src/api/users.ts',
        line: 25,
        message: 'Inefficient loop detected',
        suggestion: 'Consider using map() instead of forEach() for better performance',
      },
    ];
  }

  private async runTestCoverageCheck(files: any[]): Promise<ReviewFinding[]> {
    return [
      {
        severity: 'medium',
        category: 'tests',
        file: 'src/api/users.ts',
        message: 'Test coverage below 80%',
        suggestion: 'Add unit tests for uncovered functions',
      },
    ];
  }

  private async generateReport(
    findings: ReviewFinding[],
    filesCount: number
  ): Promise<{ summary: string; recommendations: string[]; metrics: ReviewMetrics }> {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const securityCount = findings.filter(f => f.category === 'security').length;

    return {
      summary: `Reviewed ${filesCount} files and found ${findings.length} issues. ${criticalCount} critical issues require immediate attention.`,
      recommendations: [
        'Address all critical and high severity issues before merging',
        'Improve test coverage to at least 80%',
        'Run security scan regularly',
      ],
      metrics: {
        filesReviewed: filesCount,
        issuesFound: findings.length,
        criticalIssues: criticalCount,
        securityVulnerabilities: securityCount,
        codeQualityScore: 85,
        testCoverage: 72,
      },
    };
  }

  async generatePRComment(findings: ReviewFinding[]): Promise<string> {
    let comment = '## Code Review Summary\n\n';

    const critical = findings.filter(f => f.severity === 'critical');
    const high = findings.filter(f => f.severity === 'high');
    const medium = findings.filter(f => f.severity === 'medium');

    if (critical.length > 0) {
      comment += `### 🚨 Critical Issues (${critical.length})\n\n`;
      critical.forEach(f => {
        comment += `- **${f.file}${f.line ? `:${f.line}` : ''}**: ${f.message}\n`;
        if (f.suggestion) comment += `  - 💡 ${f.suggestion}\n`;
      });
      comment += '\n';
    }

    if (high.length > 0) {
      comment += `### ⚠️ High Priority (${high.length})\n\n`;
      high.forEach(f => {
        comment += `- **${f.file}${f.line ? `:${f.line}` : ''}**: ${f.message}\n`;
      });
      comment += '\n';
    }

    if (medium.length > 0) {
      comment += `### ℹ️ Medium Priority (${medium.length})\n\n`;
      medium.forEach(f => {
        comment += `- **${f.file}**: ${f.message}\n`;
      });
    }

    comment += '\n---\n\n';
    comment += '✨ Generated by AI Code Reviewer';

    return comment;
  }
}

export const codeReviewAgent = new CodeReviewAgent();
