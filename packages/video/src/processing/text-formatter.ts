/**
 * Text Formatter for Transcription Processing
 * @module @ainative/video/processing
 */

import type { TranscriptionSegment, TextFormattingOptions } from './types';

/**
 * TextFormatter class for applying formatting to transcribed text
 *
 * Supports:
 * - Automatic punctuation
 * - Capitalization
 * - Paragraph detection
 * - Line length management
 *
 * @example
 * ```typescript
 * const formatter = new TextFormatter({
 *   enablePunctuation: true,
 *   enableCapitalization: true
 * });
 *
 * const formatted = formatter.formatText('hello world');
 * // Result: "Hello world."
 * ```
 */
export class TextFormatter {
  private options: Required<TextFormattingOptions>;

  /**
   * Question word patterns for detecting questions
   */
  private static readonly QUESTION_WORDS = [
    'how', 'what', 'when', 'where', 'who', 'whom', 'whose',
    'why', 'which', 'can', 'could', 'would', 'should',
    'will', 'do', 'does', 'did', 'is', 'are', 'was', 'were'
  ];

  /**
   * Default formatting options
   */
  private static readonly DEFAULT_OPTIONS: Required<TextFormattingOptions> = {
    enablePunctuation: true,
    enableCapitalization: true,
    enableParagraphs: false,
    maxLineLength: 80
  };

  /**
   * Creates a new TextFormatter instance
   *
   * @param options - Formatting options
   */
  constructor(options: TextFormattingOptions = {}) {
    this.options = {
      ...TextFormatter.DEFAULT_OPTIONS,
      ...options
    };
  }

  /**
   * Apply punctuation to text
   *
   * Adds appropriate punctuation marks based on sentence structure:
   * - Periods for statements
   * - Question marks for questions
   * - Preserves existing punctuation
   *
   * @param text - Input text
   * @returns Text with punctuation applied
   */
  applyPunctuation(text: string): string {
    // Handle null/undefined input
    if (!text) {
      return '';
    }

    // Trim whitespace
    text = text.trim();

    // Return empty string if only whitespace
    if (!text) {
      return '';
    }

    // Already has ending punctuation
    if (/[.!?]$/.test(text)) {
      return text;
    }

    // Check if it's a question
    const lowerText = text.toLowerCase();
    const firstWord = lowerText.split(/\s+/)[0];

    if (firstWord && TextFormatter.QUESTION_WORDS.includes(firstWord)) {
      return text + '?';
    }

    // Default to period
    return text + '.';
  }

  /**
   * Apply capitalization to text
   *
   * Capitalizes:
   * - First letter of text
   * - Letters after sentence-ending punctuation
   *
   * @param text - Input text
   * @returns Text with capitalization applied
   */
  applyCapitalization(text: string): string {
    // Handle empty input
    if (!text) {
      return '';
    }

    // Capitalize first letter
    let result = text.charAt(0).toUpperCase() + text.slice(1);

    // Capitalize after sentence-ending punctuation
    result = result.replace(/([.!?]\s+)([a-z])/g, (_match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });

    return result;
  }

  /**
   * Format a single text string with all enabled options
   *
   * @param text - Input text
   * @returns Formatted text
   */
  formatText(text: string): string {
    if (!text) {
      return '';
    }

    let result = text;

    // Handle multiline text
    if (text.includes('\n')) {
      const lines = text.split('\n');
      result = lines.map(line => this.formatSingleLine(line)).join('\n');
      return result;
    }

    return this.formatSingleLine(result);
  }

  /**
   * Format a single line of text
   *
   * @param text - Input text (single line)
   * @returns Formatted text
   */
  private formatSingleLine(text: string): string {
    if (!text || !text.trim()) {
      return text;
    }

    let result = text;

    // Apply capitalization first
    if (this.options.enableCapitalization) {
      result = this.applyCapitalization(result);
    }

    // Apply punctuation
    if (this.options.enablePunctuation) {
      result = this.applyPunctuation(result);
    }

    return result;
  }

  /**
   * Format an array of transcription segments
   *
   * Applies formatting to the text of each segment while preserving
   * timestamps, confidence scores, and speaker information.
   *
   * @param segments - Array of transcription segments
   * @returns Array of formatted segments
   */
  formatSegments(segments: TranscriptionSegment[]): TranscriptionSegment[] {
    // Handle empty array
    if (!segments || segments.length === 0) {
      return [];
    }

    return segments.map(segment => {
      // Format the text
      const formattedText = this.formatText(segment.text);

      // Return new segment with formatted text, preserving all other properties
      return {
        ...segment,
        text: formattedText
      };
    });
  }

  /**
   * Get current formatting options
   *
   * @returns Current options
   */
  getOptions(): Readonly<Required<TextFormattingOptions>> {
    return { ...this.options };
  }

  /**
   * Update formatting options
   *
   * @param options - New options to merge with existing
   */
  setOptions(options: Partial<TextFormattingOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * Check if punctuation is enabled
   *
   * @returns True if punctuation is enabled
   */
  isPunctuationEnabled(): boolean {
    return this.options.enablePunctuation;
  }

  /**
   * Check if capitalization is enabled
   *
   * @returns True if capitalization is enabled
   */
  isCapitalizationEnabled(): boolean {
    return this.options.enableCapitalization;
  }

  /**
   * Check if paragraph detection is enabled
   *
   * @returns True if paragraph detection is enabled
   */
  isParagraphsEnabled(): boolean {
    return this.options.enableParagraphs;
  }

  /**
   * Get maximum line length
   *
   * @returns Maximum line length in characters
   */
  getMaxLineLength(): number {
    return this.options.maxLineLength;
  }
}
