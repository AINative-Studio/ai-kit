import { useState } from 'react'
import { Search, Bell, RefreshCw, Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/helpers'

export function Header() {
  const [darkMode, setDarkMode] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents, executions, or logs..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn(
            'p-2 hover:bg-accent rounded-lg transition-colors',
            refreshing && 'animate-spin'
          )}
        >
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  )
}
