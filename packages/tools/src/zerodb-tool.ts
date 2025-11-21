/**
 * ZeroDB Tool for AI Agents
 *
 * Enables AI agents to interact with ZeroDB through natural language.
 * Provides safe, validated database operations with comprehensive error handling.
 */

import {
  ZeroDBToolConfig,
  ZeroDBToolConfigSchema,
  DatabaseOperation,
  DatabaseOperationType,
  QueryIntent,
  SafetyLevel,
  SafetyCheck,
  ToolResult,
  ParsedNaturalLanguage,
  TableSchema,
  ColumnSchema,
  DatabaseSchema,
  ValidationResult,
  RateLimitState,
  ResultFormat,
  ExecutionContext,
  ToolCapabilities,
  OperationStats,
  SchemaCacheEntry,
} from './zerodb-types'

/**
 * Mock ZeroDB client for development and testing
 * In production, this would use the actual ZeroDB SDK
 */
class ZeroDBClient {
  private config: Required<ZeroDBToolConfig>

  constructor(config: ZeroDBToolConfig) {
    this.config = {
      apiKey: config.apiKey || '',
      jwtToken: config.jwtToken || '',
      baseURL: config.baseURL || 'https://api.ainative.studio',
      projectId: config.projectId,
      timeout: config.timeout || 30000,
      allowDangerousOperations: config.allowDangerousOperations || false,
      requireConfirmation: config.requireConfirmation !== false,
      maxRowsPerQuery: config.maxRowsPerQuery || 1000,
      rateLimit: config.rateLimit || {},
      cacheSchema: config.cacheSchema !== false,
      schemaCacheTTL: config.schemaCacheTTL || 3600,
      enableLogging: config.enableLogging || false,
      logLevel: config.logLevel || 'info',
    }
  }

  async request(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    // Mock implementation - would make actual HTTP requests in production
    return {
      success: true,
      data: data || [],
      message: `Mock response for ${method} ${endpoint}`,
    }
  }

  async select(tableName: string, options: any): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/query`,
      'POST',
      { ...options, operation: 'select' }
    )
  }

  async insert(tableName: string, data: any): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/insert`,
      'POST',
      { data }
    )
  }

  async update(tableName: string, data: any, conditions: any): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/update`,
      'PUT',
      { data, where: conditions }
    )
  }

  async delete(tableName: string, conditions: any): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/delete`,
      'DELETE',
      { where: conditions }
    )
  }

  async getSchema(tableName?: string): Promise<any> {
    const endpoint = tableName
      ? `/api/v1/zerodb/${this.config.projectId}/schema/${tableName}`
      : `/api/v1/zerodb/${this.config.projectId}/schema`
    return this.request(endpoint, 'GET')
  }

  async createTable(tableName: string, columns: ColumnSchema[]): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}`,
      'POST',
      { columns }
    )
  }

  async dropTable(tableName: string): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}`,
      'DELETE'
    )
  }

  async aggregate(tableName: string, aggregations: any, groupBy?: string[]): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/aggregate`,
      'POST',
      { aggregations, groupBy }
    )
  }

  async count(tableName: string, conditions?: any): Promise<any> {
    return this.request(
      `/api/v1/zerodb/${this.config.projectId}/tables/${tableName}/count`,
      'POST',
      { where: conditions }
    )
  }
}

/**
 * Natural language parser for database operations
 */
export class NaturalLanguageParser {
  /**
   * Parse natural language into structured database operation
   */
  static parse(query: string): ParsedNaturalLanguage {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')

    // Try to identify the operation type
    const operation = this.identifyOperation(normalized)

    // Extract components based on operation type
    const parsed = this.extractComponents(normalized, operation.type)

    // Calculate confidence based on completeness
    const confidence = this.calculateConfidence(parsed)

    return {
      operation: {
        ...parsed,
        type: operation.type,
        intent: operation.intent,
        confidence,
        rawQuery: query,
      },
      confidence,
      ambiguities: this.findAmbiguities(normalized),
      missingInformation: this.findMissingInfo(parsed),
    }
  }

  private static identifyOperation(query: string): { type: DatabaseOperationType; intent: QueryIntent } {
    // SCHEMA operations (check before SELECT to avoid "show" conflict)
    if (query.match(/\b(schema|describe|structure)\b/)) {
      return { type: DatabaseOperationType.SCHEMA, intent: QueryIntent.READ }
    }

    // SELECT operations
    if (query.match(/\b(select|get|find|retrieve|fetch|show|list|query)\b/)) {
      return { type: DatabaseOperationType.SELECT, intent: QueryIntent.READ }
    }

    // INSERT operations
    if (query.match(/\b(insert|add|create|new)\b/) && !query.includes('table')) {
      return { type: DatabaseOperationType.INSERT, intent: QueryIntent.WRITE }
    }

    // UPDATE operations
    if (query.match(/\b(update|modify|change|set)\b/)) {
      return { type: DatabaseOperationType.UPDATE, intent: QueryIntent.MODIFY }
    }

    // DELETE operations
    if (query.match(/\b(delete|remove|drop)\b/) && !query.includes('table')) {
      return { type: DatabaseOperationType.DELETE, intent: QueryIntent.DELETE }
    }

    // COUNT operations
    if (query.match(/\b(count|how many)\b/)) {
      return { type: DatabaseOperationType.COUNT, intent: QueryIntent.ANALYTICS }
    }

    // AGGREGATE operations
    if (query.match(/\b(sum|average|avg|min|max|group by|aggregate)\b/)) {
      return { type: DatabaseOperationType.AGGREGATE, intent: QueryIntent.ANALYTICS }
    }


    // CREATE TABLE operations
    if (query.match(/\bcreate\s+table\b/)) {
      return { type: DatabaseOperationType.CREATE_TABLE, intent: QueryIntent.SCHEMA_CHANGE }
    }

    // DROP TABLE operations
    if (query.match(/\bdrop\s+table\b/)) {
      return { type: DatabaseOperationType.DROP_TABLE, intent: QueryIntent.SCHEMA_CHANGE }
    }

    // Default to SELECT
    return { type: DatabaseOperationType.SELECT, intent: QueryIntent.READ }
  }

  private static extractComponents(query: string, type: DatabaseOperationType): Partial<DatabaseOperation> {
    const components: Partial<DatabaseOperation> = {}

    // Extract table name
    components.tableName = this.extractTableName(query)

    // Extract columns
    components.columns = this.extractColumns(query)

    // Extract conditions
    components.conditions = this.extractConditions(query)

    // Extract limit
    components.limit = this.extractLimit(query)

    // Extract offset
    components.offset = this.extractOffset(query)

    // Extract order by
    components.orderBy = this.extractOrderBy(query)

    // Extract group by
    components.groupBy = this.extractGroupBy(query)

    // Extract aggregations
    if (type === DatabaseOperationType.AGGREGATE) {
      components.aggregations = this.extractAggregations(query)
    }

    return components
  }

  private static extractTableName(query: string): string | undefined {
    // Match patterns like "from users", "table users", "in products", "all products"
    const patterns = [
      /\bfrom\s+(\w+)/,
      /\btable\s+(\w+)/,
      /\bin\s+(\w+)/,
      /\b(\w+)\s+table\b/,
      /\ball\s+(\w+)/,  // "get all products"
      /\bget\s+(\w+)/,  // "get products"
    ]

    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match && match[1]) {
        // Skip common words that aren't table names
        const word = match[1].toLowerCase()
        if (!['the', 'all', 'some', 'any', 'data'].includes(word)) {
          return match[1]
        }
      }
    }

    return undefined
  }

  private static extractColumns(query: string): string[] | undefined {
    // Match patterns like "select name, email" or "columns name, email"
    const selectMatch = query.match(/\bselect\s+([\w\s,*]+)\s+from\b/)
    if (selectMatch && selectMatch[1]) {
      const cols = selectMatch[1].split(',').map(c => c.trim()).filter(c => c && c !== '*')
      return cols.length > 0 ? cols : undefined
    }

    const columnsMatch = query.match(/\bcolumns?\s+([\w\s,]+)/)
    if (columnsMatch && columnsMatch[1]) {
      return columnsMatch[1].split(',').map(c => c.trim()).filter(c => c)
    }

    return undefined
  }

  private static extractConditions(query: string): Record<string, any> | undefined {
    const conditions: Record<string, any> = {}

    // Extract WHERE conditions - match until end of string or next clause
    const whereMatch = query.match(/\bwhere\s+(.+?)(?:\s+(?:limit|order|group)\s+|$)/i)
    if (whereMatch && whereMatch[1]) {
      const conditionStr = whereMatch[1].trim()

      // Parse simple conditions like "status = active" or "age > 18"
      const simpleConditions = conditionStr.split(/\s+and\s+/i)

      for (const condition of simpleConditions) {
        const eqMatch = condition.match(/(\w+)\s*=\s*['"']?(\w+)['"']?/)
        if (eqMatch && eqMatch[1] && eqMatch[2]) {
          conditions[eqMatch[1]] = eqMatch[2]
          continue
        }

        const gtMatch = condition.match(/(\w+)\s*>\s*(\d+)/)
        if (gtMatch && gtMatch[1] && gtMatch[2]) {
          conditions[gtMatch[1]] = { $gt: parseInt(gtMatch[2]) }
          continue
        }

        const ltMatch = condition.match(/(\w+)\s*<\s*(\d+)/)
        if (ltMatch && ltMatch[1] && ltMatch[2]) {
          conditions[ltMatch[1]] = { $lt: parseInt(ltMatch[2]) }
        }
      }
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined
  }

  private static extractLimit(query: string): number | undefined {
    const patterns = [
      /\blimit\s+(\d+)/,
      /\btop\s+(\d+)/,
      /\bfirst\s+(\d+)/,
    ]

    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match && match[1]) {
        return parseInt(match[1], 10)
      }
    }

    return undefined
  }

  private static extractOffset(query: string): number | undefined {
    const match = query.match(/\boffset\s+(\d+)/)
    const offset = match?.[1]
    return offset ? parseInt(offset, 10) : undefined
  }

  private static extractOrderBy(query: string): { column: string; direction: 'asc' | 'desc' }[] | undefined {
    const match = query.match(/\border\s+by\s+([\w\s,]+?)(?:\s+(asc|desc))?(?:\s+|$)/i)
    if (match && match[1]) {
      const column = match[1].trim()
      const direction = (match[2]?.toLowerCase() as 'asc' | 'desc') || 'asc'
      return [{ column, direction }]
    }
    return undefined
  }

  private static extractGroupBy(query: string): string[] | undefined {
    const match = query.match(/\bgroup\s+by\s+([\w\s,]+?)(?:\s+|$)/i)
    if (match && match[1]) {
      return match[1].split(',').map(c => c.trim())
    }
    return undefined
  }

  private static extractAggregations(query: string): any[] | undefined {
    const aggregations: any[] = []

    // Match patterns like "sum(amount)", "avg(price)", "count(*)"
    const aggPatterns = [
      { pattern: /\bcount\s*\(\s*\*?\s*\)/i, func: 'count' },
      { pattern: /\bsum\s*\(\s*(\w+)\s*\)/i, func: 'sum' },
      { pattern: /\bavg\s*\(\s*(\w+)\s*\)/i, func: 'avg' },
      { pattern: /\bmin\s*\(\s*(\w+)\s*\)/i, func: 'min' },
      { pattern: /\bmax\s*\(\s*(\w+)\s*\)/i, func: 'max' },
    ]

    for (const { pattern, func } of aggPatterns) {
      const match = query.match(pattern)
      if (match) {
        aggregations.push({
          function: func,
          column: match[1] || undefined,
          alias: func,
        })
      }
    }

    return aggregations.length > 0 ? aggregations : undefined
  }

  private static calculateConfidence(operation: Partial<DatabaseOperation>): number {
    let confidence = 0.3 // Lower base confidence for empty/unclear queries

    // Increase confidence for having table name
    if (operation.tableName) confidence += 0.3

    // Increase for having specific columns
    if (operation.columns && operation.columns.length > 0) confidence += 0.1

    // Increase for having conditions
    if (operation.conditions) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  private static findAmbiguities(query: string): string[] {
    const ambiguities: string[] = []

    // Check for multiple potential table names
    const tableMatches = query.match(/\b\w+\s+(?:table|from|in)\b/g)
    if (tableMatches && tableMatches.length > 1) {
      ambiguities.push('Multiple potential table names detected')
    }

    return ambiguities
  }

  private static findMissingInfo(operation: Partial<DatabaseOperation>): string[] {
    const missing: string[] = []

    if (!operation.tableName) {
      missing.push('Table name not specified')
    }

    return missing
  }
}

/**
 * Safety validator for database operations
 */
export class SafetyValidator {
  /**
   * Validate operation for safety concerns
   */
  static validate(operation: DatabaseOperation, config: ZeroDBToolConfig): SafetyCheck {
    const warnings: string[] = []
    const errors: string[] = []
    const suggestions: string[] = []
    let level = SafetyLevel.SAFE
    let requiresConfirmation = false

    // Check for dangerous operations
    if (operation.intent === QueryIntent.DELETE) {
      level = SafetyLevel.DANGEROUS
      warnings.push('DELETE operation detected')
      requiresConfirmation = true

      if (!operation.conditions || Object.keys(operation.conditions).length === 0) {
        level = SafetyLevel.BLOCKED
        errors.push('DELETE without WHERE clause is not allowed')
        suggestions.push('Add specific conditions to limit which rows are deleted')
      }
    }

    if (operation.type === DatabaseOperationType.DROP_TABLE) {
      level = SafetyLevel.DANGEROUS
      warnings.push('DROP TABLE operation detected - this will permanently delete data')
      requiresConfirmation = true

      if (!config.allowDangerousOperations) {
        level = SafetyLevel.BLOCKED
        errors.push('DROP TABLE is blocked by configuration')
      }
    }

    if (operation.type === DatabaseOperationType.UPDATE) {
      if (!operation.conditions || Object.keys(operation.conditions).length === 0) {
        level = SafetyLevel.WARNING
        warnings.push('UPDATE without WHERE clause will affect all rows')
        requiresConfirmation = true
        suggestions.push('Add WHERE conditions to update specific rows')
      }
    }

    // Check row limits
    if (operation.type === DatabaseOperationType.SELECT) {
      const maxRows = config.maxRowsPerQuery || 1000
      if (!operation.limit || operation.limit > maxRows) {
        level = SafetyLevel.WARNING
        warnings.push(`Query may return more than ${maxRows} rows`)
        suggestions.push(`Add LIMIT clause (max ${maxRows})`)
      }
    }

    // Check for missing table name
    if (!operation.tableName && operation.type !== DatabaseOperationType.SCHEMA) {
      errors.push('Table name is required for this operation')
      level = SafetyLevel.BLOCKED
    }

    const passed = errors.length === 0 && level !== SafetyLevel.BLOCKED

    return {
      level,
      passed,
      warnings,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      requiresConfirmation: requiresConfirmation && config.requireConfirmation !== false,
      blockedReason: !passed ? errors.join('; ') : undefined,
    }
  }
}

/**
 * Result formatter for LLM consumption
 */
export class ResultFormatter {
  /**
   * Format query results for optimal LLM consumption
   */
  static format(data: any, format: ResultFormat = ResultFormat.JSON): string {
    switch (format) {
      case ResultFormat.JSON:
        return this.formatJSON(data)
      case ResultFormat.TABLE:
        return this.formatTable(data)
      case ResultFormat.MARKDOWN:
        return this.formatMarkdown(data)
      case ResultFormat.NATURAL_LANGUAGE:
        return this.formatNaturalLanguage(data)
      case ResultFormat.STRUCTURED:
        return this.formatStructured(data)
      default:
        return this.formatJSON(data)
    }
  }

  private static formatJSON(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  private static formatTable(data: any): string {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return 'No data available'
    }

    const rows = Array.isArray(data) ? data : [data]
    if (rows.length === 0) return 'No data available'

    const columns = Object.keys(rows[0])
    const widths = columns.map(col => {
      const maxDataWidth = Math.max(...rows.map(row => String(row[col] || '').length))
      return Math.max(col.length, maxDataWidth, 3)
    })

    const header = columns.map((col, i) => col.padEnd(widths[i] || 0)).join(' | ')
    const separator = widths.map(w => '-'.repeat(w || 0)).join('-+-')
    const tableRows = rows.map(row =>
      columns.map((col, i) => String(row[col] || '').padEnd(widths[i] || 0)).join(' | ')
    )

    return [header, separator, ...tableRows].join('\n')
  }

  private static formatMarkdown(data: any): string {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return '> No data available'
    }

    const rows = Array.isArray(data) ? data : [data]
    if (rows.length === 0) return '> No data available'

    const columns = Object.keys(rows[0])
    const header = '| ' + columns.join(' | ') + ' |'
    const separator = '| ' + columns.map(() => '---').join(' | ') + ' |'
    const tableRows = rows.map(row =>
      '| ' + columns.map(col => String(row[col] || '')).join(' | ') + ' |'
    )

    return [header, separator, ...tableRows].join('\n')
  }

  private static formatNaturalLanguage(data: any): string {
    if (!data) return 'No data was found.'

    if (Array.isArray(data)) {
      if (data.length === 0) return 'No results were found.'
      if (data.length === 1) {
        return `Found 1 result: ${JSON.stringify(data[0])}`
      }
      return `Found ${data.length} results. First result: ${JSON.stringify(data[0])}`
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data)
      return `Result contains ${keys.length} fields: ${keys.join(', ')}`
    }

    return `Result: ${String(data)}`
  }

  private static formatStructured(data: any): string {
    if (!data) return 'null'

    if (Array.isArray(data)) {
      return `Array[${data.length}]:\n${data.map((item, i) => `  [${i}]: ${JSON.stringify(item)}`).join('\n')}`
    }

    if (typeof data === 'object') {
      return `Object:\n${Object.entries(data).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}`
    }

    return String(data)
  }
}

/**
 * Main ZeroDB Tool class
 */
export class ZeroDBTool {
  private client: ZeroDBClient
  private config: Required<ZeroDBToolConfig>
  private schemaCache?: SchemaCacheEntry
  private rateLimitState: RateLimitState
  private stats: OperationStats

  constructor(config: ZeroDBToolConfig) {
    // Validate configuration
    const validated = ZeroDBToolConfigSchema.parse(config)

    this.config = {
      apiKey: validated.apiKey || '',
      jwtToken: validated.jwtToken || '',
      baseURL: validated.baseURL || 'https://api.ainative.studio',
      projectId: validated.projectId,
      timeout: validated.timeout || 30000,
      allowDangerousOperations: validated.allowDangerousOperations || false,
      requireConfirmation: validated.requireConfirmation !== false,
      maxRowsPerQuery: validated.maxRowsPerQuery || 1000,
      rateLimit: validated.rateLimit || {},
      cacheSchema: validated.cacheSchema !== false,
      schemaCacheTTL: validated.schemaCacheTTL || 3600,
      enableLogging: validated.enableLogging || false,
      logLevel: validated.logLevel || 'info',
    }

    this.client = new ZeroDBClient(this.config)
    this.rateLimitState = {
      requestsThisMinute: 0,
      requestsThisHour: 0,
      lastResetMinute: Date.now(),
      lastResetHour: Date.now(),
      isLimited: false,
    }

    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTimeMs: 0,
      operationsByType: {} as Record<DatabaseOperationType, number>,
      totalRowsAffected: 0,
      totalRowsReturned: 0,
    }
  }

  /**
   * Execute a database operation from natural language
   */
  async execute(input: string, format: ResultFormat = ResultFormat.JSON): Promise<ToolResult> {
    const context: ExecutionContext = {
      operation: {} as DatabaseOperation,
      startTime: Date.now(),
    }

    try {
      // Check rate limits
      this.checkRateLimit()

      // Parse natural language
      const parsed = this.parseNaturalLanguage(input)
      context.operation = parsed.operation

      // Validate operation
      const validation = this.validate(parsed.operation)
      if (!validation.valid) {
        this.updateStats(context, false)
        return this.createErrorResult(
          parsed.operation.type,
          'Validation failed',
          validation.errors.join('; '),
          context,
          format,
          validation.safetyCheck
        )
      }

      // Execute operation
      const data = await this.executeOperation(parsed.operation)

      // Format results
      const formattedResult = ResultFormatter.format(data, format)

      // Update stats
      this.updateStats(context, true, data)

      const executionTime = Date.now() - context.startTime

      return {
        success: true,
        data,
        formattedResult,
        metadata: {
          operation: parsed.operation.type,
          executionTimeMs: executionTime,
          rowsReturned: Array.isArray(data) ? data.length : undefined,
          format,
          safetyCheck: validation.safetyCheck,
        },
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      }
    } catch (error: any) {
      this.updateStats(context, false)
      return this.createErrorResult(
        context.operation.type || DatabaseOperationType.SELECT,
        error.message || 'Operation failed',
        error.code || 'EXECUTION_ERROR',
        context,
        format
      )
    }
  }

  /**
   * Parse natural language query
   */
  parseNaturalLanguage(query: string): ParsedNaturalLanguage {
    return NaturalLanguageParser.parse(query)
  }

  /**
   * Validate operation before execution
   */
  validate(operation: DatabaseOperation): ValidationResult {
    const safetyCheck = SafetyValidator.validate(operation, this.config)

    return {
      valid: safetyCheck.passed,
      errors: safetyCheck.errors,
      warnings: safetyCheck.warnings,
      safetyCheck,
    }
  }

  /**
   * Get database schema
   */
  async getSchema(tableName?: string): Promise<DatabaseSchema | TableSchema> {
    // Check cache
    if (this.config.cacheSchema && this.schemaCache && !tableName) {
      if (Date.now() < this.schemaCache.expiresAt) {
        return this.schemaCache.schema
      }
    }

    // Fetch schema
    const schema = await this.client.getSchema(tableName)

    // Cache if full schema
    if (!tableName && this.config.cacheSchema) {
      this.schemaCache = {
        schema,
        timestamp: Date.now(),
        expiresAt: Date.now() + (this.config.schemaCacheTTL * 1000),
      }
    }

    return schema
  }

  /**
   * Format results for LLM consumption
   */
  formatResults(data: any, format: ResultFormat = ResultFormat.JSON): string {
    return ResultFormatter.format(data, format)
  }

  /**
   * Get tool capabilities
   */
  getCapabilities(): ToolCapabilities {
    return {
      supportedOperations: [
        DatabaseOperationType.SELECT,
        DatabaseOperationType.INSERT,
        DatabaseOperationType.UPDATE,
        DatabaseOperationType.DELETE,
        DatabaseOperationType.COUNT,
        DatabaseOperationType.AGGREGATE,
        DatabaseOperationType.SCHEMA,
        ...(this.config.allowDangerousOperations ? [
          DatabaseOperationType.CREATE_TABLE,
          DatabaseOperationType.DROP_TABLE,
        ] : []),
      ],
      maxRowsPerQuery: this.config.maxRowsPerQuery,
      allowDangerousOperations: this.config.allowDangerousOperations,
      hasSchemaAccess: true,
      hasWriteAccess: true,
      supportedFormats: Object.values(ResultFormat),
    }
  }

  /**
   * Get operation statistics
   */
  getStats(): OperationStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTimeMs: 0,
      operationsByType: {} as Record<DatabaseOperationType, number>,
      totalRowsAffected: 0,
      totalRowsReturned: 0,
    }
  }

  /**
   * Execute the parsed operation
   */
  private async executeOperation(operation: DatabaseOperation): Promise<any> {
    if (!operation.tableName && operation.type !== DatabaseOperationType.SCHEMA) {
      throw new Error('Table name is required')
    }

    switch (operation.type) {
      case DatabaseOperationType.SELECT:
        return this.client.select(operation.tableName!, {
          columns: operation.columns,
          where: operation.conditions,
          limit: operation.limit || this.config.maxRowsPerQuery,
          offset: operation.offset,
          orderBy: operation.orderBy,
        })

      case DatabaseOperationType.INSERT:
        if (!operation.data) {
          throw new Error('Data is required for INSERT operation')
        }
        return this.client.insert(operation.tableName!, operation.data)

      case DatabaseOperationType.UPDATE:
        if (!operation.data) {
          throw new Error('Data is required for UPDATE operation')
        }
        return this.client.update(operation.tableName!, operation.data, operation.conditions)

      case DatabaseOperationType.DELETE:
        return this.client.delete(operation.tableName!, operation.conditions)

      case DatabaseOperationType.COUNT:
        return this.client.count(operation.tableName!, operation.conditions)

      case DatabaseOperationType.AGGREGATE:
        return this.client.aggregate(operation.tableName!, operation.aggregations, operation.groupBy)

      case DatabaseOperationType.SCHEMA:
        return this.getSchema(operation.tableName)

      case DatabaseOperationType.CREATE_TABLE:
        if (!operation.columns) {
          throw new Error('Columns are required for CREATE TABLE operation')
        }
        return this.client.createTable(operation.tableName!, operation.columns as ColumnSchema[])

      case DatabaseOperationType.DROP_TABLE:
        return this.client.dropTable(operation.tableName!)

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`)
    }
  }

  /**
   * Check and update rate limits
   */
  private checkRateLimit(): void {
    const now = Date.now()

    // Reset minute counter if needed
    if (now - this.rateLimitState.lastResetMinute >= 60000) {
      this.rateLimitState.requestsThisMinute = 0
      this.rateLimitState.lastResetMinute = now
    }

    // Reset hour counter if needed
    if (now - this.rateLimitState.lastResetHour >= 3600000) {
      this.rateLimitState.requestsThisHour = 0
      this.rateLimitState.lastResetHour = now
    }

    // Check limits
    const { maxRequestsPerMinute, maxRequestsPerHour } = this.config.rateLimit

    if (maxRequestsPerMinute && this.rateLimitState.requestsThisMinute >= maxRequestsPerMinute) {
      throw new Error(`Rate limit exceeded: ${maxRequestsPerMinute} requests per minute`)
    }

    if (maxRequestsPerHour && this.rateLimitState.requestsThisHour >= maxRequestsPerHour) {
      throw new Error(`Rate limit exceeded: ${maxRequestsPerHour} requests per hour`)
    }

    // Increment counters
    this.rateLimitState.requestsThisMinute++
    this.rateLimitState.requestsThisHour++
  }

  /**
   * Update operation statistics
   */
  private updateStats(context: ExecutionContext, success: boolean, data?: any): void {
    this.stats.totalOperations++

    if (success) {
      this.stats.successfulOperations++
    } else {
      this.stats.failedOperations++
    }

    const executionTime = Date.now() - context.startTime
    this.stats.averageExecutionTimeMs =
      (this.stats.averageExecutionTimeMs * (this.stats.totalOperations - 1) + executionTime) /
      this.stats.totalOperations

    if (context.operation.type) {
      this.stats.operationsByType[context.operation.type] =
        (this.stats.operationsByType[context.operation.type] || 0) + 1
    }

    if (data && Array.isArray(data)) {
      this.stats.totalRowsReturned += data.length
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(
    operation: DatabaseOperationType,
    message: string,
    code: string,
    context: ExecutionContext,
    format: ResultFormat,
    safetyCheck?: SafetyCheck
  ): ToolResult {
    return {
      success: false,
      metadata: {
        operation,
        executionTimeMs: Date.now() - context.startTime,
        format,
        safetyCheck,
      },
      error: {
        message,
        code,
        suggestion: safetyCheck?.suggestions?.[0],
      },
    }
  }
}

/**
 * Factory function to create ZeroDB tool
 */
export function createZeroDBTool(config: ZeroDBToolConfig): ZeroDBTool {
  return new ZeroDBTool(config)
}

/**
 * Re-export types from zerodb-types
 */
export type {
  ZeroDBToolConfig,
  DatabaseOperation,
  SafetyCheck,
  ToolResult,
  ParsedNaturalLanguage,
  TableSchema,
  ColumnSchema,
  DatabaseSchema,
  ValidationResult,
  ToolCapabilities,
  OperationStats,
  RateLimitState,
  ExecutionContext,
  SchemaCacheEntry,
} from './zerodb-types'

export {
  DatabaseOperationType,
  QueryIntent,
  SafetyLevel,
  ResultFormat,
} from './zerodb-types'

export default ZeroDBTool
