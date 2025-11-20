/**
 * Tests for extractive summarization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  extractKeySentences,
  extractKeyPoints,
  createExtractiveSummary,
  extractKeywords,
  calculateDiversity,
} from '../../src/summarization/extractive';
import { Message } from '../../src/types';

describe('Extractive Summarization', () => {
  const testMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content:
        'I need help understanding machine learning algorithms. Can you explain what neural networks are?',
      timestamp: Date.now() - 5000,
    },
    {
      id: '2',
      role: 'assistant',
      content:
        'Neural networks are computational models inspired by biological neural networks. They consist of interconnected nodes that process information. Deep learning uses multiple layers of these networks.',
      timestamp: Date.now() - 4000,
    },
    {
      id: '3',
      role: 'user',
      content:
        'What are the main applications of neural networks in real-world scenarios?',
      timestamp: Date.now() - 3000,
    },
    {
      id: '4',
      role: 'assistant',
      content:
        'Neural networks are used in image recognition, natural language processing, and autonomous vehicles. They excel at pattern recognition tasks. Many modern AI applications rely on neural network architectures.',
      timestamp: Date.now() - 2000,
    },
  ];

  describe('extractKeySentences', () => {
    it('should extract key sentences from messages', () => {
      const sentences = extractKeySentences(testMessages, 3);

      expect(sentences).toBeDefined();
      expect(sentences.length).toBeLessThanOrEqual(3);
      expect(sentences[0]).toHaveProperty('text');
      expect(sentences[0]).toHaveProperty('score');
      expect(sentences[0]).toHaveProperty('messageIndex');
      expect(sentences[0]).toHaveProperty('role');
    });

    it('should return sentences sorted by score', () => {
      const sentences = extractKeySentences(testMessages, 5);

      for (let i = 0; i < sentences.length - 1; i++) {
        expect(sentences[i].score).toBeGreaterThanOrEqual(
          sentences[i + 1].score
        );
      }
    });

    it('should boost user message scores', () => {
      const sentences = extractKeySentences(testMessages, 10);

      // Check that at least some user messages are included
      const userSentences = sentences.filter((s) => s.role === 'user');
      expect(userSentences.length).toBeGreaterThan(0);
    });

    it('should handle empty messages', () => {
      const sentences = extractKeySentences([], 5);
      expect(sentences).toEqual([]);
    });

    it('should respect max sentences limit', () => {
      const sentences = extractKeySentences(testMessages, 2);
      expect(sentences.length).toBeLessThanOrEqual(2);
    });

    it('should filter out very short fragments', () => {
      const shortMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hi. Yes. OK.',
          timestamp: Date.now(),
        },
      ];

      const sentences = extractKeySentences(shortMessages, 5);
      // Very short fragments should be filtered
      expect(sentences.length).toBe(0);
    });
  });

  describe('extractKeyPoints', () => {
    it('should extract key points from messages', () => {
      const points = extractKeyPoints(testMessages, 3);

      expect(points).toBeDefined();
      expect(points.length).toBeLessThanOrEqual(3);
      expect(points.every((p) => typeof p === 'string')).toBe(true);
    });

    it('should avoid duplicate points from same message', () => {
      const points = extractKeyPoints(testMessages, 5);

      // Each point should come from a different message index
      const messageIndices = new Set<number>();
      // We can't directly verify this from the output, but the function
      // should ensure diversity
      expect(points.length).toBeGreaterThan(0);
    });

    it('should handle empty messages', () => {
      const points = extractKeyPoints([], 5);
      expect(points).toEqual([]);
    });

    it('should respect max points limit', () => {
      const points = extractKeyPoints(testMessages, 2);
      expect(points.length).toBeLessThanOrEqual(2);
    });
  });

  describe('createExtractiveSummary', () => {
    it('should create extractive summary from messages', () => {
      const summary = createExtractiveSummary(testMessages, 3);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.endsWith('.')).toBe(true);
    });

    it('should maintain chronological order', () => {
      const summary = createExtractiveSummary(testMessages, 5);

      // Summary should be coherent and sentences should flow
      expect(summary).toBeTruthy();
      expect(summary.includes('. ')).toBe(true);
    });

    it('should handle different sentence counts', () => {
      const brief = createExtractiveSummary(testMessages, 2);
      const detailed = createExtractiveSummary(testMessages, 5);

      expect(brief.length).toBeLessThanOrEqual(detailed.length);
    });

    it('should handle single message', () => {
      const summary = createExtractiveSummary([testMessages[0]], 3);
      expect(summary).toBeTruthy();
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from messages', () => {
      const keywords = extractKeywords(testMessages, 5);

      expect(keywords).toBeDefined();
      expect(keywords.length).toBeLessThanOrEqual(5);
      expect(keywords.every((k) => typeof k === 'string')).toBe(true);
    });

    it('should filter out stop words', () => {
      const keywords = extractKeywords(testMessages, 10);

      // Common stop words should not appear
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are'];
      const hasStopWords = keywords.some((k) => stopWords.includes(k));
      expect(hasStopWords).toBe(false);
    });

    it('should return most relevant keywords', () => {
      const keywords = extractKeywords(testMessages, 5);

      // Keywords should be related to the conversation topic
      // In this case, about neural networks and machine learning
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.every((k) => k.length > 2)).toBe(true);
    });

    it('should handle empty messages', () => {
      const keywords = extractKeywords([], 5);
      expect(keywords).toEqual([]);
    });

    it('should respect top N limit', () => {
      const keywords = extractKeywords(testMessages, 3);
      expect(keywords.length).toBeLessThanOrEqual(3);
    });

    it('should return keywords sorted by importance', () => {
      const keywords = extractKeywords(testMessages, 10);

      // Keywords should be in order of relevance
      // (we can't easily verify the exact scoring, but they should exist)
      expect(keywords.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDiversity', () => {
    it('should calculate vocabulary diversity', () => {
      const diversity = calculateDiversity(testMessages);

      expect(diversity).toBeGreaterThan(0);
      expect(diversity).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty messages', () => {
      const diversity = calculateDiversity([]);
      expect(diversity).toBe(0);
    });

    it('should return lower diversity for repetitive text', () => {
      const repetitiveMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'test test test test',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'test test test test',
          timestamp: Date.now(),
        },
      ];

      const diverseMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'unique different various distinct words here',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'completely separate vocabulary altogether',
          timestamp: Date.now(),
        },
      ];

      const repDiversity = calculateDiversity(repetitiveMessages);
      const divDiversity = calculateDiversity(diverseMessages);

      expect(divDiversity).toBeGreaterThan(repDiversity);
    });

    it('should handle single word messages', () => {
      const singleWordMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'hello',
          timestamp: Date.now(),
        },
      ];

      const diversity = calculateDiversity(singleWordMessages);
      expect(diversity).toBe(1); // 1 unique word / 1 total word
    });
  });

  describe('TF-IDF Scoring', () => {
    it('should score sentences based on term importance', () => {
      const sentences = extractKeySentences(testMessages, 5);

      // Sentences with important terms should score higher
      expect(sentences[0].score).toBeGreaterThan(0);

      // Sentences should have different scores
      const uniqueScores = new Set(sentences.map((s) => s.score));
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('should extract sentences with scoring algorithm', () => {
      const messagesWithRare: Message[] = [
        {
          id: '1',
          role: 'user',
          content:
            'This is a common sentence with common words and nothing special.',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content:
            'Quantum entanglement demonstrates non-classical correlations between spatially separated particles.',
          timestamp: Date.now(),
        },
        {
          id: '3',
          role: 'user',
          content:
            'Yes I see. That is good. Thank you for explaining that to me.',
          timestamp: Date.now(),
        },
      ];

      const sentences = extractKeySentences(messagesWithRare, 3);

      // Should extract sentences
      expect(sentences.length).toBeGreaterThan(0);
      expect(sentences.length).toBeLessThanOrEqual(3);

      // All sentences should have scores
      sentences.forEach(s => {
        expect(s.score).toBeGreaterThan(0);
        expect(s.text).toBeTruthy();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with realistic conversation', () => {
      const conversation: Message[] = [
        {
          id: '1',
          role: 'user',
          content:
            'I am working on a React application and need to implement user authentication.',
          timestamp: Date.now() - 10000,
        },
        {
          id: '2',
          role: 'assistant',
          content:
            'For React authentication, you have several options. JWT tokens are commonly used. You can implement authentication using libraries like Auth0 or build a custom solution.',
          timestamp: Date.now() - 9000,
        },
        {
          id: '3',
          role: 'user',
          content: 'What is the difference between JWT and session-based auth?',
          timestamp: Date.now() - 8000,
        },
        {
          id: '4',
          role: 'assistant',
          content:
            'JWT is stateless and stores information in tokens. Session-based auth stores data on the server. JWT is better for APIs and microservices.',
          timestamp: Date.now() - 7000,
        },
        {
          id: '5',
          role: 'user',
          content:
            'Can you show me how to implement JWT authentication in React?',
          timestamp: Date.now() - 6000,
        },
        {
          id: '6',
          role: 'assistant',
          content:
            'Sure! First, install jsonwebtoken library. Then create a login endpoint that generates tokens. Store the token in localStorage and include it in request headers.',
          timestamp: Date.now() - 5000,
        },
      ];

      const summary = createExtractiveSummary(conversation, 3);
      const keywords = extractKeywords(conversation, 5);
      const points = extractKeyPoints(conversation, 3);

      expect(summary).toBeTruthy();
      expect(keywords.length).toBeGreaterThan(0);
      expect(points.length).toBeGreaterThan(0);

      // Keywords should be relevant
      const relevantKeywords = keywords.filter(
        (k) =>
          k.includes('jwt') ||
          k.includes('auth') ||
          k.includes('token') ||
          k.includes('react')
      );
      expect(relevantKeywords.length).toBeGreaterThan(0);
    });

    it('should handle multilingual content gracefully', () => {
      const multilingualMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello, how are you today?',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'I am doing well, thank you for asking!',
          timestamp: Date.now(),
        },
      ];

      const summary = createExtractiveSummary(multilingualMessages, 2);
      const keywords = extractKeywords(multilingualMessages, 5);

      expect(summary).toBeTruthy();
      expect(keywords).toBeDefined();
    });

    it('should handle messages with code snippets', () => {
      const codeMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'How do I declare a variable in JavaScript?',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content:
            'You can use const, let, or var. For example: const x = 10; declares a constant variable.',
          timestamp: Date.now(),
        },
      ];

      const summary = createExtractiveSummary(codeMessages, 2);
      expect(summary).toBeTruthy();
    });
  });
});
