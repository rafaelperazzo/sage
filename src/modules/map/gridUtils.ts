import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'

export type GridCellType =
  | { type: 'allocation'; alocacao: Alocacao; rowSpan: number }
  | { type: 'skip' }
  | { type: 'empty'; hora: string; dia: string }

export type GridMatrix = Record<string, Record<string, GridCellType>>

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * Constrói a matriz de células para o grid semanal.
 * Trata o caso de alocações multi-hora com rowSpan.
 */
export function buildGridMatrix(alocacoes: Alocacao[]): GridMatrix {
  // Inicializar com células vazias
  const matrix: GridMatrix = {}
  for (const hora of HORAS) {
    matrix[hora] = {}
    for (const dia of DIAS) {
      matrix[hora][dia] = { type: 'empty', hora, dia }
    }
  }

  for (const alocacao of alocacoes) {
    const inicioMin = timeToMinutes(alocacao.inicio)
    const fimMin = timeToMinutes(alocacao.fim)
    const rowSpan = Math.round((fimMin - inicioMin) / 60)
    if (rowSpan <= 0) continue

    // Encontrar a linha de início na grade
    const horaInicio = `${String(Math.floor(inicioMin / 60)).padStart(2, '0')}:00`
    const diaIdx = DIAS.indexOf(alocacao.dia_semana as typeof DIAS[number])
    if (diaIdx === -1) continue
    if (!HORAS.includes(horaInicio)) continue

    // Marcar célula de início com a alocação
    matrix[horaInicio]![alocacao.dia_semana] = {
      type: 'allocation',
      alocacao,
      rowSpan,
    }

    // Marcar células subsequentes como 'skip'
    for (let i = 1; i < rowSpan; i++) {
      const nextHora = `${String(Math.floor(inicioMin / 60) + i).padStart(2, '0')}:00`
      if (matrix[nextHora]) {
        matrix[nextHora]![alocacao.dia_semana] = { type: 'skip' }
      }
    }
  }

  return matrix
}
