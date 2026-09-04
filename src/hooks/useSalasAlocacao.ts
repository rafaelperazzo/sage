import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLE_NAME, fetchSalasAlocacao } from '../lib/supabase'

interface UseSalasAlocacaoReturn {
  salas: string[]
  loading: boolean
  error: string | null
}

export function useSalasAlocacao(): UseSalasAlocacaoReturn {
  const [salas, setSalas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSalasAlocacao()
      setSalas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar salas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel('alocacao-salas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load])

  return { salas, loading, error }
}
