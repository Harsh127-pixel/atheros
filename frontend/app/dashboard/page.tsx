'use client'

import { DeploymentHub } from '@/components/dashboard/deployment-hub'
import { AIBrainAnalysis } from '@/components/dashboard/ai-brain-analysis'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full p-8 space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-foreground">Welcome to AetherOS</h1>
        <p className="text-muted-foreground">Manage your deployments and monitor AI-powered security analytics</p>
      </motion.div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <DeploymentHub />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <AIBrainAnalysis />
        </motion.div>
      </div>
    </motion.div>
  )
}
