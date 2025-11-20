/**
 * Core types for prompt testing and evaluation
 */

export interface PromptConfig {
  name: string;
  version: string;
  prompts: PromptVariant[];
  test_cases?: TestCase[];
  models?: ModelConfig[];
  defaults?: PromptDefaults;
}

export interface PromptVariant {
  id: string;
  content: string;
  parameters?: PromptParameters;
  metadata?: Record<string, any>;
}

export interface PromptParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface PromptDefaults {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface TestCase {
  input: string;
  expected_topics?: string[];
  expected_keywords?: string[];
  expected_format?: string;
  metadata?: Record<string, any>;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface';
  model: string;
  api_key?: string;
}

export interface PromptTestResult {
  id: string;
  prompt_id: string;
  input: string;
  output: string;
  model: string;
  parameters: PromptParameters;
  metrics: PromptMetrics;
  timestamp: Date;
  error?: string;
}

export interface PromptMetrics {
  tokens_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
  quality_score?: number;
}

export interface ComparisonResult {
  prompts: PromptVariant[];
  results: PromptTestResult[];
  comparison: ComparisonMetrics;
  winner?: string;
}

export interface ComparisonMetrics {
  token_comparison: Record<string, number>;
  cost_comparison: Record<string, number>;
  latency_comparison: Record<string, number>;
  quality_comparison?: Record<string, number>;
}

export interface OptimizationSuggestion {
  type: 'structure' | 'clarity' | 'efficiency' | 'best_practice';
  severity: 'low' | 'medium' | 'high';
  message: string;
  before: string;
  after: string;
  impact?: string;
}

export interface OptimizationResult {
  original_prompt: string;
  optimized_prompt: string;
  suggestions: OptimizationSuggestion[];
  improvement_metrics?: {
    estimated_token_reduction: number;
    estimated_cost_reduction: number;
    clarity_improvement: number;
  };
}

export interface BatchTestResult {
  total: number;
  completed: number;
  failed: number;
  results: PromptTestResult[];
  aggregate_metrics: {
    avg_tokens: number;
    avg_cost: number;
    avg_latency: number;
    total_cost: number;
  };
}

export interface HistoryEntry {
  id: string;
  prompt_name: string;
  prompt_version: string;
  test_type: 'single' | 'compare' | 'optimize' | 'batch';
  results: PromptTestResult | ComparisonResult | OptimizationResult | BatchTestResult;
  timestamp: Date;
  tags?: string[];
}

export interface HistoryFilter {
  prompt_name?: string;
  test_type?: string;
  date_from?: Date;
  date_to?: Date;
  tags?: string[];
  limit?: number;
}

export interface StreamOptions {
  onToken?: (token: string) => void;
  onComplete?: (result: PromptTestResult) => void;
  onError?: (error: Error) => void;
}
