'use client'

import { AetherTerminal } from '@/components/terminal/aether-terminal'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Metadata } from 'next'

export default function TerminalPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full p-8 space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-foreground">Deployment Terminal</h1>
        <p className="text-muted-foreground">Real-time deployment logs and output</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AetherTerminal />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass p-6 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-foreground mb-3">Terminal Commands</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <code className="text-sm text-primary">deploy start</code>
              <p className="text-xs text-muted-foreground">Start a new deployment</p>
            </div>
            <div className="space-y-1">
              <code className="text-sm text-primary">logs view</code>
              <p className="text-xs text-muted-foreground">View current deployment logs</p>
            </div>
            <div className="space-y-1">
              <code className="text-sm text-primary">health check</code>
              <p className="text-xs text-muted-foreground">Check application health status</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
