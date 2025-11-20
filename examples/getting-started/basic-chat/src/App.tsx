import { useState } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'
import './App.css'

function App() {
  const [input, setInput] = useState('')

  const { messages, send, isStreaming, error, usage } = useAIStream({
    endpoint: '/api/chat',
    onCost: (cost) => {
      console.log('Cost:', cost)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Basic Chat Example</h1>
        <div className="stats">
          <span>Messages: {messages.length}</span>
          <span>Tokens: {usage.totalTokens}</span>
          <span>Cost: ${usage.estimatedCost.toFixed(4)}</span>
        </div>
      </header>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}

        {error && (
          <div className="error">Error: {error.message}</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default App
