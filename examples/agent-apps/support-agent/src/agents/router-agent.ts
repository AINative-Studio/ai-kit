/**
 * Router Agent - Routes support tickets to specialist agents
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger } from '@examples/shared';

const logger = createLogger('RouterAgent');

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
}

export class RouterAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'SupportRouter',
      systemPrompt: `You are a support ticket router. Classify tickets by:
- Category: technical, billing, account, general
- Priority: low, medium, high, urgent
- Sentiment: positive, neutral, negative
Route to appropriate specialist agent.`,
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.2,
    });
  }

  async route(ticket: SupportTicket): Promise<{
    category: string;
    priority: string;
    sentiment: string;
    agentType: string;
  }> {
    logger.info('Routing ticket', { ticketId: ticket.id });

    // Simulated classification
    const categories = ['technical', 'billing', 'account', 'general'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const sentiments = ['positive', 'neutral', 'negative'];

    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    let agentType = 'general';
    if (category === 'technical') agentType = 'technical';
    else if (category === 'billing') agentType = 'billing';
    else if (category === 'account') agentType = 'account';

    return { category, priority, sentiment, agentType };
  }
}

export const routerAgent = new RouterAgent();
