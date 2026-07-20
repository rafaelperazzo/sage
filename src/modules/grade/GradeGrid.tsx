import { useState, useMemo } from 'react'
import type { Alocacao } from '../../types'
import { DIAS } from '../../constants/salas'
import { buildGridMatrix, getHorasVisiveis } from '../map/gridUtils'
import { ViewModal } from '../map/ViewModal'
import { GradeCell } from './GradeCell'

interface GradeGridProps {
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

export function GradeGrid({ alocacoes }: GradeGridProps) {
  const [selected, setSelected] = useState<Alocacao | null>(null)

  const matrix = useMemo(() => buildGridMatrix(alocacoes), [alocacoes])
  const horas = useMemo(() => getHorasVisiveis(matrix), [matrix])

  if (horas.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">Nenhuma disciplina cadastrada para este semestre.</p>
      </div>
    )
  }

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
            {horas.map((hora) => (
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
                      <GradeCell
                        key={dia}
                        alocacao={cell.alocacao}
                        rowSpan={cell.rowSpan}
                        onClick={setSelected}
                      />
                    )
                  }
                  return (
                    <td key={dia} className="border border-gray-100 px-2 py-1 align-top" />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ViewModal alocacao={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
