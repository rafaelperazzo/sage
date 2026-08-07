import type { InfraSala } from '../../types'
import { Armchair, Projector, Tv, Cable, CheckCircle2, XCircle } from 'lucide-react'

interface InfraSalaInfoProps {
  infraSala: InfraSala | undefined
  loading: boolean
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

export function InfraSalaInfo({ infraSala, loading }: InfraSalaInfoProps) {
  if (loading) return null

  if (!infraSala) {
    return (
      <div className="mb-4 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
        Infraestrutura da sala não cadastrada.
      </div>
    )
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
        <Armchair size={15} />
        {infraSala.cadeiras} cadeiras
      </span>
      <ItemStatus label="Projetor" ok={infraSala.projetor} icon={Projector} />
      <ItemStatus label="TV" ok={infraSala.tv} icon={Tv} />
      <ItemStatus label="Cabo HDMI" ok={infraSala.hdmi} icon={Cable} />
    </div>
  )
}
