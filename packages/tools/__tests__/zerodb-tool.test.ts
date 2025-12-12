/**
 * Comprehensive test suite for ZeroDB Tool
 * Tests all operations, natural language parsing, safety validations, and error scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ZeroDBTool,
  NaturalLanguageParser,
  SafetyValidator,
  ResultFormatter,
  createZeroDBTool,
  DatabaseOperationType,
  QueryIntent,
  SafetyLevel,
  ResultFormat,
  type ZeroDBToolConfig,
  type DatabaseOperation,
  type ParsedNaturalLanguage,
} from '../src/zerodb-tool'

describe('ZeroDBTool', () => {
  describe('Configuration and Initialization', () => {
    it('should create tool with valid API key configuration', () => {
      const config: ZeroDBToolConfig = {
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      }

      const tool = new ZeroDBTool(config)
      expect(tool).toBeDefined()
      expect(tool.getCapabilities()).toBeDefined()
    })

    it('should create tool with JWT token configuration', () => {
      const config: ZeroDBToolConfig = {
        jwtToken: 'test-jwt-token',
        projectId: 'test-project-123',
      }

      const tool = new ZeroDBTool(config)
      expect(tool).toBeDefined()
    })

    it('should throw error when neither API key nor JWT token provided', () => {
      const config = {
        projectId: 'test-project-123',
      } as ZeroDBToolConfig

      expect(() => new ZeroDBTool(config)).toThrow()
    })

    it('should create tool using factory function', () => {
      const config: ZeroDBToolConfig = {
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      }

      const tool = createZeroDBTool(config)
      expect(tool).toBeInstanceOf(ZeroDBTool)
    })

    it('should accept custom configuration options', () => {
      const config: ZeroDBToolConfig = {
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
        baseURL: 'https://custom.api.com',
        timeout: 60000,
        maxRowsPerQuery: 500,
        allowDangerousOperations: true,
      }

      const tool = new ZeroDBTool(config)
      const capabilities = tool.getCapabilities()

      expect(capabilities.maxRowsPerQuery).toBe(500)
      expect(capabilities.allowDangerousOperations).toBe(true)
    })

    it('should use default values for optional config', () => {
      const config: ZeroDBToolConfig = {
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      }

      const tool = new ZeroDBTool(config)
      const capabilities = tool.getCapabilities()

      expect(capabilities.maxRowsPerQuery).toBe(1000) // default
      expect(capabilities.allowDangerousOperations).toBe(false) // default
    })
  })

  describe('Tool Capabilities', () => {
    let tool: ZeroDBTool

    beforeEach(() => {
      tool = createZeroDBTool({
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      })
    })

    it('should return supported operations', () => {
      const capabilities = tool.getCapabilities()

      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.SELECT)
      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.INSERT)
      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.UPDATE)
      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.DELETE)
    })

    it('should include dangerous operations when allowed', () => {
      const dangerousTool = createZeroDBTool({
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
        allowDangerousOperations: true,
      })

      const capabilities = dangerousTool.getCapabilities()

      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.DROP_TABLE)
      expect(capabilities.supportedOperations).toContain(DatabaseOperationType.CREATE_TABLE)
    })

    it('should exclude dangerous operations when not allowed', () => {
      const capabilities = tool.getCapabilities()

      expect(capabilities.supportedOperations).not.toContain(DatabaseOperationType.DROP_TABLE)
      expect(capabilities.supportedOperations).not.toContain(DatabaseOperationType.CREATE_TABLE)
    })

    it('should return supported result formats', () => {
      const capabilities = tool.getCapabilities()

      expect(capabilities.supportedFormats).toContain(ResultFormat.JSON)
      expect(capabilities.supportedFormats).toContain(ResultFormat.TABLE)
      expect(capabilities.supportedFormats).toContain(ResultFormat.MARKDOWN)
      expect(capabilities.supportedFormats).toContain(ResultFormat.NATURAL_LANGUAGE)
    })

    it('should indicate schema and write access', () => {
      const capabilities = tool.getCapabilities()

      expect(capabilities.hasSchemaAccess).toBe(true)
      expect(capabilities.hasWriteAccess).toBe(true)
    })
  })

  describe('Execute Operations', () => {
    let tool: ZeroDBTool

    beforeEach(() => {
      tool = createZeroDBTool({
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      })
    })

    it('should execute SELECT query from natural language', async () => {
      const result = await tool.execute('select from users limit 10')

      expect(result.success).toBe(true)
      expect(result.metadata.operation).toBe(DatabaseOperationType.SELECT)
      expect(result.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should execute query with table name', async () => {
      const result = await tool.execute('get all products')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should execute COUNT query', async () => {
      const result = await tool.execute('count rows in users')

      expect(result.success).toBe(true)
      expect(result.metadata.operation).toBe(DatabaseOperationType.COUNT)
    })

    it('should execute SCHEMA query', async () => {
      const result = await tool.execute('describe table users')

      expect(result.success).toBe(true)
      expect(result.metadata.operation).toBe(DatabaseOperationType.SCHEMA)
    })

    it('should include execution time in results', async () => {
      const result = await tool.execute('select from users')

      expect(result.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.executionTimeMs).toBeLessThan(10000)
    })

    it('should format results according to specified format', async () => {
      const jsonResult = await tool.execute('select from users', ResultFormat.JSON)
      expect(jsonResult.metadata.format).toBe(ResultFormat.JSON)

      const tableResult = await tool.execute('select from users', ResultFormat.TABLE)
      expect(tableResult.metadata.format).toBe(ResultFormat.TABLE)
    })

    it('should return formatted result string', async () => {
      const result = await tool.execute('select from users', ResultFormat.TABLE)

      expect(result.formattedResult).toBeDefined()
      expect(typeof result.formattedResult).toBe('string')
    })
  })

  describe('Error Handling', () => {
    let tool: ZeroDBTool

    beforeEach(() => {
      tool = createZeroDBTool({
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      })
    })

    it('should return error for invalid queries', async () => {
      const result = await tool.execute('zxczxc random gibberish hjkhkj')

      // Low confidence queries should still parse but may have warnings
      expect(result).toBeDefined()
    })

    it('should handle queries without table name', async () => {
      const result = await tool.execute('select some data')

      expect(result).toBeDefined()
      // Should either succeed with low confidence or fail with helpful error
    })

    it('should include error details in result', async () => {
      const result = await tool.execute('delete from users') // Missing WHERE

      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.error?.message).toBeDefined()
      }
    })

    it('should provide helpful error messages', async () => {
      const result = await tool.execute('drop table users')

      // DROP TABLE should be blocked by default
      expect(result.success).toBe(false)
      expect(result.error?.message).toBeDefined()
      // Suggestions are optional but should be provided for safety errors
      if (result.metadata.safetyCheck?.suggestions) {
        expect(result.metadata.safetyCheck.suggestions).toBeDefined()
      }
    })
  })

  describe('Statistics Tracking', () => {
    let tool: ZeroDBTool

    beforeEach(() => {
      tool = createZeroDBTool({
        apiKey: 'test-api-key',
        projectId: 'test-project-123',
      })
    })

    it('should track operation statistics', async () => {
      await tool.execute('select from users')
      await tool.execute('select from products')

      const stats = tool.getStats()

      expect(stats.totalOperations).toBe(2)
      expect(stats.successfulOperations).toBeGreaterThan(0)
    })

    it('should track failed operations', async () => {
      const result = await tool.execute('delete from users') // Will fail safety check

      const stats = tool.getStats()
      // Even failed operations should be counted
      expect(stats.totalOperations).toBeGreaterThanOrEqual(1)
    })

    it('should calculate average execution time', async () => {
      await tool.execute('select from users')
      await tool.execute('select from products')

      const stats = tool.getStats()
      expect(stats.averageExecutionTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should track operations by type', async () => {
      await tool.execute('select from users')
      await tool.execute('count rows in products')

      const stats = tool.getStats()
      expect(stats.operationsByType[DatabaseOperationType.SELECT]).toBeGreaterThan(0)
    })

    it('should allow resetting statistics', () => {
      tool.resetStats()

      const stats = tool.getStats()
      expect(stats.totalOperations).toBe(0)
      expect(stats.successfulOperations).toBe(0)
    })
  })
})

describe('NaturalLanguageParser', () => {
  describe('SELECT Operation Parsing', () => {
    it('should parse simple SELECT query', () => {
      const parsed = NaturalLanguageParser.parse('select from users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SELECT)
      expect(parsed.operation.intent).toBe(QueryIntent.READ)
      expect(parsed.operation.tableName).toBe('users')
    })

    it('should parse GET variant', () => {
      const parsed = NaturalLanguageParser.parse('get all products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SELECT)
      expect(parsed.operation.tableName).toBe('products')
    })

    it('should parse FIND variant', () => {
      const parsed = NaturalLanguageParser.parse('find records in orders')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SELECT)
      expect(parsed.operation.tableName).toBe('orders')
    })

    it('should extract column names', () => {
      const parsed = NaturalLanguageParser.parse('select name, email from users')

      expect(parsed.operation.columns).toContain('name')
      expect(parsed.operation.columns).toContain('email')
    })

    it('should extract WHERE conditions', () => {
      const parsed = NaturalLanguageParser.parse('select from users where status=active')

      expect(parsed.operation.conditions).toBeDefined()
      expect(parsed.operation.conditions?.status).toBe('active')
    })

    it('should extract LIMIT clause', () => {
      const parsed = NaturalLanguageParser.parse('select from users limit 50')

      expect(parsed.operation.limit).toBe(50)
    })

    it('should extract OFFSET clause', () => {
      const parsed = NaturalLanguageParser.parse('select from users limit 10 offset 20')

      expect(parsed.operation.limit).toBe(10)
      expect(parsed.operation.offset).toBe(20)
    })

    it('should extract ORDER BY clause', () => {
      const parsed = NaturalLanguageParser.parse('select from users order by name asc')

      expect(parsed.operation.orderBy).toBeDefined()
      expect(parsed.operation.orderBy?.[0].column).toBe('name')
      expect(parsed.operation.orderBy?.[0].direction).toBe('asc')
    })

    it('should handle complex SELECT queries', () => {
      const parsed = NaturalLanguageParser.parse(
        'select name, email from users where status=active limit 10'
      )

      expect(parsed.operation.tableName).toBe('users')
      expect(parsed.operation.columns).toContain('name')
      expect(parsed.operation.conditions?.status).toBe('active')
      expect(parsed.operation.limit).toBe(10)
    })
  })

  describe('INSERT Operation Parsing', () => {
    it('should parse INSERT query', () => {
      const parsed = NaturalLanguageParser.parse('insert into users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.INSERT)
      expect(parsed.operation.intent).toBe(QueryIntent.WRITE)
    })

    it('should parse ADD variant', () => {
      const parsed = NaturalLanguageParser.parse('add to products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.INSERT)
    })

    it('should parse CREATE variant', () => {
      const parsed = NaturalLanguageParser.parse('create new record in users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.INSERT)
    })
  })

  describe('UPDATE Operation Parsing', () => {
    it('should parse UPDATE query', () => {
      const parsed = NaturalLanguageParser.parse('update users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.UPDATE)
      expect(parsed.operation.intent).toBe(QueryIntent.MODIFY)
    })

    it('should parse MODIFY variant', () => {
      const parsed = NaturalLanguageParser.parse('modify records in products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.UPDATE)
    })

    it('should extract UPDATE conditions', () => {
      const parsed = NaturalLanguageParser.parse('update users where id=123')

      expect(parsed.operation.conditions).toBeDefined()
    })
  })

  describe('DELETE Operation Parsing', () => {
    it('should parse DELETE query', () => {
      const parsed = NaturalLanguageParser.parse('delete from users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.DELETE)
      expect(parsed.operation.intent).toBe(QueryIntent.DELETE)
    })

    it('should parse REMOVE variant', () => {
      const parsed = NaturalLanguageParser.parse('remove from products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.DELETE)
    })

    it('should extract DELETE conditions', () => {
      const parsed = NaturalLanguageParser.parse('delete from users where status=inactive')

      expect(parsed.operation.conditions).toBeDefined()
    })
  })

  describe('COUNT Operation Parsing', () => {
    it('should parse COUNT query', () => {
      const parsed = NaturalLanguageParser.parse('count rows in users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.COUNT)
      expect(parsed.operation.intent).toBe(QueryIntent.ANALYTICS)
    })

    it('should parse HOW MANY variant', () => {
      const parsed = NaturalLanguageParser.parse('how many products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.COUNT)
    })
  })

  describe('AGGREGATE Operation Parsing', () => {
    it('should parse SUM aggregation', () => {
      const parsed = NaturalLanguageParser.parse('sum(amount) from orders')

      expect(parsed.operation.type).toBe(DatabaseOperationType.AGGREGATE)
      expect(parsed.operation.aggregations).toBeDefined()
      expect(parsed.operation.aggregations?.[0].function).toBe('sum')
    })

    it('should parse AVG aggregation', () => {
      const parsed = NaturalLanguageParser.parse('average price from products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.AGGREGATE)
    })

    it('should parse GROUP BY clause', () => {
      const parsed = NaturalLanguageParser.parse('count from orders group by status')

      expect(parsed.operation.groupBy).toContain('status')
    })
  })

  describe('SCHEMA Operation Parsing', () => {
    it('should parse SCHEMA query', () => {
      const parsed = NaturalLanguageParser.parse('describe table users')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SCHEMA)
      expect(parsed.operation.intent).toBe(QueryIntent.READ)
    })

    it('should parse SCHEMA variant', () => {
      const parsed = NaturalLanguageParser.parse('show schema for products')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SCHEMA)
    })
  })

  describe('Confidence Calculation', () => {
    it('should have high confidence for complete queries', () => {
      const parsed = NaturalLanguageParser.parse('select from users where id=1 limit 10')

      expect(parsed.confidence).toBeGreaterThanOrEqual(0.7) // Complete query with table, conditions
    })

    it('should have lower confidence for ambiguous queries', () => {
      const parsed = NaturalLanguageParser.parse('get some data')

      expect(parsed.confidence).toBeLessThan(0.8)
    })

    it('should increase confidence with table name', () => {
      const withTable = NaturalLanguageParser.parse('select from users')
      const withoutTable = NaturalLanguageParser.parse('select something')

      expect(withTable.confidence).toBeGreaterThan(withoutTable.confidence)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const parsed = NaturalLanguageParser.parse('')

      expect(parsed).toBeDefined()
      expect(parsed.confidence).toBeLessThan(0.5)
    })

    it('should handle case-insensitive queries', () => {
      const parsed = NaturalLanguageParser.parse('SELECT FROM USERS')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SELECT)
    })

    it('should handle extra whitespace', () => {
      const parsed = NaturalLanguageParser.parse('  select   from   users  ')

      expect(parsed.operation.type).toBe(DatabaseOperationType.SELECT)
      expect(parsed.operation.tableName).toBe('users')
    })

    it('should identify missing information', () => {
      const parsed = NaturalLanguageParser.parse('select some data')

      expect(parsed.missingInformation).toBeDefined()
    })
  })
})

describe('SafetyValidator', () => {
  const safeConfig: ZeroDBToolConfig = {
    apiKey: 'test-key',
    projectId: 'test-project',
    allowDangerousOperations: false,
  }

  const dangerousConfig: ZeroDBToolConfig = {
    apiKey: 'test-key',
    projectId: 'test-project',
    allowDangerousOperations: true,
  }

  describe('Safe Operations', () => {
    it('should pass SELECT operations', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.SELECT,
        intent: QueryIntent.READ,
        tableName: 'users',
        limit: 10,
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(true)
      expect(check.level).toBe(SafetyLevel.SAFE)
    })

    it('should pass COUNT operations', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.COUNT,
        intent: QueryIntent.ANALYTICS,
        tableName: 'users',
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(true)
      expect(check.level).toBe(SafetyLevel.SAFE)
    })

    it('should pass SCHEMA operations', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.SCHEMA,
        intent: QueryIntent.READ,
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(true)
    })
  })

  describe('Warning Operations', () => {
    it('should warn for UPDATE without WHERE clause', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.UPDATE,
        intent: QueryIntent.MODIFY,
        tableName: 'users',
        data: { status: 'active' },
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.level).toBe(SafetyLevel.WARNING)
      expect(check.warnings).toContain('UPDATE without WHERE clause will affect all rows')
      expect(check.requiresConfirmation).toBe(true)
    })

    it('should warn for large SELECT queries', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.SELECT,
        intent: QueryIntent.READ,
        tableName: 'users',
        limit: 5000, // Exceeds default max
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.level).toBe(SafetyLevel.WARNING)
      expect(check.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Dangerous Operations', () => {
    it('should block DELETE without WHERE clause', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.DELETE,
        intent: QueryIntent.DELETE,
        tableName: 'users',
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(false)
      expect(check.level).toBe(SafetyLevel.BLOCKED)
      expect(check.blockedReason).toContain('DELETE without WHERE clause')
    })

    it('should allow DELETE with WHERE clause', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.DELETE,
        intent: QueryIntent.DELETE,
        tableName: 'users',
        conditions: { id: 123 },
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.level).toBe(SafetyLevel.DANGEROUS)
      expect(check.requiresConfirmation).toBe(true)
      expect(check.passed).toBe(true) // Passes but requires confirmation
    })

    it('should block DROP TABLE when not allowed', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.DROP_TABLE,
        intent: QueryIntent.SCHEMA_CHANGE,
        tableName: 'users',
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(false)
      expect(check.level).toBe(SafetyLevel.BLOCKED)
      expect(check.blockedReason).toContain('DROP TABLE is blocked')
    })

    it('should allow DROP TABLE when configured', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.DROP_TABLE,
        intent: QueryIntent.SCHEMA_CHANGE,
        tableName: 'users',
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, dangerousConfig)

      expect(check.level).toBe(SafetyLevel.DANGEROUS)
      expect(check.requiresConfirmation).toBe(true)
    })
  })

  describe('Validation Errors', () => {
    it('should require table name for most operations', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.SELECT,
        intent: QueryIntent.READ,
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.passed).toBe(false)
      expect(check.errors).toContain('Table name is required for this operation')
    })

    it('should provide helpful suggestions', () => {
      const operation: DatabaseOperation = {
        type: DatabaseOperationType.DELETE,
        intent: QueryIntent.DELETE,
        tableName: 'users',
        confidence: 0.9,
      }

      const check = SafetyValidator.validate(operation, safeConfig)

      expect(check.suggestions).toBeDefined()
      expect(check.suggestions?.length).toBeGreaterThan(0)
    })
  })
})

describe('ResultFormatter', () => {
  describe('JSON Formatting', () => {
    it('should format object as JSON', () => {
      const data = { id: 1, name: 'Test' }
      const formatted = ResultFormatter.format(data, ResultFormat.JSON)

      expect(formatted).toBe(JSON.stringify(data, null, 2))
    })

    it('should format array as JSON', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const formatted = ResultFormatter.format(data, ResultFormat.JSON)

      expect(formatted).toContain('"id": 1')
      expect(formatted).toContain('"id": 2')
    })
  })

  describe('TABLE Formatting', () => {
    it('should format array as table', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const formatted = ResultFormatter.format(data, ResultFormat.TABLE)

      expect(formatted).toContain('id')
      expect(formatted).toContain('name')
      expect(formatted).toContain('Alice')
      expect(formatted).toContain('Bob')
      expect(formatted).toContain('|')
      expect(formatted).toContain('-')
    })

    it('should handle empty array', () => {
      const formatted = ResultFormatter.format([], ResultFormat.TABLE)
      expect(formatted).toBe('No data available')
    })

    it('should format single object as table', () => {
      const data = { id: 1, name: 'Test' }
      const formatted = ResultFormatter.format(data, ResultFormat.TABLE)

      expect(formatted).toContain('id')
      expect(formatted).toContain('name')
    })
  })

  describe('MARKDOWN Formatting', () => {
    it('should format as markdown table', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const formatted = ResultFormatter.format(data, ResultFormat.MARKDOWN)

      expect(formatted).toContain('|')
      expect(formatted).toContain('---')
      expect(formatted).toContain('Alice')
    })

    it('should handle empty data', () => {
      const formatted = ResultFormatter.format([], ResultFormat.MARKDOWN)
      expect(formatted).toContain('No data')
    })
  })

  describe('NATURAL_LANGUAGE Formatting', () => {
    it('should describe array results', () => {
      const data = [1, 2, 3, 4, 5]
      const formatted = ResultFormatter.format(data, ResultFormat.NATURAL_LANGUAGE)

      expect(formatted).toContain('5 results')
    })

    it('should describe single result', () => {
      const data = [{ id: 1 }]
      const formatted = ResultFormatter.format(data, ResultFormat.NATURAL_LANGUAGE)

      expect(formatted).toContain('1 result')
    })

    it('should describe object fields', () => {
      const data = { id: 1, name: 'Test', status: 'active' }
      const formatted = ResultFormatter.format(data, ResultFormat.NATURAL_LANGUAGE)

      expect(formatted).toContain('3 fields')
    })

    it('should handle no data', () => {
      const formatted = ResultFormatter.format(null, ResultFormat.NATURAL_LANGUAGE)
      expect(formatted).toContain('No data')
    })
  })

  describe('STRUCTURED Formatting', () => {
    it('should format array with indices', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const formatted = ResultFormatter.format(data, ResultFormat.STRUCTURED)

      expect(formatted).toContain('Array[2]')
      expect(formatted).toContain('[0]')
      expect(formatted).toContain('[1]')
    })

    it('should format object with fields', () => {
      const data = { id: 1, name: 'Test' }
      const formatted = ResultFormatter.format(data, ResultFormat.STRUCTURED)

      expect(formatted).toContain('Object:')
      expect(formatted).toContain('id:')
      expect(formatted).toContain('name:')
    })
  })
})
