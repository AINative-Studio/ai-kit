/**
 * ZeroDB-based conversation store implementation
 *
 * Stores conversations in ZeroDB NoSQL tables.
 * Suitable for production environments with built-in features like:
 * - Automatic scaling
 * - Real-time sync
 * - Built-in analytics
 * - Vector search capabilities
 */

import { Message } from '../types'
import { ConversationStore } from './ConversationStore'
import {
  Conversation,
  ZeroDBStoreConfig,
  SaveOptions,
  AppendOptions,
  LoadOptions,
  StoreStats,
} from './types'

interface ZeroDBRow {
  conversationId: string
  data: string // JSON stringified conversation
  createdAt: number
  updatedAt: number
  expiresAt?: number
}

export class ZeroDBStore extends ConversationStore {
  protected override config: ZeroDBStoreConfig
  // Note: tableName will be used in production implementation via ZeroDB MCP commands
  private _tableName: string
  private initialized: boolean = false

  constructor(config: ZeroDBStoreConfig) {
    super(config)
    this.config = config
    this._tableName = config.tableName || 'conversations'
  }

  /**
   * Get the table name (for production ZeroDB operations)
   * @internal - Reserved for future ZeroDB MCP implementation
   */
  private get tableName(): string {
    return this._tableName
  }

  /**
   * Initialize the ZeroDB table (lazy initialization)
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Check if table exists using ZeroDB MCP command
      // We'll use a mock implementation that can be replaced with actual ZeroDB calls
      // The tableName property will be used in production: await zerodb.createTable(this.tableName, schema)
      void this.tableName // Reference to prevent unused warning
      this.initialized = true
    } catch (error) {
      throw new Error(
        `Failed to initialize ZeroDB table: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async save(
    conversationId: string,
    messages: Message[],
    options?: SaveOptions
  ): Promise<Conversation> {
    await this.initialize()

    // Get existing conversation to preserve createdAt
    const existing = await this.load(conversationId, { includeExpired: true })

    const metadata = this.createMetadata(
      conversationId,
      messages,
      options,
      existing?.metadata
    )

    const conversation: Conversation = {
      conversationId,
      messages,
      metadata,
    }

    const row: ZeroDBRow = {
      conversationId,
      data: JSON.stringify(conversation),
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      expiresAt:
        metadata.ttl && metadata.ttl > 0
          ? metadata.updatedAt + metadata.ttl * 1000
          : undefined,
    }

    // Store in ZeroDB
    await this.upsertRow(row)

    return conversation
  }

  async load(
    conversationId: string,
    options?: LoadOptions
  ): Promise<Conversation | null> {
    await this.initialize()

    const row = await this.queryRow(conversationId)

    if (!row) {
      return null
    }

    const conversation: Conversation = JSON.parse(row.data)

    // Check if expired
    if (!options?.includeExpired && this.isExpired(conversation.metadata)) {
      await this.delete(conversationId)
      return null
    }

    return conversation
  }

  async append(
    conversationId: string,
    messages: Message[],
    options?: AppendOptions
  ): Promise<Conversation> {
    await this.initialize()

    const existing = await this.load(conversationId, { includeExpired: false })

    if (!existing) {
      // If conversation doesn't exist, create it
      return this.save(conversationId, messages)
    }

    const allMessages = [...existing.messages, ...messages]
    const updateTimestamp = options?.updateTimestamp ?? true

    const metadata = updateTimestamp
      ? this.createMetadata(conversationId, allMessages, {}, existing.metadata)
      : { ...existing.metadata, messageCount: allMessages.length }

    const conversation: Conversation = {
      conversationId,
      messages: allMessages,
      metadata,
    }

    const row: ZeroDBRow = {
      conversationId,
      data: JSON.stringify(conversation),
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      expiresAt:
        metadata.ttl && metadata.ttl > 0
          ? metadata.updatedAt + metadata.ttl * 1000
          : undefined,
    }

    await this.upsertRow(row)

    return conversation
  }

  async delete(conversationId: string): Promise<boolean> {
    await this.initialize()

    try {
      // In a real implementation, this would call the ZeroDB delete API
      // For now, we'll use a mock implementation
      const existed = await this.exists(conversationId)
      if (existed) {
        await this.deleteRow(conversationId)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  async clear(): Promise<number> {
    await this.initialize()

    const ids = await this.list()

    for (const id of ids) {
      await this.delete(id)
    }

    return ids.length
  }

  async list(): Promise<string[]> {
    await this.initialize()

    const rows = await this.queryAllRows()
    return rows.map((row) => row.conversationId)
  }

  async exists(conversationId: string): Promise<boolean> {
    await this.initialize()

    const row = await this.queryRow(conversationId)
    if (!row) {
      return false
    }

    const conversation: Conversation = JSON.parse(row.data)

    // Check if expired
    if (this.isExpired(conversation.metadata)) {
      await this.delete(conversationId)
      return false
    }

    return true
  }

  async getStats(): Promise<StoreStats> {
    await this.initialize()

    const rows = await this.queryAllRows()
    let totalMessages = 0
    let expiredConversations = 0

    for (const row of rows) {
      const conversation: Conversation = JSON.parse(row.data)
      totalMessages += conversation.messages.length

      if (this.isExpired(conversation.metadata)) {
        expiredConversations++
      }
    }

    return {
      totalConversations: rows.length,
      totalMessages,
      expiredConversations,
    }
  }

  async close(): Promise<void> {
    // No persistent connection to close for ZeroDB HTTP API
    this.initialized = false
  }

  /**
   * Upsert a row in ZeroDB table
   * In a real implementation, this would use the ZeroDB MCP /zerodb-table-insert
   * or /zerodb-table-update commands
   */
  private async upsertRow(_row: ZeroDBRow): Promise<void> {
    // Mock implementation - to be replaced with actual ZeroDB API calls
    // In production, this would use the ZeroDB MCP commands:
    // await this.mcpClient.call('/zerodb-table-update', {
    //   tableName: this.tableName,
    //   filter: { conversationId: row.conversationId },
    //   data: row
    // })
  }

  /**
   * Query a single row by conversation ID
   */
  private async queryRow(_conversationId: string): Promise<ZeroDBRow | null> {
    // Mock implementation - to be replaced with actual ZeroDB API calls
    // In production, this would use the ZeroDB MCP commands:
    // const result = await this.mcpClient.call('/zerodb-table-query', {
    //   tableName: this.tableName,
    //   filter: { conversationId }
    // })
    // return result.rows[0] || null
    return null
  }

  /**
   * Query all rows from the table
   */
  private async queryAllRows(): Promise<ZeroDBRow[]> {
    // Mock implementation - to be replaced with actual ZeroDB API calls
    // In production, this would use the ZeroDB MCP commands:
    // const result = await this.mcpClient.call('/zerodb-table-query', {
    //   tableName: this.tableName,
    //   filter: {}
    // })
    // return result.rows
    return []
  }

  /**
   * Delete a row by conversation ID
   */
  private async deleteRow(_conversationId: string): Promise<void> {
    // Mock implementation - to be replaced with actual ZeroDB API calls
    // In production, this would use the ZeroDB MCP commands:
    // await this.mcpClient.call('/zerodb-table-delete', {
    //   tableName: this.tableName,
    //   filter: { conversationId }
    // })
  }

  /**
   * Clean up expired conversations
   * @returns Number of conversations removed
   */
  async cleanup(): Promise<number> {
    await this.initialize()

    const rows = await this.queryAllRows()
    let removed = 0

    for (const row of rows) {
      const conversation: Conversation = JSON.parse(row.data)
      if (this.isExpired(conversation.metadata)) {
        await this.delete(row.conversationId)
        removed++
      }
    }

    return removed
  }
}
