import { NextRequest, NextResponse } from 'next/server'
import { AIKit } from '@ainative/ai-kit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveMessage, updateConversation } from '@/lib/db'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new NextResponse('Invalid request body', { status: 400 })
    }

    const aikit = new AIKit({
      apiKey: process.env.AINATIVE_API_KEY!,
    })

    // Save user message
    const userMessage = messages[messages.length - 1]
    await saveMessage({
      conversationId,
      userId: session.user.id,
      role: 'user',
      content: userMessage.content,
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''
          let tokenCount = 0
          let cost = 0

          const response = await aikit.chat.completions.create({
            messages,
            model: 'gpt-4-turbo-preview',
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          })

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''

            if (content) {
              fullResponse += content
              tokenCount++

              const data = {
                type: 'content',
                content,
                tokenCount,
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
              )
            }
          }

          // Calculate cost (approximate)
          cost = (tokenCount / 1000) * 0.01

          // Save assistant message
          await saveMessage({
            conversationId,
            userId: session.user.id,
            role: 'assistant',
            content: fullResponse,
            metadata: {
              tokenCount,
              cost,
              model: 'gpt-4-turbo-preview',
            },
          })

          // Update conversation
          await updateConversation({
            id: conversationId,
            userId: session.user.id,
            lastMessage: fullResponse.substring(0, 100),
            tokenCount,
            cost,
          })

          // Send final stats
          const finalData = {
            type: 'done',
            tokenCount,
            cost,
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          )

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
