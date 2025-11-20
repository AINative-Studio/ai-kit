/**
 * Specialist Support Agents
 */

import { AgentExecutor } from '@ainative/ai-kit/core';
import { createLogger } from '@examples/shared';
import type { SupportTicket } from './router-agent';

const logger = createLogger('SpecialistAgents');

export interface SupportResponse {
  ticketId: string;
  response: string;
  resolved: boolean;
  escalate: boolean;
  followUpNeeded: boolean;
  knowledgeBaseArticles: string[];
}

class TechnicalSupportAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'TechnicalSupport',
      systemPrompt: `You are a technical support specialist. Help users with:
- Software bugs and errors
- Installation issues
- Configuration problems
- Performance issues
Provide clear, step-by-step solutions.`,
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.3,
    });
  }

  async handle(ticket: SupportTicket): Promise<SupportResponse> {
    logger.info('Handling technical ticket', { ticketId: ticket.id });

    return {
      ticketId: ticket.id,
      response: `Thank you for contacting technical support. I've analyzed your issue regarding "${ticket.subject}". Here are the steps to resolve it:\n\n1. Check your system configuration\n2. Update to the latest version\n3. Clear cache and restart\n\nIf the issue persists, please let me know.`,
      resolved: true,
      escalate: false,
      followUpNeeded: true,
      knowledgeBaseArticles: ['troubleshooting-guide', 'common-errors'],
    };
  }
}

class BillingSupportAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'BillingSupport',
      systemPrompt: `You are a billing support specialist. Help users with:
- Payment issues
- Subscription management
- Refund requests
- Invoice questions
Be empathetic and clear about billing policies.`,
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.3,
    });
  }

  async handle(ticket: SupportTicket): Promise<SupportResponse> {
    logger.info('Handling billing ticket', { ticketId: ticket.id });

    return {
      ticketId: ticket.id,
      response: `Thank you for reaching out about "${ticket.subject}". I've reviewed your account and can help you with this billing matter. Our billing team will process your request within 24 hours.`,
      resolved: false,
      escalate: true,
      followUpNeeded: true,
      knowledgeBaseArticles: ['billing-faq', 'payment-methods'],
    };
  }
}

class AccountSupportAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'AccountSupport',
      systemPrompt: `You are an account support specialist. Help users with:
- Account access issues
- Profile updates
- Security concerns
- Account closure
Prioritize account security.`,
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.3,
    });
  }

  async handle(ticket: SupportTicket): Promise<SupportResponse> {
    logger.info('Handling account ticket', { ticketId: ticket.id });

    return {
      ticketId: ticket.id,
      response: `Thank you for contacting us about "${ticket.subject}". For security reasons, I've sent a verification email to your registered address. Please verify your identity to proceed.`,
      resolved: false,
      escalate: false,
      followUpNeeded: true,
      knowledgeBaseArticles: ['account-security', 'password-reset'],
    };
  }
}

class GeneralSupportAgent {
  private agent: AgentExecutor;

  constructor() {
    this.agent = new AgentExecutor({
      name: 'GeneralSupport',
      systemPrompt: `You are a general support agent. Handle:
- General inquiries
- Product information
- Feature requests
- Feedback
Be friendly and helpful.`,
      model: 'claude-sonnet-4',
      tools: [],
      temperature: 0.5,
    });
  }

  async handle(ticket: SupportTicket): Promise<SupportResponse> {
    logger.info('Handling general ticket', { ticketId: ticket.id });

    return {
      ticketId: ticket.id,
      response: `Thank you for your message about "${ticket.subject}". I'm happy to help! Based on your inquiry, I recommend checking our knowledge base for detailed information. Is there anything specific I can assist you with?`,
      resolved: true,
      escalate: false,
      followUpNeeded: false,
      knowledgeBaseArticles: ['getting-started', 'faq'],
    };
  }
}

export const specialistAgents = {
  technical: new TechnicalSupportAgent(),
  billing: new BillingSupportAgent(),
  account: new AccountSupportAgent(),
  general: new GeneralSupportAgent(),
};
