/**
 * Summary generation tool
 */

import type { Tool } from '@examples/shared';

export const summaryTool: Tool = {
  name: 'generate_summary',
  description: 'Generate a concise summary of given content',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content to summarize',
      },
      maxLength: {
        type: 'number',
        description: 'Maximum length of summary in words',
        default: 200,
      },
      style: {
        type: 'string',
        enum: ['academic', 'casual', 'technical'],
        description: 'Writing style for the summary',
        default: 'academic',
      },
    },
    required: ['content'],
  },
  async execute(params: Record<string, unknown>) {
    const { content, maxLength = 200, style = 'academic' } = params;

    // In production, use LLM to generate actual summary
    // For now, create a simple mock summary
    const words = (content as string).split(' ').slice(0, maxLength as number);
    const summary = words.join(' ') + (words.length === maxLength ? '...' : '');

    return {
      summary,
      originalLength: (content as string).split(' ').length,
      summaryLength: words.length,
      style,
    };
  },
};
