import type { Alocacao } from '../../types'
import type { TipoSala } from '../../types'
import { SALAS, DIAS, LIMITES } from '../../constants/salas'
import { timeToMinutes } from '../map/gridUtils'

export interface RoomOccupancy {
  sala: string
  tipo?: TipoSala     // só nas salas do SAGE Map
  predio?: string     // só nas salas do SAGE Rural
  totalHoras: number
  percentual: number        // 0–100
  porDia: Record<string, number>  // dia → horas
}

export interface ReportSummary {
  salas: RoomOccupancy[]
  totalGeralHoras: number
  mediaOcupacao: number
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

// Grade inteira (07:00–21:50) = 11,5h + 4h noturnas = 15,5h por dia;
// × 5 dias = 77,5h máximo por semana.
export const MAX_HORAS_DIA = horasEfetivas(timeToMinutes(LIMITES[0]!), timeToMinutes(LIMITES[LIMITES.length - 1]!))
export const MAX_HORAS_SEMANA = MAX_HORAS_DIA * DIAS_CALCULO.length

export interface SalaRelatorio {
  nome: string
  tipo?: TipoSala
  predio?: string
}

export function calcularOcupacao(alocacoes: Alocacao[], salasRelatorio: SalaRelatorio[] = SALAS): ReportSummary {
  const salas: RoomOccupancy[] = salasRelatorio.map((salaInfo) => {
    const porDia: Record<string, number> = {}
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
      for (const { start, end } of intervals) {
        if (start >= currentEnd) {
          horasNoDia += horasEfetivas(start, end)
          currentEnd = end
        } else if (end > currentEnd) {
          horasNoDia += horasEfetivas(currentEnd, end)
          currentEnd = end
        }
      }

      porDia[dia] = horasNoDia
      totalHoras += horasNoDia
    }

    return {
      sala: salaInfo.nome,
      tipo: salaInfo.tipo,
      predio: salaInfo.predio,
      totalHoras,
      percentual: Math.round((totalHoras / MAX_HORAS_SEMANA) * 100),
      porDia,
    }
  })

  const totalGeralHoras = salas.reduce((sum, s) => sum + s.totalHoras, 0)
  const mediaOcupacao = salas.length > 0
    ? Math.round(salas.reduce((sum, s) => sum + s.percentual, 0) / salas.length)
    : 0

  return { salas, totalGeralHoras, mediaOcupacao }
}
