import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Reserva } from '../../types'

// "HH:MM:SS" ou "HH:MM" → "HH:MM"
export function normalizeTime(t: string): string {
  return t.substring(0, 5)
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Retorna o índice Seg=0 ... Dom=6 (domingo = 6, não 0)
function diaSemanaIdx(date: Date): number {
  const d = date.getDay() // 0=Dom, 1=Seg, ..., 6=Sáb
  return d === 0 ? 6 : d - 1  // converte para Seg=0 ... Dom=6
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isSunday: boolean
}

/**
 * Gera as semanas do calendário com 6 colunas (Seg–Sáb), sem domingos.
 * Cada semana é um array de 6 CalendarDay.
 */
function buildCalendarWeeks(ano: number, mes: number): CalendarDay[][] {
  const firstDay = new Date(ano, mes - 1, 1)
  const lastDay = new Date(ano, mes, 0)

  // Dia da semana do primeiro dia (0=Seg...6=Dom)
  let startIdx = diaSemanaIdx(firstDay)
  // Se for domingo (6), a semana começa na segunda, então não há preenchimento
  if (startIdx === 6) startIdx = 0

  // Construir array linear de dias visíveis
  const days: CalendarDay[] = []

  // Dias do mês anterior para preencher
  for (let i = startIdx - 1; i >= 0; i--) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - (i + 1))
    const dow = d.getDay()
    if (dow !== 0) days.push({ date: d, isCurrentMonth: false, isSunday: false })
  }

  // Dias do mês atual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(ano, mes - 1, d)
    const dow = date.getDay()
    if (dow !== 0) days.push({ date, isCurrentMonth: true, isSunday: false })
  }

  // Completar última semana com dias do próximo mês
  const remainder = days.length % 6
  if (remainder !== 0) {
    const fill = 6 - remainder
    for (let i = 1; i <= fill; i++) {
      const d = new Date(lastDay)
      d.setDate(d.getDate() + i)
      if (d.getDay() !== 0) days.push({ date: d, isCurrentMonth: false, isSunday: false })
    }
  }

  // Dividir em semanas de 6
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 6) {
    weeks.push(days.slice(i, i + 6))
  }
  return weeks
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface MonthCalendarProps {
  ano: number
  mes: number
  reservas: Reserva[]
  isAdmin: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (dateStr: string) => void
  onReservaClick: (reserva: Reserva) => void
}

export function MonthCalendar({
  ano,
  mes,
  reservas,
  isAdmin,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onReservaClick,
}: MonthCalendarProps) {
  const weeks = buildCalendarWeeks(ano, mes)
  const today = toDateStr(new Date())

  // Indexar reservas por data
  const reservasPorDia = new Map<string, Reserva[]>()
  for (const r of reservas) {
    const lista = reservasPorDia.get(r.data) ?? []
    lista.push(r)
    reservasPorDia.set(r.data, lista)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {MESES[mes - 1]} {ano}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grade */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {DIAS_SEMANA.map((d) => (
              <th
                key={d}
                className="border-b border-gray-100 px-2 py-2 text-xs font-semibold text-gray-500 text-center w-[16.66%]"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi} className="border-b border-gray-100 last:border-0">
              {week.map((cell, ci) => {
                const dateStr = toDateStr(cell.date)
                const isToday = dateStr === today
                const cellReservas = reservasPorDia.get(dateStr) ?? []
                const isClickable = cell.isCurrentMonth && isAdmin

                return (
                  <td
                    key={ci}
                    className={`border-r border-gray-100 last:border-0 align-top p-1.5 min-h-[80px] ${
                      cell.isCurrentMonth
                        ? isClickable
                          ? 'cursor-pointer hover:bg-amber-50 transition-colors'
                          : 'bg-white'
                        : 'bg-gray-50'
                    }`}
                    onClick={() => isClickable && onDayClick(dateStr)}
                  >
                    {/* Número do dia */}
                    <div className="flex items-center justify-end mb-1">
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : cell.isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-300'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>

                    {/* Chips de reservas */}
                    <div className="space-y-0.5">
                      {cellReservas.map((r) => (
                        <button
                          key={r.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onReservaClick(r)
                          }}
                          className="w-full text-left text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-200 transition-colors leading-tight truncate"
                          title={`${r.responsavel ?? 'Sem responsável'} — ${normalizeTime(r.inicio)}–${normalizeTime(r.fim)}`}
                        >
                          <span className="font-medium">{normalizeTime(r.inicio)}</span>
                          {r.responsavel && (
                            <span className="ml-1 opacity-75 truncate">{r.responsavel.split(' ')[0]}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
