import type { Alocacao, AlocacaoInput, ReservaPontual, ReservaPontualInput } from '../../types'
import { DIAS } from '../../constants/salas'
import { DIA_POR_INDICE_JS, dataISO, timeToMinutes } from './gridUtils'

export const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda-feira',
  'TERÇA': 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  'SÁBADO': 'Sábado',
}

/** "YYYY-MM-DD" → Date local (meia-noite), sem a conversão UTC de `new Date(str)`. */
function parseData(data: string): Date {
  const [y, m, d] = data.split('-').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
}

/** Dia da semana ("SEGUNDA"…"SÁBADO") de uma data "YYYY-MM-DD"; undefined no domingo. */
export function diaSemanaDeData(data: string): string | undefined {
  return DIA_POR_INDICE_JS[parseData(data).getDay()]
}

/** "YYYY-MM-DD" → "dd/mm/aaaa". */
export function formatarData(data: string): string {
  const [y, m, d] = data.split('-')
  return `${d}/${m}/${y}`
}

/** "YYYY-MM-DD" → "dd/mm". */
export function formatarDataCurta(data: string): string {
  const [, m, d] = data.split('-')
  return `${d}/${m}`
}

/**
 * Próxima data (a partir de `hoje`, inclusive) que cai no dia da semana `dia`,
 * no formato "YYYY-MM-DD".
 */
export function proximaDataDoDia(dia: string, hoje: Date = new Date()): string {
  const alvo = DIAS.indexOf(dia as (typeof DIAS)[number]) + 1 // SEGUNDA = 1 em Date.getDay()
  const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  if (alvo < 1) return dataISO(data)
  const delta = (alvo - data.getDay() + 7) % 7
  data.setDate(data.getDate() + delta)
  return dataISO(data)
}

function sobrepoe(aInicio: string, aFim: string, bInicio: string, bFim: string): boolean {
  return timeToMinutes(aInicio) < timeToMinutes(bFim) && timeToMinutes(aFim) > timeToMinutes(bInicio)
}

/**
 * Reservas cujo dia da semana é `dia` e cujo horário se sobrepõe ao bloco
 * [inicio, fim), ordenadas por data e início.
 */
export function reservasNoBloco(
  reservas: ReservaPontual[],
  dia: string,
  inicio: string,
  fim: string
): ReservaPontual[] {
  return reservas
    .filter((r) => diaSemanaDeData(r.data) === dia && sobrepoe(r.inicio, r.fim, inicio, fim))
    .sort((a, b) => a.data.localeCompare(b.data) || timeToMinutes(a.inicio) - timeToMinutes(b.inicio))
}

/**
 * Verifica se uma reserva pontual conflita com alguma alocação da sala (no
 * mesmo dia da semana da data) ou com outra reserva da mesma sala na mesma
 * data. Retorna a mensagem de conflito, ou null se o horário estiver livre.
 */
export function conflitoReservaPontual(
  input: ReservaPontualInput,
  alocacoes: Alocacao[],
  reservas: ReservaPontual[],
  excludeId?: number
): string | null {
  const dia = diaSemanaDeData(input.data)

  const alocacao = alocacoes.find(
    (a) => a.sala === input.sala && a.dia_semana === dia && sobrepoe(input.inicio, input.fim, a.inicio, a.fim)
  )
  if (alocacao) {
    return `Conflito com a alocação ${alocacao.disciplina} (${alocacao.inicio}–${alocacao.fim}): este horário não está livre.`
  }

  const reserva = reservas.find(
    (r) =>
      r.id !== excludeId &&
      r.sala === input.sala &&
      r.data === input.data &&
      sobrepoe(input.inicio, input.fim, r.inicio, r.fim)
  )
  if (reserva) {
    return `Conflito com a reserva pontual ${reserva.disciplina} de ${formatarData(reserva.data)} (${reserva.inicio}–${reserva.fim}).`
  }

  return null
}

/**
 * Primeira reserva pontual (da lista, já restrita às futuras) que impede uma
 * alocação: mesma sala, mesmo dia da semana e horário sobreposto.
 */
export function alocacaoConflitaComReserva(
  input: AlocacaoInput,
  reservas: ReservaPontual[]
): ReservaPontual | undefined {
  return reservas.find(
    (r) =>
      r.sala === input.sala &&
      diaSemanaDeData(r.data) === input.dia_semana &&
      sobrepoe(input.inicio, input.fim, r.inicio, r.fim)
  )
}

export function mensagemConflitoReserva(r: ReservaPontual): string {
  const dia = DIA_LABEL[diaSemanaDeData(r.data) ?? ''] ?? ''
  const professor = r.professor ? ` — ${r.professor}` : ''
  return `Conflito com a reserva pontual: ${r.disciplina}${professor} em ${dia}, ${formatarData(r.data)}, ${r.inicio}–${r.fim}.`
}
