import type { Alocacao, AlocacaoInput, ReservaPontual, SalaInfo, TipoSala } from '../../types'
import { DIAS, HORAS, LIMITES } from '../../constants/salas'

export type GridCellType =
  | { type: 'allocation'; alocacao: Alocacao; rowSpan: number }
  | { type: 'skip' }
  | { type: 'empty'; hora: string; dia: string }
  | { type: 'free'; hora: string; dia: string; rowSpan: number }

export type GridMatrix = Record<string, Record<string, GridCellType>>

// Horários que nunca são agrupados nem marcados como livre (ex: entrada,
// almoço e volta do almoço), mesmo quando vagos. 18:00 é a folga de 30min
// entre o fim do período diurno e o 1º período noturno real (18:30) — não
// representa uma aula, então nunca aparece como "livre".
const HORAS_DESCONSIDERADAS = new Set(['07:00', '12:00', '13:00', '18:00'])

export const DIA_POR_INDICE_JS: Record<number, (typeof DIAS)[number]> = {
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
    const diaIdx = DIAS.indexOf(alocacao.dia_semana as typeof DIAS[number])
    if (diaIdx === -1) continue

    // Posiciona a alocação pelos marcos de início/fim da grade (LIMITES),
    // não por aritmética de hora cheia — assim slots de duração e início
    // variáveis (ex: aulas noturnas de 50min) são posicionados corretamente.
    const idxInicio = LIMITES.indexOf(alocacao.inicio)
    const idxFim = LIMITES.indexOf(alocacao.fim)
    if (idxInicio === -1 || idxFim === -1 || idxFim <= idxInicio) continue

    const horaInicio = alocacao.inicio
    const rowSpan = idxFim - idxInicio

    // Marcar célula de início com a alocação
    matrix[horaInicio]![alocacao.dia_semana] = {
      type: 'allocation',
      alocacao,
      rowSpan,
    }

    // Marcar células subsequentes como 'skip'
    for (let i = 1; i < rowSpan; i++) {
      const nextHora = LIMITES[idxInicio + i]!
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
 * 'free' (livres), agrupando pares de linhas consecutivas quando possível
 * (no máximo 2 por vez — 2h de dia, ou 2 aulas de 50min à noite, já que os
 * marcos noturnos em LIMITES correspondem 1 para 1 às aulas reais). Os
 * horários em HORAS_DESCONSIDERADAS nunca são agrupados nem marcados como
 * livres — permanecem 'empty'. Muta e retorna a matriz recebida.
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
 * rowSpan (em horas). Ex: hora "14:00", rowSpan 2 → "14:00-16:00".
 */
export function formatFreeRange(hora: string, rowSpan: number): string {
  const fim = LIMITES[LIMITES.indexOf(hora) + rowSpan] ?? hora
  return `${hora}-${fim}`
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

/** Data local no formato "YYYY-MM-DD" (sem conversão para UTC). */
export function dataISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface Ocupacao {
  inicio: string
  fim: string
}

/**
 * Intervalos em que `sala` está ocupada no dia de `now`: as alocações do dia
 * da semana atual somadas às reservas pontuais com a data de hoje, ordenados
 * pelo início.
 */
export function getOcupacoesDoDia(
  sala: string,
  alocacoes: Alocacao[],
  reservas: ReservaPontual[],
  now: Date = new Date()
): Ocupacao[] {
  const diaAtual = DIA_POR_INDICE_JS[now.getDay()]
  const hoje = dataISO(now)
  return [
    ...alocacoes.filter((a) => a.sala === sala && a.dia_semana === diaAtual),
    ...reservas.filter((r) => r.sala === sala && r.data === hoje),
  ].sort((a, b) => timeToMinutes(a.inicio) - timeToMinutes(b.inicio))
}

// Janela de exibição das seções "livres agora": segunda a sexta, 08:00-22:00.
const FIM_EXPEDIENTE = '22:00'

/**
 * Verifica se o momento atual está dentro da janela de exibição das seções
 * "livres agora" da home: segunda a sexta, entre 08:00 e 22:00.
 */
export function isDentroJanelaLivresAgora(now: Date = new Date()): boolean {
  const dia = now.getDay()
  if (dia < 1 || dia > 5) return false

  const minutosAgora = now.getHours() * 60 + now.getMinutes()
  return minutosAgora >= timeToMinutes('08:00') && minutosAgora < timeToMinutes(FIM_EXPEDIENTE)
}

export interface SalaLivreAgora {
  sala: string
  tipo: TipoSala
  livreAte: string
}

/**
 * Para cada sala em `salas`, verifica se ela está livre neste exato momento
 * (nenhuma alocação de hoje cobre o horário atual) e, se estiver, até que
 * horário permanece livre — o início da próxima alocação de hoje, ou o fim
 * do expediente (22:00) caso não haja mais nenhuma. Reservas pontuais de
 * hoje também ocupam a sala. Salas ocupadas agora não entram no resultado.
 */
export function getSalasLivresAgora(
  salas: SalaInfo[],
  alocacoes: Alocacao[],
  now: Date = new Date(),
  reservas: ReservaPontual[] = []
): SalaLivreAgora[] {
  const diaAtual = DIA_POR_INDICE_JS[now.getDay()]
  if (!diaAtual) return []

  const minutosAgora = now.getHours() * 60 + now.getMinutes()
  const livres: SalaLivreAgora[] = []

  for (const salaInfo of salas) {
    const ocupacoesHoje = getOcupacoesDoDia(salaInfo.nome, alocacoes, reservas, now)

    const ocupadaAgora = ocupacoesHoje.some(
      (a) => minutosAgora >= timeToMinutes(a.inicio) && minutosAgora < timeToMinutes(a.fim)
    )
    if (ocupadaAgora) continue

    const proxima = ocupacoesHoje.find((a) => timeToMinutes(a.inicio) > minutosAgora)
    const livreAte =
      proxima && timeToMinutes(proxima.inicio) < timeToMinutes(FIM_EXPEDIENTE)
        ? proxima.inicio
        : FIM_EXPEDIENTE

    livres.push({ sala: salaInfo.nome, tipo: salaInfo.tipo, livreAte })
  }

  return livres
}

/**
 * Valida o segundo horário de uma alocação criada em dois dias/horários de
 * uma vez. Retorna a mensagem de erro (prefixada com "Segundo horário:") ou
 * null se estiver livre. `getConflitoReserva` é opcional (reservas pontuais).
 */
export function conflitoSegundaAlocacao(
  primeira: AlocacaoInput,
  segunda: AlocacaoInput,
  hasConflict: (data: AlocacaoInput) => boolean,
  getConflitoReserva?: (data: AlocacaoInput) => string | null
): string | null {
  if (segunda.inicio >= segunda.fim) {
    return 'Segundo horário: o início deve ser anterior ao fim.'
  }
  if (
    primeira.dia_semana === segunda.dia_semana &&
    timeToMinutes(primeira.inicio) < timeToMinutes(segunda.fim) &&
    timeToMinutes(primeira.fim) > timeToMinutes(segunda.inicio)
  ) {
    return 'Segundo horário: sobrepõe o primeiro horário.'
  }
  if (hasConflict(segunda)) {
    return 'Segundo horário: conflito de horário, este slot já está ocupado.'
  }
  const reserva = getConflitoReserva?.(segunda)
  return reserva ? `Segundo horário: ${reserva}` : null
}
