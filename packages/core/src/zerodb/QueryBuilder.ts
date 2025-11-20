/**
 * Fluent Query Builder for ZeroDB
 *
 * Provides a fluent API for building complex database queries with
 * type safety and method chaining.
 */

import {
  IQueryBuilder,
  QueryOptions,
  Filter,
  FilterCondition,
  FilterOperator,
  SortDirection,
  SortSpec,
  QueryResult,
} from './types'

export class QueryBuilder<T = any> implements IQueryBuilder<T> {
  private tableName: string
  private options: QueryOptions = {}
  private filters: Filter[] = []
  private orFilters: Filter[] = []
  private notFilters: Filter[] = []
  private executor: (table: string, options: QueryOptions) => Promise<QueryResult<T>>

  constructor(
    table: string,
    executor: (table: string, options: QueryOptions) => Promise<QueryResult<T>>
  ) {
    this.tableName = table
    this.executor = executor
  }

  /**
   * Select specific fields
   */
  select(...fields: string[]): IQueryBuilder<T> {
    this.options.select = [...(this.options.select || []), ...fields]
    return this
  }

  /**
   * Add WHERE condition
   */
  where(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
    const condition: FilterCondition = { field, operator, value }
    this.filters.push({ condition })
    return this
  }

  /**
   * Add AND condition
   */
  and(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
    return this.where(field, operator, value)
  }

  /**
   * Add OR condition
   */
  or(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
    const condition: FilterCondition = { field, operator, value }
    this.orFilters.push({ condition })
    return this
  }

  /**
   * Add NOT condition
   */
  not(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
    const condition: FilterCondition = { field, operator, value }
    this.notFilters.push({ condition })
    return this
  }

  /**
   * Add ORDER BY
   */
  orderBy(field: string, direction: SortDirection = 'asc'): IQueryBuilder<T> {
    const sort: SortSpec = { field, direction }
    this.options.sort = [...(this.options.sort || []), sort]
    return this
  }

  /**
   * Add LIMIT
   */
  limit(limit: number): IQueryBuilder<T> {
    this.options.limit = limit
    return this
  }

  /**
   * Add OFFSET
   */
  offset(offset: number): IQueryBuilder<T> {
    this.options.offset = offset
    return this
  }

  /**
   * Add JOIN
   */
  join(
    table: string,
    on: { left: string; right: string },
    type: 'inner' | 'left' | 'right' | 'full' = 'inner'
  ): IQueryBuilder<T> {
    this.options.joins = [
      ...(this.options.joins || []),
      { table, type, on },
    ]
    return this
  }

  /**
   * Add GROUP BY
   */
  groupBy(...fields: string[]): IQueryBuilder<T> {
    // Store group by fields in metadata for later processing
    if (!this.options.select) {
      this.options.select = []
    }
    // Note: Actual GROUP BY implementation would require additional options
    return this
  }

  /**
   * Add HAVING
   */
  having(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
    // Note: HAVING implementation would require GROUP BY support
    return this
  }

  /**
   * Build the final filter
   */
  private buildFilter(): Filter | undefined {
    if (this.filters.length === 0 && this.orFilters.length === 0 && this.notFilters.length === 0) {
      return undefined
    }

    const filter: Filter = {}

    if (this.filters.length > 0) {
      filter.and = this.filters
    }

    if (this.orFilters.length > 0) {
      if (filter.and) {
        filter.and.push({ or: this.orFilters })
      } else {
        filter.or = this.orFilters
      }
    }

    if (this.notFilters.length > 0) {
      const notFilter: Filter = { or: this.notFilters }
      if (filter.and) {
        filter.and.push({ not: notFilter })
      } else {
        filter.not = notFilter
      }
    }

    return filter
  }

  /**
   * Execute query
   */
  async execute(): Promise<QueryResult<T>> {
    const filter = this.buildFilter()
    if (filter) {
      this.options.filter = filter
    }

    return this.executor(this.tableName, this.options)
  }

  /**
   * Get first result
   */
  async first(): Promise<T | null> {
    this.limit(1)
    const result = await this.execute()
    return result.rows[0] || null
  }

  /**
   * Get all results
   */
  async all(): Promise<T[]> {
    const result = await this.execute()
    return result.rows
  }

  /**
   * Count results
   */
  async count(): Promise<number> {
    this.options.count = true
    const result = await this.execute()
    return result.count || 0
  }

  /**
   * Clone the query builder
   */
  clone(): QueryBuilder<T> {
    const cloned = new QueryBuilder<T>(this.tableName, this.executor)
    cloned.options = { ...this.options }
    cloned.filters = [...this.filters]
    cloned.orFilters = [...this.orFilters]
    cloned.notFilters = [...this.notFilters]
    return cloned
  }

  /**
   * Reset the query builder
   */
  reset(): IQueryBuilder<T> {
    this.options = {}
    this.filters = []
    this.orFilters = []
    this.notFilters = []
    return this
  }

  /**
   * Paginate results
   */
  paginate(page: number, pageSize: number): IQueryBuilder<T> {
    const offset = (page - 1) * pageSize
    return this.limit(pageSize).offset(offset)
  }

  /**
   * Get query options (for debugging)
   */
  getOptions(): QueryOptions {
    const filter = this.buildFilter()
    return {
      ...this.options,
      filter,
    }
  }
}
