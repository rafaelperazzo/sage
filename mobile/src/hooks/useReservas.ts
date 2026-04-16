import { useState, useEffect, useCallback } from 'react'
import type { Reserva, ReservaInput } from '../types'
import {
  fetchReservasMes,
  insertReserva,
  updateReserva,
  deleteReserva,
} from '../lib/supabase'

// "HH:MM:SS" ou "HH:MM" → minutos
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function horariosConflitam(a: ReservaInput, b: Reserva): boolean {
  if (a.data !== b.data) return false
  const aInicio = timeToMinutes(a.inicio)
  const aFim = timeToMinutes(a.fim)
  const bInicio = timeToMinutes(b.inicio)
  const bFim = timeToMinutes(b.fim)
  return aInicio < bFim && aFim > bInicio
}

interface UseReservasReturn {
  reservas: Reserva[]
  loading: boolean
  error: string | null
  create: (data: ReservaInput) => Promise<void>
  update: (id: number, data: ReservaInput) => Promise<void>
  remove: (id: number) => Promise<void>
  hasConflict: (data: ReservaInput, excludeId?: number) => boolean
}

export function useReservas(ano: number, mes: number): UseReservasReturn {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchReservasMes(ano, mes)
      setReservas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reservas')
    } finally {
      setLoading(false)
    }
  }, [ano, mes])

  useEffect(() => {
    void load()

  }, [load, ano, mes])

  function hasConflict(data: ReservaInput, excludeId?: number): boolean {
    return reservas
      .filter((r) => excludeId === undefined || r.id !== excludeId)
      .some((r) => horariosConflitam(data, r))
  }

  async function create(data: ReservaInput) {
    if (hasConflict(data)) throw new Error('Conflito de horário: este período já está reservado.')
    await insertReserva(data)
    await load()
  }

  async function update(id: number, data: ReservaInput) {
    if (hasConflict(data, id)) throw new Error('Conflito de horário: este período já está reservado.')
    await updateReserva(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteReserva(id)
    await load()
  }

  return { reservas, loading, error, create, update, remove, hasConflict }
}
