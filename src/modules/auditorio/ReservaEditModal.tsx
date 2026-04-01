import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { Reserva, ReservaInput } from '../../types'
import { HORAS } from '../../constants/salas'
import { normalizeTime } from './MonthCalendar'
import { AlertCircle, Trash2 } from 'lucide-react'

interface ReservaEditModalProps {
  reserva: Reserva
  hasConflict: (data: ReservaInput, excludeId?: number) => boolean
  onSave: (id: number, data: ReservaInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

export function ReservaEditModal({ reserva, hasConflict, onSave, onDelete, onClose }: ReservaEditModalProps) {
  const [data, setData] = useState(reserva.data)
  const [inicio, setInicio] = useState(normalizeTime(reserva.inicio))
  const [fim, setFim] = useState(normalizeTime(reserva.fim))
  const [responsavel, setResponsavel] = useState(reserva.responsavel ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: ReservaInput = { data, inicio, fim, responsavel: responsavel || null }
  const conflict = responsavel.trim() !== '' && hasConflict(input, reserva.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data) { setError('Data é obrigatória.'); return }
    if (!responsavel.trim()) { setError('Responsável é obrigatório.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito de horário: este período já está reservado.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(reserva.id, input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(reserva.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete) {
    return (
      <BaseModal title="Confirmar Remoção" onClose={onClose} size="sm">
        <p className="text-sm text-gray-700 mb-1">
          Tem certeza que deseja remover a reserva:
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-4">
          {reserva.responsavel} — {reserva.data} {normalizeTime(reserva.inicio)}–{normalizeTime(reserva.fim)}
        </p>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Removendo...' : 'Confirmar Remoção'}
          </button>
        </div>
      </BaseModal>
    )
  }

  return (
    <BaseModal title="Editar Reserva" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Responsável *</label>
          <input
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Remover
          </button>
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
