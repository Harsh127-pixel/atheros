'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType, UserRole } from '@/lib/auth-types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('aetheros_user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true)
      // Simulate Google login
      const mockUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      }
      setUser(mockUser)
      localStorage.setItem('aetheros_user', JSON.stringify(mockUser))
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      setUser(null)
      localStorage.removeItem('aetheros_user')
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
    isAdmin: user?.role === 'ADMIN' ?? false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
