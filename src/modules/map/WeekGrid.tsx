import { useEffect, useState } from 'react'
import type { Alocacao, ReservaPontual } from '../../types'
import { DIAS, HORAS, LIMITES } from '../../constants/salas'
import { buildGridMatrix, markFreeSlots, isAlocacaoAgora, formatFreeRange } from './gridUtils'
import { reservasNoBloco, formatarDataCurta } from './reservasPontuaisUtils'
import { AllocationCell } from './AllocationCell'

interface WeekGridProps {
  alocacoes: Alocacao[]
  isAdmin: boolean
  onCellClick: (alocacao: Alocacao) => void
  onEmptyCellClick?: (dia: string, hora: string) => void
  // Reservas pontuais futuras da sala, exibidas nas células sem alocação.
  reservas?: ReservaPontual[]
  onReservaClick?: (reserva: ReservaPontual) => void
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'Seg',
  'TERÇA': 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  'SÁBADO': 'Sáb',
}

// SAGE Map exibe apenas os dias úteis (segunda a sexta); sábado fica de fora da grade.
const DIAS_GRADE = DIAS.filter((dia) => dia !== 'SÁBADO')

export function WeekGrid({
  alocacoes,
  isAdmin,
  onCellClick,
  onEmptyCellClick,
  reservas = [],
  onReservaClick,
}: WeekGridProps) {
  const matrix = markFreeSlots(buildGridMatrix(alocacoes))

  function renderReservas(dia: string, inicio: string, rowSpan: number) {
    const fim = LIMITES[LIMITES.indexOf(inicio) + rowSpan] ?? inicio
    const doBloco = reservasNoBloco(reservas, dia, inicio, fim)
    if (doBloco.length === 0) return null
    return (
      <div className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
        {doBloco.map((r) => (
          <button
            key={r.id}
            type="button"
            title={`${r.disciplina}${r.professor ? ` — ${r.professor}` : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onReservaClick?.(r)
            }}
            className="block w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
          >
            <span className="block truncate">
              <span className="font-semibold">{formatarDataCurta(r.data)}</span> · {r.disciplina}
            </span>
            <span className="block text-amber-700">{r.inicio}–{r.fim}</span>
          </button>
        ))}
      </div>
    )
  }

  // Atualiza a cada minuto para manter o destaque de "aula em andamento" correto.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse text-sm min-w-[640px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 w-16 text-center">
              Hora
            </th>
            {DIAS_GRADE.map((dia) => (
              <th
                key={dia}
                className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 text-center"
              >
                {DIA_SHORT[dia] ?? dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HORAS.map((hora) => (
            <tr key={hora}>
              <td className="border border-gray-200 px-2 py-1 text-xs text-gray-400 text-center whitespace-nowrap bg-gray-50 font-mono">
                {hora}
              </td>
              {DIAS_GRADE.map((dia) => {
                const cell = matrix[hora]?.[dia]
                if (!cell) return null
                if (cell.type === 'skip') return null
                if (cell.type === 'allocation') {
                  return (
                    <AllocationCell
                      key={dia}
                      alocacao={cell.alocacao}
                      rowSpan={cell.rowSpan}
                      isAdmin={isAdmin}
                      isNow={isAlocacaoAgora(cell.alocacao, now)}
                      onClick={onCellClick}
                    />
                  )
                }
                if (cell.type === 'free') {
                  return (
                    <td
                      key={dia}
                      rowSpan={cell.rowSpan}
                      className={`border border-cyan-200 bg-cyan-50 px-2 py-1 align-top text-center ${
                        isAdmin
                          ? 'cursor-pointer hover:bg-cyan-100 transition-colors'
                          : ''
                      }`}
                      onClick={() => isAdmin && onEmptyCellClick?.(dia, hora)}
                    >
                      <div className="text-xs font-medium text-cyan-700">LIVRE</div>
                      <div className="text-[11px] text-cyan-600">
                        {formatFreeRange(cell.hora, cell.rowSpan)}
                      </div>
                      {renderReservas(dia, cell.hora, cell.rowSpan)}
                    </td>
                  )
                }
                // Empty cell (ex: horário de almoço 12:00–13:00)
                return (
                  <td
                    key={dia}
                    className={`border border-gray-100 px-2 py-1 align-top ${
                      isAdmin
                        ? 'cursor-pointer hover:bg-blue-50 transition-colors'
                        : ''
                    }`}
                    onClick={() => isAdmin && onEmptyCellClick?.(dia, hora)}
                  >
                    {renderReservas(dia, hora, 1)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
