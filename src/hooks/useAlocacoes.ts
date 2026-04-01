import { useState, useEffect, useCallback } from 'react'
import type { Alocacao, AlocacaoInput } from '../types'
import {
  supabase,
  TABLE_NAME,
  fetchAlocacoes,
  fetchAlocacoesPorSala,
  insertAlocacao,
  updateAlocacao,
  deleteAlocacao,
} from '../lib/supabase'

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
  // Sobreposição: não há conflito apenas se um termina antes do outro começar
  return aInicio < bFim && aFim > bInicio
}

// ── Hook para todas as alocações (agenda, report) ────────────────

export function useAlocacoes() {
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoes()
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel('alocacoes-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load])

  return { alocacoes, loading, error, reload: load }
}

// ── Hook para alocações de uma sala (SAGE Map) ───────────────────

interface UseAlocacoesPorSalaReturn {
  alocacoes: Alocacao[]
  loading: boolean
  error: string | null
  create: (data: AlocacaoInput) => Promise<void>
  update: (id: number, data: AlocacaoInput) => Promise<void>
  remove: (id: number) => Promise<void>
  hasConflict: (data: AlocacaoInput, excludeId?: number) => boolean
}

export function useAlocacoesPorSala(sala: string): UseAlocacoesPorSalaReturn {
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoesPorSala(sala)
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [sala])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel(`alocacoes-sala-${sala}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load, sala])

  function hasConflict(data: AlocacaoInput, excludeId?: number): boolean {
    return alocacoes
      .filter((a) => excludeId === undefined || a.id !== excludeId)
      .some((a) => horariosConflitam(data, a))
  }

  async function create(data: AlocacaoInput) {
    if (hasConflict(data)) throw new Error('Conflito de horário: este slot já está ocupado.')
    await insertAlocacao(data)
    // Realtime irá atualizar; forçar reload como fallback
    await load()
  }

  async function update(id: number, data: AlocacaoInput) {
    if (hasConflict(data, id)) throw new Error('Conflito de horário: este slot já está ocupado.')
    await updateAlocacao(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteAlocacao(id)
    await load()
  }

  return { alocacoes, loading, error, create, update, remove, hasConflict }
}
