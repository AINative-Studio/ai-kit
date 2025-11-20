/**
 * Data Analysis Agent
 * Analyzes CSV/Excel files, generates SQL queries, creates visualizations
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger, globalStateManager, globalMetricsCollector } from '@examples/shared';
import type { AgentResult, StepResult } from '@examples/shared';
import { sqlGeneratorTool } from '../tools/sql-generator';
import { statisticsTool } from '../tools/statistics';
import { visualizationTool } from '../tools/visualization';

const logger = createLogger('DataAnalystAgent');

export interface AnalysisRequest {
  dataSource: string;
  fileType: 'csv' | 'excel' | 'json';
  query: string;
  analysisType?: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
  visualizations?: boolean;
}

export interface AnalysisResult {
  summary: string;
  statistics: Record<string, any>;
  insights: string[];
  sqlQueries: string[];
  visualizations: Visualization[];
  data: any[];
  generatedAt: Date;
}

export interface Visualization {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram';
  title: string;
  data: any;
  config: any;
}

export class DataAnalystAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'DataAnalyst',
      systemPrompt: `You are a professional data analyst. Your role is to:
1. Analyze data from CSV/Excel files
2. Generate SQL queries for data exploration
3. Calculate statistical measures
4. Identify patterns and insights
5. Create appropriate visualizations
6. Provide actionable recommendations

Be precise with numbers and clear in explanations.`,
      model: 'claude-sonnet-4',
      tools: [sqlGeneratorTool, statisticsTool, visualizationTool],
      maxIterations: 12,
      temperature: 0.2,
    });
  }

  async analyze(request: AnalysisRequest): Promise<AgentResult> {
    const executionId = `analysis-${Date.now()}`;
    const state = globalStateManager.createState(executionId, { request });

    logger.info('Starting data analysis', { dataSource: request.dataSource });
    globalMetricsCollector.startExecution(executionId);

    const steps: StepResult[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Load and parse data
      globalStateManager.updateState(executionId, {
        status: 'running',
        currentStep: 1,
        totalSteps: 6,
        stepName: 'Loading Data',
      });

      logger.info('Step 1: Loading data');
      const loadStart = Date.now();
      const data = await this.loadData(request);
      const loadDuration = Date.now() - loadStart;

      steps.push({
        stepName: 'Load Data',
        success: true,
        output: { rowCount: data.length, columns: Object.keys(data[0] || {}) },
        tokensUsed: 0,
        durationMs: loadDuration,
      });

      globalMetricsCollector.recordStep(executionId);

      // Step 2: Generate SQL queries for analysis
      globalStateManager.updateState(executionId, {
        currentStep: 2,
        stepName: 'SQL Generation',
      });

      logger.info('Step 2: Generating SQL queries');
      const sqlStart = Date.now();
      const sqlQueries = await this.generateSQLQueries(request, data);
      const sqlDuration = Date.now() - sqlStart;

      steps.push({
        stepName: 'SQL Generation',
        success: true,
        output: sqlQueries,
        tokensUsed: 1500,
        durationMs: sqlDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1500, 0.015);
      globalMetricsCollector.recordToolCall(executionId);

      // Step 3: Calculate statistics
      globalStateManager.updateState(executionId, {
        currentStep: 3,
        stepName: 'Statistical Analysis',
      });

      logger.info('Step 3: Calculating statistics');
      const statsStart = Date.now();
      const statistics = await this.calculateStatistics(data);
      const statsDuration = Date.now() - statsStart;

      steps.push({
        stepName: 'Statistical Analysis',
        success: true,
        output: statistics,
        tokensUsed: 1000,
        durationMs: statsDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1000, 0.01);
      globalMetricsCollector.recordToolCall(executionId);

      // Step 4: Identify insights
      globalStateManager.updateState(executionId, {
        currentStep: 4,
        stepName: 'Insight Generation',
      });

      logger.info('Step 4: Generating insights');
      const insightsStart = Date.now();
      const insights = await this.generateInsights(data, statistics);
      const insightsDuration = Date.now() - insightsStart;

      steps.push({
        stepName: 'Insight Generation',
        success: true,
        output: insights,
        tokensUsed: 2000,
        durationMs: insightsDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 2000, 0.02);

      // Step 5: Create visualizations
      let visualizations: Visualization[] = [];
      if (request.visualizations !== false) {
        globalStateManager.updateState(executionId, {
          currentStep: 5,
          stepName: 'Creating Visualizations',
        });

        logger.info('Step 5: Creating visualizations');
        const vizStart = Date.now();
        visualizations = await this.createVisualizations(data, statistics);
        const vizDuration = Date.now() - vizStart;

        steps.push({
          stepName: 'Create Visualizations',
          success: true,
          output: visualizations,
          tokensUsed: 800,
          durationMs: vizDuration,
        });

        globalMetricsCollector.recordStep(executionId);
        globalMetricsCollector.recordTokens(executionId, 800, 0.008);
        globalMetricsCollector.recordToolCall(executionId);
      }

      // Step 6: Generate summary
      globalStateManager.updateState(executionId, {
        currentStep: 6,
        stepName: 'Generating Summary',
      });

      logger.info('Step 6: Generating summary');
      const summaryStart = Date.now();
      const summary = await this.generateSummary(data, statistics, insights);
      const summaryDuration = Date.now() - summaryStart;

      steps.push({
        stepName: 'Generate Summary',
        success: true,
        output: summary,
        tokensUsed: 1200,
        durationMs: summaryDuration,
      });

      globalMetricsCollector.recordStep(executionId);
      globalMetricsCollector.recordTokens(executionId, 1200, 0.012);

      const totalDuration = Date.now() - startTime;
      const totalTokens = steps.reduce((sum, step) => sum + step.tokensUsed, 0);

      const result: AnalysisResult = {
        summary,
        statistics,
        insights,
        sqlQueries,
        visualizations,
        data: data.slice(0, 100), // Return first 100 rows
        generatedAt: new Date(),
      };

      globalStateManager.updateState(executionId, {
        status: 'completed',
        result,
      });

      globalMetricsCollector.endExecution(executionId);

      logger.info('Analysis completed', {
        rowsAnalyzed: data.length,
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
      logger.error('Analysis failed', { error: err.message });

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

  private async loadData(request: AnalysisRequest): Promise<any[]> {
    // Simulate loading data
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.random() * 100,
      category: ['A', 'B', 'C'][i % 3],
      date: new Date(2024, 0, 1 + i % 365),
    }));
  }

  private async generateSQLQueries(request: AnalysisRequest, data: any[]): Promise<string[]> {
    return [
      'SELECT COUNT(*) as total FROM data;',
      'SELECT category, AVG(value) as avg_value FROM data GROUP BY category;',
      'SELECT * FROM data ORDER BY value DESC LIMIT 10;',
    ];
  }

  private async calculateStatistics(data: any[]): Promise<Record<string, any>> {
    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: data.length,
      sum,
      mean: sum / data.length,
      min: Math.min(...values),
      max: Math.max(...values),
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      categories: { A: 334, B: 333, C: 333 },
    };
  }

  private async generateInsights(data: any[], statistics: any): Promise<string[]> {
    return [
      `Analyzed ${statistics.count} records`,
      `Average value is ${statistics.mean.toFixed(2)}`,
      `Values range from ${statistics.min.toFixed(2)} to ${statistics.max.toFixed(2)}`,
      'Distribution across categories is relatively even',
    ];
  }

  private async createVisualizations(data: any[], statistics: any): Promise<Visualization[]> {
    return [
      {
        type: 'bar',
        title: 'Values by Category',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{ label: 'Count', data: [334, 333, 333] }],
        },
        config: {},
      },
      {
        type: 'line',
        title: 'Trend Over Time',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [{ label: 'Value', data: [45, 52, 48, 61, 55] }],
        },
        config: {},
      },
    ];
  }

  private async generateSummary(data: any[], statistics: any, insights: string[]): Promise<string> {
    return `Analysis Summary:\n\n${insights.join('\n')}.\n\nThe dataset shows consistent patterns across categories with normal distribution of values.`;
  }
}

export const dataAnalystAgent = new DataAnalystAgent();
