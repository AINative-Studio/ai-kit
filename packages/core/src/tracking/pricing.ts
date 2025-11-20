/**
 * Pricing configuration for LLM providers
 * Prices are in USD per 1K tokens
 * Last updated: November 2024
 */

import { LLMProvider, ModelPricing, CostBreakdown } from './types';

/**
 * OpenAI pricing table
 * Source: https://openai.com/pricing
 */
export const OPENAI_PRICING: ModelPricing[] = [
  // GPT-4 Turbo
  {
    model: 'gpt-4-turbo',
    provider: 'openai',
    promptCostPer1k: 0.01,
    completionCostPer1k: 0.03,
  },
  {
    model: 'gpt-4-turbo-preview',
    provider: 'openai',
    promptCostPer1k: 0.01,
    completionCostPer1k: 0.03,
  },
  {
    model: 'gpt-4-1106-preview',
    provider: 'openai',
    promptCostPer1k: 0.01,
    completionCostPer1k: 0.03,
  },
  {
    model: 'gpt-4-0125-preview',
    provider: 'openai',
    promptCostPer1k: 0.01,
    completionCostPer1k: 0.03,
  },
  // GPT-4
  {
    model: 'gpt-4',
    provider: 'openai',
    promptCostPer1k: 0.03,
    completionCostPer1k: 0.06,
  },
  {
    model: 'gpt-4-0613',
    provider: 'openai',
    promptCostPer1k: 0.03,
    completionCostPer1k: 0.06,
  },
  {
    model: 'gpt-4-32k',
    provider: 'openai',
    promptCostPer1k: 0.06,
    completionCostPer1k: 0.12,
  },
  {
    model: 'gpt-4-32k-0613',
    provider: 'openai',
    promptCostPer1k: 0.06,
    completionCostPer1k: 0.12,
  },
  // GPT-3.5 Turbo
  {
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    promptCostPer1k: 0.0005,
    completionCostPer1k: 0.0015,
  },
  {
    model: 'gpt-3.5-turbo-0125',
    provider: 'openai',
    promptCostPer1k: 0.0005,
    completionCostPer1k: 0.0015,
  },
  {
    model: 'gpt-3.5-turbo-1106',
    provider: 'openai',
    promptCostPer1k: 0.001,
    completionCostPer1k: 0.002,
  },
  {
    model: 'gpt-3.5-turbo-16k',
    provider: 'openai',
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.004,
  },
  // Embeddings
  {
    model: 'text-embedding-3-small',
    provider: 'openai',
    promptCostPer1k: 0.00002,
    completionCostPer1k: 0,
  },
  {
    model: 'text-embedding-3-large',
    provider: 'openai',
    promptCostPer1k: 0.00013,
    completionCostPer1k: 0,
  },
  {
    model: 'text-embedding-ada-002',
    provider: 'openai',
    promptCostPer1k: 0.0001,
    completionCostPer1k: 0,
  },
];

/**
 * Anthropic pricing table
 * Source: https://www.anthropic.com/pricing
 */
export const ANTHROPIC_PRICING: ModelPricing[] = [
  // Claude 3 Opus
  {
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
    promptCostPer1k: 0.015,
    completionCostPer1k: 0.075,
  },
  {
    model: 'claude-3-opus',
    provider: 'anthropic',
    promptCostPer1k: 0.015,
    completionCostPer1k: 0.075,
  },
  // Claude 3 Sonnet
  {
    model: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  {
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  // Claude 3.5 Sonnet
  {
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  {
    model: 'claude-3-5-sonnet',
    provider: 'anthropic',
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  // Claude 3 Haiku
  {
    model: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    promptCostPer1k: 0.00025,
    completionCostPer1k: 0.00125,
  },
  {
    model: 'claude-3-haiku',
    provider: 'anthropic',
    promptCostPer1k: 0.00025,
    completionCostPer1k: 0.00125,
  },
  // Claude 2.1
  {
    model: 'claude-2.1',
    provider: 'anthropic',
    promptCostPer1k: 0.008,
    completionCostPer1k: 0.024,
  },
  // Claude 2.0
  {
    model: 'claude-2.0',
    provider: 'anthropic',
    promptCostPer1k: 0.008,
    completionCostPer1k: 0.024,
  },
  // Claude Instant
  {
    model: 'claude-instant-1.2',
    provider: 'anthropic',
    promptCostPer1k: 0.0008,
    completionCostPer1k: 0.0024,
  },
];

/**
 * Combined pricing table for all providers
 */
export const ALL_PRICING: ModelPricing[] = [
  ...OPENAI_PRICING,
  ...ANTHROPIC_PRICING,
];

/**
 * Pricing lookup map for fast access
 */
const PRICING_MAP = new Map<string, ModelPricing>();
ALL_PRICING.forEach((pricing) => {
  PRICING_MAP.set(`${pricing.provider}:${pricing.model}`, pricing);
});

/**
 * Get pricing for a specific model and provider
 */
export function getModelPricing(
  model: string,
  provider: LLMProvider
): ModelPricing | null {
  const key = `${provider}:${model}`;
  return PRICING_MAP.get(key) || null;
}

/**
 * Calculate cost for a request
 */
export function calculateCost(
  model: string,
  provider: LLMProvider,
  promptTokens: number,
  completionTokens: number
): CostBreakdown {
  const pricing = getModelPricing(model, provider);

  if (!pricing) {
    // If pricing not found, return zero cost
    return {
      promptCost: 0,
      completionCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const promptCost = (promptTokens / 1000) * pricing.promptCostPer1k;
  const completionCost = (completionTokens / 1000) * pricing.completionCostPer1k;
  const totalCost = promptCost + completionCost;

  return {
    promptCost,
    completionCost,
    totalCost,
    currency: 'USD',
  };
}

/**
 * Detect provider from model name
 */
export function detectProvider(model: string): LLMProvider {
  const lowerModel = model.toLowerCase();

  if (lowerModel.includes('gpt') || lowerModel.includes('text-embedding')) {
    return 'openai';
  }

  if (lowerModel.includes('claude')) {
    return 'anthropic';
  }

  return 'unknown';
}
