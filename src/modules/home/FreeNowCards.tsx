import { DoorOpen, Monitor } from 'lucide-react'
import { useSalasLivresAgora } from '../../hooks/useSalasLivresAgora'
import type { SalaLivreAgora } from '../map/gridUtils'

interface FreeListCardProps {
  title: string
  icon: React.ReactNode
  iconColor: string
  borderColor: string
  items: SalaLivreAgora[]
  emptyLabel: string
  loading: boolean
}

function FreeListCard({ title, icon, iconColor, borderColor, items, emptyLabel, loading }: FreeListCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm bg-white ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      </div>
      {loading ? (
        <p className="text-xs text-gray-400">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.sala} className="text-xs text-gray-600">
              <span className="font-medium text-gray-800">{item.sala}</span>
              {' - Livre até as '}
              {item.livreAte}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FreeNowCards() {
  const { visivel, loading, labs, salas } = useSalasLivresAgora()

  if (!visivel) return null

  return (
    <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <FreeListCard
        title="Laboratórios Livres Agora"
        icon={<Monitor size={16} className="text-emerald-700" />}
        iconColor="bg-emerald-50"
        borderColor="border-emerald-100"
        items={labs}
        emptyLabel="Nenhum laboratório disponível no momento."
        loading={loading}
      />
      <FreeListCard
        title="Salas Livres Agora"
        icon={<DoorOpen size={16} className="text-blue-700" />}
        iconColor="bg-blue-50"
        borderColor="border-blue-100"
        items={salas}
        emptyLabel="Nenhuma sala disponível no momento."
        loading={loading}
      />
    </div>
  )
}
