import type { Alocacao } from '../../types'
import { TIPO_CELL_COLOR, getSalaInfo } from '../../constants/salas'

interface AllocationCellProps {
  alocacao: Alocacao
  rowSpan: number
  isAdmin: boolean
  onClick: (alocacao: Alocacao) => void
}

export function AllocationCell({ alocacao, rowSpan, isAdmin, onClick }: AllocationCellProps) {
  const salaInfo = getSalaInfo(alocacao.sala)
  const colorClass = salaInfo
    ? TIPO_CELL_COLOR[salaInfo.tipo]
    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'

  return (
    <td
      rowSpan={rowSpan}
      className={`border px-2 py-1 align-top cursor-pointer transition-colors ${colorClass} ${
        isAdmin ? 'ring-inset hover:ring-1 hover:ring-blue-400' : ''
      }`}
      onClick={() => onClick(alocacao)}
    >
      <div className="text-xs font-medium leading-tight line-clamp-2">
        {alocacao.disciplina}
      </div>
      {alocacao.professor && (
        <div className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-1">
          {alocacao.professor.split(' ').slice(0, 2).join(' ')}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-0.5">
        {alocacao.inicio}–{alocacao.fim}
      </div>
    </td>
  )
}
