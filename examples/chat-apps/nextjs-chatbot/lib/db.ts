// Database utilities for message persistence
// In production, replace with actual database implementation

export interface Message {
  id: string
  conversationId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    tokenCount?: number
    cost?: number
    model?: string
  }
  createdAt: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string
  lastMessage: string
  messageCount: number
  tokenCount: number
  cost: number
  createdAt: Date
  updatedAt: Date
}

// In-memory storage for demo (replace with actual database)
const conversations = new Map<string, Conversation>()
const messages = new Map<string, Message[]>()

export async function saveMessage(data: {
  conversationId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
}): Promise<Message> {
  const message: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    conversationId: data.conversationId,
    userId: data.userId,
    role: data.role,
    content: data.content,
    metadata: data.metadata,
    createdAt: new Date(),
  }

  const conversationMessages = messages.get(data.conversationId) || []
  conversationMessages.push(message)
  messages.set(data.conversationId, conversationMessages)

  return message
}

export async function getMessages(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  const conversationMessages = messages.get(conversationId) || []
  return conversationMessages.filter((msg) => msg.userId === userId)
}

export async function updateConversation(data: {
  id: string
  userId: string
  title?: string
  lastMessage?: string
  tokenCount?: number
  cost?: number
}): Promise<Conversation> {
  const existing = conversations.get(data.id)

  const conversation: Conversation = {
    id: data.id,
    userId: data.userId,
    title: data.title || existing?.title || 'New Conversation',
    lastMessage: data.lastMessage || existing?.lastMessage || '',
    messageCount: (existing?.messageCount || 0) + 1,
    tokenCount: (existing?.tokenCount || 0) + (data.tokenCount || 0),
    cost: (existing?.cost || 0) + (data.cost || 0),
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  }

  conversations.set(data.id, conversation)
  return conversation
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return Array.from(conversations.values())
    .filter((conv) => conv.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function deleteConversation(
  id: string,
  userId: string
): Promise<void> {
  const conversation = conversations.get(id)
  if (conversation?.userId === userId) {
    conversations.delete(id)
    messages.delete(id)
  }
}

export async function getUserStats(userId: string): Promise<{
  totalConversations: number
  totalMessages: number
  totalTokens: number
  totalCost: number
}> {
  const userConversations = Array.from(conversations.values()).filter(
    (conv) => conv.userId === userId
  )

  return {
    totalConversations: userConversations.length,
    totalMessages: userConversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    ),
    totalTokens: userConversations.reduce(
      (sum, conv) => sum + conv.tokenCount,
      0
    ),
    totalCost: userConversations.reduce((sum, conv) => sum + conv.cost, 0),
  }
}
