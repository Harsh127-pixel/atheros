'use client'

import { StatsCards } from '@/components/admin/stats-cards'
import { SystemToggles } from '@/components/admin/system-toggles'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { motion } from 'framer-motion'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
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
          <h1 className="text-4xl font-bold text-foreground">God Mode</h1>
          <p className="text-muted-foreground">System administration and control panel</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCards />
        </motion.div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <SystemToggles />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <UserManagementTable />
          </motion.div>
        </div>
      </motion.div>
    </ProtectedRoute>
  )
}
