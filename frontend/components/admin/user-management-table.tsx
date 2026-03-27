'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Ban, Unlock, Crown } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'banned'
  joinedAt: string
}

const MOCK_USERS: User[] = [
  { id: '1', email: 'alice@example.com', name: 'Alice Johnson', plan: 'enterprise', status: 'active', joinedAt: '2024-01-15' },
  { id: '2', email: 'bob@example.com', name: 'Bob Smith', plan: 'pro', status: 'active', joinedAt: '2024-02-20' },
  { id: '3', email: 'charlie@example.com', name: 'Charlie Brown', plan: 'free', status: 'banned', joinedAt: '2024-03-10' },
  { id: '4', email: 'diana@example.com', name: 'Diana Prince', plan: 'pro', status: 'active', joinedAt: '2024-03-25' },
  { id: '5', email: 'eve@example.com', name: 'Eve Wilson', plan: 'free', status: 'active', joinedAt: '2024-04-05' },
]

export function UserManagementTable() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(MOCK_USERS)
  const [isLoading, setIsLoading] = useState(false)

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const banUser = async (id: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setUsers(users.map(u => 
        u.id === id ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const upgradePlan = async (id: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setUsers(users.map(u => {
        if (u.id === id) {
          const plans: Array<'free' | 'pro' | 'enterprise'> = ['free', 'pro', 'enterprise']
          const nextPlan = plans[(plans.indexOf(u.plan) + 1) % plans.length]
          return { ...u, plan: nextPlan }
        }
        return u
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-400'
      case 'pro':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <Card className="glass p-6 border border-primary/20 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">User Management</h3>
        <p className="text-sm text-muted-foreground">Manage user accounts, plans, and access</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-input/50 border-border/50"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-3 font-semibold text-foreground">User</th>
              <th className="text-left py-3 px-3 font-semibold text-foreground">Plan</th>
              <th className="text-left py-3 px-3 font-semibold text-foreground">Status</th>
              <th className="text-left py-3 px-3 font-semibold text-foreground">Joined</th>
              <th className="text-right py-3 px-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-black/20 transition-colors">
                <td className="py-3 px-3">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPlanColor(user.plan)}`}>
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    user.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-3 text-muted-foreground">{user.joinedAt}</td>
                <td className="py-3 px-3 text-right space-x-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upgradePlan(user.id)}
                    disabled={isLoading}
                    className="gap-1"
                  >
                    <Crown className="w-4 h-4" />
                    <span className="hidden sm:inline">Upgrade</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => banUser(user.id)}
                    disabled={isLoading}
                    className={user.status === 'banned' ? 'gap-1' : 'gap-1'}
                  >
                    {user.status === 'banned' ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span className="hidden sm:inline">Unban</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        <span className="hidden sm:inline">Ban</span>
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </Card>
  )
}
