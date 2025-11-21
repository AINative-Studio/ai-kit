/**
 * Extractive summarization utilities
 *
 * Extract key sentences from conversations without using LLMs
 */

import { Message, MessageContent } from '../types';
import { ExtractedSentence } from './types';

/**
 * Extract text content from a message
 */
function getTextContent(content: string | MessageContent | MessageContent[]): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((c): c is MessageContent & { type: 'text' } => c.type === 'text')
      .map((c) => c.data)
      .join(' ');
  }
  return content.type === 'text' ? content.data : '';
}

/**
 * Simple word tokenizer
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Calculate term frequency for a document
 */
function calculateTF(words: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const totalWords = words.length;

  for (const word of words) {
    tf.set(word, (tf.get(word) || 0) + 1 / totalWords);
  }

  return tf;
}

/**
 * Calculate inverse document frequency across all messages
 */
function calculateIDF(messages: Message[]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = messages.length;
  const docFrequency = new Map<string, number>();

  // Count document frequency
  for (const message of messages) {
    const words = new Set(tokenize(getTextContent(message.content)));
    for (const word of words) {
      docFrequency.set(word, (docFrequency.get(word) || 0) + 1);
    }
  }

  // Calculate IDF
  for (const [word, freq] of docFrequency) {
    idf.set(word, Math.log(totalDocs / freq));
  }

  return idf;
}

/**
 * Calculate TF-IDF scores for sentences
 */
function calculateTFIDF(
  sentence: string,
  tf: Map<string, number>,
  idf: Map<string, number>
): number {
  const words = tokenize(sentence);
  let score = 0;

  for (const word of words) {
    const tfScore = tf.get(word) || 0;
    const idfScore = idf.get(word) || 0;
    score += tfScore * idfScore;
  }

  return score / (words.length || 1);
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting - handles common cases
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10); // Filter out very short fragments
}

/**
 * Extract key sentences from messages using TF-IDF
 */
export function extractKeySentences(
  messages: Message[],
  maxSentences: number = 5
): ExtractedSentence[] {
  if (messages.length === 0) {
    return [];
  }

  // Calculate IDF across all messages
  const idf = calculateIDF(messages);

  const scoredSentences: ExtractedSentence[] = [];

  // Process each message
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message) continue; // Skip if message is undefined (shouldn't happen)

    const sentences = splitIntoSentences(getTextContent(message.content));
    const words = tokenize(getTextContent(message.content));
    const tf = calculateTF(words);

    for (const sentence of sentences) {
      const score = calculateTFIDF(sentence, tf, idf);

      // Boost score for user messages (often contain questions/requests)
      const roleBoost = message.role === 'user' ? 1.2 : 1.0;

      scoredSentences.push({
        text: sentence,
        score: score * roleBoost,
        messageIndex: i,
        role: message.role,
      });
    }
  }

  // Sort by score and return top N
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences);
}

/**
 * Extract key points from messages (distinct from sentences)
 */
export function extractKeyPoints(
  messages: Message[],
  maxPoints: number = 5
): string[] {
  const sentences = extractKeySentences(messages, maxPoints * 2);

  // Group consecutive sentences from same message
  const points: string[] = [];
  const seen = new Set<number>();

  for (const sentence of sentences) {
    if (points.length >= maxPoints) break;
    if (seen.has(sentence.messageIndex)) continue;

    points.push(sentence.text);
    seen.add(sentence.messageIndex);
  }

  return points;
}

/**
 * Create an extractive summary from messages
 */
export function createExtractiveSummary(
  messages: Message[],
  maxSentences: number = 5
): string {
  const sentences = extractKeySentences(messages, maxSentences);

  // Sort by message index to maintain chronological order
  const orderedSentences = sentences.sort(
    (a, b) => a.messageIndex - b.messageIndex
  );

  return orderedSentences.map((s) => s.text).join('. ') + '.';
}

/**
 * Calculate conversation diversity (vocabulary richness)
 */
export function calculateDiversity(messages: Message[]): number {
  const allWords = messages.flatMap((m) => tokenize(getTextContent(m.content)));
  const uniqueWords = new Set(allWords);

  if (allWords.length === 0) return 0;

  return uniqueWords.size / allWords.length;
}

/**
 * Identify important keywords in conversation
 */
export function extractKeywords(
  messages: Message[],
  topN: number = 10
): string[] {
  const idf = calculateIDF(messages);
  const allWords = messages.flatMap((m) => tokenize(getTextContent(m.content)));
  const tf = calculateTF(allWords);

  // Calculate TF-IDF for each word
  const wordScores = new Map<string, number>();
  for (const [word, tfScore] of tf) {
    const idfScore = idf.get(word) || 0;
    wordScores.set(word, tfScore * idfScore);
  }

  // Filter out common stop words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'can',
    'may',
    'might',
    'must',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'what',
    'which',
    'who',
    'when',
    'where',
    'why',
    'how',
  ]);

  const filteredScores = Array.from(wordScores.entries()).filter(
    ([word]) => !stopWords.has(word) && word.length > 2
  );

  return filteredScores
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}
