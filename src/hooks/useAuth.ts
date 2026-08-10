import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, fetchAdminRoles } from '../lib/supabase'

// Escopo especial que concede admin em todos os módulos.
const ALL_MODULES = 'all'

export type ModuleKey = 'map' | 'auditorio' | 'manutencao' | 'rural'

interface UseAuthReturn {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Admin é definido por módulo, via a tabela `admin_roles` (user_id → module,
// onde module = 'all' concede acesso a todos os módulos). Passar o módulo da
// página atual para saber se o usuário logado é admin *nela*.
export function useAuth(module?: ModuleKey): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setRoles([]); return }
    fetchAdminRoles(user.id)
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [user])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    isAdmin: roles.includes(ALL_MODULES) || (module !== undefined && roles.includes(module)),
    loading,
    signIn,
    signOut,
  }
}
