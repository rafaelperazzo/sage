import { useState } from 'react'
import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { buildGridMatrix } from '../map/gridUtils'
import { ViewModal } from '../map/ViewModal'
import { getSalaInfo, TIPO_CELL_COLOR } from '../../constants/salas'

interface TeacherGridProps {
  alocacoes: Alocacao[]
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'Seg',
  'TERÇA': 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  'SÁBADO': 'Sáb',
}

export function TeacherGrid({ alocacoes }: TeacherGridProps) {
  const [selected, setSelected] = useState<Alocacao | null>(null)

  // Na agenda do professor, montamos a grade considerando todas as salas
  // Pode haver múltiplas salas no mesmo horário (caso raro, mas possível)
  // Usamos a mesma lógica de buildGridMatrix sem filtro de sala
  const matrix = buildGridMatrix(alocacoes)

  return (
    <>
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
                    const salaInfo = getSalaInfo(cell.alocacao.sala)
                    const colorClass = salaInfo
                      ? TIPO_CELL_COLOR[salaInfo.tipo]
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    return (
                      <td
                        key={dia}
                        rowSpan={cell.rowSpan}
                        className={`border px-2 py-1 align-top cursor-pointer transition-colors ${colorClass}`}
                        onClick={() => setSelected(cell.alocacao)}
                      >
                        <div className="text-xs font-medium leading-tight line-clamp-2">
                          {cell.alocacao.disciplina}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 font-medium">
                          {cell.alocacao.sala}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {cell.alocacao.inicio}–{cell.alocacao.fim}
                        </div>
                      </td>
                    )
                  }
                  return (
                    <td
                      key={dia}
                      className="border border-gray-100 px-2 py-1 align-top"
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ViewModal
          alocacao={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
