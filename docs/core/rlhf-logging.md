# RLHF Logging System

Complete guide to using the RLHF (Reinforcement Learning from Human Feedback) logging system in AI Kit.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Feedback Types](#feedback-types)
- [Storage Backends](#storage-backends)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Analytics and Insights](#analytics-and-insights)
- [Best Practices](#best-practices)
- [Integration Patterns](#integration-patterns)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Overview

The RLHF Logging system provides a comprehensive solution for capturing user feedback and AI interactions to improve model performance through reinforcement learning from human feedback. It supports multiple feedback types, storage backends, and provides powerful analytics capabilities.

### Key Features

- **Multiple Feedback Types**: Binary (thumbs up/down), ratings, text comments, multi-dimensional, and comparative feedback
- **Flexible Storage**: ZeroDB, local file system, in-memory, or custom backends
- **Batch Processing**: Efficient batch logging for high-throughput scenarios
- **Session Tracking**: Automatic session management and tracking
- **Analytics**: Built-in statistics and analytics for feedback data
- **Export Capabilities**: Export data in JSON, JSONL, CSV, and Parquet formats
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Getting Started

### Installation

```bash
npm install @ai-kit/core
```

### Quick Start

```typescript
import { createRLHFLogger, StorageBackend, BinaryFeedback } from '@ai-kit/core/rlhf';

// Create logger instance
const logger = createRLHFLogger({
  backend: StorageBackend.MEMORY,
  enableBatching: true,
  enableSessionTracking: true,
});

// Initialize
await logger.initialize();

// Log an interaction
const interactionId = await logger.logInteraction(
  'What is the capital of France?',
  'The capital of France is Paris.',
  {
    model: 'gpt-4',
    latency: 250,
    tokenUsage: { prompt: 10, completion: 15, total: 25 },
  }
);

// Log user feedback
await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_UP);

// Get statistics
const stats = await logger.getFeedbackStats();
console.log('Feedback rate:', stats.feedbackRate);

// Close when done
await logger.close();
```

## Core Concepts

### Interactions

An **interaction** represents a single exchange between a user and an AI model. It captures:

- User prompt/input
- AI response/output
- Model information (name, parameters)
- Performance metrics (latency, token usage)
- Conversation context
- Metadata

```typescript
interface InteractionLog {
  id: string;
  prompt: string;
  response: string;
  model?: string;
  modelParams?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    [key: string]: any;
  };
  latency?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  userId?: string;
  sessionId?: string;
  context?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  metadata?: Record<string, any>;
  timestamp: Date;
  feedbackIds?: string[];
}
```

### Feedback

**Feedback** is user input about an AI interaction. It can be:

- Binary (thumbs up/down)
- Numerical rating (1-5 stars)
- Text comments
- Multi-dimensional ratings
- Comparative preferences

```typescript
interface Feedback {
  id: string;
  interactionId: string;
  type: FeedbackType;
  data: FeedbackData;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  source?: string;
}
```

### Sessions

A **session** groups related interactions and feedback together, typically representing a single user session or conversation.

```typescript
interface FeedbackSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  interactionIds: string[];
  feedbackIds: string[];
  metadata?: Record<string, any>;
}
```

## Feedback Types

### 1. Binary Feedback

Simple thumbs up/down feedback for quick user responses.

```typescript
import { BinaryFeedback } from '@ai-kit/core/rlhf';

// Log thumbs up
await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_UP);

// Log thumbs down
await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_DOWN);

// With metadata
await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_UP, {
  userId: 'user123',
  source: 'web',
});
```

**Use Cases:**
- Quick user satisfaction surveys
- A/B testing model responses
- Identifying problematic responses
- Real-time feedback collection

### 2. Rating Feedback

Numerical ratings (typically 1-5 stars) with optional comments.

```typescript
// Simple rating
await logger.logRating(interactionId, 5);

// Rating with comment
await logger.logRating(interactionId, 4, 'Very helpful response!');

// Custom rating scale (1-10)
await logger.logRating(interactionId, 8, 'Great!', {
  maxRating: 10,
});
```

**Use Cases:**
- Detailed satisfaction measurement
- Quality assessment
- Feature evaluation
- User experience tracking

### 3. Text Feedback

Free-form text comments with optional sentiment analysis.

```typescript
// Simple text feedback
await logger.logTextFeedback(
  interactionId,
  'The response was accurate but could be more concise.'
);

// With sentiment
await logger.logTextFeedback(
  interactionId,
  'Excellent explanation!',
  'positive'
);

await logger.logTextFeedback(
  interactionId,
  'This answer is incorrect.',
  'negative'
);
```

**Use Cases:**
- Collecting detailed user opinions
- Identifying specific issues
- Feature requests
- Bug reports

### 4. Multi-Dimensional Feedback

Rate multiple aspects of a response independently.

```typescript
// Multi-dimensional rating
await logger.logMultiDimensionalFeedback(interactionId, {
  accuracy: 5,
  helpfulness: 4,
  clarity: 5,
  completeness: 3,
  tone: 4,
});

// With weights and overall comment
await logger.logMultiDimensionalFeedback(
  interactionId,
  {
    accuracy: 5,
    helpfulness: 4,
    clarity: 5,
  },
  {
    weights: {
      accuracy: 0.5,
      helpfulness: 0.3,
      clarity: 0.2,
    },
    overallComment: 'Great response overall, but could include more examples.',
  }
);
```

**Use Cases:**
- Detailed quality assessment
- Component-level evaluation
- Feature-specific feedback
- Training data labeling

### 5. Comparative Feedback

Compare multiple responses to identify preferences.

```typescript
// Simple comparison
await logger.logComparativeFeedback(preferredId, [alternativeId1, alternativeId2]);

// With reason and confidence
await logger.logComparativeFeedback(
  preferredId,
  [alternativeId1, alternativeId2],
  {
    reason: 'More detailed and accurate',
    confidenceLevel: 0.9, // 0-1 scale
  }
);
```

**Use Cases:**
- A/B testing
- Model comparison
- Response ranking
- Preference learning

## Storage Backends

### Memory Storage

In-memory storage for testing and development.

```typescript
import { StorageBackend } from '@ai-kit/core/rlhf';

const logger = createRLHFLogger({
  backend: StorageBackend.MEMORY,
  backendConfig: {
    memory: {
      maxEntries: 10000, // Maximum entries to keep
    },
  },
});
```

**Pros:**
- Fast performance
- No external dependencies
- Perfect for testing

**Cons:**
- Data lost on restart
- Limited capacity
- Not suitable for production

### Local File Storage

Store data in local files with optional compression.

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.LOCAL,
  backendConfig: {
    local: {
      dataDir: './rlhf-data',
      compress: true,
      maxFileSize: 100, // MB
      rotateFiles: true,
    },
  },
});
```

**Features:**
- JSONL format for easy processing
- Automatic file rotation
- Gzip compression support
- Append-only writes

**Pros:**
- Simple setup
- No external dependencies
- Good for small to medium scale

**Cons:**
- Single-machine only
- Manual backup required
- Limited query capabilities

### ZeroDB Storage

Cloud-based storage with advanced querying capabilities.

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
  backendConfig: {
    zerodb: {
      projectId: 'your-project-id',
      apiKey: process.env.ZERODB_API_KEY,
      tableName: 'rlhf_feedback',
      vectorTableName: 'rlhf_vectors',
    },
  },
});
```

**Features:**
- Cloud-based storage
- Advanced querying
- Vector embeddings support
- Automatic scaling

**Pros:**
- Scalable
- Distributed
- Built-in analytics
- Vector search capabilities

**Cons:**
- Requires network connection
- May incur costs
- Additional configuration

### Custom Storage Backend

Implement your own storage backend.

```typescript
import { IStorageBackend } from '@ai-kit/core/rlhf';

class CustomStorage implements IStorageBackend {
  async initialize(): Promise<void> {
    // Your initialization logic
  }

  async storeInteraction(interaction: InteractionLog): Promise<void> {
    // Your storage logic
  }

  async storeFeedback(feedback: Feedback): Promise<void> {
    // Your storage logic
  }

  // Implement other required methods...
}

const logger = createRLHFLogger({
  backend: StorageBackend.CUSTOM,
  backendConfig: {
    custom: {
      implementation: new CustomStorage(),
      config: {
        // Your custom config
      },
    },
  },
});
```

**Use Cases:**
- Integration with existing databases
- Custom data pipelines
- Specialized storage requirements
- Legacy system integration

## Configuration

### Complete Configuration Options

```typescript
interface RLHFConfig {
  // Storage backend type
  backend: StorageBackend;

  // Backend-specific configuration
  backendConfig?: {
    zerodb?: {
      projectId: string;
      apiKey?: string;
      tableName?: string;
      vectorTableName?: string;
    };
    local?: {
      dataDir: string;
      compress?: boolean;
      maxFileSize?: number;
      rotateFiles?: boolean;
    };
    custom?: {
      implementation: IStorageBackend;
      config?: Record<string, any>;
    };
    memory?: {
      maxEntries?: number;
    };
  };

  // Batch processing
  enableBatching?: boolean; // Default: true
  batchSize?: number; // Default: 50
  batchFlushInterval?: number; // Default: 5000ms

  // Compression
  enableCompression?: boolean; // Default: false

  // ID generation
  autoGenerateIds?: boolean; // Default: true

  // Session tracking
  enableSessionTracking?: boolean; // Default: true
  sessionTimeout?: number; // Default: 1800000ms (30 min)

  // Privacy
  allowAnonymous?: boolean; // Default: true

  // Metadata
  defaultMetadata?: Record<string, any>;

  // Debugging
  debug?: boolean; // Default: false
}
```

### Configuration Examples

#### Production Configuration

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
  backendConfig: {
    zerodb: {
      projectId: process.env.ZERODB_PROJECT_ID!,
      apiKey: process.env.ZERODB_API_KEY,
    },
  },
  enableBatching: true,
  batchSize: 100,
  batchFlushInterval: 10000,
  enableSessionTracking: true,
  sessionTimeout: 3600000, // 1 hour
  defaultMetadata: {
    app: 'my-ai-app',
    version: '1.0.0',
    environment: 'production',
  },
});
```

#### Development Configuration

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.LOCAL,
  backendConfig: {
    local: {
      dataDir: './dev-rlhf-data',
      compress: false,
    },
  },
  enableBatching: false, // Immediate writes for debugging
  debug: true,
});
```

#### Testing Configuration

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.MEMORY,
  enableSessionTracking: false,
  enableBatching: false,
  debug: true,
});
```

## API Reference

### RLHFLogger Class

#### Constructor

```typescript
constructor(config: RLHFConfig)
```

Create a new RLHFLogger instance.

#### initialize()

```typescript
async initialize(): Promise<void>
```

Initialize the logger and storage backend.

#### logInteraction()

```typescript
async logInteraction(
  prompt: string,
  response: string,
  metadata?: {
    model?: string;
    modelParams?: Record<string, any>;
    latency?: number;
    tokenUsage?: { prompt: number; completion: number; total: number };
    userId?: string;
    sessionId?: string;
    context?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    [key: string]: any;
  }
): Promise<string>
```

Log an AI interaction. Returns the interaction ID.

#### logBinaryFeedback()

```typescript
async logBinaryFeedback(
  interactionId: string,
  value: BinaryFeedback,
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string>
```

Log binary (thumbs up/down) feedback. Returns the feedback ID.

#### logRating()

```typescript
async logRating(
  interactionId: string,
  rating: number,
  comment?: string,
  metadata?: {
    maxRating?: number;
    userId?: string;
    sessionId?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string>
```

Log a numerical rating. Returns the feedback ID.

#### logTextFeedback()

```typescript
async logTextFeedback(
  interactionId: string,
  comment: string,
  sentiment?: 'positive' | 'negative' | 'neutral',
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string>
```

Log text feedback. Returns the feedback ID.

#### logMultiDimensionalFeedback()

```typescript
async logMultiDimensionalFeedback(
  interactionId: string,
  dimensions: { [dimensionName: string]: number },
  options?: {
    weights?: { [dimensionName: string]: number };
    overallComment?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string>
```

Log multi-dimensional feedback. Returns the feedback ID.

#### logComparativeFeedback()

```typescript
async logComparativeFeedback(
  preferredResponseId: string,
  comparedResponseIds: string[],
  options?: {
    reason?: string;
    confidenceLevel?: number;
    userId?: string;
    sessionId?: string;
    source?: string;
    [key: string]: any;
  }
): Promise<string>
```

Log comparative feedback. Returns the feedback ID.

#### getFeedbackStats()

```typescript
async getFeedbackStats(
  startTime?: Date,
  endTime?: Date
): Promise<FeedbackStats>
```

Get aggregated feedback statistics.

#### getInteraction()

```typescript
async getInteraction(interactionId: string): Promise<InteractionLog | null>
```

Get an interaction by ID.

#### getFeedback()

```typescript
async getFeedback(feedbackId: string): Promise<Feedback | null>
```

Get feedback by ID.

#### getFeedbackForInteraction()

```typescript
async getFeedbackForInteraction(interactionId: string): Promise<Feedback[]>
```

Get all feedback for a specific interaction.

#### queryFeedback()

```typescript
async queryFeedback(filter: FeedbackFilter): Promise<Feedback[]>
```

Query feedback with filters.

#### exportFeedback()

```typescript
async exportFeedback(
  format: ExportFormat,
  options?: Omit<ExportOptions, 'format'>
): Promise<string | Buffer>
```

Export feedback data in various formats.

#### getAnalytics()

```typescript
async getAnalytics(filter?: FeedbackFilter): Promise<AnalyticsResult>
```

Get comprehensive analytics results.

#### flush()

```typescript
async flush(): Promise<void>
```

Manually flush batch queue.

#### startSession()

```typescript
startSession(userId?: string, metadata?: Record<string, any>): string
```

Start a new feedback session. Returns session ID.

#### endSession()

```typescript
endSession(): FeedbackSession | null
```

End the current session. Returns session data.

#### getCurrentSession()

```typescript
getCurrentSession(): FeedbackSession | null
```

Get the current active session.

#### close()

```typescript
async close(): Promise<void>
```

Close the logger and cleanup resources.

## Usage Examples

### Basic Chatbot Integration

```typescript
import { createRLHFLogger, StorageBackend, BinaryFeedback } from '@ai-kit/core/rlhf';

class AIChat {
  private logger: RLHFLogger;

  constructor() {
    this.logger = createRLHFLogger({
      backend: StorageBackend.LOCAL,
      backendConfig: {
        local: {
          dataDir: './chat-feedback',
        },
      },
    });
  }

  async initialize() {
    await this.logger.initialize();
  }

  async chat(userId: string, message: string): Promise<string> {
    const startTime = Date.now();

    // Get AI response
    const response = await this.getAIResponse(message);
    const latency = Date.now() - startTime;

    // Log interaction
    const interactionId = await this.logger.logInteraction(message, response, {
      model: 'gpt-4',
      latency,
      userId,
    });

    return response;
  }

  async provideFeedback(interactionId: string, liked: boolean) {
    await this.logger.logBinaryFeedback(
      interactionId,
      liked ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN
    );
  }

  private async getAIResponse(message: string): Promise<string> {
    // Your AI implementation
    return 'AI response';
  }
}
```

### Content Moderation System

```typescript
import { createRLHFLogger, FeedbackType } from '@ai-kit/core/rlhf';

class ContentModerator {
  private logger: RLHFLogger;

  constructor() {
    this.logger = createRLHFLogger({
      backend: StorageBackend.ZERODB,
      backendConfig: {
        zerodb: {
          projectId: 'moderation-project',
        },
      },
    });
  }

  async moderateContent(content: string): Promise<{
    decision: 'approve' | 'reject';
    confidence: number;
    interactionId: string;
  }> {
    // Get AI moderation decision
    const decision = await this.getAIDecision(content);

    // Log the moderation
    const interactionId = await this.logger.logInteraction(
      `Moderate: ${content}`,
      decision.decision,
      {
        model: 'moderation-model-v1',
        metadata: {
          confidence: decision.confidence,
        },
      }
    );

    return {
      ...decision,
      interactionId,
    };
  }

  async humanReview(
    interactionId: string,
    humanDecision: 'approve' | 'reject',
    aiDecision: 'approve' | 'reject'
  ) {
    // Log comparative feedback
    if (humanDecision !== aiDecision) {
      await this.logger.logTextFeedback(
        interactionId,
        `AI incorrectly chose ${aiDecision}, should be ${humanDecision}`,
        'negative'
      );
    } else {
      await this.logger.logBinaryFeedback(
        interactionId,
        BinaryFeedback.THUMBS_UP
      );
    }
  }

  private async getAIDecision(content: string) {
    // Your moderation AI
    return { decision: 'approve' as const, confidence: 0.9 };
  }
}
```

### Multi-Model Comparison

```typescript
import { createRLHFLogger } from '@ai-kit/core/rlhf';

class ModelComparison {
  private logger: RLHFLogger;

  constructor() {
    this.logger = createRLHFLogger({
      backend: StorageBackend.ZERODB,
      backendConfig: {
        zerodb: {
          projectId: 'model-comparison',
        },
      },
    });
  }

  async compareModels(prompt: string, models: string[]) {
    const results = [];

    // Get responses from all models
    for (const model of models) {
      const response = await this.getModelResponse(model, prompt);
      const interactionId = await this.logger.logInteraction(prompt, response, {
        model,
      });

      results.push({ model, response, interactionId });
    }

    return results;
  }

  async userPreference(
    preferredId: string,
    otherIds: string[],
    reason: string
  ) {
    await this.logger.logComparativeFeedback(preferredId, otherIds, {
      reason,
      confidenceLevel: 1.0,
    });
  }

  async getWinningModel(): Promise<string> {
    const stats = await this.logger.getFeedbackStats();
    // Analyze comparative feedback to determine best model
    return 'gpt-4'; // Based on feedback analysis
  }

  private async getModelResponse(model: string, prompt: string): Promise<string> {
    // Your model implementation
    return `Response from ${model}`;
  }
}
```

## Analytics and Insights

### Getting Basic Statistics

```typescript
const stats = await logger.getFeedbackStats();

console.log('Total Interactions:', stats.totalInteractions);
console.log('Total Feedback:', stats.totalFeedback);
console.log('Feedback Rate:', (stats.feedbackRate * 100).toFixed(2) + '%');

if (stats.binary) {
  console.log('Thumbs Up:', stats.binary.thumbsUp);
  console.log('Thumbs Down:', stats.binary.thumbsDown);
  console.log('Positive Ratio:', (stats.binary.ratio * 100).toFixed(2) + '%');
}

if (stats.rating) {
  console.log('Average Rating:', stats.rating.average.toFixed(2));
  console.log('Median Rating:', stats.rating.median);
}
```

### Time-Range Analysis

```typescript
// Last 7 days
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const now = new Date();

const weeklyStats = await logger.getFeedbackStats(lastWeek, now);

console.log('Weekly feedback rate:', weeklyStats.feedbackRate);
```

### Filtering and Querying

```typescript
// Get all negative feedback
const negativeFeedback = await logger.queryFeedback({
  types: [FeedbackType.RATING, FeedbackType.TEXT],
  maxRating: 2,
  startTime: new Date('2024-01-01'),
});

// Analyze common issues
negativeFeedback.forEach(feedback => {
  if (feedback.type === FeedbackType.TEXT) {
    console.log('Issue:', (feedback.data as any).comment);
  }
});
```

### Exporting for Analysis

```typescript
// Export to JSON for ML training
const jsonData = await logger.exportFeedback(ExportFormat.JSON, {
  startTime: new Date('2024-01-01'),
  includeInteractions: true,
  includeFeedback: true,
});

// Save to file
await fs.writeFile('training-data.json', jsonData);

// Export to CSV for spreadsheet analysis
const csvData = await logger.exportFeedback(ExportFormat.CSV);
await fs.writeFile('feedback-report.csv', csvData);
```

## Best Practices

### 1. Session Management

Always use sessions to group related interactions:

```typescript
// Start session when user logs in
const sessionId = logger.startSession(userId);

// All interactions will be associated with this session
await logger.logInteraction(prompt, response);

// End session when user logs out
logger.endSession();
```

### 2. Batch Processing

Enable batching for high-throughput scenarios:

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
  enableBatching: true,
  batchSize: 100,
  batchFlushInterval: 10000,
});
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  await logger.logInteraction(prompt, response);
} catch (error) {
  console.error('Failed to log interaction:', error);
  // Continue operation - logging failures shouldn't break your app
}
```

### 4. Privacy Considerations

Respect user privacy:

```typescript
// Allow anonymous feedback
const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
  allowAnonymous: true,
});

// Don't log sensitive information
await logger.logInteraction(
  sanitizePrompt(userInput), // Remove PII
  response
);
```

### 5. Regular Cleanup

Implement data retention policies:

```typescript
// Delete old data periodically
const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
// Implement cleanup based on your storage backend
```

## Integration Patterns

### Express.js Middleware

```typescript
import express from 'express';
import { createRLHFLogger } from '@ai-kit/core/rlhf';

const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
});

await logger.initialize();

app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;

  const response = await getAIResponse(message);
  const interactionId = await logger.logInteraction(message, response, {
    userId,
  });

  res.json({ response, interactionId });
});

app.post('/api/feedback', async (req, res) => {
  const { interactionId, rating, comment } = req.body;

  await logger.logRating(interactionId, rating, comment);

  res.json({ success: true });
});
```

### React Hook

```typescript
import { useState, useEffect } from 'react';
import { createRLHFLogger, BinaryFeedback } from '@ai-kit/core/rlhf';

export function useRLHF() {
  const [logger, setLogger] = useState<RLHFLogger | null>(null);

  useEffect(() => {
    const initLogger = async () => {
      const rlhfLogger = createRLHFLogger({
        backend: StorageBackend.MEMORY,
      });
      await rlhfLogger.initialize();
      setLogger(rlhfLogger);
    };

    initLogger();

    return () => {
      logger?.close();
    };
  }, []);

  const logInteraction = async (prompt: string, response: string) => {
    if (!logger) return null;
    return await logger.logInteraction(prompt, response);
  };

  const logFeedback = async (interactionId: string, liked: boolean) => {
    if (!logger) return;
    await logger.logBinaryFeedback(
      interactionId,
      liked ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN
    );
  };

  return { logInteraction, logFeedback };
}
```

## Performance Optimization

### 1. Use Batching

```typescript
// Enable batching for better throughput
const logger = createRLHFLogger({
  backend: StorageBackend.ZERODB,
  enableBatching: true,
  batchSize: 100,
  batchFlushInterval: 5000,
});
```

### 2. Optimize Storage Backend

Choose the right backend for your scale:

- **Memory**: < 10K interactions
- **Local**: < 1M interactions
- **ZeroDB**: Unlimited scale

### 3. Limit Context Size

Don't log excessive context:

```typescript
// Instead of logging full conversation history
const interaction = await logger.logInteraction(prompt, response, {
  context: fullConversation, // Could be huge!
});

// Log only recent context
const interaction = await logger.logInteraction(prompt, response, {
  context: recentMessages.slice(-5), // Last 5 messages only
});
```

### 4. Implement Sampling

For very high traffic, sample interactions:

```typescript
// Only log 10% of interactions
if (Math.random() < 0.1) {
  await logger.logInteraction(prompt, response);
}
```

## Troubleshooting

### Common Issues

#### 1. "Custom storage backend implementation required"

**Cause**: Using `StorageBackend.CUSTOM` without providing implementation.

**Solution**:
```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.CUSTOM,
  backendConfig: {
    custom: {
      implementation: new MyCustomStorage(),
    },
  },
});
```

#### 2. "Interaction ID required when autoGenerateIds is disabled"

**Cause**: `autoGenerateIds: false` but no ID provided.

**Solution**:
```typescript
// Either enable auto-generation
const logger = createRLHFLogger({
  backend: StorageBackend.MEMORY,
  autoGenerateIds: true,
});

// Or provide IDs manually
await logger.logInteraction(prompt, response, {
  id: 'custom-id-123',
});
```

#### 3. Rating validation errors

**Cause**: Rating outside valid range.

**Solution**:
```typescript
// Ensure rating is within range
const rating = Math.max(1, Math.min(5, userRating));
await logger.logRating(interactionId, rating);
```

### Debug Mode

Enable debug logging:

```typescript
const logger = createRLHFLogger({
  backend: StorageBackend.MEMORY,
  debug: true, // Enables console logging
});
```

### Performance Monitoring

Monitor logger performance:

```typescript
const startTime = Date.now();
await logger.logInteraction(prompt, response);
const logTime = Date.now() - startTime;

if (logTime > 100) {
  console.warn('Slow logging detected:', logTime, 'ms');
}
```

## Summary

The RLHF Logging system provides a comprehensive solution for capturing and analyzing user feedback in AI applications. Key takeaways:

1. **Multiple feedback types** support different use cases
2. **Flexible storage backends** scale from development to production
3. **Built-in analytics** provide actionable insights
4. **Session tracking** groups related interactions
5. **Batch processing** optimizes for high throughput
6. **Type-safe API** ensures correctness

For more information, see the API reference and examples in the codebase.
