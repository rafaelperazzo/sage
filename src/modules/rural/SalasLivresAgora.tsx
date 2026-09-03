import { DoorOpen, Clock } from 'lucide-react'
import type { Alocacao } from '../../types'
import { useSalasExternasLivresAgora } from '../../hooks/useSalasExternasLivresAgora'

interface SalasLivresAgoraProps {
  salas: string[]
  alocacoes: Alocacao[]
  loading: boolean
}

export function SalasLivresAgora({ salas, alocacoes, loading }: SalasLivresAgoraProps) {
  const { visivel, livres } = useSalasExternasLivresAgora(salas, alocacoes)

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando dados...</p>
  }

  if (!visivel) {
    return (
      <p className="text-sm text-gray-400">
        Disponível apenas de segunda a sexta, das 08:00 às 22:00.
      </p>
    )
  }

  if (livres.length === 0) {
    return (
      <p className="text-sm text-gray-400">Nenhuma sala externa disponível no momento.</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{livres.length} sala(s) livre(s) agora</p>
      <ul className="space-y-2">
        {livres.map((item) => (
          <li
            key={item.sala}
            className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <DoorOpen size={15} className="text-blue-600" />
              {item.sala}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={13} />
              Livre até as {item.livreAte}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
