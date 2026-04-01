import { BaseModal } from '../../components/Modal/BaseModal'
import type { Alocacao } from '../../types'
import { getSalaInfo, TIPO_LABEL, TIPO_COLOR } from '../../constants/salas'

interface ViewModalProps {
  alocacao: Alocacao
  onClose: () => void
  onEdit?: () => void  // fornecido apenas para admins
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

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda-feira',
  'TERÇA': 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  'SÁBADO': 'Sábado',
}

export function ViewModal({ alocacao, onClose, onEdit }: ViewModalProps) {
  const salaInfo = getSalaInfo(alocacao.sala)

  return (
    <BaseModal title="Detalhes da Alocação" onClose={onClose} size="sm">
      <dl className="space-y-3">
        <Field label="Disciplina" value={alocacao.disciplina} />
        <Field label="Professor" value={alocacao.professor} />
        <Field label="Sala" value={alocacao.sala} />
        {salaInfo && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</dt>
            <dd className="mt-0.5">
              <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${TIPO_COLOR[salaInfo.tipo]}`}>
                {TIPO_LABEL[salaInfo.tipo]}
              </span>
            </dd>
          </div>
        )}
        <Field label="Dia" value={DIA_LABEL[alocacao.dia_semana] ?? alocacao.dia_semana} />
        <Field label="Horário" value={`${alocacao.inicio} – ${alocacao.fim}`} />
        <Field label="Período" value={alocacao.periodo} />
      </dl>

      {onEdit && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Editar Alocação
          </button>
        </div>
      )}
    </BaseModal>
  )
}
