'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/auth-provider'
import { Globe, ExternalLink, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Deployment {
  id: string
  repoUrl: string
  status: string
  cloudProvider: string
  liveUrl?: string
  createdAt: string
}

export function RecentDeployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const token = await getToken()
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        const response = await fetch(`${backendUrl}/api/deployments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (response.ok) {
          setDeployments(data.slice(0, 5)) // Show last 5
        }
      } catch (err) {
        console.error('Failed to fetch deployments:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDeployments()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDeployments, 30000)
    return () => clearInterval(interval)
  }, [getToken])

  if (isLoading) {
    return (
      <Card className="glass p-6 border-primary/10">
        <div className="h-6 w-32 bg-primary/10 rounded animate-pulse mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-primary/5 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass p-6 border-primary/20 backdrop-blur-md">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Recent Activity
      </h2>
      
      <div className="space-y-4">
        {deployments.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-primary/10 rounded-xl">
             <p className="text-sm text-muted-foreground italic">No recent deployments found</p>
          </div>
        ) : (
          deployments.map((dep, index) => (
            <motion.div
              key={dep.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    {dep.status === 'SUCCESS' ? (
                       <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : dep.status === 'FAILED' ? (
                       <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                       <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-xs font-mono font-bold tracking-tight text-foreground truncate w-32">
                      {dep.repoUrl.split('/').pop()}
                    </span>
                 </div>
                 <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/20 text-muted-foreground uppercase tracking-widest">
                   {dep.cloudProvider}
                 </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(dep.createdAt).toLocaleDateString()}
                </span>
                {dep.liveUrl && (
                  <a 
                    href={dep.liveUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase group-hover:scale-105"
                  >
                    Visit App
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  )
}
