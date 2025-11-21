/**
 * ZeroDB memory store implementation
 *
 * Stores user memories in ZeroDB for cloud persistence and scalability.
 */

import { MemoryStore } from './MemoryStore'
import {
  MemoryItem,
  MemoryType,
  MemorySearchOptions,
  SaveMemoryOptions,
  UpdateMemoryOptions,
  MemoryStoreStats,
  ZeroDBMemoryStoreConfig,
} from './types'

interface ZeroDBTableRow {
  id: string
  data: string
  userId: string
  type: string
  entityName?: string
  importance: number
  confidence: number
  createdAt: number
  updatedAt: number
}

export class ZeroDBMemoryStore extends MemoryStore {
  private projectId: string
  private apiKey: string
  private tableName: string
  private baseUrl: string

  constructor(config: Omit<ZeroDBMemoryStoreConfig, 'type'>) {
    super(config)
    this.projectId = config.projectId
    this.apiKey = config.apiKey
    this.tableName = config.tableName || 'user_memories'
    this.baseUrl = 'https://api.zerodb.io/v1'
  }

  async save(
    memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options?: SaveMemoryOptions
  ): Promise<MemoryItem> {
    const memoryItem = this.createMemoryItem(memory, options)

    const row: ZeroDBTableRow = {
      id: memoryItem.id,
      data: JSON.stringify(memoryItem),
      userId: memoryItem.userId,
      type: memoryItem.type,
      entityName: memoryItem.entityName,
      importance: memoryItem.importance,
      confidence: memoryItem.confidence,
      createdAt: memoryItem.createdAt,
      updatedAt: memoryItem.updatedAt,
    }

    await this.insertRow(row)

    return { ...memoryItem }
  }

  async get(memoryId: string): Promise<MemoryItem | null> {
    const rows = await this.queryRows({
      filter: { id: memoryId },
    })

    if (rows.length === 0 || !rows[0]) {
      return null
    }

    const memory: MemoryItem = JSON.parse(rows[0].data)

    // Check if expired
    if (this.isExpired(memory)) {
      await this.delete(memoryId)
      return null
    }

    // Update last accessed time
    memory.lastAccessedAt = Date.now()
    await this.updateRow(memoryId, { data: JSON.stringify(memory) })

    return memory
  }

  async update(
    memoryId: string,
    updates: UpdateMemoryOptions
  ): Promise<MemoryItem | null> {
    const memory = await this.get(memoryId)

    if (!memory) {
      return null
    }

    const now = Date.now()

    // Apply updates
    if (updates.content !== undefined) {
      memory.content = updates.content
    }
    if (updates.importance !== undefined) {
      memory.importance = updates.importance
    }
    if (updates.confidence !== undefined) {
      memory.confidence = updates.confidence
    }
    if (updates.ttl !== undefined) {
      memory.ttl = updates.ttl > 0 ? updates.ttl : undefined
    }
    if (updates.metadata) {
      memory.metadata = {
        ...memory.metadata,
        ...updates.metadata,
      }
    }

    memory.updatedAt = now
    memory.lastAccessedAt = now

    // Update in ZeroDB
    await this.updateRow(memoryId, {
      data: JSON.stringify(memory),
      importance: memory.importance,
      confidence: memory.confidence,
      updatedAt: now,
    })

    return memory
  }

  async delete(memoryId: string): Promise<boolean> {
    try {
      await this.deleteRow(memoryId)
      return true
    } catch (error) {
      return false
    }
  }

  async search(
    userId: string,
    options?: MemorySearchOptions
  ): Promise<MemoryItem[]> {
    const memories = await this.getByUser(userId, options?.includeExpired)
    return this.filterMemories(memories, options)
  }

  async getByUser(
    userId: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const rows = await this.queryRows({
      filter: { userId },
    })

    return this.rowsToMemories(rows, includeExpired)
  }

  async getByType(
    userId: string,
    type: MemoryType,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const rows = await this.queryRows({
      filter: { userId, type },
    })

    return this.rowsToMemories(rows, includeExpired)
  }

  async getByEntity(
    userId: string,
    entityName: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const rows = await this.queryRows({
      filter: { userId, entityName },
    })

    return this.rowsToMemories(rows, includeExpired)
  }

  async deleteByUser(userId: string): Promise<number> {
    const rows = await this.queryRows({
      filter: { userId },
    })

    for (const row of rows) {
      await this.deleteRow(row.id)
    }

    return rows.length
  }

  async clear(): Promise<number> {
    const rows = await this.queryRows({})

    for (const row of rows) {
      await this.deleteRow(row.id)
    }

    return rows.length
  }

  async getStats(): Promise<MemoryStoreStats> {
    const rows = await this.queryRows({})

    const memoriesByType: Record<MemoryType, number> = {
      fact: 0,
      preference: 0,
      context: 0,
      entity: 0,
      goal: 0,
    }

    const userSet = new Set<string>()
    let expiredMemories = 0

    for (const row of rows) {
      const memory: MemoryItem = JSON.parse(row.data)

      if (memory.type in memoriesByType) {
        memoriesByType[memory.type]++
      }

      userSet.add(memory.userId)

      if (this.isExpired(memory)) {
        expiredMemories++
      }
    }

    return {
      totalMemories: rows.length,
      memoriesByType,
      uniqueUsers: userSet.size,
      expiredMemories,
    }
  }

  async cleanup(): Promise<number> {
    const rows = await this.queryRows({})
    let removed = 0

    for (const row of rows) {
      const memory: MemoryItem = JSON.parse(row.data)
      if (this.isExpired(memory)) {
        await this.deleteRow(row.id)
        removed++
      }
    }

    return removed
  }

  async close(): Promise<void> {
    // No persistent connections to close
  }

  /**
   * Convert rows to memory items
   */
  private rowsToMemories(
    rows: ZeroDBTableRow[],
    includeExpired: boolean = false
  ): MemoryItem[] {
    const memories: MemoryItem[] = []

    for (const row of rows) {
      const memory: MemoryItem = JSON.parse(row.data)
      if (includeExpired || !this.isExpired(memory)) {
        memories.push(memory)
      }
    }

    return memories
  }

  /**
   * Insert a row into ZeroDB
   */
  private async insertRow(row: ZeroDBTableRow): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/tables/${this.tableName}/insert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ rows: [row] }),
      }
    )

    if (!response.ok) {
      throw new Error(`ZeroDB insert failed: ${response.statusText}`)
    }
  }

  /**
   * Query rows from ZeroDB
   */
  private async queryRows(params: {
    filter?: Record<string, any>
    limit?: number
    offset?: number
  }): Promise<ZeroDBTableRow[]> {
    const response = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/tables/${this.tableName}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      }
    )

    if (!response.ok) {
      throw new Error(`ZeroDB query failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.rows || []
  }

  /**
   * Update a row in ZeroDB
   */
  private async updateRow(
    id: string,
    updates: Partial<ZeroDBTableRow>
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/tables/${this.tableName}/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          filter: { id },
          updates,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`ZeroDB update failed: ${response.statusText}`)
    }
  }

  /**
   * Delete a row from ZeroDB
   */
  private async deleteRow(id: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/tables/${this.tableName}/delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          filter: { id },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`ZeroDB delete failed: ${response.statusText}`)
    }
  }
}
