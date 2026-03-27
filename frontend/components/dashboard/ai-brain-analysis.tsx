'use client'

import { useState, useEffect } from 'react'
import { AnalysisCard } from './analysis-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AIInsight {
  id: string
  title: string
  value: string | number
  description: string
  type: 'insight' | 'security' | 'performance' | 'alert'
  trend?: 'up' | 'down' | 'stable'
}

export function AIBrainAnalysis() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching AI insights
    setTimeout(() => {
      setInsights([
        {
          id: '1',
          title: 'Security Score',
          value: '94/100',
          description: 'Your deployment passes 94% of security checks',
          type: 'security',
          trend: 'up',
        },
        {
          id: '2',
          title: 'Performance Index',
          value: '87/100',
          description: 'Average response time: 145ms',
          type: 'performance',
          trend: 'stable',
        },
        {
          id: '3',
          title: 'Uptime',
          value: '99.98%',
          description: '0 incidents in the last 30 days',
          type: 'insight',
          trend: 'up',
        },
        {
          id: '4',
          title: 'API Requests',
          value: '2.4M',
          description: 'Processed this month',
          type: 'insight',
          trend: 'up',
        },
        {
          id: '5',
          title: 'Database Queries',
          value: '156ms',
          description: 'Average response time',
          type: 'performance',
          trend: 'down',
        },
        {
          id: '6',
          title: 'Active Alerts',
          value: '2',
          description: 'Review your alerts in the dashboard',
          type: 'alert',
          trend: 'stable',
        },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const securityInsights = insights.filter(i => i.type === 'security')
  const performanceInsights = insights.filter(i => i.type === 'performance')
  const generalInsights = insights.filter(i => i.type === 'insight')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Brain Analysis</h2>
        <p className="text-sm text-muted-foreground">Real-time insights powered by AetherOS AI</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/30 border border-border/50">
          <TabsTrigger value="all">All Insights</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-secondary/20 rounded-lg animate-pulse"></div>
              ))
            ) : (
              insights.map(insight => (
                <AnalysisCard key={insight.id} {...insight} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {securityInsights.length > 0 ? (
              securityInsights.map(insight => (
                <AnalysisCard key={insight.id} {...insight} />
              ))
            ) : (
              <p className="text-muted-foreground">No security insights available</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {performanceInsights.length > 0 ? (
              performanceInsights.map(insight => (
                <AnalysisCard key={insight.id} {...insight} />
              ))
            ) : (
              <p className="text-muted-foreground">No performance insights available</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4 mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {generalInsights.length > 0 ? (
              generalInsights.map(insight => (
                <AnalysisCard key={insight.id} {...insight} />
              ))
            ) : (
              <p className="text-muted-foreground">No general insights available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
