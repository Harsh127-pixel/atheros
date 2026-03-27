'use client'

import { AuthProvider } from './auth-provider'

export function LayoutProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
