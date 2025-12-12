import { AIProvider } from '@ainative/ai-kit-core';

/**
 * Example utility function that uses AI Kit
 * This demonstrates how to build a library on top of AI Kit
 */
export async function generateText(
  provider: AIProvider,
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await provider.generate({
    prompt,
    maxTokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.7,
  });

  return response.text;
}

/**
 * Example class-based approach for AI Kit library
 */
export class AIHelper {
  constructor(private provider: AIProvider) {}

  async summarize(text: string): Promise<string> {
    return generateText(
      this.provider,
      `Please summarize the following text:\n\n${text}`
    );
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    return generateText(
      this.provider,
      `Translate the following text to ${targetLanguage}:\n\n${text}`
    );
  }

  async analyze(text: string): Promise<string> {
    return generateText(
      this.provider,
      `Analyze the sentiment and key points in the following text:\n\n${text}`
    );
  }
}

/**
 * Example types for your library
 */
export interface AILibraryConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

/**
 * Re-export commonly used types from AI Kit
 */
export type { AIProvider } from '@ainative/ai-kit-core';
