import { useState } from 'react'
import { ChatContainer } from './components/ChatContainer'
import { ToolsPanel } from './components/ToolsPanel'
import { Header } from './components/Header'
import { useChatStore } from './lib/store'
import './App.css'

function App() {
  const [showTools, setShowTools] = useState(true)
  const toolExecutions = useChatStore((state) => state.toolExecutions)

  return (
    <div className="app">
      <Header onToggleTools={() => setShowTools(!showTools)} />

      <div className="main-container">
        <div className="chat-section">
          <ChatContainer />
        </div>

        {showTools && (
          <aside className="tools-panel">
            <ToolsPanel executions={toolExecutions} />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App
