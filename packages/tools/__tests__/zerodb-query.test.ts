import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ZeroDBQueryTool,
  QueryParser,
  ResultFormatter,
  QueryType,
  ResultFormat,
  createZeroDBQueryTool,
  ZeroDBConfigSchema,
  type ZeroDBConfig,
  type ParsedQuery,
  type QueryResult,
} from '../src/zerodb-query';

describe('ZeroDBQueryTool', () => {
  describe('Configuration Validation', () => {
    it('should create tool with valid API key config', () => {
      const config: ZeroDBConfig = {
        apiKey: 'test-api-key',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const tool = new ZeroDBQueryTool(config);
      expect(tool).toBeDefined();
      expect(tool.validateConfig().valid).toBe(true);
    });

    it('should create tool with valid JWT token config', () => {
      const config: ZeroDBConfig = {
        jwtToken: 'test-jwt-token',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const tool = new ZeroDBQueryTool(config);
      expect(tool).toBeDefined();
      expect(tool.validateConfig().valid).toBe(true);
    });

    it('should throw error when neither API key nor JWT token provided', () => {
      const config: ZeroDBConfig = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => new ZeroDBQueryTool(config)).toThrow();
    });

    it('should validate config with missing project ID', () => {
      const config: ZeroDBConfig = {
        apiKey: 'test-api-key',
      };

      const tool = new ZeroDBQueryTool(config);
      const validation = tool.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('projectId is required for queries');
    });

    it('should validate config with invalid timeout', () => {
      const config: ZeroDBConfig = {
        apiKey: 'test-api-key',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        timeout: 500, // Less than minimum
      };

      const tool = new ZeroDBQueryTool(config);
      const validation = tool.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('timeout must be at least 1000ms');
    });

    it('should accept custom base URL', () => {
      const config: ZeroDBConfig = {
        apiKey: 'test-api-key',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        baseURL: 'https://custom.api.com',
      };

      const tool = new ZeroDBQueryTool(config);
      expect(tool.validateConfig().valid).toBe(true);
    });
  });

  describe('Factory Function', () => {
    it('should create tool using factory function', () => {
      const config: ZeroDBConfig = {
        apiKey: 'test-api-key',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const tool = createZeroDBQueryTool(config);
      expect(tool).toBeInstanceOf(ZeroDBQueryTool);
    });

    it('should throw error for invalid config in factory', () => {
      const config: ZeroDBConfig = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => createZeroDBQueryTool(config)).toThrow('Invalid configuration');
    });
  });

  describe('Static Methods', () => {
    it('should return supported query types', () => {
      const types = ZeroDBQueryTool.getSupportedQueryTypes();

      expect(types).toContain(QueryType.TABLE_QUERY);
      expect(types).toContain(QueryType.VECTOR_SEARCH);
      expect(types).toContain(QueryType.FILE_LIST);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should return supported result formats', () => {
      const formats = ZeroDBQueryTool.getSupportedFormats();

      expect(formats).toContain(ResultFormat.JSON);
      expect(formats).toContain(ResultFormat.TABLE);
      expect(formats).toContain(ResultFormat.LIST);
      expect(formats).toContain(ResultFormat.SUMMARY);
    });
  });

  describe('Query Execution', () => {
    let tool: ZeroDBQueryTool;

    beforeEach(() => {
      tool = new ZeroDBQueryTool({
        apiKey: 'test-api-key',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      });
    });

    it('should execute list tables query', async () => {
      const result = await tool.query('list tables');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.TABLE_LIST);
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
    });

    it('should execute table query with table name', async () => {
      const result = await tool.query('select from users');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.TABLE_QUERY);
    });

    it('should execute list vectors query', async () => {
      const result = await tool.query('list vectors');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.VECTOR_LIST);
    });

    it('should execute list files query', async () => {
      const result = await tool.query('show files');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.FILE_LIST);
    });

    it('should execute list events query', async () => {
      const result = await tool.query('list events');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.EVENT_LIST);
    });

    it('should execute project info query', async () => {
      const result = await tool.query('project info');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.PROJECT_INFO);
    });

    it('should execute database status query', async () => {
      const result = await tool.query('database status');

      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.DATABASE_STATUS);
    });

    it('should handle low confidence queries', async () => {
      const result = await tool.query('zxczxczxc asdfasdf hjkhjkhjk');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LOW_CONFIDENCE');
      expect(result.error?.message).toContain('Unable to parse query');
    });

    it('should include execution time in metadata', async () => {
      const result = await tool.query('list tables');

      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
    });

    it('should handle different result formats', async () => {
      const jsonResult = await tool.query('list tables', ResultFormat.JSON);
      expect(jsonResult.metadata.format).toBe(ResultFormat.JSON);

      const tableResult = await tool.query('list tables', ResultFormat.TABLE);
      expect(tableResult.metadata.format).toBe(ResultFormat.TABLE);

      const listResult = await tool.query('list tables', ResultFormat.LIST);
      expect(listResult.metadata.format).toBe(ResultFormat.LIST);

      const summaryResult = await tool.query('list tables', ResultFormat.SUMMARY);
      expect(summaryResult.metadata.format).toBe(ResultFormat.SUMMARY);
    });
  });
});

describe('QueryParser', () => {
  describe('TABLE_LIST parsing', () => {
    it('should parse "list tables"', () => {
      const parsed = QueryParser.parse('list tables');

      expect(parsed.type).toBe(QueryType.TABLE_LIST);
      expect(parsed.operation).toBe('list_tables');
      expect(parsed.confidence).toBeGreaterThan(0.9);
    });

    it('should parse "show tables"', () => {
      const parsed = QueryParser.parse('show tables');
      expect(parsed.type).toBe(QueryType.TABLE_LIST);
    });

    it('should parse "what tables"', () => {
      const parsed = QueryParser.parse('what tables do I have');
      expect(parsed.type).toBe(QueryType.TABLE_LIST);
    });

    it('should parse just "tables"', () => {
      const parsed = QueryParser.parse('tables');
      expect(parsed.type).toBe(QueryType.TABLE_LIST);
    });
  });

  describe('TABLE_QUERY parsing', () => {
    it('should parse "select from users"', () => {
      const parsed = QueryParser.parse('select from users');

      expect(parsed.type).toBe(QueryType.TABLE_QUERY);
      expect(parsed.parameters.tableName).toBe('users');
      expect(parsed.confidence).toBeGreaterThan(0.8);
    });

    it('should parse "query users table"', () => {
      const parsed = QueryParser.parse('query users table');
      expect(parsed.parameters.tableName).toBe('users');
    });

    it('should parse "find in products"', () => {
      const parsed = QueryParser.parse('find in products');
      expect(parsed.parameters.tableName).toBe('products');
    });

    it('should extract limit from query', () => {
      const parsed = QueryParser.parse('select from users limit 50');
      expect(parsed.parameters.limit).toBe(50);
    });

    it('should extract filter from query', () => {
      const parsed = QueryParser.parse('select from users where status=active');
      expect(parsed.parameters.filter).toEqual({ status: 'active' });
    });

    it('should handle queries without table name', () => {
      const parsed = QueryParser.parse('select something');
      expect(parsed.confidence).toBeLessThan(0.8);
    });
  });

  describe('VECTOR_SEARCH parsing', () => {
    it('should parse "search vectors"', () => {
      const parsed = QueryParser.parse('search vectors');
      expect(parsed.type).toBe(QueryType.VECTOR_SEARCH);
    });

    it('should parse "find similar"', () => {
      const parsed = QueryParser.parse('find similar documents');
      expect(parsed.type).toBe(QueryType.VECTOR_SEARCH);
    });

    it('should parse "semantic search"', () => {
      const parsed = QueryParser.parse('semantic search');
      expect(parsed.type).toBe(QueryType.VECTOR_SEARCH);
    });

    it('should extract topK parameter', () => {
      const parsed = QueryParser.parse('search vectors top 5');
      expect(parsed.parameters.topK).toBe(5);
    });
  });

  describe('VECTOR_LIST parsing', () => {
    it('should parse "list vectors"', () => {
      const parsed = QueryParser.parse('list vectors');

      expect(parsed.type).toBe(QueryType.VECTOR_LIST);
      expect(parsed.parameters.limit).toBe(100);
      expect(parsed.parameters.offset).toBe(0);
    });

    it('should extract limit and offset', () => {
      const parsed = QueryParser.parse('list vectors limit 50 offset 100');

      expect(parsed.parameters.limit).toBe(50);
      expect(parsed.parameters.offset).toBe(100);
    });
  });

  describe('FILE_LIST parsing', () => {
    it('should parse "list files"', () => {
      const parsed = QueryParser.parse('list files');
      expect(parsed.type).toBe(QueryType.FILE_LIST);
    });

    it('should parse "show files"', () => {
      const parsed = QueryParser.parse('show files');
      expect(parsed.type).toBe(QueryType.FILE_LIST);
    });

    it('should parse just "files"', () => {
      const parsed = QueryParser.parse('files');
      expect(parsed.type).toBe(QueryType.FILE_LIST);
    });
  });

  describe('EVENT_LIST parsing', () => {
    it('should parse "list events"', () => {
      const parsed = QueryParser.parse('list events');
      expect(parsed.type).toBe(QueryType.EVENT_LIST);
    });

    it('should extract topic parameter', () => {
      const parsed = QueryParser.parse('list events topic user_actions');
      expect(parsed.parameters.topic).toBe('user_actions');
    });
  });

  describe('PROJECT_INFO parsing', () => {
    it('should parse "project info"', () => {
      const parsed = QueryParser.parse('project info');
      expect(parsed.type).toBe(QueryType.PROJECT_INFO);
    });

    it('should parse "describe project"', () => {
      const parsed = QueryParser.parse('describe project');
      expect(parsed.type).toBe(QueryType.PROJECT_INFO);
    });
  });

  describe('DATABASE_STATUS parsing', () => {
    it('should parse "database status"', () => {
      const parsed = QueryParser.parse('database status');
      expect(parsed.type).toBe(QueryType.DATABASE_STATUS);
    });

    it('should parse "db status"', () => {
      const parsed = QueryParser.parse('db status');
      expect(parsed.type).toBe(QueryType.DATABASE_STATUS);
    });

    it('should parse "storage usage"', () => {
      const parsed = QueryParser.parse('storage usage');
      expect(parsed.type).toBe(QueryType.DATABASE_STATUS);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty query', () => {
      const parsed = QueryParser.parse('');
      expect(parsed.confidence).toBeLessThan(0.5);
    });

    it('should handle case insensitive queries', () => {
      const parsed = QueryParser.parse('LIST TABLES');
      expect(parsed.type).toBe(QueryType.TABLE_LIST);
    });

    it('should handle queries with extra whitespace', () => {
      const parsed = QueryParser.parse('  list   tables  ');
      expect(parsed.type).toBe(QueryType.TABLE_LIST);
    });

    it('should provide low confidence for ambiguous queries', () => {
      const parsed = QueryParser.parse('something random');
      expect(parsed.confidence).toBeLessThan(0.5);
    });
  });
});

describe('ResultFormatter', () => {
  describe('JSON formatting', () => {
    it('should format data as JSON', () => {
      const data = { id: 1, name: 'Test' };
      const formatted = ResultFormatter.format(data, ResultFormat.JSON);

      expect(formatted).toBe(JSON.stringify(data, null, 2));
    });

    it('should format array as JSON', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const formatted = ResultFormatter.format(data, ResultFormat.JSON);

      expect(formatted).toContain('"id": 1');
      expect(formatted).toContain('"id": 2');
    });
  });

  describe('TABLE formatting', () => {
    it('should format array of objects as table', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const formatted = ResultFormatter.format(data, ResultFormat.TABLE);

      expect(formatted).toContain('id');
      expect(formatted).toContain('name');
      expect(formatted).toContain('Alice');
      expect(formatted).toContain('Bob');
      expect(formatted).toContain('|');
      expect(formatted).toContain('-');
    });

    it('should handle empty array', () => {
      const formatted = ResultFormatter.format([], ResultFormat.TABLE);
      expect(formatted).toBe('No data available');
    });

    it('should handle single object', () => {
      const data = { id: 1, name: 'Test' };
      const formatted = ResultFormatter.format(data, ResultFormat.TABLE);

      expect(formatted).toContain('id');
      expect(formatted).toContain('name');
    });

    it('should align columns properly', () => {
      const data = [
        { id: 1, name: 'A' },
        { id: 2, name: 'Very Long Name' },
      ];
      const formatted = ResultFormatter.format(data, ResultFormat.TABLE);
      const lines = formatted.split('\n');

      // All lines should have similar length due to padding
      const lengths = lines.map(l => l.length);
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThan(5);
    });
  });

  describe('LIST formatting', () => {
    it('should format array as numbered list', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const formatted = ResultFormatter.format(data, ResultFormat.LIST);

      expect(formatted).toContain('1.');
      expect(formatted).toContain('2.');
      expect(formatted).toContain('3.');
    });

    it('should handle non-array data', () => {
      const data = 'simple string';
      const formatted = ResultFormatter.format(data, ResultFormat.LIST);

      expect(formatted).toBe('simple string');
    });

    it('should include item data in list', () => {
      const data = [{ name: 'Test' }];
      const formatted = ResultFormatter.format(data, ResultFormat.LIST);

      expect(formatted).toContain('name');
      expect(formatted).toContain('Test');
    });
  });

  describe('SUMMARY formatting', () => {
    it('should summarize array', () => {
      const data = [1, 2, 3, 4, 5];
      const formatted = ResultFormatter.format(data, ResultFormat.SUMMARY);

      expect(formatted).toContain('5 result');
    });

    it('should summarize object', () => {
      const data = { id: 1, name: 'Test', status: 'active' };
      const formatted = ResultFormatter.format(data, ResultFormat.SUMMARY);

      expect(formatted).toContain('3 field');
      expect(formatted).toContain('id');
      expect(formatted).toContain('name');
      expect(formatted).toContain('status');
    });

    it('should handle simple types', () => {
      expect(ResultFormatter.format('text', ResultFormat.SUMMARY)).toBe('text');
      expect(ResultFormatter.format(123, ResultFormat.SUMMARY)).toBe('123');
      expect(ResultFormatter.format(true, ResultFormat.SUMMARY)).toBe('true');
    });

    it('should handle null and undefined', () => {
      expect(ResultFormatter.format(null, ResultFormat.SUMMARY)).toBe('null');
      expect(ResultFormatter.format(undefined, ResultFormat.SUMMARY)).toBe('undefined');
    });
  });

  describe('Default formatting', () => {
    it('should default to JSON format', () => {
      const data = { test: true };
      const formatted = ResultFormatter.format(data);

      expect(formatted).toBe(JSON.stringify(data, null, 2));
    });
  });
});

describe('ZeroDBConfigSchema', () => {
  it('should validate config with API key', () => {
    const config = {
      apiKey: 'test-key',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should validate config with JWT token', () => {
    const config = {
      jwtToken: 'test-token',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject config without authentication', () => {
    const config = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should validate valid URL', () => {
    const config = {
      apiKey: 'test-key',
      baseURL: 'https://api.example.com',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const config = {
      apiKey: 'test-key',
      baseURL: 'not-a-valid-url',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should validate timeout >= 1000', () => {
    const config = {
      apiKey: 'test-key',
      timeout: 1000,
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject timeout < 1000', () => {
    const config = {
      apiKey: 'test-key',
      timeout: 500,
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should validate UUID project ID', () => {
    const config = {
      apiKey: 'test-key',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const config = {
      apiKey: 'test-key',
      projectId: 'not-a-uuid',
    };

    const result = ZeroDBConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe('Integration Tests', () => {
  let tool: ZeroDBQueryTool;

  beforeEach(() => {
    tool = createZeroDBQueryTool({
      apiKey: 'test-api-key',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('should handle complete query workflow', async () => {
    const queries = [
      'list tables',
      'select from users',
      'show files',
      'list events',
      'project info',
    ];

    for (const query of queries) {
      const result = await tool.query(query);
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
    }
  });

  it('should validate configuration before queries', () => {
    const validation = tool.validateConfig();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should provide consistent results across formats', async () => {
    const query = 'list tables';

    const results = await Promise.all([
      tool.query(query, ResultFormat.JSON),
      tool.query(query, ResultFormat.TABLE),
      tool.query(query, ResultFormat.LIST),
      tool.query(query, ResultFormat.SUMMARY),
    ]);

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.metadata.queryType).toBe(QueryType.TABLE_LIST);
    });

    // Each should have different format
    const formats = results.map(r => r.metadata.format);
    expect(new Set(formats).size).toBe(4);
  });
});
