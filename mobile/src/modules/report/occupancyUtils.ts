import type { Alocacao } from '../../types'
import type { TipoSala } from '../../types'
import { SALAS, DIAS } from '../../constants/salas'
import { timeToMinutes } from '../map/gridUtils'

export interface RoomOccupancy {
  sala: string
  tipo: TipoSala
  totalHoras: number
  percentual: number        // 0–100
  porDia: Record<string, number>  // dia → horas
}

export interface ReportSummary {
  salas: RoomOccupancy[]
  totalGeralHoras: number
  mediaOcupacao: number
}

// 12 horas por dia × 6 dias = 72h máximo por semana
const MAX_HORAS_DIA = 12
const MAX_HORAS_SEMANA = MAX_HORAS_DIA * DIAS.length

export function calcularOcupacao(alocacoes: Alocacao[]): ReportSummary {
  const salas: RoomOccupancy[] = SALAS.map((salaInfo) => {
    const porDia: Record<string, number> = {}
    let totalHoras = 0

    for (const dia of DIAS) {
      const alocsNoDia = alocacoes.filter(
        (a) => a.sala === salaInfo.nome && a.dia_semana === dia
      )
      // Calcular horas sem sobreposição (merge de intervalos)
      const intervals = alocsNoDia.map((a) => ({
        start: timeToMinutes(a.inicio),
        end: timeToMinutes(a.fim),
      })).sort((a, b) => a.start - b.start)

      let horasNoDia = 0
      let currentEnd = -1
      for (const { start, end } of intervals) {
        if (start >= currentEnd) {
          horasNoDia += (end - start) / 60
          currentEnd = end
        } else if (end > currentEnd) {
          horasNoDia += (end - currentEnd) / 60
          currentEnd = end
        }
      }

      porDia[dia] = horasNoDia
      totalHoras += horasNoDia
    }

    return {
      sala: salaInfo.nome,
      tipo: salaInfo.tipo,
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
