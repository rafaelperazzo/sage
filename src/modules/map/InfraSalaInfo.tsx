import type { InfraSala } from '../../types'
import { Armchair, Monitor, Projector, Tv, Cable, AirVent, CheckCircle2, XCircle, Pencil } from 'lucide-react'

interface InfraSalaInfoProps {
  infraSala: InfraSala | undefined
  loading: boolean
  isAdmin?: boolean
  onEdit?: () => void
}

function ItemStatus({ label, ok, icon: Icon }: { label: string; ok: boolean; icon: typeof Projector }) {
  return (
    <span className={`flex items-center gap-1.5 ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
      <Icon size={15} />
      {label}
      {ok ? (
        <CheckCircle2 size={14} className="text-emerald-500" />
      ) : (
        <XCircle size={14} className="text-gray-300" />
      )}
    </span>
  )
}

export function InfraSalaInfo({ infraSala, loading, isAdmin = false, onEdit }: InfraSalaInfoProps) {
  if (loading) return null

  if (!infraSala) {
    return (
      <div
        onClick={isAdmin ? onEdit : undefined}
        className={`mb-4 flex items-center justify-between gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 ${
          isAdmin ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors' : ''
        }`}
      >
        Infraestrutura da sala não cadastrada.
        {isAdmin && (
          <span className="flex items-center gap-1 text-blue-600 font-medium flex-shrink-0">
            <Pencil size={12} />
            Cadastrar
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={isAdmin ? onEdit : undefined}
      className={`mb-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 ${
        isAdmin ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Armchair size={15} />
          {infraSala.cadeiras} cadeiras
        </span>
        <span className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Monitor size={15} />
          {infraSala.computadores} computadores
        </span>
        <ItemStatus label="Projetor" ok={infraSala.projetor} icon={Projector} />
        <ItemStatus label="TV" ok={infraSala.tv} icon={Tv} />
        <ItemStatus label="Cabo HDMI" ok={infraSala.hdmi} icon={Cable} />
        <ItemStatus label="Ar-condicionado" ok={infraSala.arCondicionado} icon={AirVent} />
      </div>
      {isAdmin && <Pencil size={13} className="text-gray-400 flex-shrink-0" />}
    </div>
  )
}
