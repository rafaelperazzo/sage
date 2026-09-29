import { BaseModal } from '../../components/Modal/BaseModal'
import { CalendarPlus, CalendarClock } from 'lucide-react'

interface SlotChoiceModalProps {
  dia: string
  hora: string
  onAlocacao: () => void
  onReserva: () => void
  onClose: () => void
}

export function SlotChoiceModal({ dia, hora, onAlocacao, onReserva, onClose }: SlotChoiceModalProps) {
  return (
    <BaseModal title={`Slot livre — ${dia} ${hora}`} onClose={onClose} size="sm">
      <p className="text-sm text-gray-600 mb-4">O que deseja criar neste horário?</p>
      <div className="space-y-2">
        <button
          onClick={onAlocacao}
          className="w-full flex items-start gap-3 text-left px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <CalendarPlus size={18} className="mt-0.5 text-blue-700 flex-shrink-0" />
          <span>
            <span className="block text-sm font-medium text-blue-900">Nova alocação</span>
            <span className="block text-xs text-blue-700">Ocupa este horário toda semana no período letivo.</span>
          </span>
        </button>
        <button
          onClick={onReserva}
          className="w-full flex items-start gap-3 text-left px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <CalendarClock size={18} className="mt-0.5 text-amber-700 flex-shrink-0" />
          <span>
            <span className="block text-sm font-medium text-amber-900">Reserva pontual</span>
            <span className="block text-xs text-amber-700">Ocupa este horário apenas em uma data específica.</span>
          </span>
        </button>
      </div>
    </BaseModal>
  )
}
