import { Sidebar } from '@/components/layout/sidebar'
import { ProtectedRoute } from '@/components/layout/protected-route'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - AetherOS',
  description: 'Your DevSecOps command center',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-20 flex-1 transition-all duration-300">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
