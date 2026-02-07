import { describe, it, expect, beforeEach } from 'vitest';
import { TextFormatter } from '../../processing/text-formatter';
import { TranscriptionSegment } from '../../processing/types';

class DescribeTextFormatter {
  private formatter: TextFormatter | null = null;

  class DescribeConstructor {
    it_creates_formatter_with_default_options() {
      const formatter = new TextFormatter();
      expect(formatter).toBeDefined();
      expect(formatter).toBeInstanceOf(TextFormatter);
    }

    it_accepts_custom_options() {
      const formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true,
        enableParagraphs: true
      });
      expect(formatter).toBeDefined();
    }
  }

  class DescribeApplyPunctuation {
    beforeEach() {
      this.formatter = new TextFormatter({
        enablePunctuation: true
      });
    }

    it_adds_periods_to_sentences() {
      const text = 'hello world this is a test';
      const result = this.formatter!.applyPunctuation(text);
      
      expect(result).toMatch(/\./);
      expect(result.endsWith('.')).toBe(true);
    }

    it_adds_question_marks_for_questions() {
      const text = 'how are you doing today';
      const result = this.formatter!.applyPunctuation(text);
      
      expect(result).toMatch(/\?/);
    }

    it_preserves_existing_punctuation() {
      const text = 'Hello! How are you?';
      const result = this.formatter!.applyPunctuation(text);
      
      expect(result).toContain('!');
      expect(result).toContain('?');
    }

    it_handles_empty_text() {
      const text = '';
      const result = this.formatter!.applyPunctuation(text);
      
      expect(result).toBe('');
    }
  }

  class DescribeFormatSegments {
    beforeEach() {
      this.formatter = new TextFormatter({
        enablePunctuation: true,
        enableCapitalization: true
      });
    }

    it_formats_all_segments() {
      const segments: TranscriptionSegment[] = [
        { text: 'hello world', start: 0, end: 1 },
        { text: 'how are you', start: 2, end: 3 }
      ];
      
      const result = this.formatter!.formatSegments(segments);
      
      expect(result.length).toBe(2);
      expect(result[0].text.charAt(0)).toBe('H');
      expect(result[1].text.charAt(0)).toBe('H');
    }

    it_preserves_timestamps() {
      const segments: TranscriptionSegment[] = [
        { text: 'test', start: 1.5, end: 3.2 }
      ];
      
      const result = this.formatter!.formatSegments(segments);
      
      expect(result[0].start).toBe(1.5);
      expect(result[0].end).toBe(3.2);
    }
  }
}

describe('TextFormatter', () => {
  describe('Constructor', () => {
    const suite = new DescribeTextFormatter();
    const constructor = new suite.DescribeConstructor();

    it('creates formatter with default options', () => {
      constructor.it_creates_formatter_with_default_options();
    });

    it('accepts custom options', () => {
      constructor.it_accepts_custom_options();
    });
  });

  describe('applyPunctuation', () => {
    const suite = new DescribeTextFormatter();
    const punctuation = new suite.DescribeApplyPunctuation();

    beforeEach(() => {
      punctuation.beforeEach();
    });

    it('adds periods to sentences', () => {
      punctuation.it_adds_periods_to_sentences();
    });

    it('adds question marks for questions', () => {
      punctuation.it_adds_question_marks_for_questions();
    });

    it('preserves existing punctuation', () => {
      punctuation.it_preserves_existing_punctuation();
    });

    it('handles empty text', () => {
      punctuation.it_handles_empty_text();
    });
  });

  describe('formatSegments', () => {
    const suite = new DescribeTextFormatter();
    const format = new suite.DescribeFormatSegments();

    beforeEach(() => {
      format.beforeEach();
    });

    it('formats all segments', () => {
      format.it_formats_all_segments();
    });

    it('preserves timestamps', () => {
      format.it_preserves_timestamps();
    });
  });
});
