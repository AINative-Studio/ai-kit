import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    running: 'text-blue-500',
    success: 'text-green-500',
    failure: 'text-red-500',
    error: 'text-red-500',
    idle: 'text-gray-500',
    stopped: 'text-gray-500',
  }
  return colors[status] || 'text-gray-500'
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    running: 'bg-blue-500/10',
    success: 'bg-green-500/10',
    failure: 'bg-red-500/10',
    error: 'bg-red-500/10',
    idle: 'bg-gray-500/10',
    stopped: 'bg-gray-500/10',
  }
  return colors[status] || 'bg-gray-500/10'
}
