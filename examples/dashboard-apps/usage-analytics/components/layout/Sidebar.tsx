'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Users,
  Settings,
  Activity,
  FileText,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Cost Tracking', href: '/costs', icon: DollarSign },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">AI Kit</h1>
        <p className="text-sm text-muted-foreground mt-1">Usage Analytics</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">
              john@example.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
