'use client'

import { Users, Key, Shield, Activity, DollarSign, Settings } from 'lucide-react'

export default function AdminPanel() {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, change: '+12%' },
    { label: 'API Keys', value: '456', icon: Key, change: '+5%' },
    { label: 'Active Sessions', value: '89', icon: Activity, change: '+23%' },
    { label: 'Revenue (MTD)', value: '$12,456', icon: DollarSign, change: '+18%' },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Control Panel</h1>
          <p className="text-muted-foreground">
            Manage users, API keys, security settings, and system configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Create, update, and manage user accounts and permissions
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Manage Users
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">API Key Management</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Generate, revoke, and monitor API key usage
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Manage Keys
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Configure rate limits, access controls, and security policies
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Configure Security
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">System Health</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Monitor system performance, uptime, and resource usage
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              View Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
