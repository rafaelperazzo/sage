import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Reserva } from '../../types'
import { normalizeTime } from './MonthCalendar'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const MAX_HORAS_DIA = 12

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function horasDia(reservasDia: Reserva[]): number {
  // Merge de intervalos para evitar dupla contagem
  const intervals = reservasDia
    .map((r) => ({ start: timeToMinutes(r.inicio), end: timeToMinutes(r.fim) }))
    .sort((a, b) => a.start - b.start)

  let total = 0
  let currentEnd = -1
  for (const { start, end } of intervals) {
    if (start >= currentEnd) {
      total += end - start
      currentEnd = end
    } else if (end > currentEnd) {
      total += end - currentEnd
      currentEnd = end
    }
  }
  return total / 60
}

// Conta dias Seg–Sáb do mês
function diasUteisDoMes(ano: number, mes: number): number {
  const lastDay = new Date(ano, mes, 0).getDate()
  let count = 0
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(ano, mes - 1, d).getDay()
    if (dow !== 0) count++ // 0=domingo → excluir
  }
  return count
}

interface DayEntry {
  dia: string      // "DD/MM"
  horas: number
  percentual: number
  reservas: number
}

interface AuditorioReportProps {
  reservas: Reserva[]
  ano: number
  mes: number
}

export function AuditorioReport({ reservas, ano, mes }: AuditorioReportProps) {
  const { porDia, totalHoras, percentualMensal, diasUteis } = useMemo(() => {
    const map = new Map<string, Reserva[]>()
    for (const r of reservas) {
      const lista = map.get(r.data) ?? []
      lista.push(r)
      map.set(r.data, lista)
    }

    const dias = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, rs]): DayEntry => {
        const horas = horasDia(rs)
        const [, , dd] = data.split('-')
        return {
          dia: `${dd}/${String(mes).padStart(2, '0')}`,
          horas,
          percentual: Math.min(Math.round((horas / MAX_HORAS_DIA) * 100), 100),
          reservas: rs.length,
        }
      })

    const totalH = dias.reduce((s, d) => s + d.horas, 0)
    const du = diasUteisDoMes(ano, mes)
    const pctMensal = du > 0 ? Math.round((totalH / (du * MAX_HORAS_DIA)) * 100) : 0

    return { porDia: dias, totalHoras: totalH, percentualMensal: pctMensal, diasUteis: du }
  }, [reservas, ano, mes])

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reservas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{reservas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Horas Reservadas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoras.toFixed(1)}h</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ocupação Mensal</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{percentualMensal}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Dias Úteis</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{diasUteis}</p>
        </div>
      </div>

      {porDia.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Nenhuma reserva em {MESES[mes - 1]} {ano}.
        </div>
      ) : (
        <>
          {/* Gráfico de barras */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Ocupação Diária</p>
            <p className="text-xs text-gray-400 mb-4">Base: {MAX_HORAS_DIA}h/dia = 100%</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porDia} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload as DayEntry
                    return (
                      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                        <p style={{ fontWeight: 600 }}>{d.dia}</p>
                        <p style={{ color: '#6B7280' }}>{d.percentual}% — {d.horas.toFixed(1)}h ({d.reservas} reserva{d.reservas !== 1 ? 's' : ''})</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="percentual" radius={[4, 4, 0, 0]}>
                  {porDia.map((_, i) => (
                    <Cell key={i} fill="#F59E0B" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela detalhada */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
              <h3 className="text-sm font-semibold text-amber-900">
                Detalhamento — {MESES[mes - 1]} {ano}
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="text-left px-4 py-2 font-medium">Dia</th>
                  <th className="text-right px-4 py-2 font-medium">Reservas</th>
                  <th className="text-right px-4 py-2 font-medium">Horas</th>
                  <th className="text-right px-4 py-2 font-medium">Ocupação</th>
                  <th className="px-4 py-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {porDia.map((d) => (
                  <tr key={d.dia} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{d.dia}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{d.reservas}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{d.horas.toFixed(1)}h</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{d.percentual}%</td>
                    <td className="px-4 py-2.5">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-amber-400 h-2 rounded-full"
                          style={{ width: `${Math.min(d.percentual, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2.5 font-semibold text-gray-800">Total</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{reservas.length}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{totalHoras.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{percentualMensal}%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Lista de reservas do mês */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Reservas do Mês</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="text-left px-4 py-2 font-medium">Data</th>
                  <th className="text-left px-4 py-2 font-medium">Horário</th>
                  <th className="text-left px-4 py-2 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => {
                  const [, , dd] = r.data.split('-')
                  return (
                    <tr key={r.id} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-700">{dd}/{String(mes).padStart(2, '0')}</td>
                      <td className="px-4 py-2 text-gray-600 font-mono text-xs">
                        {normalizeTime(r.inicio)}–{normalizeTime(r.fim)}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{r.responsavel ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
