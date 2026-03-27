'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'

export function LoginForm() {
  const { loginWithGoogle, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      await loginWithGoogle()
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error('Sign in error:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">AetherOS</h1>
        <p className="text-sm text-muted-foreground">Premium DevSecOps Command Center</p>
      </div>

      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-12 text-base gap-3 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Chrome className="w-5 h-5" />
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Sign in to access your deployment hub and AI analysis
      </p>
    </div>
  )
}
