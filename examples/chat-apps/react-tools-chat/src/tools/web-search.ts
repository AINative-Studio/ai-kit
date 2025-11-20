/**
 * Web search tool for searching the internet
 */

export interface WebSearchInput {
  query: string
  limit?: number
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchOutput {
  query: string
  results: SearchResult[]
  totalResults: number
}

export const webSearch = {
  name: 'web_search',
  description: 'Searches the web for information and returns relevant results',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5, max: 10)',
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['query'],
  },

  execute: async (input: WebSearchInput): Promise<WebSearchOutput> => {
    const limit = Math.min(input.limit || 5, 10)

    try {
      // In production, replace with actual search API
      // Examples: Google Custom Search, Bing Search API, SerpAPI
      const results = await performSearch(input.query, limit)

      return {
        query: input.query,
        results,
        totalResults: results.length,
      }
    } catch (error) {
      throw new Error(`Search API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}

async function performSearch(
  query: string,
  limit: number
): Promise<SearchResult[]> {
  // Mock implementation for demo
  // Replace with actual search API call

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const mockResults: SearchResult[] = [
    {
      title: `${query} - Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      snippet: `Wikipedia article about ${query}. This is a comprehensive encyclopedia entry covering various aspects...`,
    },
    {
      title: `Everything you need to know about ${query}`,
      url: `https://example.com/${encodeURIComponent(query.toLowerCase())}`,
      snippet: `A detailed guide to ${query}, including history, uses, and interesting facts. Learn more about this topic...`,
    },
    {
      title: `${query} - Official Website`,
      url: `https://${encodeURIComponent(query.toLowerCase().replace(/\s/g, ''))}.com`,
      snippet: `The official website for ${query}. Find the latest news, updates, and information here...`,
    },
    {
      title: `Top 10 Facts About ${query}`,
      url: `https://facts.com/${encodeURIComponent(query)}`,
      snippet: `Discover interesting facts and trivia about ${query}. Number 7 will surprise you...`,
    },
    {
      title: `${query} Tutorial and Guide`,
      url: `https://tutorials.com/${encodeURIComponent(query)}`,
      snippet: `Step-by-step tutorial for understanding ${query}. Perfect for beginners and experts alike...`,
    },
  ]

  return mockResults.slice(0, limit)
}
