import type { Tool } from '@examples/shared';

export const statisticsTool: Tool = {
  name: 'calculate_statistics',
  description: 'Calculate statistical measures',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'array' },
      measures: { type: 'array', items: { type: 'string' } },
    },
    required: ['data'],
  },
  async execute(params) {
    return { mean: 50, median: 48, mode: 52, stddev: 12 };
  },
};
