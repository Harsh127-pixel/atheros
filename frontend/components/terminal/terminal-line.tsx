'use client'

import { cn } from '@/lib/utils'

interface TerminalLineProps {
  content: string
  type?: 'log' | 'error' | 'warning' | 'success'
  timestamp?: string
  delay?: number
}

export function TerminalLine({ content, type = 'log', timestamp, delay = 0 }: TerminalLineProps) {
  const typeClass = {
    log: 'text-foreground',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
  }

  const prefix = {
    log: '$ ',
    error: '✗ ',
    warning: '⚠ ',
    success: '✓ ',
  }

  return (
    <div 
      className={cn(
        'text-sm font-mono whitespace-pre-wrap break-words opacity-0 animate-slideInUp',
        typeClass[type]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {timestamp && <span className="text-muted-foreground">[{timestamp}] </span>}
      <span>{prefix[type]}</span>
      <span>{content}</span>
    </div>
  )
}
