import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '../hooks/useAuth'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>')
  return ctx
}
