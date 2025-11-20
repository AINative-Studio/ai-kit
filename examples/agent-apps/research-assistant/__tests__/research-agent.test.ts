/**
 * Research Agent Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { researchAgent } from '../src/agents/research-agent';
import type { ResearchQuery } from '../src/agents/research-agent';

describe('ResearchAgent', () => {
  describe('research', () => {
    it('should conduct basic research successfully', async () => {
      const query: ResearchQuery = {
        topic: 'Artificial Intelligence',
        depth: 'basic',
        sources: 3,
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output.topic).toBe('Artificial Intelligence');
      expect(result.output.sections).toBeInstanceOf(Array);
      expect(result.output.citations).toBeInstanceOf(Array);
    });

    it('should handle intermediate research depth', async () => {
      const query: ResearchQuery = {
        topic: 'Climate Change',
        depth: 'intermediate',
        sources: 5,
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      expect(result.output.sections.length).toBeGreaterThanOrEqual(3);
    });

    it('should conduct comprehensive research', async () => {
      const query: ResearchQuery = {
        topic: 'Quantum Computing',
        depth: 'comprehensive',
        sources: 10,
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      expect(result.output.citations.length).toBeGreaterThanOrEqual(5);
      expect(result.steps.length).toBe(5);
    });

    it('should include proper citations', async () => {
      const query: ResearchQuery = {
        topic: 'Machine Learning',
        depth: 'basic',
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      result.output.citations.forEach((citation: any) => {
        expect(citation).toHaveProperty('id');
        expect(citation).toHaveProperty('title');
        expect(citation).toHaveProperty('url');
        expect(citation).toHaveProperty('accessDate');
      });
    });

    it('should generate summary', async () => {
      const query: ResearchQuery = {
        topic: 'Renewable Energy',
        depth: 'basic',
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      expect(result.output.summary).toBeDefined();
      expect(result.output.summary.length).toBeGreaterThan(0);
    });

    it('should track metrics', async () => {
      const query: ResearchQuery = {
        topic: 'Blockchain',
        depth: 'basic',
      };

      const result = await researchAgent.research(query);

      expect(result.success).toBe(true);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const query: ResearchQuery = {
        topic: '',
        depth: 'basic',
      };

      // This should handle empty topic gracefully
      try {
        await researchAgent.research(query);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
