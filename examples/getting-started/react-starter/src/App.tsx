import { useState } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'
import './App.css'

function App() {
  const [input, setInput] = useState('')

  const {
    messages,
    send,
    isStreaming,
    error,
    retry,
    reset,
    usage
  } = useAIStream({
    endpoint: 'http://localhost:3001/api/chat',
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
    },
    onCost: (cost) => {
      console.log('Request cost:', cost)
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
        <h1>React AI Kit Starter</h1>
        <div className="stats">
          <span>{messages.length} messages</span>
          <span>{usage.totalTokens} tokens</span>
          <span>${usage.estimatedCost.toFixed(4)}</span>
          <button onClick={reset} className="reset-btn">
            Reset
          </button>
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Type a message below to begin</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-header">
              <strong>{msg.role === 'user' ? 'You' : 'AI'}</strong>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}

        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
            <button onClick={retry}>Retry</button>
          </div>
        )}

        {isStreaming && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
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
