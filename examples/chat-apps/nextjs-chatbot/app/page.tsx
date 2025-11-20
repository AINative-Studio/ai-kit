import { ChatInterface } from '@/components/chat-interface'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  )
}
