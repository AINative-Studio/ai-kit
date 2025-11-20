/**
 * Research Assistant Agent
 * Multi-step research workflow with web search and citation generation
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger, globalStateManager, globalMetricsCollector } from '@examples/shared';
import type { AgentResult, StepResult } from '@examples/shared';
import { webSearchTool } from '../tools/web-search';
import { citationTool } from '../tools/citation';
import { summaryTool } from '../tools/summary';

const logger = createLogger('ResearchAgent');

export interface ResearchQuery {
  topic: string;
  depth: 'basic' | 'intermediate' | 'comprehensive';
  sources?: number;
  includeImages?: boolean;
}

export interface ResearchResult {
  topic: string;
  summary: string;
  sections: ResearchSection[];
  citations: Citation[];
  generatedAt: Date;
  tokensUsed: number;
  costUsd: number;
}

export interface ResearchSection {
  title: string;
  content: string;
  sources: string[];
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  accessDate: Date;
  snippet?: string;
}

export class ResearchAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'ResearchAssistant',
      systemPrompt: `You are a professional research assistant. Your role is to:
1. Conduct thorough research on given topics
2. Find credible sources and information
3. Synthesize information from multiple sources
4. Generate well-structured research reports with proper citations
5. Provide accurate, unbiased information

Always cite your sources properly and indicate when information cannot be verified.`,
      model: 'claude-sonnet-4',
      tools: [webSearchTool, citationTool, summaryTool],
      maxIterations: 10,
      temperature: 0.7,
    });
  }

  async research(query: ResearchQuery): Promise<AgentResult> {
    const executionId = `research-${Date.now()}`;
    const state = globalStateManager.createState(executionId, { query });

    logger.info('Starting research', { topic: query.topic, depth: query.depth });
    globalMetricsCollector.startExecution(executionId);

    const steps: StepResult[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Initial web search
      globalStateManager.updateState(executionId, {
        status: 'running',
        currentStep: 1,
        totalSteps: 5,
        stepName: 'Web Search',
      });

      logger.info('Step 1: Performing web search');
      const searchStart = Date.now();
      const searchResults = await this.performWebSearch(query);
      const searchDuration = Date.now() - searchStart;

      steps.push({
        stepName: 'Web Search',
        success: true,
        output: searchResults,
        tokensUsed: 0,
        durationMs: searchDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordToolCall(executionId);

      // Step 2: Content extraction and analysis
      globalStateManager.updateState(executionId, {
        currentStep: 2,
        stepName: 'Content Analysis',
      });

      logger.info('Step 2: Analyzing content');
      const analysisStart = Date.now();
      const analyzedContent = await this.analyzeContent(searchResults, query);
      const analysisDuration = Date.now() - analysisStart;

      steps.push({
        stepName: 'Content Analysis',
        success: true,
        output: analyzedContent,
        tokensUsed: 1500,
        durationMs: analysisDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1500, 0.015);

      // Step 3: Generate structured sections
      globalStateManager.updateState(executionId, {
        currentStep: 3,
        stepName: 'Section Generation',
      });

      logger.info('Step 3: Generating sections');
      const sectionsStart = Date.now();
      const sections = await this.generateSections(analyzedContent, query);
      const sectionsDuration = Date.now() - sectionsStart;

      steps.push({
        stepName: 'Section Generation',
        success: true,
        output: sections,
        tokensUsed: 2000,
        durationMs: sectionsDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 2000, 0.02);

      // Step 4: Generate citations
      globalStateManager.updateState(executionId, {
        currentStep: 4,
        stepName: 'Citation Generation',
      });

      logger.info('Step 4: Generating citations');
      const citationsStart = Date.now();
      const citations = await this.generateCitations(searchResults);
      const citationsDuration = Date.now() - citationsStart;

      steps.push({
        stepName: 'Citation Generation',
        success: true,
        output: citations,
        tokensUsed: 500,
        durationMs: citationsDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 500, 0.005);

      // Step 5: Generate summary
      globalStateManager.updateState(executionId, {
        currentStep: 5,
        stepName: 'Summary Generation',
      });

      logger.info('Step 5: Generating summary');
      const summaryStart = Date.now();
      const summary = await this.generateSummary(sections);
      const summaryDuration = Date.now() - summaryStart;

      steps.push({
        stepName: 'Summary Generation',
        success: true,
        output: summary,
        tokensUsed: 1000,
        durationMs: summaryDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1000, 0.01);

      const totalDuration = Date.now() - startTime;
      const totalTokens = steps.reduce((sum, step) => sum + step.tokensUsed, 0);

      const result: ResearchResult = {
        topic: query.topic,
        summary,
        sections,
        citations,
        generatedAt: new Date(),
        tokensUsed: totalTokens,
        costUsd: totalTokens * 0.00001,
      };

      globalStateManager.updateState(executionId, {
        status: 'completed',
        result,
      });

      globalMetricsCollector.endExecution(executionId);

      logger.info('Research completed successfully', {
        tokensUsed: totalTokens,
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
      logger.error('Research failed', { error: err.message });

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

  private async performWebSearch(query: ResearchQuery): Promise<any[]> {
    // Simulate web search - in production, integrate with real search API
    const numSources = query.sources || (query.depth === 'comprehensive' ? 10 : query.depth === 'intermediate' ? 5 : 3);

    return Array.from({ length: numSources }, (_, i) => ({
      title: `Source ${i + 1} about ${query.topic}`,
      url: `https://example.com/source-${i + 1}`,
      snippet: `This is content related to ${query.topic}. It provides valuable information about the topic.`,
      relevanceScore: 0.9 - i * 0.05,
    }));
  }

  private async analyzeContent(searchResults: any[], query: ResearchQuery): Promise<any> {
    // Simulate content analysis
    return {
      mainTopics: ['Introduction', 'Key Concepts', 'Applications', 'Conclusion'],
      keyInsights: searchResults.map(r => r.snippet),
      relevantSources: searchResults.filter(r => r.relevanceScore > 0.7),
    };
  }

  private async generateSections(analyzedContent: any, query: ResearchQuery): Promise<ResearchSection[]> {
    return analyzedContent.mainTopics.map((topic: string, i: number) => ({
      title: topic,
      content: `This section covers ${topic} in the context of ${query.topic}. ${analyzedContent.keyInsights[i] || 'Detailed information about this aspect.'}`,
      sources: [`source-${i + 1}`],
    }));
  }

  private async generateCitations(searchResults: any[]): Promise<Citation[]> {
    return searchResults.map((result, i) => ({
      id: `cite-${i + 1}`,
      title: result.title,
      url: result.url,
      accessDate: new Date(),
      snippet: result.snippet,
    }));
  }

  private async generateSummary(sections: ResearchSection[]): Promise<string> {
    return `This research report covers ${sections.length} main topics. ${sections.map(s => s.title).join(', ')} are explored in detail with supporting evidence from credible sources.`;
  }
}

export const researchAgent = new ResearchAgent();
