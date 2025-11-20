'use client'

import { useState } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'

export default function Home() {
  const [input, setInput] = useState('')

  const { messages, send, isStreaming, error, usage, reset } = useAIStream({
    endpoint: '/api/chat',
    systemPrompt: 'You are a helpful AI assistant.',
    onCost: (cost) => console.log('Cost:', cost),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    await send(input)
    setInput('')
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Kit Next.js Starter</h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Messages: {messages.length}</span>
          <span>Tokens: {usage.totalTokens}</span>
          <span>Cost: ${usage.estimatedCost.toFixed(4)}</span>
          <button onClick={reset} className="text-blue-600 hover:underline">
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6 h-[500px] overflow-y-auto border rounded-lg p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1">{msg.role}</div>
            <div>{msg.content}</div>
          </div>
        ))}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  )
}
