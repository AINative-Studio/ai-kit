import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  FileText,
  TrendingUp,
  Settings,
  Bot,
} from 'lucide-react'
import { cn } from '@/utils/helpers'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Agents', href: '/agents', icon: Bot },
  { name: 'Execution Logs', href: '/logs', icon: FileText },
  { name: 'Performance', href: '/performance', icon: TrendingUp },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Agent Monitor</h1>
            <p className="text-xs text-muted-foreground">AI Kit</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
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
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">5 Active Agents</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operational
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
