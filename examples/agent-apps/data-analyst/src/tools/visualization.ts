import type { Tool } from '@examples/shared';

export const visualizationTool: Tool = {
  name: 'create_visualization',
  description: 'Create data visualizations',
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['bar', 'line', 'pie', 'scatter'] },
      data: { type: 'object' },
    },
    required: ['type', 'data'],
  },
  async execute(params) {
    return { chartConfig: {}, success: true };
  },
};
