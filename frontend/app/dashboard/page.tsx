'use client'

import { useState, useEffect } from 'react'
import { DeploymentHub } from '@/components/dashboard/deployment-hub'
import { AIBrainAnalysis } from '@/components/dashboard/ai-brain-analysis'
import { AetherTerminal } from '@/components/terminal/aether-terminal'
import { RecentDeployments } from '@/components/dashboard/recent-deployments'
import { useAuth } from '@/components/providers/auth-provider'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken()
      setAccessToken(token)
    }
    fetchToken()
  }, [getToken])

  const handleDeploymentStarted = (id: string) => {
    setActiveDeploymentId(id)
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono tracking-tight uppercase opacity-70">AetherOS DevSecOps Engine / Stable</p>
        </div>
      </motion.div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Left Column: Input & Context */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <DeploymentHub onDeploymentStarted={handleDeploymentStarted} />
          </motion.div>

          {/* New History Component */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <RecentDeployments />
          </motion.div>
        </div>

        {/* Right Column: Analysis or Live Terminal */}
        <div className="lg:col-span-2 relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {!activeDeploymentId ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4 }}
                className="h-full"
              >
                <AIBrainAnalysis />
              </motion.div>
            ) : (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                className="h-full"
              >
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-primary font-mono flex items-center gap-2">
                         <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                         LIVE_SESSION: {activeDeploymentId}
                      </h2>
                      <button 
                        onClick={() => setActiveDeploymentId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground underline decoration-primary/30"
                      >
                        Return to Research Mode
                      </button>
                   </div>
                   <AetherTerminal deploymentId={activeDeploymentId} accessToken={accessToken} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
