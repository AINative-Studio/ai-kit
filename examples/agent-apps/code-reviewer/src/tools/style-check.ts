import type { Tool } from '@examples/shared';

export const styleCheckTool: Tool = {
  name: 'style_check',
  description: 'Check code style and best practices',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      rules: { type: 'array', items: { type: 'string' } },
    },
    required: ['code'],
  },
  async execute(params) {
    return { issues: [], score: 95 };
  },
};
