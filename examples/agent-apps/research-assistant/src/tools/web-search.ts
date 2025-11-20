/**
 * Web search tool for research agent
 */

import type { Tool } from '@examples/shared';

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information on a given topic',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
        default: 10,
      },
    },
    required: ['query'],
  },
  async execute(params: Record<string, unknown>) {
    const { query, maxResults = 10 } = params;

    // In production, integrate with real search API (Google, Bing, etc.)
    // For now, return mock data
    return {
      results: Array.from({ length: maxResults as number }, (_, i) => ({
        title: `Search result ${i + 1} for: ${query}`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `This is a relevant result about ${query}`,
        rank: i + 1,
      })),
      query,
      totalResults: maxResults,
    };
  },
};
