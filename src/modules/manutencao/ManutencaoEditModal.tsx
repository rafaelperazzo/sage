import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { Manutencao, ManutencaoInput } from '../../types'
import { AlertCircle, Trash2 } from 'lucide-react'

const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Concluído']

interface Props {
  manutencao: Manutencao
  onSave: (id: number, data: ManutencaoInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

export function ManutencaoEditModal({ manutencao, onSave, onDelete, onClose }: Props) {
  const [numeroRt, setNumeroRt] = useState(manutencao.numero_rt)
  const [local, setLocal] = useState(manutencao.sala_local)
  const [descricao, setDescricao] = useState(manutencao.descricao_problema)
  const [status, setStatus] = useState(manutencao.status)
  const [dataAbertura, setDataAbertura] = useState(manutencao.data_abertura ?? '')
  const [dataConclusao, setDataConclusao] = useState(manutencao.data_conclusao ?? '')
  const [observacao, setObservacao] = useState(manutencao.observacao ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!numeroRt.trim()) { setError('Número da RT é obrigatório.'); return }
    if (!local.trim()) { setError('Local é obrigatório.'); return }
    if (!descricao.trim()) { setError('Descrição é obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(manutencao.id, {
        numero_rt: numeroRt.trim(),
        sala_local: local.trim(),
        descricao_problema: descricao.trim(),
        status,
        data_abertura: dataAbertura || null,
        data_conclusao: dataConclusao || null,
        observacao: observacao.trim() || null,
      })
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
      await onDelete(manutencao.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const ring = 'focus:outline-none focus:ring-2 focus:ring-orange-500'
  const inputCls = `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${ring}`

  if (confirmDelete) {
    return (
      <BaseModal title="Confirmar Remoção" onClose={onClose} size="sm">
        <p className="text-sm text-gray-700 mb-1">Tem certeza que deseja remover a solicitação:</p>
        <p className="text-sm font-semibold text-gray-900 mb-4">
          {manutencao.numero_rt} — {manutencao.sala_local}
        </p>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
            {deleting ? 'Removendo...' : 'Confirmar Remoção'}
          </button>
        </div>
      </BaseModal>
    )
  }

  return (
    <BaseModal title="Editar Solicitação de Manutenção" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nº RT *</label>
            <input value={numeroRt} onChange={(e) => setNumeroRt(e.target.value)}
              className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Local *</label>
          <input value={local} onChange={(e) => setLocal(e.target.value)}
            className={inputCls} required />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição do Problema *</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
            className={`${inputCls} resize-none`} rows={3} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de Abertura</label>
            <input type="date" value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de Conclusão</label>
            <input type="date" value={dataConclusao} onChange={(e) => setDataConclusao(e.target.value)}
              className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
            className={`${inputCls} resize-none`} rows={2} />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
            Remover
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
