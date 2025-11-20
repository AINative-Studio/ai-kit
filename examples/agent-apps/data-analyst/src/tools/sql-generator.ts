import type { Tool } from '@examples/shared';

export const sqlGeneratorTool: Tool = {
  name: 'generate_sql',
  description: 'Generate SQL queries for data analysis',
  parameters: {
    type: 'object',
    properties: {
      intent: { type: 'string', description: 'What to query' },
      table: { type: 'string', description: 'Table name' },
    },
    required: ['intent'],
  },
  async execute(params) {
    return { query: 'SELECT * FROM data LIMIT 10;' };
  },
};
