import { BaseModal } from '../../components/Modal/BaseModal'
import type { ReservaPontual } from '../../types'
import { DIA_LABEL, formatarData } from './reservasPontuaisUtils'

interface ReservasListModalProps {
  dia: string
  // Reservas do bloco, já restritas às futuras e ordenadas por data/início.
  reservas: ReservaPontual[]
  onSelect: (reserva: ReservaPontual) => void
  onClose: () => void
}

export function ReservasListModal({ dia, reservas, onSelect, onClose }: ReservasListModalProps) {
  return (
    <BaseModal title={`Reservas pontuais — ${DIA_LABEL[dia] ?? dia}`} onClose={onClose}>
      {reservas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma reserva futura neste horário.</p>
      ) : (
        <ul className="space-y-2">
          {reservas.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="w-full text-left px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="text-sm font-semibold text-amber-900">
                  {formatarData(r.data)} · {r.inicio}–{r.fim}
                </div>
                <div className="text-sm text-gray-900">{r.disciplina}</div>
                {r.professor && <div className="text-xs text-gray-600">{r.professor}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </BaseModal>
  )
}
