import { useState, useEffect, useCallback } from 'react'
import type { Alocacao, AlocacaoInput } from '../types'
import {
  fetchAlocacoes,
  fetchAlocacoesPorSala,
  insertAlocacao,
  updateAlocacao,
  deleteAlocacao,
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

// ── Hook para todas as alocações do período (agenda, report) ─────

export function useAlocacoes() {
  const { periodo } = usePeriodo()
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!periodo) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoes(periodo)
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    void load()
  }, [load])

  return { alocacoes, loading, error, reload: load }
}

// ── Hook para alocações de uma sala no período (SAGE Map) ────────

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
  const { periodo } = usePeriodo()
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sala || !periodo) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlocacoesPorSala(sala, periodo)
      setAlocacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alocações')
    } finally {
      setLoading(false)
    }
  }, [sala, periodo])

  useEffect(() => {
    void load()
  }, [load])

  function hasConflict(data: AlocacaoInput, excludeId?: number): boolean {
    return alocacoes
      .filter((a) => excludeId === undefined || a.id !== excludeId)
      .some((a) => horariosConflitam(data, a))
  }

  async function create(data: AlocacaoInput) {
    if (hasConflict(data)) throw new Error('Conflito de horário: este slot já está ocupado.')
    await insertAlocacao(data, periodo)
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
