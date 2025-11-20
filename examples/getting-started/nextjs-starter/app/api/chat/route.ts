import { NextRequest, NextResponse } from 'next/server'
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const token = event.delta.type === 'text_delta' ? event.delta.text : ''
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
              )
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
