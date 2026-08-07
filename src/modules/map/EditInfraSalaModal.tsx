import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { InfraSala, InfraSalaInput } from '../../types'
import { Armchair, Monitor, Projector, Tv, Cable, AirVent, AlertCircle } from 'lucide-react'

interface EditInfraSalaModalProps {
  sala: string
  infraSala: InfraSala | undefined
  onSave: (data: InfraSalaInput) => Promise<void>
  onClose: () => void
}

function Checkbox({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  icon: typeof Projector
}) {
  return (
    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <Icon size={15} className="text-gray-500" />
      {label}
    </label>
  )
}

export function EditInfraSalaModal({ sala, infraSala, onSave, onClose }: EditInfraSalaModalProps) {
  const [cadeiras, setCadeiras] = useState(String(infraSala?.cadeiras ?? ''))
  const [computadores, setComputadores] = useState(String(infraSala?.computadores ?? ''))
  const [projetor, setProjetor] = useState(infraSala?.projetor ?? false)
  const [tv, setTv] = useState(infraSala?.tv ?? false)
  const [hdmi, setHdmi] = useState(infraSala?.hdmi ?? false)
  const [arCondicionado, setArCondicionado] = useState(infraSala?.arCondicionado ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cadeirasNum = Number(cadeiras)
    if (cadeiras.trim() === '' || !Number.isInteger(cadeirasNum) || cadeirasNum < 0) {
      setError('Informe um número válido de cadeiras.')
      return
    }
    const computadoresNum = Number(computadores)
    if (computadores.trim() === '' || !Number.isInteger(computadoresNum) || computadoresNum < 0) {
      setError('Informe um número válido de computadores.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ sala, cadeiras: cadeirasNum, computadores: computadoresNum, projetor, tv, hdmi, arCondicionado })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      setSaving(false)
    }
  }

  return (
    <BaseModal title={`Infraestrutura — ${sala}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cadeiras *</label>
            <div className="relative">
              <Armchair size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min={0}
                step={1}
                value={cadeiras}
                onChange={(e) => setCadeiras(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Computadores *</label>
            <div className="relative">
              <Monitor size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min={0}
                step={1}
                value={computadores}
                onChange={(e) => setComputadores(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Equipamentos</label>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox label="Projetor" checked={projetor} onChange={setProjetor} icon={Projector} />
            <Checkbox label="TV" checked={tv} onChange={setTv} icon={Tv} />
            <Checkbox label="Cabo HDMI" checked={hdmi} onChange={setHdmi} icon={Cable} />
            <Checkbox label="Ar-condicionado" checked={arCondicionado} onChange={setArCondicionado} icon={AirVent} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
