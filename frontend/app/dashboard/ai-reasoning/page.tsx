'use client'

import { ReasoningHistory } from '@/components/ai-reasoning/reasoning-history'
import { motion } from 'framer-motion'

export default function AIReasoningPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full p-8"
    >
      <ReasoningHistory />
    </motion.div>
  )
}
