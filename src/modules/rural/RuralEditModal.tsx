import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { Alocacao, AlocacaoInput } from '../../types'
import { DIAS, HORAS, LIMITES } from '../../constants/salas'
import { comCamposDaDisciplina, formatarAlocacaoCurta } from '../map/alocacoesDisciplinaUtils'
import { OutrasAlocacoesFields, SELECAO_VAZIA, outrasSelecionadas } from '../map/OutrasAlocacoesFields'
import { AlertCircle, Trash2 } from 'lucide-react'

interface RuralEditModalProps {
  salas: string[]
  alocacao: Alocacao
  // Outras alocações da mesma disciplina (nome, professor e curso) — habilita
  // "Refletir em outros dias e horários da disciplina".
  outras?: Alocacao[]
  // Mensagem de conflito (alocações ou reservas pontuais) ao gravar as linhas; null se livre.
  getConflito: (linhas: Alocacao[]) => string | null
  // Linhas a gravar: a alocação editada seguida das outras selecionadas.
  onSave: (linhas: Alocacao[]) => Promise<void>
  onDelete: (ids: number[]) => Promise<void>
  onClose: () => void
}

export function RuralEditModal({ salas, alocacao, outras = [], getConflito, onSave, onDelete, onClose }: RuralEditModalProps) {
  const [disciplina, setDisciplina] = useState(alocacao.disciplina)
  const [professor, setProfessor] = useState(alocacao.professor ?? '')
  const [curso, setCurso] = useState(alocacao.curso)
  const [dia, setDia] = useState(alocacao.dia_semana)
  const [sala, setSala] = useState(alocacao.sala)
  const [inicio, setInicio] = useState(alocacao.inicio)
  const [fim, setFim] = useState(alocacao.fim)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refletirEdicao, setRefletirEdicao] = useState(SELECAO_VAZIA)
  const [refletirRemocao, setRefletirRemocao] = useState(SELECAO_VAZIA)

  const input: AlocacaoInput = { disciplina, professor: professor || null, curso, dia_semana: dia, sala, inicio, fim }
  // As outras selecionadas recebem disciplina, professor, curso e sala; mantêm dia e horário.
  const linhas: Alocacao[] = [
    { ...alocacao, ...input },
    ...outrasSelecionadas(outras, refletirEdicao).map((o) => comCamposDaDisciplina(o, input)),
  ]
  const conflito = disciplina.trim() !== '' ? getConflito(linhas) : null
  const removidas = outrasSelecionadas(outras, refletirRemocao)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (!curso.trim()) { setError('Curso é obrigatório.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflito) { setError(conflito); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(linhas)
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
      await onDelete([alocacao.id, ...removidas.map((o) => o.id)])
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
          Tem certeza que deseja remover a alocação:
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-4">
          {alocacao.disciplina} — {alocacao.dia_semana} {alocacao.inicio}–{alocacao.fim}
        </p>
        <div className="mb-4">
          <OutrasAlocacoesFields
            outras={outras}
            value={refletirRemocao}
            onChange={setRefletirRemocao}
            ajuda="As selecionadas também serão removidas."
          />
        </div>
        {removidas.length > 0 && (
          <p className="text-sm text-gray-700 mb-4">
            Serão removidas {removidas.length + 1} alocações: {[alocacao, ...removidas].map(formatarAlocacaoCurta).join('; ')}.
          </p>
        )}
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
    <BaseModal title="Editar Alocação" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Disciplina *</label>
          <input
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Professor</label>
          <input
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Curso *</label>
          <input
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {salas.map((s) => (
                <option key={s} value={s}>{s}</option>
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

        <OutrasAlocacoesFields
          outras={outras}
          value={refletirEdicao}
          onChange={setRefletirEdicao}
          ajuda="As selecionadas recebem disciplina, professor, curso e sala; dia e horário de cada uma são mantidos."
        />

        {(error ?? conflito) && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error ?? conflito}
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
            disabled={saving || !!conflito}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
