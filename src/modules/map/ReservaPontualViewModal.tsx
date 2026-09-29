import { BaseModal } from '../../components/Modal/BaseModal'
import type { ReservaPontual } from '../../types'
import { DIA_LABEL, diaSemanaDeData, formatarData } from './reservasPontuaisUtils'

interface ReservaPontualViewModalProps {
  reserva: ReservaPontual
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

export function ReservaPontualViewModal({ reserva, onClose }: ReservaPontualViewModalProps) {
  const dia = DIA_LABEL[diaSemanaDeData(reserva.data) ?? '']

  return (
    <BaseModal title="Detalhes da Reserva Pontual" onClose={onClose} size="sm">
      <dl className="space-y-3">
        <Field label="Disciplina" value={reserva.disciplina} />
        <Field label="Professor" value={reserva.professor} />
        <Field label="Sala" value={reserva.sala} />
        <Field label="Data" value={dia ? `${formatarData(reserva.data)} (${dia})` : formatarData(reserva.data)} />
        <Field label="Horário" value={`${reserva.inicio} – ${reserva.fim}`} />
      </dl>
    </BaseModal>
  )
}
