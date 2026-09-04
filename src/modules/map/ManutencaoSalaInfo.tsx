import type { Manutencao } from '../../types'
import { AlertTriangle } from 'lucide-react'

interface ManutencaoSalaInfoProps {
  manutencoes: Manutencao[]
  loading: boolean
}

export function ManutencaoSalaInfo({ manutencoes, loading }: ManutencaoSalaInfoProps) {
  if (loading || manutencoes.length === 0) return null

  return (
    <div className="mb-4 flex flex-col gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
      {manutencoes.map((m) => (
        <span key={m.id} className="flex items-start gap-1.5 text-amber-800">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>
            <span className="font-medium">Chamado de manutenção em aberto ({m.numero_rt}):</span> {m.descricao_problema}
          </span>
        </span>
      ))}
    </div>
  )
}
