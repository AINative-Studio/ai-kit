'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'

interface APIKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string
  requests: number
}

export function APIKeyManager() {
  const [keys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_1234567890abcdef',
      created: '2024-01-01',
      lastUsed: '2024-01-15',
      requests: 12453,
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_abcdef1234567890',
      created: '2024-01-05',
      lastUsed: '2024-01-14',
      requests: 3456,
    },
  ])

  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          Generate New Key
        </button>
      </div>

      <div className="p-4 space-y-4">
        {keys.map((key) => (
          <div
            key={key.id}
            className="border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{key.name}</h3>
              <button className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm">
                {revealed[key.id] ? key.key : '••••••••••••••••'}
              </code>
              <button
                onClick={() => toggleReveal(key.id)}
                className="p-2 hover:bg-accent rounded"
              >
                {revealed[key.id] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => copyKey(key.key)}
                className="p-2 hover:bg-accent rounded"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Created: {key.created}</span>
              <span>Last used: {key.lastUsed}</span>
              <span>{key.requests.toLocaleString()} requests</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
