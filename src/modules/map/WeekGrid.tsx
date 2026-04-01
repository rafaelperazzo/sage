import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { buildGridMatrix } from './gridUtils'
import { AllocationCell } from './AllocationCell'

interface WeekGridProps {
  alocacoes: Alocacao[]
  isAdmin: boolean
  onCellClick: (alocacao: Alocacao) => void
  onEmptyCellClick?: (dia: string, hora: string) => void
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'Seg',
  'TERÇA': 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  'SÁBADO': 'Sáb',
}

export function WeekGrid({ alocacoes, isAdmin, onCellClick, onEmptyCellClick }: WeekGridProps) {
  const matrix = buildGridMatrix(alocacoes)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse text-sm min-w-[640px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 w-16 text-center">
              Hora
            </th>
            {DIAS.map((dia) => (
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
              {DIAS.map((dia) => {
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
                      onClick={onCellClick}
                    />
                  )
                }
                // Empty cell
                return (
                  <td
                    key={dia}
                    className={`border border-gray-100 px-2 py-1 align-top ${
                      isAdmin
                        ? 'cursor-pointer hover:bg-blue-50 transition-colors'
                        : ''
                    }`}
                    onClick={() => isAdmin && onEmptyCellClick?.(dia, hora)}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
