import { BaseModal } from '../../components/Modal/BaseModal'
import type { Reserva } from '../../types'
import { normalizeTime } from './MonthCalendar'

interface ReservaViewModalProps {
  reserva: Reserva
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

function formatDate(dateStr: string): string {
  const [ano, mes, dia] = dateStr.split('-')
  return `${dia}/${mes}/${ano}`
}

export function ReservaViewModal({ reserva, onClose }: ReservaViewModalProps) {
  return (
    <BaseModal title="Detalhes da Reserva" onClose={onClose} size="sm">
      <dl className="space-y-3">
        <Field label="Responsável" value={reserva.responsavel} />
        <Field label="Data" value={formatDate(reserva.data)} />
        <Field label="Horário" value={`${normalizeTime(reserva.inicio)} – ${normalizeTime(reserva.fim)}`} />
      </dl>
    </BaseModal>
  )
}
