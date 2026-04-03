import { BaseModal } from '../../components/Modal/BaseModal'
import type { Manutencao } from '../../types'

interface Props {
  manutencao: Manutencao
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [ano, mes, dia] = dateStr.split('-')
  return `${dia}/${mes}/${ano}`
}

const STATUS_BADGE: Record<string, string> = {
  'Aberto':        'bg-red-100 text-red-700 border-red-200',
  'Em andamento':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Concluído':     'bg-green-100 text-green-700 border-green-200',
}

export function ManutencaoViewModal({ manutencao, onClose }: Props) {
  const badgeClass = STATUS_BADGE[manutencao.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <BaseModal title="Detalhes da Manutenção" onClose={onClose} size="md">
      <dl className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nº RT</dt>
            <dd className="mt-0.5 text-sm font-semibold text-gray-900">{manutencao.numero_rt}</dd>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${badgeClass}`}>
            {manutencao.status}
          </span>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Local</dt>
          <dd className="mt-0.5 text-sm text-gray-900">{manutencao.sala_local}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição do Problema</dt>
          <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{manutencao.descricao_problema}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Abertura</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{formatDate(manutencao.data_abertura)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Conclusão</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{formatDate(manutencao.data_conclusao)}</dd>
          </div>
        </div>
        <Field label="Observações" value={manutencao.observacao} />
      </dl>
    </BaseModal>
  )
}
