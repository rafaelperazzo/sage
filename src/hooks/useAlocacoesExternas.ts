import { useState, useEffect, useCallback } from 'react'
import type { Alocacao, AlocacaoInput } from '../types'
import {
  supabase,
  EXTERNAS_TABLE_NAME,
  fetchAlocacoesExternas,
  fetchAlocacoesExternasPorSala,
  insertAlocacaoExterna,
  updateAlocacaoExterna,
  deleteAlocacaoExterna,
} from '../lib/supabase'
import { usePeriodo } from '../contexts/PeriodoContext'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function horariosConflitam(a: AlocacaoInput, b: Alocacao): boolean {
  if (a.sala !== b.sala || a.dia_semana !== b.dia_semana) return false
  const aInicio = timeToMinutes(a.inicio)
  const aFim = timeToMinutes(a.fim)
  const bInicio = timeToMinutes(b.inicio)
  const bFim = timeToMinutes(b.fim)
  return aInicio < bFim && aFim > bInicio
}

// ── Hook para todas as alocações externas do período (busca/lista) ──

export function useAlocacoesExternas() {
  const { periodo } = usePeriodo()
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!periodo) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoesExternas(periodo)
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel(`externas-all-${periodo}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: EXTERNAS_TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load, periodo])

  return { alocacoes, loading, error, reload: load }
}

// ── Hook para alocações de uma sala externa no período (SAGE Rural) ──

interface UseAlocacoesExternasPorSalaReturn {
  alocacoes: Alocacao[]
  loading: boolean
  error: string | null
  create: (data: AlocacaoInput) => Promise<void>
  update: (id: number, data: AlocacaoInput) => Promise<void>
  remove: (id: number) => Promise<void>
  hasConflict: (data: AlocacaoInput, excludeId?: number) => boolean
}

export function useAlocacoesExternasPorSala(sala: string): UseAlocacoesExternasPorSalaReturn {
  const { periodo } = usePeriodo()
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala || !periodo) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoesExternasPorSala(sala, periodo)
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [sala, periodo])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel(`externas-sala-${sala}-${periodo}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: EXTERNAS_TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load, sala, periodo])

  function hasConflict(data: AlocacaoInput, excludeId?: number): boolean {
    return alocacoes
      .filter((a) => excludeId === undefined || a.id !== excludeId)
      .some((a) => horariosConflitam(data, a))
  }

  async function create(data: AlocacaoInput) {
    if (hasConflict(data)) throw new Error('Conflito de horário: este slot já está ocupado.')
    await insertAlocacaoExterna(data, periodo)
    await load()
  }

  async function update(id: number, data: AlocacaoInput) {
    if (hasConflict(data, id)) throw new Error('Conflito de horário: este slot já está ocupado.')
    await updateAlocacaoExterna(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteAlocacaoExterna(id)
    await load()
  }

  return { alocacoes, loading, error, create, update, remove, hasConflict }
}
