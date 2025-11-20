/**
 * Data Analyst Agent Tests
 */

import { describe, it, expect } from 'vitest';
import { dataAnalystAgent } from '../src/agents/data-analyst-agent';
import type { AnalysisRequest } from '../src/agents/data-analyst-agent';

describe('DataAnalystAgent', () => {
  describe('analyze', () => {
    it('should analyze CSV data', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.csv',
        fileType: 'csv',
        query: 'What is the average value?',
        analysisType: 'descriptive',
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output.statistics).toBeDefined();
    });

    it('should generate SQL queries', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.csv',
        fileType: 'csv',
        query: 'Show top 10 by value',
        analysisType: 'descriptive',
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
      expect(result.output.sqlQueries).toBeInstanceOf(Array);
      expect(result.output.sqlQueries.length).toBeGreaterThan(0);
    });

    it('should calculate statistics', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.csv',
        fileType: 'csv',
        query: 'Calculate statistics',
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
      expect(result.output.statistics).toBeDefined();
      expect(result.output.statistics.count).toBeGreaterThan(0);
    });

    it('should generate insights', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.csv',
        fileType: 'csv',
        query: 'Analyze trends',
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
      expect(result.output.insights).toBeInstanceOf(Array);
      expect(result.output.insights.length).toBeGreaterThan(0);
    });

    it('should create visualizations', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.csv',
        fileType: 'csv',
        query: 'Show me a chart',
        visualizations: true,
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
      expect(result.output.visualizations).toBeInstanceOf(Array);
    });

    it('should handle different file types', async () => {
      const request: AnalysisRequest = {
        dataSource: 'test.xlsx',
        fileType: 'excel',
        query: 'Analyze data',
      };

      const result = await dataAnalystAgent.analyze(request);

      expect(result.success).toBe(true);
    });
  });
});
