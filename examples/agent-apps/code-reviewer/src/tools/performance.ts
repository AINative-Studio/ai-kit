import type { Tool } from '@examples/shared';

export const performanceTool: Tool = {
  name: 'performance_analysis',
  description: 'Analyze code for performance issues',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
    },
    required: ['code'],
  },
  async execute(params) {
    return { suggestions: [], score: 88 };
  },
};
