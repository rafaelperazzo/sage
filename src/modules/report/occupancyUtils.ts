import type { Alocacao } from '../../types'
import type { TipoSala } from '../../types'
import { SALAS, DIAS, LIMITES } from '../../constants/salas'
import { timeToMinutes } from '../map/gridUtils'

export type Turno = 'manha' | 'tarde' | 'noite'

export interface OcupacaoTurno {
  horas: number
  percentual: number  // 0–100, sobre MAX_HORAS_TURNO_SEMANA
}

export interface RoomOccupancy {
  sala: string
  tipo?: TipoSala     // só nas salas do SAGE Map
  predio?: string     // só nas salas do SAGE Rural
  totalHoras: number
  percentual: number        // 0–100
  porDia: Record<string, number>  // dia → horas
  porTurno: Record<Turno, OcupacaoTurno>
}

export interface ReportSummary {
  salas: RoomOccupancy[]
  totalGeralHoras: number
  mediaOcupacao: number
  mediaPorTurno: Record<Turno, number>
}

// Ocupação considerada apenas de segunda a sexta (5 dias úteis)
export const DIAS_CALCULO = DIAS.filter((dia) => dia !== 'SÁBADO')

// A partir das 18:30 as aulas têm 50 min, mas cada uma conta como 1h no
// cálculo: 18:30–20:10 = 2h e 20:10–21:50 = 2h.
const INICIO_NOTURNO = timeToMinutes('18:30')
const AULA_NOTURNA_MIN = 50

/** Minutos "efetivos" desde 00:00: após 18:30, cada 50 min valem 60. */
export function minutosEfetivos(minutos: number): number {
  if (minutos <= INICIO_NOTURNO) return minutos
  return INICIO_NOTURNO + ((minutos - INICIO_NOTURNO) * 60) / AULA_NOTURNA_MIN
}

/** Horas efetivas do intervalo [inicio, fim) em minutos reais. */
function horasEfetivas(inicio: number, fim: number): number {
  return (minutosEfetivos(fim) - minutosEfetivos(inicio)) / 60
}

// Turnos que contam no cálculo. Ficam de fora 07:00–08:00, o almoço
// (12:00–14:00) e a folga 18:00–18:30, mesmo quando há alocação nelas.
export const TURNOS: { chave: Turno; label: string; inicio: string; fim: string }[] = [
  { chave: 'manha', label: 'Manhã', inicio: '08:00', fim: '12:00' },
  { chave: 'tarde', label: 'Tarde', inicio: '14:00', fim: '18:00' },
  { chave: 'noite', label: 'Noite', inicio: '18:30', fim: LIMITES[LIMITES.length - 1]! },
]

function turnosZerados(): Record<Turno, number> {
  return { manha: 0, tarde: 0, noite: 0 }
}

/** Horas efetivas de [inicio, fim) que caem em cada turno. */
function horasPorTurno(inicio: number, fim: number): Record<Turno, number> {
  const horas = turnosZerados()
  for (const turno of TURNOS) {
    const ini = Math.max(inicio, timeToMinutes(turno.inicio))
    const f = Math.min(fim, timeToMinutes(turno.fim))
    if (f > ini) horas[turno.chave] = horasEfetivas(ini, f)
  }
  return horas
}

// Cada turno tem 4h/dia (a noite, 4 aulas de 50 min) → 20h/semana;
// os três somam 12h/dia e 60h/semana.
const MAX_POR_TURNO_DIA = horasPorTurno(0, 24 * 60)
export const MAX_HORAS_TURNO_SEMANA = MAX_POR_TURNO_DIA.manha * DIAS_CALCULO.length
export const MAX_HORAS_DIA = TURNOS.reduce((sum, t) => sum + MAX_POR_TURNO_DIA[t.chave], 0)
export const MAX_HORAS_SEMANA = MAX_HORAS_DIA * DIAS_CALCULO.length

export interface SalaRelatorio {
  nome: string
  tipo?: TipoSala
  predio?: string
}

export function calcularOcupacao(alocacoes: Alocacao[], salasRelatorio: SalaRelatorio[] = SALAS): ReportSummary {
  const salas: RoomOccupancy[] = salasRelatorio.map((salaInfo) => {
    const porDia: Record<string, number> = {}
    const horasTurno = turnosZerados()
    let totalHoras = 0

    for (const dia of DIAS_CALCULO) {
      const alocsNoDia = alocacoes.filter(
        (a) => a.sala === salaInfo.nome && a.dia_semana === dia
      )
      // Calcular horas sem sobreposição (merge de intervalos em minutos reais;
      // só a duração de cada trecho é convertida em horas efetivas)
      const intervals = alocsNoDia.map((a) => ({
        start: timeToMinutes(a.inicio),
        end: timeToMinutes(a.fim),
      })).sort((a, b) => a.start - b.start)

      let horasNoDia = 0
      let currentEnd = -1
      const somarTrecho = (inicio: number, fim: number) => {
        const horas = horasPorTurno(inicio, fim)
        for (const { chave } of TURNOS) {
          horasTurno[chave] += horas[chave]
          horasNoDia += horas[chave]
        }
      }
      for (const { start, end } of intervals) {
        if (start >= currentEnd) {
          somarTrecho(start, end)
          currentEnd = end
        } else if (end > currentEnd) {
          somarTrecho(currentEnd, end)
          currentEnd = end
        }
      }

      porDia[dia] = horasNoDia
      totalHoras += horasNoDia
    }

    const porTurno = {} as Record<Turno, OcupacaoTurno>
    for (const { chave } of TURNOS) {
      porTurno[chave] = {
        horas: horasTurno[chave],
        percentual: Math.round((horasTurno[chave] / MAX_HORAS_TURNO_SEMANA) * 100),
      }
    }

    return {
      sala: salaInfo.nome,
      tipo: salaInfo.tipo,
      predio: salaInfo.predio,
      totalHoras,
      percentual: Math.round((totalHoras / MAX_HORAS_SEMANA) * 100),
      porDia,
      porTurno,
    }
  })

  const media = (valores: number[]) =>
    valores.length > 0 ? Math.round(valores.reduce((sum, v) => sum + v, 0) / valores.length) : 0

  const totalGeralHoras = salas.reduce((sum, s) => sum + s.totalHoras, 0)
  const mediaOcupacao = media(salas.map((s) => s.percentual))
  const mediaPorTurno = turnosZerados()
  for (const { chave } of TURNOS) {
    mediaPorTurno[chave] = media(salas.map((s) => s.porTurno[chave].percentual))
  }

  return { salas, totalGeralHoras, mediaOcupacao, mediaPorTurno }
}
