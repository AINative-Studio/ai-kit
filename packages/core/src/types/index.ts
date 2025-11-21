/**
 * Core types for AI Kit
 * Comprehensive type exports for all AI Kit functionality
 */

// Common shared types (single source of truth)
export * from './common.d';

// Type utilities
export * from './utils';

// Streaming types
export * from './streaming.d';

// Agent types
export * from './agents.d';

// Tool types
export * from './tools.d';

// Model types
export * from './models.d';

// Error types
export * from './errors.d';

// Configuration types
export * from './config.d';

// Legacy type re-exports for backwards compatibility
import type { Message, Usage, StreamConfig, StreamResult, StreamOptions } from './streaming.d';
export type { Message, Usage, StreamConfig, StreamResult, StreamOptions };
