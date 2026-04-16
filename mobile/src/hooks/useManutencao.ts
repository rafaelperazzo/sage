import { useState, useEffect, useCallback } from 'react'
import type { Manutencao, ManutencaoInput } from '../types'
import {
  fetchManutencoes,
  insertManutencao,
  updateManutencao,
  deleteManutencao,
} from '../lib/supabase'

interface UseManutencaoReturn {
  manutencoes: Manutencao[]
  loading: boolean
  error: string | null
  create: (data: ManutencaoInput) => Promise<void>
  update: (id: number, data: ManutencaoInput) => Promise<void>
  remove: (id: number) => Promise<void>
}

export function useManutencao(): UseManutencaoReturn {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchManutencoes()
      setManutencoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar manutenções')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

  }, [load])

  async function create(data: ManutencaoInput) {
    await insertManutencao(data)
    await load()
  }

  async function update(id: number, data: ManutencaoInput) {
    await updateManutencao(id, data)
    await load()
  }

  async function remove(id: number) {
    await deleteManutencao(id)
    await load()
  }

  return { manutencoes, loading, error, create, update, remove }
}
