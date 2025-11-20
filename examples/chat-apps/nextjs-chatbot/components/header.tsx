'use client'

import { useSession, signOut } from 'next-auth/react'
import { Moon, Sun, Settings, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold">AI Chatbot</h1>
          <span className="text-xs text-muted-foreground">
            Powered by AI Kit
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {session.user.name?.[0] || <User className="w-4 h-4" />}
                </div>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
