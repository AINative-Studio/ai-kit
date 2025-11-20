/**
 * Citation generation tool
 */

import type { Tool } from '@examples/shared';

export const citationTool: Tool = {
  name: 'generate_citation',
  description: 'Generate properly formatted citations for sources',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the source',
      },
      url: {
        type: 'string',
        description: 'URL of the source',
      },
      format: {
        type: 'string',
        enum: ['APA', 'MLA', 'Chicago'],
        description: 'Citation format',
        default: 'APA',
      },
    },
    required: ['title', 'url'],
  },
  async execute(params: Record<string, unknown>) {
    const { title, url, format = 'APA' } = params;
    const accessDate = new Date().toISOString().split('T')[0];

    let citation = '';

    switch (format) {
      case 'APA':
        citation = `${title}. Retrieved ${accessDate}, from ${url}`;
        break;
      case 'MLA':
        citation = `"${title}." Web. ${accessDate}. <${url}>.`;
        break;
      case 'Chicago':
        citation = `${title}. Accessed ${accessDate}. ${url}.`;
        break;
      default:
        citation = `${title} - ${url} (Accessed: ${accessDate})`;
    }

    return {
      citation,
      format,
      generatedAt: new Date(),
    };
  },
};
