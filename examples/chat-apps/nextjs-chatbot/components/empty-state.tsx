'use client'

import { MessageSquarePlus, Zap, Shield, Globe } from 'lucide-react'

interface EmptyStateProps {
  onStart: () => void
}

export function EmptyState({ onStart }: EmptyStateProps) {
  const features = [
    {
      icon: Zap,
      title: 'Fast Responses',
      description: 'Get instant AI-powered answers with streaming',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and private',
    },
    {
      icon: Globe,
      title: 'Multi-language',
      description: 'Chat in any language you prefer',
    },
  ]

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquarePlus className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">
            Welcome to AI Chatbot
          </h1>

          <p className="text-muted-foreground text-lg">
            Start a conversation and experience the power of AI-assisted chat
          </p>
        </div>

        <button
          onClick={onStart}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Start New Conversation
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-6 rounded-lg border border-border bg-muted/30"
              >
                <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>
            Powered by AI Kit • Built with Next.js 14 • Production Ready
          </p>
        </div>
      </div>
    </div>
  )
}
