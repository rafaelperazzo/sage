import { useMemo } from 'react'
import { useSalasAlocacao } from './useSalasAlocacao'
import { useSalasExternas } from './useSalasExternas'

export const SALA_AUDITORIO_MANUTENCAO = 'Auditório - Sala 07'

interface UseSalasManutencaoReturn {
  salas: string[]
  loading: boolean
  error: string | null
}

export function useSalasManutencao(): UseSalasManutencaoReturn {
  const alocacao = useSalasAlocacao()
  const externas = useSalasExternas()

  const salas = useMemo(() => {
    const set = new Set<string>([...alocacao.salas, ...externas.salas, SALA_AUDITORIO_MANUTENCAO])
    return Array.from(set).sort()
  }, [alocacao.salas, externas.salas])

  return {
    salas,
    loading: alocacao.loading || externas.loading,
    error: alocacao.error ?? externas.error,
  }
}
