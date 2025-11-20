/**
 * Router Agent Tests
 */

import { describe, it, expect } from 'vitest';
import { routerAgent } from '../src/agents/router-agent';
import type { SupportTicket } from '../src/agents/router-agent';

describe('RouterAgent', () => {
  describe('route', () => {
    it('should route technical tickets', async () => {
      const ticket: SupportTicket = {
        id: '123',
        subject: 'Application crashes on startup',
        description: 'The app crashes when I try to open it',
        userId: 'user123',
      };

      const result = await routerAgent.route(ticket);

      expect(result).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.agentType).toBeDefined();
    });

    it('should classify billing tickets', async () => {
      const ticket: SupportTicket = {
        id: '124',
        subject: 'Subscription payment failed',
        description: 'My payment did not go through',
        userId: 'user124',
      };

      const result = await routerAgent.route(ticket);

      expect(result.category).toBeDefined();
    });

    it('should handle account tickets', async () => {
      const ticket: SupportTicket = {
        id: '125',
        subject: 'Cannot login to account',
        description: 'I forgot my password',
        userId: 'user125',
      };

      const result = await routerAgent.route(ticket);

      expect(result).toBeDefined();
    });

    it('should assign priority levels', async () => {
      const ticket: SupportTicket = {
        id: '126',
        subject: 'General inquiry',
        description: 'How do I use feature X?',
        userId: 'user126',
      };

      const result = await routerAgent.route(ticket);

      expect(['low', 'medium', 'high', 'urgent']).toContain(result.priority);
    });

    it('should detect sentiment', async () => {
      const ticket: SupportTicket = {
        id: '127',
        subject: 'Great product!',
        description: 'Love the new features',
        userId: 'user127',
      };

      const result = await routerAgent.route(ticket);

      expect(['positive', 'neutral', 'negative']).toContain(result.sentiment);
    });
  });
});
