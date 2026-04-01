import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { AlocacaoInput } from '../../types'
import { SALAS, DIAS, HORAS, PERIODO_ATUAL } from '../../constants/salas'
import { AlertCircle } from 'lucide-react'

interface AllocationFormProps {
  initialDia?: string
  initialHora?: string
  initialSala?: string
  hasConflict: (data: AlocacaoInput) => boolean
  onSave: (data: AlocacaoInput) => Promise<void>
  onClose: () => void
}

export function AllocationForm({
  initialDia = DIAS[0],
  initialHora = HORAS[7],  // 14:00
  initialSala = SALAS[0]!.nome,
  hasConflict,
  onSave,
  onClose,
}: AllocationFormProps) {
  const [disciplina, setDisciplina] = useState('')
  const [professor, setProfessor] = useState('')
  const [dia, setDia] = useState(initialDia ?? DIAS[0]!)
  const [sala, setSala] = useState(initialSala ?? SALAS[0]!.nome)
  const [inicio, setInicio] = useState(initialHora ?? '14:00')
  const [fim, setFim] = useState(() => {
    const h = parseInt(initialHora ?? '14:00')
    return `${String(h + 2).padStart(2, '0')}:00`
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: AlocacaoInput = { disciplina, professor: professor || null, dia_semana: dia, sala, inicio, fim }

  const conflict = disciplina.trim() !== '' && hasConflict(input)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito de horário: este slot já está ocupado.'); return }
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
    <BaseModal title={`Nova Alocação — ${PERIODO_ATUAL}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Disciplina *</label>
          <input
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da disciplina"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sala *</label>
            <select
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SALAS.map((s) => (
                <option key={s.nome} value={s.nome}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dia *</label>
            <select
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DIAS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
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
              {[...HORAS.slice(1), '22:00'].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {(error ?? conflict) && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error ?? 'Conflito de horário: este slot já está ocupado.'}
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
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
