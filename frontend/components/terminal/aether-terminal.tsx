'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TerminalLine } from './terminal-line'
import { Copy, Trash2, Download } from 'lucide-react'

interface LogEntry {
  id: string
  content: string
  type: 'log' | 'error' | 'warning' | 'success'
  timestamp: string
}

const MOCK_LOGS = [
  { type: 'success' as const, content: 'Deployment started' },
  { type: 'log' as const, content: 'Cloning repository...' },
  { type: 'log' as const, content: 'Installing dependencies...' },
  { type: 'log' as const, content: 'npm packages installed successfully' },
  { type: 'log' as const, content: 'Building application...' },
  { type: 'log' as const, content: 'Compilation complete' },
  { type: 'log' as const, content: 'Running tests...' },
  { type: 'success' as const, content: 'All tests passed' },
  { type: 'log' as const, content: 'Pushing to cloud provider...' },
  { type: 'log' as const, content: 'Configuring DNS...' },
  { type: 'success' as const, content: 'Application deployed to render.com' },
  { type: 'log' as const, content: 'URL: https://my-app.render.com' },
  { type: 'success' as const, content: 'Deployment completed in 45s' },
]

export function AetherTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = useState(true)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isStreaming) return

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < MOCK_LOGS.length) {
        const log = MOCK_LOGS[currentIndex]
        const now = new Date()
        const timestamp = now.toLocaleTimeString()
        
        setLogs(prev => [...prev, {
          id: `log-${currentIndex}`,
          content: log.content,
          type: log.type,
          timestamp,
        }])
        
        currentIndex++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, 400)

    return () => clearInterval(interval)
  }, [isStreaming])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleCopy = () => {
    const text = logs.map(l => `[${l.timestamp}] ${l.content}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setLogs([])
    setIsStreaming(true)
  }

  const handleDownload = () => {
    const text = logs.map(l => `[${l.timestamp}] ${l.content}`).join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
    element.setAttribute('download', 'deployment-logs.txt')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Card className="glass p-0 border border-primary/20 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-black/50 border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono text-primary">aether@terminal:~$</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground gap-2 h-8"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-muted-foreground hover:text-foreground gap-2 h-8"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground gap-2 h-8"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gradient-to-b from-black/80 to-black/60 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground/50 text-center py-20">
            Waiting for deployment logs...
          </div>
        ) : (
          logs.map((log, index) => (
            <TerminalLine
              key={log.id}
              content={log.content}
              type={log.type}
              timestamp={log.timestamp}
              delay={index * 50}
            />
          ))
        )}
        {isStreaming && logs.length > 0 && (
          <div className="text-foreground/50 animate-pulse">$</div>
        )}
      </div>
    </Card>
  )
}
