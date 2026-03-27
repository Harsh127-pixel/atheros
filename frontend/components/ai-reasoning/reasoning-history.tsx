'use client'

import { useState } from 'react'
import { ReasoningCard } from './reasoning-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ReasoningEntry {
  id: string
  deployment: string
  timestamp: string
  reasoning: string
  decision: string
  confidence: number
}

const MOCK_REASONING: ReasoningEntry[] = [
  {
    id: '1',
    deployment: 'Production API v2.3.0',
    timestamp: '2024-03-27 14:32:00',
    reasoning: 'Analyzed deployment manifest and detected security vulnerabilities in dependencies. Cross-referenced with CVE database and found 2 critical issues. Recommended immediate patching before deployment.',
    decision: 'BLOCKED',
    confidence: 98,
  },
  {
    id: '2',
    deployment: 'Frontend App v1.5.1',
    timestamp: '2024-03-27 13:15:00',
    reasoning: 'Performance metrics indicate 34% faster load time with optimized code splitting. Static analysis shows 100% test coverage. Infrastructure can handle 5x current traffic.',
    decision: 'APPROVED',
    confidence: 96,
  },
  {
    id: '3',
    deployment: 'Database Migration v3.1.0',
    timestamp: '2024-03-27 11:48:00',
    reasoning: 'Reviewed migration script and backup procedures. Verified rollback strategy and tested in staging environment. Zero data loss risk detected. Recommended deployment during maintenance window.',
    decision: 'APPROVED_WITH_CONDITIONS',
    confidence: 94,
  },
  {
    id: '4',
    deployment: 'Cache Service v2.0.0',
    timestamp: '2024-03-26 16:22:00',
    reasoning: 'Analyzed deployment and identified potential memory leak in new version. Recommended further testing and monitoring. Staging tests show 15% higher memory usage than previous version.',
    decision: 'NEEDS_REVIEW',
    confidence: 87,
  },
  {
    id: '5',
    deployment: 'Payment Module v1.2.0',
    timestamp: '2024-03-26 10:15:00',
    reasoning: 'Thoroughly analyzed payment processing logic and security measures. PCI compliance verified. Load testing shows 10k transaction/second capacity. All edge cases handled correctly.',
    decision: 'APPROVED',
    confidence: 99,
  },
]

export function ReasoningHistory() {
  const [search, setSearch] = useState('')

  const filteredBySearch = MOCK_REASONING.filter(r =>
    r.deployment.toLowerCase().includes(search.toLowerCase())
  )

  const approved = filteredBySearch.filter(r => r.decision === 'APPROVED')
  const blocked = filteredBySearch.filter(r => r.decision === 'BLOCKED')
  const needsReview = filteredBySearch.filter(r => r.decision === 'APPROVED_WITH_CONDITIONS' || r.decision === 'NEEDS_REVIEW')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Reasoning History</h2>
        <p className="text-sm text-muted-foreground">Deployment decisions and AI agent reasoning</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search deployments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-input/50 border-border/50"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/30 border border-border/50">
          <TabsTrigger value="all">All ({filteredBySearch.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({blocked.length})</TabsTrigger>
          <TabsTrigger value="review">Review ({needsReview.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6">
          {filteredBySearch.length > 0 ? (
            filteredBySearch.map(entry => (
              <ReasoningCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No deployments found matching your search
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-6">
          {approved.length > 0 ? (
            approved.map(entry => (
              <ReasoningCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No approved deployments
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked" className="space-y-3 mt-6">
          {blocked.length > 0 ? (
            blocked.map(entry => (
              <ReasoningCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No blocked deployments
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-3 mt-6">
          {needsReview.length > 0 ? (
            needsReview.map(entry => (
              <ReasoningCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No deployments needing review
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
