import type { Tool } from '@examples/shared';

export const testCoverageTool: Tool = {
  name: 'test_coverage',
  description: 'Analyze test coverage',
  parameters: {
    type: 'object',
    properties: {
      directory: { type: 'string' },
    },
    required: ['directory'],
  },
  async execute(params) {
    return { coverage: 82, uncovered: [] };
  },
};
