import type { Alocacao } from '../../types'

interface GradeCellProps {
  alocacao: Alocacao
  rowSpan: number
  onClick: (alocacao: Alocacao) => void
}

export function GradeCell({ alocacao, rowSpan, onClick }: GradeCellProps) {
  return (
    <td
      rowSpan={rowSpan}
      className="border px-2 py-1 align-top cursor-pointer transition-colors bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
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
      <div className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-1">
        {alocacao.sala}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {alocacao.inicio}–{alocacao.fim}
      </div>
    </td>
  )
}
