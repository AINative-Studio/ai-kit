import type { Tool } from '@examples/shared';

export const securityScanTool: Tool = {
  name: 'security_scan',
  description: 'Scan code for security vulnerabilities',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to scan' },
      language: { type: 'string', description: 'Programming language' },
    },
    required: ['code'],
  },
  async execute(params) {
    // Simulated security scan
    return { vulnerabilities: [], safe: true };
  },
};
