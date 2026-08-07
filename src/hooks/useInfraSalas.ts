import { useState, useEffect, useCallback } from 'react'
import type { InfraSala, InfraSalaInput } from '../types'
import { supabase, INFRA_SALAS_TABLE, fetchInfraSalas, upsertInfraSala } from '../lib/supabase'

interface UseInfraSalasReturn {
  infraSalas: InfraSala[]
  loading: boolean
  error: string | null
  save: (data: InfraSalaInput) => Promise<void>
}

export function useInfraSalas(): UseInfraSalasReturn {
  const [infraSalas, setInfraSalas] = useState<InfraSala[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchInfraSalas()
      setInfraSalas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar infraestrutura das salas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel('infra-salas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: INFRA_SALAS_TABLE }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load])

  async function save(data: InfraSalaInput) {
    await upsertInfraSala(data)
    await load()
  }

  return { infraSalas, loading, error, save }
}
