/**
 * LLM Model type definitions for AI Kit
 * Comprehensive types for language models and model management
 */

import type { ModelId, JsonValue, Brand } from './utils';
import type { UsageStats } from './streaming';

// ============================================================================
// Model Identifiers and Categories
// ============================================================================

/**
 * Model provider
 */
export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'cohere'
  | 'mistral'
  | 'huggingface'
  | 'azure'
  | 'aws'
  | 'local'
  | 'custom';

/**
 * Model category
 */
export type ModelCategory =
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'image'
  | 'audio'
  | 'video'
  | 'multimodal'
  | 'code'
  | 'reasoning';

/**
 * Model size category
 */
export type ModelSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Model capability
 */
export type ModelCapability =
  | 'chat'
  | 'streaming'
  | 'function-calling'
  | 'vision'
  | 'audio'
  | 'code'
  | 'reasoning'
  | 'embeddings'
  | 'fine-tuning';

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Model configuration
 */
export interface ModelConfig {
  readonly id: ModelId;
  readonly name: string;
  readonly provider: ModelProvider;
  readonly category: ModelCategory;
  readonly version?: string;
  readonly capabilities: readonly ModelCapability[];
  readonly contextWindow: number; // max tokens
  readonly maxOutputTokens: number;
  readonly inputCostPer1kTokens?: number; // in USD
  readonly outputCostPer1kTokens?: number; // in USD
  readonly supportedLanguages?: readonly string[];
  readonly defaultParameters?: ModelParameters;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Model parameters
 */
export interface ModelParameters {
  readonly temperature?: number; // 0-2
  readonly topP?: number; // 0-1
  readonly topK?: number;
  readonly frequencyPenalty?: number; // -2 to 2
  readonly presencePenalty?: number; // -2 to 2
  readonly maxTokens?: number;
  readonly stop?: readonly string[];
  readonly seed?: number;
  readonly responseFormat?: ResponseFormat;
  readonly logitBias?: Record<string, number>;
  readonly n?: number; // number of completions
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Response format
 */
export interface ResponseFormat {
  readonly type: 'text' | 'json_object' | 'json_schema';
  readonly schema?: JsonValue; // JSON Schema
}

// ============================================================================
// Model Endpoints and Authentication
// ============================================================================

/**
 * Model endpoint configuration
 */
export interface ModelEndpoint {
  readonly url: string;
  readonly method?: 'GET' | 'POST';
  readonly headers?: Record<string, string>;
  readonly authentication: ModelAuthentication;
  readonly timeout?: number; // milliseconds
  readonly retryConfig?: RetryConfig;
}

/**
 * Model authentication
 */
export interface ModelAuthentication {
  readonly type: 'none' | 'bearer' | 'api-key' | 'oauth2' | 'custom';
  readonly credentials?: ModelCredentials;
  readonly headerName?: string; // For API key authentication
}

/**
 * Model credentials
 */
export interface ModelCredentials {
  readonly apiKey?: string;
  readonly token?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  readonly maxRetries: number;
  readonly initialDelay: number; // milliseconds
  readonly maxDelay: number; // milliseconds
  readonly backoff: 'linear' | 'exponential';
  readonly retryableStatusCodes?: readonly number[];
}

// ============================================================================
// Model Selection and Routing
// ============================================================================

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  readonly provider?: ModelProvider;
  readonly category?: ModelCategory;
  readonly capabilities?: readonly ModelCapability[];
  readonly minContextWindow?: number;
  readonly maxCost?: number; // cost per 1k tokens
  readonly preferredModels?: readonly ModelId[];
  readonly excludedModels?: readonly ModelId[];
  readonly size?: ModelSize;
}

/**
 * Model selector interface
 */
export interface ModelSelector {
  select(criteria: ModelSelectionCriteria): ModelId | null;
  selectMultiple(criteria: ModelSelectionCriteria, count: number): readonly ModelId[];
  rank(criteria: ModelSelectionCriteria): readonly ModelRanking[];
}

/**
 * Model ranking result
 */
export interface ModelRanking {
  readonly modelId: ModelId;
  readonly score: number; // 0-1
  readonly reasons: readonly string[];
  readonly matchedCriteria: readonly string[];
}

/**
 * Model router configuration
 */
export interface ModelRouterConfig {
  readonly strategy: RoutingStrategy;
  readonly fallbackModel?: ModelId;
  readonly loadBalancing?: LoadBalancingConfig;
  readonly costOptimization?: boolean;
  readonly qualityThreshold?: number; // 0-1
}

/**
 * Routing strategy
 */
export type RoutingStrategy =
  | 'cheapest' // Select cheapest model
  | 'fastest' // Select fastest model
  | 'best-quality' // Select highest quality model
  | 'balanced' // Balance cost/speed/quality
  | 'round-robin' // Rotate through models
  | 'least-loaded' // Select least busy model
  | 'custom';

/**
 * Load balancing configuration
 */
export interface LoadBalancingConfig {
  readonly algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  readonly weights?: Record<ModelId, number>;
  readonly healthCheck?: boolean;
  readonly healthCheckInterval?: number; // milliseconds
}

// ============================================================================
// Model Performance and Monitoring
// ============================================================================

/**
 * Model performance metrics
 */
export interface ModelPerformanceMetrics {
  readonly modelId: ModelId;
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly averageLatency: number; // milliseconds
  readonly p50Latency: number;
  readonly p95Latency: number;
  readonly p99Latency: number;
  readonly averageTokensPerSecond: number;
  readonly totalTokensUsed: number;
  readonly totalCost: number;
  readonly errorRate: number; // 0-1
  readonly availability: number; // 0-1
  readonly lastUpdated: number; // timestamp
}

/**
 * Model health status
 */
export interface ModelHealthStatus {
  readonly modelId: ModelId;
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  readonly responseTime?: number; // milliseconds
  readonly errorRate?: number; // 0-1
  readonly lastCheck: number; // timestamp
  readonly issues?: readonly string[];
}

/**
 * Model usage statistics
 */
export interface ModelUsageStatistics {
  readonly modelId: ModelId;
  readonly period: TimePeriod;
  readonly requestCount: number;
  readonly tokenCount: number;
  readonly cost: number;
  readonly breakdown: UsageBreakdown;
}

/**
 * Time period for statistics
 */
export interface TimePeriod {
  readonly start: number; // timestamp
  readonly end: number; // timestamp
  readonly duration: number; // milliseconds
}

/**
 * Usage breakdown
 */
export interface UsageBreakdown {
  readonly byDay?: Record<string, UsageStats>;
  readonly byUser?: Record<string, UsageStats>;
  readonly byAgent?: Record<string, UsageStats>;
  readonly byOperation?: Record<string, UsageStats>;
}

// ============================================================================
// Model Comparison and Benchmarking
// ============================================================================

/**
 * Model comparison request
 */
export interface ModelComparisonRequest {
  readonly models: readonly ModelId[];
  readonly prompt: string;
  readonly parameters?: ModelParameters;
  readonly criteria: readonly ComparisonCriterion[];
}

/**
 * Comparison criterion
 */
export type ComparisonCriterion =
  | 'accuracy'
  | 'speed'
  | 'cost'
  | 'quality'
  | 'consistency'
  | 'creativity';

/**
 * Model comparison result
 */
export interface ModelComparisonResult {
  readonly models: readonly ModelId[];
  readonly results: readonly ModelResult[];
  readonly rankings: Record<ComparisonCriterion, readonly ModelId[]>;
  readonly winner?: ModelId;
  readonly analysis: string;
}

/**
 * Individual model result in comparison
 */
export interface ModelResult {
  readonly modelId: ModelId;
  readonly output: string;
  readonly duration: number; // milliseconds
  readonly cost: number;
  readonly tokenCount: number;
  readonly scores: Record<ComparisonCriterion, number>; // 0-1
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  readonly name: string;
  readonly description?: string;
  readonly prompts: readonly string[];
  readonly models: readonly ModelId[];
  readonly parameters?: ModelParameters;
  readonly metrics: readonly ComparisonCriterion[];
  readonly iterations?: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  readonly config: BenchmarkConfig;
  readonly results: readonly ModelComparisonResult[];
  readonly summary: BenchmarkSummary;
  readonly timestamp: number;
}

/**
 * Benchmark summary
 */
export interface BenchmarkSummary {
  readonly overall: Record<ModelId, number>; // Average score 0-1
  readonly byMetric: Record<ComparisonCriterion, Record<ModelId, number>>;
  readonly winner: ModelId;
  readonly recommendations: readonly string[];
}

// ============================================================================
// Model Versioning and Deprecation
// ============================================================================

/**
 * Model version
 */
export interface ModelVersion {
  readonly version: string;
  readonly releaseDate: number; // timestamp
  readonly deprecationDate?: number; // timestamp
  readonly endOfLifeDate?: number; // timestamp
  readonly changes?: readonly string[];
  readonly breaking?: boolean;
  readonly stable: boolean;
}

/**
 * Model lifecycle stage
 */
export type ModelLifecycleStage =
  | 'preview'
  | 'beta'
  | 'stable'
  | 'deprecated'
  | 'end-of-life';

/**
 * Model deprecation notice
 */
export interface DeprecationNotice {
  readonly modelId: ModelId;
  readonly stage: ModelLifecycleStage;
  readonly deprecationDate: number; // timestamp
  readonly endOfLifeDate: number; // timestamp
  readonly migrationGuide?: string;
  readonly replacementModels?: readonly ModelId[];
  readonly reason?: string;
}

// ============================================================================
// Model Registry
// ============================================================================

/**
 * Model registry interface
 */
export interface ModelRegistry {
  // Registration
  register(config: ModelConfig): void;
  unregister(modelId: ModelId): void;
  update(modelId: ModelId, updates: Partial<ModelConfig>): void;

  // Retrieval
  get(modelId: ModelId): ModelConfig | undefined;
  getAll(): readonly ModelConfig[];
  getByProvider(provider: ModelProvider): readonly ModelConfig[];
  getByCategory(category: ModelCategory): readonly ModelConfig[];
  getByCapability(capability: ModelCapability): readonly ModelConfig[];

  // Search
  search(query: string): readonly ModelConfig[];
  filter(predicate: (config: ModelConfig) => boolean): readonly ModelConfig[];

  // Status
  has(modelId: ModelId): boolean;
  count(): number;
  getAvailable(): readonly ModelConfig[];
  getDeprecated(): readonly DeprecationNotice[];
}

// ============================================================================
// Model Provider Interfaces
// ============================================================================

/**
 * Model provider interface
 */
export interface ModelProviderInterface {
  readonly provider: ModelProvider;
  readonly models: readonly ModelConfig[];

  // Execution
  complete(
    modelId: ModelId,
    prompt: string,
    parameters?: ModelParameters
  ): Promise<CompletionResponse>;

  stream(
    modelId: ModelId,
    prompt: string,
    parameters?: ModelParameters
  ): AsyncIterableIterator<CompletionChunk>;

  embed(modelId: ModelId, input: string | readonly string[]): Promise<EmbeddingResponse>;

  // Management
  listModels(): Promise<readonly ModelConfig[]>;
  getModel(modelId: ModelId): Promise<ModelConfig>;
  validateApiKey(): Promise<boolean>;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  readonly id: string;
  readonly model: ModelId;
  readonly choices: readonly CompletionChoice[];
  readonly usage: UsageStats;
  readonly created: number; // timestamp
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Completion choice
 */
export interface CompletionChoice {
  readonly index: number;
  readonly text: string;
  readonly finishReason: FinishReason;
  readonly logprobs?: LogProbs;
}

/**
 * Finish reason
 */
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'function_call' | 'tool_calls';

/**
 * Log probabilities
 */
export interface LogProbs {
  readonly tokens: readonly string[];
  readonly tokenLogprobs: readonly number[];
  readonly topLogprobs?: readonly Record<string, number>[];
  readonly textOffset: readonly number[];
}

/**
 * Completion chunk (for streaming)
 */
export interface CompletionChunk {
  readonly id: string;
  readonly model: ModelId;
  readonly delta: string;
  readonly finishReason?: FinishReason;
  readonly index: number;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  readonly model: ModelId;
  readonly embeddings: readonly Embedding[];
  readonly usage: UsageStats;
}

/**
 * Single embedding
 */
export interface Embedding {
  readonly index: number;
  readonly embedding: readonly number[];
  readonly object: 'embedding';
}

// ============================================================================
// Model Caching
// ============================================================================

/**
 * Model cache configuration
 */
export interface ModelCacheConfig {
  readonly enabled: boolean;
  readonly ttl: number; // seconds
  readonly maxSize?: number; // max items
  readonly strategy: 'lru' | 'lfu' | 'ttl';
  readonly keyGenerator?: (prompt: string, params: ModelParameters) => string;
}

/**
 * Cached response metadata
 */
export interface CachedResponseMetadata {
  readonly cached: true;
  readonly cachedAt: number; // timestamp
  readonly expiresAt: number; // timestamp
  readonly hits: number;
}

// ============================================================================
// Fine-tuning Support
// ============================================================================

/**
 * Fine-tuning job configuration
 */
export interface FineTuningConfig {
  readonly baseModel: ModelId;
  readonly trainingData: string; // File path or URL
  readonly validationData?: string;
  readonly hyperparameters?: FineTuningHyperparameters;
  readonly suffix?: string;
}

/**
 * Fine-tuning hyperparameters
 */
export interface FineTuningHyperparameters {
  readonly nEpochs?: number;
  readonly batchSize?: number;
  readonly learningRateMultiplier?: number;
  readonly promptLossWeight?: number;
}

/**
 * Fine-tuning job status
 */
export interface FineTuningJob {
  readonly id: string;
  readonly status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  readonly createdAt: number;
  readonly finishedAt?: number;
  readonly fineTunedModel?: ModelId;
  readonly error?: string;
  readonly metrics?: FineTuningMetrics;
}

/**
 * Fine-tuning metrics
 */
export interface FineTuningMetrics {
  readonly trainLoss?: number;
  readonly validLoss?: number;
  readonly trainAccuracy?: number;
  readonly validAccuracy?: number;
  readonly steps: number;
}
