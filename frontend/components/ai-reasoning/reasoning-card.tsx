'use client'

import { Card } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

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
]

export function ReasoningCard({ entry }: { entry: ReasoningEntry }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-green-500/10 border-green-500/30'
      case 'BLOCKED':
        return 'bg-red-500/10 border-red-500/30'
      case 'APPROVED_WITH_CONDITIONS':
        return 'bg-yellow-500/10 border-yellow-500/30'
      default:
        return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">✓ Approved</span>
      case 'BLOCKED':
        return <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">✗ Blocked</span>
      case 'APPROVED_WITH_CONDITIONS':
        return <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">⚠ Review</span>
      default:
        return <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">? Pending</span>
    }
  }

  return (
    <div
      className={`${getDecisionColor(entry.decision)} border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{entry.deployment}</h3>
          <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
        </div>
        <div className="flex items-center gap-3">
          {getDecisionBadge(entry.decision)}
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {!isExpanded && (
        <p className="text-sm text-foreground/80 line-clamp-2">{entry.reasoning}</p>
      )}

      {isExpanded && (
        <div className="space-y-3 mt-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">AI Reasoning</p>
            <p className="text-sm text-foreground/90">{entry.reasoning}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Confidence Score</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${entry.confidence}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-primary">{entry.confidence}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
