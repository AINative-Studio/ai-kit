/**
 * ContentModerator Tests
 *
 * Comprehensive test suite for the content moderation system
 */

import { ContentModerator } from '../src/ContentModerator';
import {
  ModerationCategory,
  SeverityLevel,
  ModerationAction,
  Language,
  ModerationPattern,
  WordList,
} from '../src/types';

describe('ContentModerator', () => {
  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const moderator = new ContentModerator();
      const config = moderator.getConfig();

      expect(config.enabledCategories).toHaveLength(6);
      expect(config.languages).toContain(Language.ENGLISH);
      expect(config.sanitize).toBe(false);
      expect(config.contextAwareFiltering).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const moderator = new ContentModerator({
        enabledCategories: [ModerationCategory.PROFANITY, ModerationCategory.HATE_SPEECH],
        languages: [Language.ENGLISH, Language.SPANISH],
        sanitize: true,
        minConfidence: 0.8,
      });

      const config = moderator.getConfig();
      expect(config.enabledCategories).toHaveLength(2);
      expect(config.languages).toHaveLength(2);
      expect(config.sanitize).toBe(true);
      expect(config.minConfidence).toBe(0.8);
    });

    it('should load built-in patterns and word lists', () => {
      const moderator = new ContentModerator();
      const stats = moderator.getStats();

      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.totalWordLists).toBeGreaterThan(0);
    });
  });

  describe('Profanity Detection', () => {
    it('should detect strong profanity', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is fucking terrible!');

      expect(result.flagged).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].category).toBe(ModerationCategory.PROFANITY);
      expect(result.matches[0].severity).toBe(SeverityLevel.HIGH);
    });

    it('should detect mild profanity', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is crap and stupid!');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should detect profanity in different cases', () => {
      const moderator = new ContentModerator();
      const result1 = moderator.moderate('FUCK');
      const result2 = moderator.moderate('fuck');
      const result3 = moderator.moderate('FuCk');

      expect(result1.flagged).toBe(true);
      expect(result2.flagged).toBe(true);
      expect(result3.flagged).toBe(true);
    });

    it('should detect multiple profanities', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('What the fuck is this shit?');

      expect(result.flagged).toBe(true);
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
      expect(result.summary.violationsByCategory[ModerationCategory.PROFANITY]).toBeGreaterThanOrEqual(
        2
      );
    });

    it('should not detect profanity in clean text', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is a nice and clean message.');

      expect(result.flagged).toBe(false);
      expect(result.action).toBe(ModerationAction.ALLOW);
    });
  });

  describe('Hate Speech Detection', () => {
    it('should detect hate speech slurs with critical severity', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('You are a stupid retard');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.HATE_SPEECH)).toBe(true);
      expect(result.overallSeverity).toBe(SeverityLevel.CRITICAL);
    });

    it('should detect hate rhetoric patterns', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('I hate all muslims');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.HATE_SPEECH)).toBe(true);
    });

    it('should have high confidence for hate speech', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('hate all jews');

      expect(result.flagged).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Violence Detection', () => {
    it('should detect direct threats of violence', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('I will kill you');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.VIOLENCE)).toBe(true);
      expect(result.matches[0].severity).toBe(SeverityLevel.CRITICAL);
    });

    it('should detect graphic violence descriptions', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('The torture was brutal and savage');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.VIOLENCE)).toBe(true);
    });

    it('should detect weapon-related content', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('how to make a bomb');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.VIOLENCE)).toBe(true);
    });

    it('should allow violence in fictional context with context-aware filtering', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: true,
      });

      const result = moderator.moderate(
        'In the movie, the character threatens to kill the villain'
      );

      // Should be allowed or have lower severity due to fictional context
      expect(result.action).not.toBe(ModerationAction.BLOCK);
    });

    it('should detect violence without context-aware filtering', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: false,
      });

      const result = moderator.moderate('I will kill you');

      expect(result.flagged).toBe(true);
      expect(result.action).toBe(ModerationAction.BLOCK);
    });
  });

  describe('Sexual Content Detection', () => {
    it('should detect explicit sexual content', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('Looking for porn and xxx content');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.SEXUAL_CONTENT)).toBe(
        true
      );
    });

    it('should detect sexual solicitation', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('Looking for hookup');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.SEXUAL_CONTENT)).toBe(
        true
      );
    });

    it('should allow medical context with context-aware filtering', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: true,
      });

      const result = moderator.moderate(
        'The doctor examined the breast for medical diagnosis'
      );

      // Should be allowed due to medical context
      expect(result.action).not.toBe(ModerationAction.BLOCK);
    });
  });

  describe('Spam Detection', () => {
    it('should detect promotional spam', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('Buy now! Limited time offer! Click here for discount!');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.SPAM)).toBe(true);
    });

    it('should detect multiple URLs as spam', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate(
        'Visit example.com and test.com and another.io for more'
      );

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.SPAM)).toBe(true);
    });

    it('should detect repetitive text', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('free free free');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.SPAM)).toBe(true);
    });
  });

  describe('PII Detection', () => {
    it('should detect PII when enabled', () => {
      const moderator = new ContentModerator({
        enablePIIDetection: true,
      });

      const result = moderator.moderate('My email is test@example.com and phone is 555-123-4567');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PII)).toBe(true);
    });

    it('should not detect PII when disabled', () => {
      const moderator = new ContentModerator({
        enablePIIDetection: false,
      });

      const result = moderator.moderate('My email is test@example.com');

      expect(result.matches.some((m) => m.category === ModerationCategory.PII)).toBe(false);
    });

    it('should detect multiple PII types', () => {
      const moderator = new ContentModerator({
        enablePIIDetection: true,
      });

      const result = moderator.moderate(
        'Contact me at john@example.com or 555-1234 or 123-45-6789'
      );

      expect(result.flagged).toBe(true);
      const piiMatches = result.matches.filter((m) => m.category === ModerationCategory.PII);
      expect(piiMatches.length).toBeGreaterThan(1);
    });
  });

  describe('Severity Levels', () => {
    it('should correctly identify low severity violations', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is stupid and dumb');

      expect(result.flagged).toBe(true);
      expect(result.overallSeverity).toBe(SeverityLevel.LOW);
    });

    it('should correctly identify high severity violations', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is fucking terrible');

      expect(result.flagged).toBe(true);
      expect(result.overallSeverity).toBe(SeverityLevel.HIGH);
    });

    it('should correctly identify critical severity violations', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('I will kill you, you retard');

      expect(result.flagged).toBe(true);
      expect(result.overallSeverity).toBe(SeverityLevel.CRITICAL);
    });

    it('should use highest severity when multiple violations exist', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is stupid and I will kill you');

      expect(result.flagged).toBe(true);
      expect(result.summary.highestSeverity).toBe(SeverityLevel.CRITICAL);
    });
  });

  describe('Action Determination', () => {
    it('should allow clean content', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is a perfectly clean message');

      expect(result.action).toBe(ModerationAction.ALLOW);
    });

    it('should warn for medium severity content', () => {
      const moderator = new ContentModerator({
        thresholds: {
          warnThreshold: 0.5,
          blockThreshold: 0.95,
          autoBlockSeverity: SeverityLevel.CRITICAL,
        },
      });

      const result = moderator.moderate('damn it');

      expect(result.flagged).toBe(true);
      expect(result.action).toBe(ModerationAction.WARN);
    });

    it('should block critical severity content', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('I will kill you');

      expect(result.action).toBe(ModerationAction.BLOCK);
    });

    it('should respect custom thresholds', () => {
      const moderator = new ContentModerator({
        thresholds: {
          blockThreshold: 0.95,
          warnThreshold: 0.8,
          autoBlockSeverity: SeverityLevel.CRITICAL,
        },
      });

      const result = moderator.moderate('This is fucking bad');

      // Should warn instead of block due to higher threshold
      expect(result.action).not.toBe(ModerationAction.ALLOW);
    });
  });

  describe('Multi-Language Support', () => {
    it('should detect Spanish profanity', () => {
      const moderator = new ContentModerator({
        languages: [Language.SPANISH],
      });

      const result = moderator.moderate('Eres una puta');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should detect French profanity', () => {
      const moderator = new ContentModerator({
        languages: [Language.FRENCH],
      });

      const result = moderator.moderate('C\'est de la merde');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should detect German profanity', () => {
      const moderator = new ContentModerator({
        languages: [Language.GERMAN],
      });

      const result = moderator.moderate('Du bist ein Arschloch');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should detect Portuguese profanity', () => {
      const moderator = new ContentModerator({
        languages: [Language.PORTUGUESE],
      });

      const result = moderator.moderate('Você é uma puta');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should support multiple languages simultaneously', () => {
      const moderator = new ContentModerator({
        languages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH],
      });

      const result1 = moderator.moderate('This is fucking bad');
      const result2 = moderator.moderate('Eres una puta');
      const result3 = moderator.moderate('C\'est de la merde');

      expect(result1.flagged).toBe(true);
      expect(result2.flagged).toBe(true);
      expect(result3.flagged).toBe(true);
    });
  });

  describe('Custom Patterns', () => {
    it('should register and use custom patterns', () => {
      const moderator = new ContentModerator();

      const customPattern: ModerationPattern = {
        id: 'custom-test',
        category: ModerationCategory.SPAM,
        pattern: /\b(custom-spam-word)\b/gi,
        severity: SeverityLevel.HIGH,
        confidence: 0.95,
        description: 'Custom spam pattern',
        caseSensitive: false,
      };

      moderator.registerPattern(customPattern);
      const result = moderator.moderate('This contains custom-spam-word');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.metadata?.patternId === 'custom-test')).toBe(true);
    });

    it('should unregister patterns', () => {
      const moderator = new ContentModerator();

      const customPattern: ModerationPattern = {
        id: 'removable-pattern',
        category: ModerationCategory.PROFANITY,
        pattern: /\b(testword)\b/gi,
        severity: SeverityLevel.MEDIUM,
        confidence: 0.8,
        description: 'Test pattern',
      };

      moderator.registerPattern(customPattern);
      const result1 = moderator.moderate('This has testword');
      expect(result1.flagged).toBe(true);

      moderator.unregisterPattern('removable-pattern');
      const result2 = moderator.moderate('This has testword');
      expect(result2.matches.some((m) => m.metadata?.patternId === 'removable-pattern')).toBe(
        false
      );
    });

    it('should handle custom patterns with keyword arrays', () => {
      const moderator = new ContentModerator();

      const customPattern: ModerationPattern = {
        id: 'keyword-array',
        category: ModerationCategory.SPAM,
        pattern: ['badword1', 'badword2', 'badword3'],
        severity: SeverityLevel.MEDIUM,
        confidence: 0.85,
        description: 'Custom keyword list',
      };

      moderator.registerPattern(customPattern);
      const result = moderator.moderate('This has badword2 in it');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.metadata?.patternId === 'keyword-array')).toBe(true);
    });
  });

  describe('Custom Word Lists', () => {
    it('should register and use custom word lists', () => {
      const moderator = new ContentModerator();

      const wordList: WordList = {
        category: ModerationCategory.PROFANITY,
        language: Language.ENGLISH,
        severity: SeverityLevel.HIGH,
        words: ['customcurse', 'anotherbadword'],
        caseSensitive: false,
      };

      moderator.registerWordList(wordList);
      const result = moderator.moderate('You are a customcurse');

      expect(result.flagged).toBe(true);
      expect(result.matches.some((m) => m.category === ModerationCategory.PROFANITY)).toBe(true);
    });

    it('should respect case sensitivity in word lists', () => {
      const moderator = new ContentModerator();

      const wordList: WordList = {
        category: ModerationCategory.PROFANITY,
        language: Language.ENGLISH,
        severity: SeverityLevel.MEDIUM,
        words: ['CaseSensitive'],
        caseSensitive: true,
      };

      moderator.registerWordList(wordList);

      const result1 = moderator.moderate('CaseSensitive');
      const result2 = moderator.moderate('casesensitive');

      expect(result1.flagged).toBe(true);
      expect(result2.flagged).toBe(false);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize flagged content when enabled', () => {
      const moderator = new ContentModerator({
        sanitize: true,
      });

      const result = moderator.moderate('This is fucking terrible');

      expect(result.sanitizedText).toBeDefined();
      expect(result.sanitizedText).not.toContain('fucking');
      expect(result.sanitizedText).toContain('*');
    });

    it('should not sanitize when disabled', () => {
      const moderator = new ContentModerator({
        sanitize: false,
      });

      const result = moderator.moderate('This is fucking terrible');

      expect(result.sanitizedText).toBeUndefined();
    });

    it('should use custom sanitization character', () => {
      const moderator = new ContentModerator({
        sanitize: true,
        sanitizationChar: '#',
      });

      const result = moderator.moderate('This is fucking terrible');

      expect(result.sanitizedText).toBeDefined();
      expect(result.sanitizedText).toContain('#');
      expect(result.sanitizedText).not.toContain('*');
    });

    it('should sanitize multiple violations', () => {
      const moderator = new ContentModerator({
        sanitize: true,
      });

      const result = moderator.moderate('This fucking shit is terrible');

      expect(result.sanitizedText).toBeDefined();
      expect(result.sanitizedText).not.toContain('fucking');
      expect(result.sanitizedText).not.toContain('shit');
    });
  });

  describe('Context-Aware Filtering', () => {
    it('should reduce false positives with context rules', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: true,
      });

      // Violence in a game context should be allowed
      const result = moderator.moderate('In the video game, you can kill enemies');

      expect(result.action).not.toBe(ModerationAction.BLOCK);
    });

    it('should still detect violations without whitelisted context', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: true,
      });

      const result = moderator.moderate('I will kill you right now');

      expect(result.flagged).toBe(true);
      expect(result.action).toBe(ModerationAction.BLOCK);
    });

    it('should work when context filtering is disabled', () => {
      const moderator = new ContentModerator({
        contextAwareFiltering: false,
      });

      const result = moderator.moderate('I will kill you');

      expect(result.flagged).toBe(true);
      expect(result.action).toBe(ModerationAction.BLOCK);
    });
  });

  describe('Batch Moderation', () => {
    it('should moderate multiple texts in batch', () => {
      const moderator = new ContentModerator();
      const texts = [
        'This is clean',
        'This is fucking bad',
        'I hate all muslims',
        'Another clean message',
      ];

      const results = moderator.moderateBatch(texts);

      expect(results).toHaveLength(4);
      expect(results[0].flagged).toBe(false);
      expect(results[1].flagged).toBe(true);
      expect(results[2].flagged).toBe(true);
      expect(results[3].flagged).toBe(false);
    });

    it('should handle empty batch', () => {
      const moderator = new ContentModerator();
      const results = moderator.moderateBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const moderator = new ContentModerator();

      moderator.updateConfig({
        minConfidence: 0.9,
        sanitize: true,
      });

      const config = moderator.getConfig();
      expect(config.minConfidence).toBe(0.9);
      expect(config.sanitize).toBe(true);
    });

    it('should enable/disable categories', () => {
      const moderator = new ContentModerator({
        enabledCategories: [ModerationCategory.PROFANITY],
      });

      const result1 = moderator.moderate('This is fucking bad');
      const result2 = moderator.moderate('I hate everyone');

      expect(result1.flagged).toBe(true);
      // Hate speech should not be detected as it's not enabled
      expect(result2.matches.some((m) => m.category === ModerationCategory.HATE_SPEECH)).toBe(
        false
      );
    });

    it('should respect minimum confidence threshold', () => {
      const moderator = new ContentModerator({
        minConfidence: 0.95,
      });

      // This might have lower confidence and should be filtered out
      const result = moderator.moderate('This is stupid');

      // Should either not be flagged or have high confidence
      if (result.flagged) {
        expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      }
    });
  });

  describe('Statistics', () => {
    it('should provide statistics about patterns and word lists', () => {
      const moderator = new ContentModerator();
      const stats = moderator.getStats();

      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.totalWordLists).toBeGreaterThan(0);
      expect(stats.patternsByCategory).toBeDefined();
      expect(stats.wordListsByLanguage).toBeDefined();
    });

    it('should update statistics when patterns are registered', () => {
      const moderator = new ContentModerator();
      const stats1 = moderator.getStats();

      const customPattern: ModerationPattern = {
        id: 'stats-test',
        category: ModerationCategory.SPAM,
        pattern: /test/gi,
        severity: SeverityLevel.LOW,
        confidence: 0.7,
        description: 'Test pattern',
      };

      moderator.registerPattern(customPattern);
      const stats2 = moderator.getStats();

      expect(stats2.totalPatterns).toBe(stats1.totalPatterns + 1);
    });
  });

  describe('Result Structure', () => {
    it('should return complete result structure', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is fucking terrible');

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('flagged');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('overallSeverity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should include match metadata', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is fucking terrible');

      expect(result.matches.length).toBeGreaterThan(0);
      const match = result.matches[0];

      expect(match).toHaveProperty('category');
      expect(match).toHaveProperty('severity');
      expect(match).toHaveProperty('confidence');
      expect(match).toHaveProperty('matchedText');
      expect(match).toHaveProperty('start');
      expect(match).toHaveProperty('end');
      expect(match).toHaveProperty('reason');
      expect(match).toHaveProperty('metadata');
    });

    it('should include summary statistics', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This fucking shit is terrible');

      expect(result.summary).toHaveProperty('totalViolations');
      expect(result.summary).toHaveProperty('violationsByCategory');
      expect(result.summary).toHaveProperty('highestSeverity');
      expect(result.summary.totalViolations).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('');

      expect(result.flagged).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.action).toBe(ModerationAction.ALLOW);
    });

    it('should handle very long text with truncation', () => {
      const moderator = new ContentModerator({
        maxTextLength: 100,
      });

      const longText = 'This is a very long text '.repeat(100) + 'with fucking profanity at end';
      const result = moderator.moderate(longText);

      expect(result.text.length).toBeLessThanOrEqual(100);
    });

    it('should handle special characters', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is f*cking terrible');

      // Should still work with obfuscation to some degree
      expect(result).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('This is 😀 nice message');

      expect(result.flagged).toBe(false);
    });

    it('should handle text with only whitespace', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('     ');

      expect(result.flagged).toBe(false);
    });

    it('should not overlap matches', () => {
      const moderator = new ContentModerator();
      const result = moderator.moderate('fuck shit fuck');

      // Should detect multiple matches without overlapping
      expect(result.matches.length).toBeGreaterThanOrEqual(2);

      // Verify no overlapping positions
      for (let i = 0; i < result.matches.length - 1; i++) {
        expect(result.matches[i].end).toBeLessThanOrEqual(result.matches[i + 1].start);
      }
    });
  });

  describe('Performance', () => {
    it('should process text efficiently', () => {
      const moderator = new ContentModerator();
      const text = 'This is a normal message without violations '.repeat(10);

      const start = Date.now();
      const result = moderator.moderate(text);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle batch processing efficiently', () => {
      const moderator = new ContentModerator();
      const texts = Array(100).fill('This is a test message');

      const start = Date.now();
      const results = moderator.moderateBatch(texts);
      const duration = Date.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete 100 items in less than 1s
    });
  });
});
