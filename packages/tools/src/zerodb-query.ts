/**
 * ZeroDB Query Tool
 *
 * Converts natural language queries to ZeroDB API calls and returns formatted results.
 * Supports querying tables, vectors, files, and events with intelligent query parsing.
 */

import { z } from 'zod';

/**
 * Query types supported by ZeroDB
 */
export enum QueryType {
  TABLE_QUERY = 'table_query',
  TABLE_LIST = 'table_list',
  VECTOR_SEARCH = 'vector_search',
  VECTOR_LIST = 'vector_list',
  FILE_LIST = 'file_list',
  EVENT_LIST = 'event_list',
  PROJECT_INFO = 'project_info',
  DATABASE_STATUS = 'database_status',
}

/**
 * Query result formats
 */
export enum ResultFormat {
  JSON = 'json',
  TABLE = 'table',
  LIST = 'list',
  SUMMARY = 'summary',
}

/**
 * ZeroDB client configuration
 */
export interface ZeroDBConfig {
  apiKey?: string;
  jwtToken?: string;
  baseURL?: string;
  timeout?: number;
  projectId?: string;
}

/**
 * Parsed query structure
 */
export interface ParsedQuery {
  type: QueryType;
  operation: string;
  parameters: Record<string, any>;
  confidence: number;
}

/**
 * Query result with metadata
 */
export interface QueryResult {
  success: boolean;
  data: any;
  metadata: {
    queryType: QueryType;
    executionTimeMs: number;
    rowCount?: number;
    format: ResultFormat;
  };
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Mock ZeroDB client for testing
 * In production, this would use the actual ZeroDB SDK
 */
class MockZeroDBClient {
  private config: Required<ZeroDBConfig>;

  constructor(config: ZeroDBConfig) {
    this.config = {
      apiKey: config.apiKey || '',
      jwtToken: config.jwtToken || '',
      baseURL: config.baseURL || 'https://api.ainative.studio',
      timeout: config.timeout || 30000,
      projectId: config.projectId || '',
    };

    if (!this.config.apiKey && !this.config.jwtToken) {
      throw new Error('Either apiKey or jwtToken must be provided');
    }
  }

  async request(endpoint: string, method: string = 'GET', _data?: any): Promise<any> {
    // Mock implementation - would make actual HTTP requests in production
    return {
      success: true,
      data: [],
      message: `Mock response for ${method} ${endpoint}`,
    };
  }

  async queryTable(projectId: string, tableName: string, filter?: any, limit?: number): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${projectId}/database/tables/${tableName}/query`,
      'POST',
      { filter, limit }
    );
  }

  async listTables(projectId: string): Promise<any> {
    return this.request(`/api/v1/zerodb/${projectId}/database/tables`, 'GET');
  }

  async searchVectors(projectId: string, queryVector: number[], topK: number = 10): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${projectId}/vectors/search`,
      'POST',
      { query_vector: queryVector, top_k: topK }
    );
  }

  async listVectors(projectId: string, limit: number = 100, offset: number = 0): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${projectId}/vectors?limit=${limit}&offset=${offset}`,
      'GET'
    );
  }

  async listFiles(projectId: string): Promise<any> {
    return this.request(`/api/v1/zerodb/${projectId}/files`, 'GET');
  }

  async listEvents(projectId: string, topic?: string): Promise<any> {
    const url = topic
      ? `/api/v1/zerodb/${projectId}/events?topic=${topic}`
      : `/api/v1/zerodb/${projectId}/events`;
    return this.request(url, 'GET');
  }

  async getProjectInfo(projectId: string): Promise<any> {
    return this.request(`/api/v1/zerodb/${projectId}`, 'GET');
  }

  async getDatabaseStatus(projectId: string): Promise<any> {
    return this.request(`/api/v1/zerodb/${projectId}/database/status`, 'GET');
  }
}

/**
 * Natural language query parser
 */
export class QueryParser {
  /**
   * Parse natural language query to structured query
   */
  static parse(naturalLanguage: string): ParsedQuery {
    // Normalize whitespace: trim and collapse multiple spaces
    const nl = naturalLanguage.toLowerCase().trim().replace(/\s+/g, ' ');

    // TABLE_LIST patterns (check before TABLE_QUERY to avoid false positives)
    if (
      nl.includes('list tables') ||
      nl.includes('show tables') ||
      nl.includes('what tables') ||
      nl === 'tables'
    ) {
      return {
        type: QueryType.TABLE_LIST,
        operation: 'list_tables',
        parameters: {},
        confidence: 0.95,
      };
    }

    // VECTOR_SEARCH patterns (check before TABLE_QUERY to avoid "find" conflict)
    if (
      nl.includes('search vector') ||
      nl.includes('similar to') ||
      nl.includes('semantic search') ||
      nl.includes('find similar')
    ) {
      return {
        type: QueryType.VECTOR_SEARCH,
        operation: 'search_vectors',
        parameters: {
          topK: this.extractLimit(nl) || 10,
        },
        confidence: 0.9,
      };
    }

    // TABLE_QUERY patterns (check after specific patterns)
    if (
      nl.includes('select') ||
      nl.includes('query') ||
      nl.includes('find') ||
      nl.includes('get') ||
      nl.includes('from')
    ) {
      const tableName = this.extractTableName(nl);
      const filter = this.extractFilter(nl);
      const limit = this.extractLimit(nl);

      return {
        type: QueryType.TABLE_QUERY,
        operation: 'query_table',
        parameters: {
          tableName,
          filter,
          limit,
        },
        confidence: tableName ? 0.85 : 0.5,
      };
    }

    // VECTOR_LIST patterns
    if (nl.includes('list vectors') || nl.includes('show vectors')) {
      return {
        type: QueryType.VECTOR_LIST,
        operation: 'list_vectors',
        parameters: {
          limit: this.extractLimit(nl) || 100,
          offset: this.extractOffset(nl) || 0,
        },
        confidence: 0.95,
      };
    }

    // FILE_LIST patterns
    if (nl.includes('list files') || nl.includes('show files') || nl === 'files') {
      return {
        type: QueryType.FILE_LIST,
        operation: 'list_files',
        parameters: {},
        confidence: 0.95,
      };
    }

    // EVENT_LIST patterns
    if (nl.includes('list events') || nl.includes('show events') || nl === 'events') {
      const topic = this.extractTopic(nl);
      return {
        type: QueryType.EVENT_LIST,
        operation: 'list_events',
        parameters: { topic },
        confidence: 0.95,
      };
    }

    // PROJECT_INFO patterns
    if (
      nl.includes('project info') ||
      nl.includes('project details') ||
      nl.includes('describe project')
    ) {
      return {
        type: QueryType.PROJECT_INFO,
        operation: 'get_project_info',
        parameters: {},
        confidence: 0.95,
      };
    }

    // DATABASE_STATUS patterns
    if (
      nl.includes('database status') ||
      nl.includes('db status') ||
      nl.includes('storage usage')
    ) {
      return {
        type: QueryType.DATABASE_STATUS,
        operation: 'get_database_status',
        parameters: {},
        confidence: 0.95,
      };
    }

    // Default: assume table query
    return {
      type: QueryType.TABLE_QUERY,
      operation: 'query_table',
      parameters: {
        tableName: this.extractTableName(nl),
      },
      confidence: 0.3,
    };
  }

  private static extractTableName(nl: string): string | undefined {
    // Match patterns like "from users", "table users", "users table"
    const patterns = [
      /from\s+(\w+)/,
      /table\s+(\w+)/,
      /(\w+)\s+table/,
      /in\s+(\w+)/,
    ];

    for (const pattern of patterns) {
      const match = nl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  private static extractFilter(nl: string): Record<string, any> | undefined {
    // Simple filter extraction for common patterns
    const filters: Record<string, any> = {};

    // Match "where key=value"
    const whereMatch = nl.match(/where\s+(\w+)\s*=\s*['"']?(\w+)['"']?/);
    if (whereMatch && whereMatch[1] && whereMatch[2]) {
      filters[whereMatch[1]] = whereMatch[2];
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private static extractLimit(nl: string): number | undefined {
    // Match patterns like "limit 10", "top 5", "first 20"
    const patterns = [
      /limit\s+(\d+)/,
      /top\s+(\d+)/,
      /first\s+(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = nl.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  private static extractOffset(nl: string): number | undefined {
    const match = nl.match(/offset\s+(\d+)/);
    const offset = match?.[1]
    return offset ? parseInt(offset, 10) : undefined;
  }

  private static extractTopic(nl: string): string | undefined {
    const match = nl.match(/topic\s+['"']?(\w+)['"']?/);
    return match?.[1];
  }
}

/**
 * Result formatter
 */
export class ResultFormatter {
  /**
   * Format query results based on format type
   */
  static format(data: any, format: ResultFormat = ResultFormat.JSON): string {
    switch (format) {
      case ResultFormat.JSON:
        return this.formatJSON(data);
      case ResultFormat.TABLE:
        return this.formatTable(data);
      case ResultFormat.LIST:
        return this.formatList(data);
      case ResultFormat.SUMMARY:
        return this.formatSummary(data);
      default:
        return this.formatJSON(data);
    }
  }

  private static formatJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private static formatTable(data: any): string {
    if (data === null || data === undefined) {
      return 'No data available';
    }

    // Convert to array if single object
    const rows = Array.isArray(data) ? data : [data];

    if (rows.length === 0) {
      return 'No data available';
    }

    const columns = Object.keys(rows[0]);

    // Calculate column widths
    const widths = columns.map((col) => {
      const maxDataWidth = Math.max(
        ...rows.map((row) => String(row[col] || '').length)
      );
      return Math.max(col.length, maxDataWidth);
    });

    // Build header
    const header = columns.map((col, i) => col.padEnd(widths[i] || 0)).join(' | ');
    const separator = widths.map((w) => '-'.repeat(w || 0)).join('-+-');

    // Build rows
    const tableRows = rows.map((row) =>
      columns.map((col, i) => String(row[col] || '').padEnd(widths[i] || 0)).join(' | ')
    );

    return [header, separator, ...tableRows].join('\n');
  }

  private static formatList(data: any): string {
    if (!Array.isArray(data)) {
      return String(data);
    }

    return data.map((item, index) => `${index + 1}. ${JSON.stringify(item)}`).join('\n');
  }

  private static formatSummary(data: any): string {
    if (Array.isArray(data)) {
      return `Found ${data.length} result(s)`;
    }

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      return `Object with ${keys.length} field(s): ${keys.join(', ')}`;
    }

    return String(data);
  }
}

/**
 * ZeroDB Query Tool
 *
 * Main tool class for executing natural language queries against ZeroDB
 */
export class ZeroDBQueryTool {
  private client: MockZeroDBClient;
  private config: ZeroDBConfig;

  constructor(config: ZeroDBConfig) {
    this.config = config;
    this.client = new MockZeroDBClient(config);
  }

  /**
   * Execute a natural language query
   *
   * @param naturalLanguage - Natural language query string
   * @param format - Result format (json, table, list, summary)
   * @returns Query result with metadata
   */
  async query(
    naturalLanguage: string,
    format: ResultFormat = ResultFormat.JSON
  ): Promise<QueryResult> {
    const startTime = performance.now();

    try {
      // Parse natural language query
      const parsed = QueryParser.parse(naturalLanguage);

      if (parsed.confidence < 0.5) {
        const executionTime = Math.max(1, Math.round(performance.now() - startTime));
        return {
          success: false,
          data: null,
          metadata: {
            queryType: parsed.type,
            executionTimeMs: executionTime,
            format,
          },
          error: {
            message: 'Unable to parse query with sufficient confidence',
            code: 'LOW_CONFIDENCE',
            details: { confidence: parsed.confidence, parsed },
          },
        };
      }

      // Execute query based on type
      const data = await this.executeQuery(parsed);

      // Format results
      const formattedData = format === ResultFormat.JSON ? data : ResultFormatter.format(data, format);

      const executionTime = Math.max(1, Math.round(performance.now() - startTime));

      return {
        success: true,
        data: formattedData,
        metadata: {
          queryType: parsed.type,
          executionTimeMs: executionTime,
          rowCount: Array.isArray(data) ? data.length : undefined,
          format,
        },
      };
    } catch (error: any) {
      const executionTime = Math.max(1, Math.round(performance.now() - startTime));
      return {
        success: false,
        data: null,
        metadata: {
          queryType: QueryType.TABLE_QUERY,
          executionTimeMs: executionTime,
          format,
        },
        error: {
          message: error.message || 'Unknown error occurred',
          code: error.code || 'QUERY_ERROR',
          details: error,
        },
      };
    }
  }

  /**
   * Execute parsed query against ZeroDB
   */
  private async executeQuery(parsed: ParsedQuery): Promise<any> {
    const projectId = this.config.projectId;

    if (!projectId) {
      throw new Error('Project ID is required for queries');
    }

    switch (parsed.type) {
      case QueryType.TABLE_LIST:
        return this.client.listTables(projectId);

      case QueryType.TABLE_QUERY: {
        const { tableName, filter, limit } = parsed.parameters;
        if (!tableName) {
          throw new Error('Table name is required for table queries');
        }
        return this.client.queryTable(projectId, tableName, filter, limit);
      }

      case QueryType.VECTOR_SEARCH: {
        const { queryVector, topK } = parsed.parameters;
        if (!queryVector) {
          throw new Error('Query vector is required for vector search');
        }
        return this.client.searchVectors(projectId, queryVector, topK);
      }

      case QueryType.VECTOR_LIST: {
        const { limit, offset } = parsed.parameters;
        return this.client.listVectors(projectId, limit, offset);
      }

      case QueryType.FILE_LIST:
        return this.client.listFiles(projectId);

      case QueryType.EVENT_LIST: {
        const { topic } = parsed.parameters;
        return this.client.listEvents(projectId, topic);
      }

      case QueryType.PROJECT_INFO:
        return this.client.getProjectInfo(projectId);

      case QueryType.DATABASE_STATUS:
        return this.client.getDatabaseStatus(projectId);

      default:
        throw new Error(`Unsupported query type: ${parsed.type}`);
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey && !this.config.jwtToken) {
      errors.push('Either apiKey or jwtToken must be provided');
    }

    if (!this.config.projectId) {
      errors.push('projectId is required for queries');
    }

    if (this.config.timeout && this.config.timeout < 1000) {
      errors.push('timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get supported query types
   */
  static getSupportedQueryTypes(): string[] {
    return Object.values(QueryType);
  }

  /**
   * Get supported result formats
   */
  static getSupportedFormats(): string[] {
    return Object.values(ResultFormat);
  }
}

/**
 * Zod schema for configuration validation
 */
export const ZeroDBConfigSchema = z.object({
  apiKey: z.string().optional(),
  jwtToken: z.string().optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().min(1000).optional(),
  projectId: z.string().uuid().optional(),
}).refine(
  (data) => data.apiKey || data.jwtToken,
  {
    message: 'Either apiKey or jwtToken must be provided',
  }
);

/**
 * Factory function to create a ZeroDB query tool
 */
export function createZeroDBQueryTool(config: ZeroDBConfig): ZeroDBQueryTool {
  // Validate configuration
  const validationResult = ZeroDBConfigSchema.safeParse(config);

  if (!validationResult.success) {
    throw new Error(`Invalid configuration: ${validationResult.error.message}`);
  }

  return new ZeroDBQueryTool(config);
}

/**
 * Export all types and classes
 */
export default ZeroDBQueryTool;
