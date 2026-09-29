import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { ModuloReserva, ReservaPontual, ReservaPontualInput } from '../../types'
import { HORAS, LIMITES } from '../../constants/salas'
import { dataISO } from './gridUtils'
import { diaSemanaDeData, formatarData } from './reservasPontuaisUtils'
import { AlertCircle, Trash2 } from 'lucide-react'

interface ReservaPontualFormProps {
  modulo: ModuloReserva
  sala: string
  // Criação: valores iniciais vindos da célula clicada.
  initialData?: string
  initialInicio?: string
  initialFim?: string
  // Edição: reserva existente (habilita o botão Remover).
  reserva?: ReservaPontual
  getConflito: (data: ReservaPontualInput, excludeId?: number) => string | null
  onSave: (data: ReservaPontualInput) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}

export function ReservaPontualForm({
  modulo,
  sala,
  initialData,
  initialInicio = '14:00',
  initialFim = '16:00',
  reserva,
  getConflito,
  onSave,
  onDelete,
  onClose,
}: ReservaPontualFormProps) {
  const hoje = dataISO()
  const [disciplina, setDisciplina] = useState(reserva?.disciplina ?? '')
  const [professor, setProfessor] = useState(reserva?.professor ?? '')
  const [data, setData] = useState(reserva?.data ?? initialData ?? hoje)
  const [inicio, setInicio] = useState(reserva?.inicio ?? initialInicio)
  const [fim, setFim] = useState(reserva?.fim ?? initialFim)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: ReservaPontualInput = {
    disciplina,
    professor: professor || null,
    data,
    inicio,
    fim,
    sala: reserva?.sala ?? sala,
    modulo: reserva?.modulo ?? modulo,
  }

  const dia = data ? diaSemanaDeData(data) : undefined
  const validacao =
    !data
      ? 'Data é obrigatória.'
      : data < hoje
        ? 'A data não pode estar no passado.'
        : !dia || dia === 'SÁBADO'
          ? 'A reserva deve ser em um dia útil (segunda a sexta).'
          : inicio >= fim
            ? 'O horário de início deve ser anterior ao fim.'
            : null
  const conflict = !validacao && disciplina.trim() !== '' ? getConflito(input, reserva?.id) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (validacao) { setError(validacao); return }
    if (conflict) { setError(conflict); return }
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

  async function handleDelete() {
    if (!reserva || !onDelete) return
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

  if (confirmDelete && reserva) {
    return (
      <BaseModal title="Confirmar Remoção" onClose={onClose} size="sm">
        <p className="text-sm text-gray-700 mb-1">
          Tem certeza que deseja remover a reserva pontual:
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-4">
          {reserva.disciplina} — {formatarData(reserva.data)} {reserva.inicio}–{reserva.fim}
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

  const aviso = error ?? conflict ?? (disciplina.trim() !== '' ? validacao : null)

  return (
    <BaseModal title={`${reserva ? 'Editar' : 'Nova'} Reserva Pontual — ${input.sala}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Disciplina *</label>
          <input
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da disciplina ou atividade"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Professor</label>
          <input
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data *</label>
          <input
            type="date"
            value={data}
            min={hoje}
            onChange={(e) => setData(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
            <select
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LIMITES.slice(1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {aviso && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {aviso}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {reserva && onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Remover
            </button>
          )}
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
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
