'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TerminalLine } from './terminal-line'
import { Copy, Trash2, Download, Terminal as TerminalIcon } from 'lucide-react'

interface LogEntry {
  id: string
  content: string
  type: 'log' | 'error' | 'warning' | 'success'
  timestamp: string
}

interface AetherTerminalProps {
  deploymentId?: string
  accessToken?: string | null
}

export function AetherTerminal({ deploymentId, accessToken }: AetherTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!deploymentId || !accessToken) return;

    setIsStreaming(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const eventSource = new EventSource(`${backendUrl}/api/deployments/${deploymentId}/logs?token=${accessToken}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const now = new Date();
        const timestamp = now.toLocaleTimeString();

        let type: LogEntry['type'] = 'log';
        if (data.message.includes('[error]')) type = 'error';
        if (data.message.includes('[system]')) type = 'log';
        if (data.message.includes('[brain]')) type = 'success';
        if (data.message.includes('[scanner]')) type = 'warning';

        setLogs(prev => [...prev, {
          id: `log-${Date.now()}-${Math.random()}`,
          content: data.message,
          type,
          timestamp,
        }]);
      } catch (err) {
        console.error('Error parsing log:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      setIsStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [deploymentId, accessToken]);

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
  }

  const handleDownload = () => {
    const text = logs.map(l => `[${l.timestamp}] ${l.content}`).join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
    element.setAttribute('download', `deployment-${deploymentId}-logs.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Card className="glass p-0 border border-primary/20 overflow-hidden flex flex-col h-[600px] shadow-2xl shadow-primary/10">
      {/* Header */}
      <div className="bg-black/50 border-b border-primary/20 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-mono text-primary">aether@terminal:~/deployments/${deploymentId || 'hub'}$</h3>
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
            disabled={logs.length === 0}
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-black/90 font-mono text-xs selection:bg-primary/30"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground/30 text-center py-40 border-2 border-dashed border-primary/5 m-4 rounded-xl">
            <div className="mb-2">AetherOS Brain Handshake Initialized.</div>
            <div className="text-[10px] animate-pulse">Establishing secure TCP tunnel...</div>
          </div>
        ) : (
          logs.map((log, index) => (
            <TerminalLine
              key={log.id}
              content={log.content}
              type={log.type}
              timestamp={log.timestamp}
              delay={0} // No delay for real-time logs
            />
          ))
        )}
        {isStreaming && (
          <div className="text-primary animate-pulse pt-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
            <span>Listening for agent events...</span>
          </div>
        )}
      </div>
    </Card>
  )
}
