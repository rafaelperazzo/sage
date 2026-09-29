import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { AlocacaoInput } from '../../types'
import { SALAS, DIAS, HORAS, LIMITES } from '../../constants/salas'
import { usePeriodo } from '../../contexts/PeriodoContext'
import { AlertCircle } from 'lucide-react'
import { OutroHorarioFields, outroHorarioInicial } from './OutroHorarioFields'
import { conflitoSegundaAlocacao } from './gridUtils'

interface AllocationFormProps {
  initialDia?: string
  initialHora?: string
  initialSala?: string
  hasConflict: (data: AlocacaoInput) => boolean
  // Mensagem de conflito com uma reserva pontual futura (null se não houver).
  getConflitoReserva?: (data: AlocacaoInput) => string | null
  onSave: (data: AlocacaoInput) => Promise<void>
  // Salva várias alocações de uma vez; habilita "Alocar em outro dia/horário".
  onSaveMany?: (data: AlocacaoInput[]) => Promise<void>
  onClose: () => void
}

export function AllocationForm({
  initialDia = DIAS[0],
  initialHora = HORAS[7],  // 14:00
  initialSala = SALAS[0]!.nome,
  hasConflict,
  getConflitoReserva,
  onSave,
  onSaveMany,
  onClose,
}: AllocationFormProps) {
  const { periodo } = usePeriodo()
  const [disciplina, setDisciplina] = useState('')
  const [professor, setProfessor] = useState('')
  const [curso, setCurso] = useState('')
  const [dia, setDia] = useState(initialDia ?? DIAS[0]!)
  const [sala, setSala] = useState(initialSala ?? SALAS[0]!.nome)
  const [inicio, setInicio] = useState(initialHora ?? '14:00')
  const [fim, setFim] = useState(() => {
    const h = parseInt(initialHora ?? '14:00')
    return `${String(h + 2).padStart(2, '0')}:00`
  })
  const [outro, setOutro] = useState(() => outroHorarioInicial(dia, inicio, fim))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const input: AlocacaoInput = { disciplina, professor: professor || null, curso, dia_semana: dia, sala, inicio, fim }

  const conflict = disciplina.trim() !== '' && hasConflict(input)
  const conflitoReserva = disciplina.trim() !== '' && !conflict ? getConflitoReserva?.(input) ?? null : null

  const input2: AlocacaoInput = { ...input, dia_semana: outro.dia, inicio: outro.inicio, fim: outro.fim }
  const conflitoSegunda =
    onSaveMany && outro.ativo && disciplina.trim() !== ''
      ? conflitoSegundaAlocacao(input, input2, hasConflict, getConflitoReserva)
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (!curso.trim()) { setError('Curso é obrigatório.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito de horário: este slot já está ocupado.'); return }
    if (conflitoReserva) { setError(conflitoReserva); return }
    if (conflitoSegunda) { setError(conflitoSegunda); return }
    setSaving(true)
    setError(null)
    try {
      if (onSaveMany && outro.ativo) {
        await onSaveMany([input, input2])
      } else {
        await onSave(input)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BaseModal title={`Nova Alocação — ${periodo}`} onClose={onClose}>
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

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Curso *</label>
          <input
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="BCC, LC, DC..."
            required
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
              {LIMITES.slice(1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {onSaveMany && <OutroHorarioFields value={outro} onChange={setOutro} />}

        {(error ?? (conflict || conflitoReserva || conflitoSegunda)) && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error ?? (conflict ? 'Conflito de horário: este slot já está ocupado.' : conflitoReserva ?? conflitoSegunda)}
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
            disabled={saving || !!conflict || !!conflitoReserva || !!conflitoSegunda}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
