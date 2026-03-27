'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnalysisCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  type?: 'insight' | 'security' | 'performance' | 'alert'
  trend?: 'up' | 'down' | 'stable'
}

export function AnalysisCard({ 
  title, 
  value, 
  description, 
  icon,
  type = 'insight',
  trend = 'stable'
}: AnalysisCardProps) {
  const getIcon = () => {
    if (icon) return icon
    switch (type) {
      case 'security':
        return <Shield className="w-5 h-5" />
      case 'performance':
        return <Zap className="w-5 h-5" />
      case 'alert':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <CheckCircle className="w-5 h-5" />
    }
  }

  const bgColor = {
    insight: 'bg-blue-500/10 border-blue-500/30',
    security: 'bg-green-500/10 border-green-500/30',
    performance: 'bg-yellow-500/10 border-yellow-500/30',
    alert: 'bg-red-500/10 border-red-500/30',
  }[type]

  const iconColor = {
    insight: 'text-blue-400',
    security: 'text-green-400',
    performance: 'text-yellow-400',
    alert: 'text-red-400',
  }[type]

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${bgColor} p-6 border backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer`}>
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={`p-2 rounded-lg bg-black/40 ${iconColor}`}
            whileHover={{ rotate: 12 }}
            transition={{ duration: 0.3 }}
          >
            {getIcon()}
          </motion.div>
          {trend && trend !== 'stable' && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {trend === 'up' ? '↑ Up' : '↓ Down'}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-3 group-hover:text-foreground/80 transition-colors">{description}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
