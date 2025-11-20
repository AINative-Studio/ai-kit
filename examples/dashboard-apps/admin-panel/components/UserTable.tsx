'use client'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive'
  lastLogin: string
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-14',
  },
]

export function UserTable() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">User Management</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Name</th>
              <th className="text-left p-3 text-sm font-medium">Email</th>
              <th className="text-left p-3 text-sm font-medium">Role</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Last Login</th>
              <th className="text-left p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {user.lastLogin}
                </td>
                <td className="p-3">
                  <button className="text-primary hover:underline text-sm">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
