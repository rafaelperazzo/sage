import { useState, useEffect, useCallback } from 'react'
import type { Alocacao, ModuloReserva, ReservaPontual, ReservaPontualInput } from '../types'
import {
  supabase,
  RESERVAS_PONTUAIS_TABLE,
  fetchReservasPontuaisDesde,
  insertReservaPontual,
  updateReservaPontual,
  deleteReservaPontual,
} from '../lib/supabase'
import { dataISO } from '../modules/map/gridUtils'
import { conflitoReservaPontual } from '../modules/map/reservasPontuaisUtils'

interface UseReservasPontuaisReturn {
  reservas: ReservaPontual[]
  loading: boolean
  error: string | null
  create: (data: ReservaPontualInput) => Promise<void>
  update: (id: number, data: ReservaPontualInput) => Promise<void>
  remove: (id: number) => Promise<void>
  getConflito: (data: ReservaPontualInput, excludeId?: number) => string | null
}

// Carrega todas as reservas pontuais futuras (data >= hoje) do módulo, de
// todas as salas — o bloqueio de alocações precisa das outras salas também,
// já que o form de alocação permite trocar de sala. `alocacoes` são as
// alocações usadas na checagem de conflito ao criar/editar uma reserva.
export function useReservasPontuais(
  modulo: ModuloReserva,
  alocacoes: Alocacao[] = []
): UseReservasPontuaisReturn {
  const [reservas, setReservas] = useState<ReservaPontual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchReservasPontuaisDesde(modulo, dataISO())
      setReservas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reservas')
    } finally {
      setLoading(false)
    }
  }, [modulo])

  useEffect(() => {
    void load()

    const channel = supabase
      .channel(`reservas-pontuais-${modulo}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: RESERVAS_PONTUAIS_TABLE }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load, modulo])

  function getConflito(data: ReservaPontualInput, excludeId?: number): string | null {
    return conflitoReservaPontual(data, alocacoes, reservas, excludeId)
  }

  async function create(data: ReservaPontualInput) {
    const conflito = getConflito(data)
    if (conflito) throw new Error(conflito)
    await insertReservaPontual(data)
    await load()
  }

  async function update(id: number, data: ReservaPontualInput) {
    const conflito = getConflito(data, id)
    if (conflito) throw new Error(conflito)
    await updateReservaPontual(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteReservaPontual(id)
    await load()
  }

  return { reservas, loading, error, create, update, remove, getConflito }
}
