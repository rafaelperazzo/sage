import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { ReservaInput } from '../../types'
import { HORAS } from '../../constants/salas'
import { AlertCircle } from 'lucide-react'

interface ReservaFormProps {
  initialData?: string   // "YYYY-MM-DD"
  hasConflict: (data: ReservaInput) => boolean
  onSave: (data: ReservaInput) => Promise<void>
  onClose: () => void
}

export function ReservaForm({ initialData = '', hasConflict, onSave, onClose }: ReservaFormProps) {
  const [data, setData] = useState(initialData)
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('10:00')
  const [responsavel, setResponsavel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: ReservaInput = { data, inicio, fim, responsavel: responsavel || null }
  const conflict = data !== '' && responsavel.trim() !== '' && hasConflict(input)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data) { setError('Data é obrigatória.'); return }
    if (!responsavel.trim()) { setError('Responsável é obrigatório.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito de horário: este período já está reservado.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BaseModal title="Nova Reserva" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Responsável *</label>
          <input
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Nome do responsável"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data *</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
            <select
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {HORAS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fim *</label>
            <select
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {[...HORAS.slice(1), '22:00'].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {(error ?? conflict) && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error ?? 'Conflito de horário: este período já está reservado.'}
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
            disabled={saving || !!conflict}
            className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
