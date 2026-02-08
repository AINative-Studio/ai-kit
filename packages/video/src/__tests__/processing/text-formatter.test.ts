import { describe, it, expect, beforeEach } from 'vitest';
import { TextFormatter } from '../../processing/text-formatter';
import type { TranscriptionSegment } from '../../processing/types';

describe('TextFormatter', () => {
  describe('Constructor', () => {
    it('creates formatter with default options', () => {
      const formatter = new TextFormatter();
      expect(formatter).toBeDefined();
      expect(formatter).toBeInstanceOf(TextFormatter);
    });

    it('accepts custom options', () => {
      const formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true,
        enableParagraphs: true
      });
      expect(formatter).toBeDefined();
    });
  });

  describe('applyPunctuation', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      formatter = new TextFormatter({
        enablePunctuation: true
      });
    });

    it('adds periods to sentences', () => {
      const text = 'hello world this is a test';
      const result = formatter.applyPunctuation(text);

      expect(result).toMatch(/\./);
      expect(result.endsWith('.')).toBe(true);
    });

    it('adds question marks for questions', () => {
      const text = 'how are you doing today';
      const result = formatter.applyPunctuation(text);

      expect(result).toMatch(/\?/);
    });

    it('preserves existing punctuation', () => {
      const text = 'Hello! How are you?';
      const result = formatter.applyPunctuation(text);

      expect(result).toContain('!');
      expect(result).toContain('?');
    });

    it('handles empty text', () => {
      const text = '';
      const result = formatter.applyPunctuation(text);

      expect(result).toBe('');
    });

    it('handles null or undefined input gracefully', () => {
      expect(() => formatter.applyPunctuation(null as any)).not.toThrow();
      expect(() => formatter.applyPunctuation(undefined as any)).not.toThrow();
    });
  });

  describe('applyCapitalization', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      formatter = new TextFormatter({
        enableCapitalization: true
      });
    });

    it('capitalizes first letter of text', () => {
      const text = 'hello world';
      const result = formatter.applyCapitalization(text);

      expect(result.charAt(0)).toBe('H');
    });

    it('capitalizes after periods', () => {
      const text = 'hello. world';
      const result = formatter.applyCapitalization(text);

      expect(result).toMatch(/\.\s+[A-Z]/);
    });

    it('preserves existing capitalization', () => {
      const text = 'Hello World';
      const result = formatter.applyCapitalization(text);

      expect(result).toBe('Hello World');
    });

    it('handles empty text', () => {
      const text = '';
      const result = formatter.applyCapitalization(text);

      expect(result).toBe('');
    });
  });

  describe('formatSegments', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true
      });
    });

    it('formats all segments', () => {
      const segments: TranscriptionSegment[] = [
        { text: 'hello world', start: 0, end: 1 },
        { text: 'how are you', start: 2, end: 3 }
      ];

      const result = formatter.formatSegments(segments);

      expect(result.length).toBe(2);
      expect(result[0]?.text.charAt(0)).toBe('H');
      expect(result[1]?.text.charAt(0)).toBe('H');
    });

    it('preserves timestamps', () => {
      const segments: TranscriptionSegment[] = [
        { text: 'test', start: 1.5, end: 3.2 }
      ];

      const result = formatter.formatSegments(segments);

      expect(result[0]?.start).toBe(1.5);
      expect(result[0]?.end).toBe(3.2);
    });

    it('preserves confidence scores', () => {
      const segments: TranscriptionSegment[] = [
        { text: 'test', start: 0, end: 1, confidence: 0.95 }
      ];

      const result = formatter.formatSegments(segments);

      expect(result[0]?.confidence).toBe(0.95);
    });

    it('preserves speaker identifiers', () => {
      const segments: TranscriptionSegment[] = [
        { text: 'hello', start: 0, end: 1, speaker: 'Speaker 1' }
      ];

      const result = formatter.formatSegments(segments);

      expect(result[0]?.speaker).toBe('Speaker 1');
    });

    it('handles empty segments array', () => {
      const segments: TranscriptionSegment[] = [];

      const result = formatter.formatSegments(segments);

      expect(result).toEqual([]);
    });

    it('applies both punctuation and capitalization', () => {
      const segments: TranscriptionSegment[] = [
        { text: 'hello world', start: 0, end: 2 }
      ];

      const result = formatter.formatSegments(segments);

      expect(result[0]?.text.charAt(0)).toBe('H');
      expect(result[0]?.text.endsWith('.')).toBe(true);
    });
  });

  describe('formatText', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true
      });
    });

    it('applies all enabled formatting options', () => {
      const text = 'hello world this is a test';
      const result = formatter.formatText(text);

      expect(result.charAt(0)).toBe('H');
      expect(result.endsWith('.')).toBe(true);
    });

    it('respects disabled options', () => {
      const formatterNoPunctuation = new TextFormatter({
        enablePunctuation: false,
        enableCapitalization: true
      });

      const text = 'hello world';
      const result = formatterNoPunctuation.formatText(text);

      expect(result.charAt(0)).toBe('H');
      expect(result.includes('.')).toBe(false);
    });

    it('handles multiline text', () => {
      const text = 'hello world\nthis is a test';
      const result = formatter.formatText(text);

      expect(result).toContain('\n');
      expect(result.split('\n').every((line: string) => line.charAt(0) === line.charAt(0).toUpperCase())).toBe(true);
    });
  });

  describe('Option validation', () => {
    it('applies default options when none provided', () => {
      const formatter = new TextFormatter();
      const text = 'hello';
      const result = formatter.formatText(text);

      expect(result).toBeDefined();
    });

    it('handles partial options', () => {
      const formatter = new TextFormatter({
        enablePunctuation: true
      });

      const text = 'hello';
      const result = formatter.formatText(text);

      expect(result).toBeDefined();
    });

    it('validates maxLineLength option', () => {
      const formatter = new TextFormatter({
        maxLineLength: 50
      });

      expect(formatter).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true
      });
    });

    it('handles text with only whitespace', () => {
      const text = '   ';
      const result = formatter.formatText(text);

      expect(result).toBeDefined();
    });

    it('handles text with special characters', () => {
      const text = 'hello @world #test';
      const result = formatter.formatText(text);

      expect(result).toContain('@world');
      expect(result).toContain('#test');
    });

    it('handles text with numbers', () => {
      const text = 'there are 123 items';
      const result = formatter.formatText(text);

      expect(result).toContain('123');
    });

    it('handles very long text', () => {
      const text = 'word '.repeat(1000);
      const result = formatter.formatText(text);

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
