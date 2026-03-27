'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Terminal, Brain, Settings, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Sidebar() {
  const { logout, isAdmin, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/terminal', label: 'Terminal', icon: Terminal },
    { href: '/dashboard/ai-reasoning', label: 'AI Reasoning', icon: Brain },
    ...(isAdmin ? [{ href: '/dashboard/admin', label: 'God Mode', icon: Settings }] : []),
  ]

  return (
    <div className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {isOpen && <h2 className="text-lg font-bold text-sidebar-foreground">AetherOS</h2>}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-sidebar-foreground hover:bg-sidebar-accent/50">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
              title={isOpen ? undefined : item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {isOpen && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30">
            <p className="text-xs text-sidebar-foreground/60 truncate">Signed in as</p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size={isOpen ? 'sm' : 'icon'}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isOpen && 'Logout'}
        </Button>
      </div>
    </div>
  )
}
