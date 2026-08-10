import { useState, useEffect, useCallback } from 'react'
import { supabase, EXTERNAS_TABLE_NAME, fetchSalasExternas } from '../lib/supabase'

interface UseSalasExternasReturn {
  salas: string[]
  loading: boolean
  error: string | null
}

export function useSalasExternas(): UseSalasExternasReturn {
  const [salas, setSalas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSalasExternas()
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
      .channel('externas-salas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: EXTERNAS_TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load])

  return { salas, loading, error }
}
