import { useState } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import type { ManutencaoInput } from '../../types'
import { AlertCircle } from 'lucide-react'

const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Concluído']

interface Props {
  onSave: (data: ManutencaoInput) => Promise<void>
  onClose: () => void
}

export function ManutencaoForm({ onSave, onClose }: Props) {
  const [numeroRt, setNumeroRt] = useState('')
  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('Aberto')
  const [dataAbertura, setDataAbertura] = useState('')
  const [dataConclusao, setDataConclusao] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!numeroRt.trim()) { setError('Número da RT é obrigatório.'); return }
    if (!local.trim()) { setError('Local é obrigatório.'); return }
    if (!descricao.trim()) { setError('Descrição é obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
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

  const ring = 'focus:outline-none focus:ring-2 focus:ring-orange-500'
  const input = `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${ring}`

  return (
    <BaseModal title="Nova Solicitação de Manutenção" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nº RT *</label>
            <input value={numeroRt} onChange={(e) => setNumeroRt(e.target.value)}
              className={input} placeholder="Ex: RT-2024-001" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Local *</label>
          <input value={local} onChange={(e) => setLocal(e.target.value)}
            className={input} placeholder="Ex: LAB 35" required />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição do Problema *</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
            className={`${input} resize-none`} rows={3}
            placeholder="Descreva o problema..." required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de Abertura</label>
            <input type="date" value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)}
              className={input} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de Conclusão</label>
            <input type="date" value={dataConclusao} onChange={(e) => setDataConclusao(e.target.value)}
              className={input} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
            className={`${input} resize-none`} rows={2}
            placeholder="Informações adicionais..." />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
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
