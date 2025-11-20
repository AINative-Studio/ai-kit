'use client'

import { useState, useEffect } from 'react'
import { Search, Moon, Sun, Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const [darkMode, setDarkMode] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search metrics, users, or reports..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            'p-2 hover:bg-accent rounded-lg transition-colors',
            isRefreshing && 'animate-spin'
          )}
          aria-label="Refresh data"
        >
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Export data"
        >
          <Download className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle dark mode"
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
