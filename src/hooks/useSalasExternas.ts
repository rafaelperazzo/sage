import { useState, useEffect, useCallback } from 'react'
import {
  supabase,
  EXTERNAS_TABLE_NAME,
  SALAS_EXTERNAS_TABLE,
  fetchSalasExternas,
  insertSalaExterna,
  updateSalaExterna,
  deleteSalaExterna,
  usosSalaExterna,
} from '../lib/supabase'
import type { SalaExternaCadastrada } from '../types'

interface UseSalasExternasReturn {
  salas: string[]
  // Salas da tabela `salas_externas` (as que podem ser editadas/removidas).
  cadastradas: SalaExternaCadastrada[]
  loading: boolean
  error: string | null
  // Cadastra uma sala sem alocação (nome completo "PREDIO - SALA XX").
  cadastrar: (sala: string) => Promise<void>
  editar: (cadastrada: SalaExternaCadastrada, sala: string) => Promise<void>
  remover: (cadastrada: SalaExternaCadastrada) => Promise<void>
}

/** "a", "a e b", "a, b e c" */
function listar(itens: string[]): string {
  return itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

// Editar/remover só é permitido enquanto a sala não estiver em uso: os outros
// registros a referenciam pelo nome e ficariam órfãos.
async function garantirSemUso(sala: string, acao: 'renomeada' | 'removida') {
  const usos = await usosSalaExterna(sala)
  if (usos.length > 0) {
    throw new Error(`A sala ${sala} está em uso (${listar(usos)}) e não pode ser ${acao}.`)
  }
}

export function useSalasExternas(): UseSalasExternasReturn {
  const [salas, setSalas] = useState<string[]>([])
  const [cadastradas, setCadastradas] = useState<SalaExternaCadastrada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSalasExternas()
      setSalas(data.salas)
      setCadastradas(data.cadastradas)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: SALAS_EXTERNAS_TABLE }, () => {
        void load()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [load])

  async function cadastrar(sala: string) {
    await insertSalaExterna(sala)
    await load()
  }

  async function editar(cadastrada: SalaExternaCadastrada, sala: string) {
    await garantirSemUso(cadastrada.sala, 'renomeada')
    await updateSalaExterna(cadastrada.id, sala)
    await load()
  }

  async function remover(cadastrada: SalaExternaCadastrada) {
    await garantirSemUso(cadastrada.sala, 'removida')
    await deleteSalaExterna(cadastrada.id)
    await load()
  }

  return { salas, cadastradas, loading, error, cadastrar, editar, remover }
}
