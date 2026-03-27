'use client'

import { Card } from '@/components/ui/card'
import { Users, Activity, TrendingUp } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  change: number
  icon: React.ReactNode
}

const stats: StatCard[] = [
  {
    label: 'Total Users',
    value: '2,847',
    change: 12,
    icon: <Users className="w-6 h-6" />,
  },
  {
    label: 'Active Deployments',
    value: '143',
    change: 8,
    icon: <Activity className="w-6 h-6" />,
  },
  {
    label: 'Success Rate',
    value: '99.2%',
    change: -0.8,
    icon: <TrendingUp className="w-6 h-6" />,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass p-6 border border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {stat.icon}
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              stat.change > 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {stat.change > 0 ? '+' : ''}{stat.change}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
        </Card>
      ))}
    </div>
  )
}
