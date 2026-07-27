import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'

export type GridCellType =
  | { type: 'allocation'; alocacao: Alocacao; rowSpan: number }
  | { type: 'skip' }
  | { type: 'empty'; hora: string; dia: string }
  | { type: 'free'; hora: string; dia: string; rowSpan: number }

export type GridMatrix = Record<string, Record<string, GridCellType>>

// Horários que nunca são agrupados nem marcados como livre (ex: entrada,
// almoço e volta do almoço), mesmo quando vagos.
const HORAS_DESCONSIDERADAS = new Set(['07:00', '12:00', '13:00'])

const DIA_POR_INDICE_JS: Record<number, (typeof DIAS)[number]> = {
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
}

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

/**
 * Retorna os horários da matriz que possuem ao menos uma alocação
 * (célula 'allocation' ou 'skip') em algum dia. Usado para ocultar
 * linhas 100% vazias em grades específicas (ex: Grade Semestral).
 */
export function getHorasVisiveis(
  matrix: GridMatrix,
  horas: string[] = HORAS,
  dias: readonly string[] = DIAS
): string[] {
  return horas.filter((hora) =>
    dias.some((dia) => matrix[hora]?.[dia]?.type !== 'empty')
  )
}

/**
 * Marca, em cada coluna de dia, sequências de células 'empty' como blocos
 * 'free' (livres), agrupando pares de horas consecutivas em blocos de 2h
 * quando possível. Os horários em HORAS_DESCONSIDERADAS (07:00, 12:00, 13:00)
 * nunca são agrupados nem marcados como livres — permanecem 'empty'. Muta e
 * retorna a matriz recebida.
 */
export function markFreeSlots(
  matrix: GridMatrix,
  horas: string[] = HORAS,
  dias: readonly string[] = DIAS
): GridMatrix {
  for (const dia of dias) {
    let i = 0
    while (i < horas.length) {
      const hora = horas[i]!
      if (HORAS_DESCONSIDERADAS.has(hora) || matrix[hora]?.[dia]?.type !== 'empty') {
        i++
        continue
      }

      const nextHora = horas[i + 1]
      const podeParear =
        nextHora !== undefined &&
        !HORAS_DESCONSIDERADAS.has(nextHora) &&
        matrix[nextHora]?.[dia]?.type === 'empty'

      if (podeParear) {
        matrix[hora]![dia] = { type: 'free', hora, dia, rowSpan: 2 }
        matrix[nextHora!]![dia] = { type: 'skip' }
        i += 2
      } else {
        matrix[hora]![dia] = { type: 'free', hora, dia, rowSpan: 1 }
        i += 1
      }
    }
  }
  return matrix
}

/**
 * Formata o intervalo de um bloco livre a partir da hora de início e do
 * rowSpan (em horas). Ex: hora "14:00", rowSpan 2 → "14-16".
 */
export function formatFreeRange(hora: string, rowSpan: number): string {
  const horaInicio = Number(hora.split(':')[0])
  const horaFim = horaInicio + rowSpan
  return `${String(horaInicio).padStart(2, '0')}-${String(horaFim).padStart(2, '0')}`
}

/**
 * Verifica se uma alocação está ocorrendo neste exato momento
 * (mesmo dia da semana e horário atual dentro do intervalo início-fim).
 */
export function isAlocacaoAgora(alocacao: Alocacao, now: Date = new Date()): boolean {
  const diaAtual = DIA_POR_INDICE_JS[now.getDay()]
  if (!diaAtual || alocacao.dia_semana !== diaAtual) return false

  const minutosAgora = now.getHours() * 60 + now.getMinutes()
  return (
    minutosAgora >= timeToMinutes(alocacao.inicio) &&
    minutosAgora < timeToMinutes(alocacao.fim)
  )
}
