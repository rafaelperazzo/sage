import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RoomOccupancy } from './occupancyUtils'
import { DIAS } from '../../constants/salas'
import { TIPO_LABEL, TIPO_COLOR } from '../../constants/salas'

interface RoomDetailProps {
  room: RoomOccupancy
  onClose: () => void
}

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  'TERÇA': 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  'SÁBADO': 'Sábado',
}

const MAX_HORAS_DIA = 12

export function RoomDetail({ room, onClose }: RoomDetailProps) {
  const ocupadoHoras = parseFloat(room.totalHoras.toFixed(1))
  const livreHoras = parseFloat((72 - room.totalHoras).toFixed(1))

  const pieData = [
    { name: 'Ocupado', value: ocupadoHoras },
    { name: 'Livre', value: livreHoras > 0 ? livreHoras : 0 },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{room.sala}</h3>
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TIPO_COLOR[room.tipo]}`}>
            {TIPO_LABEL[room.tipo]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Fechar detalhes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de pizza */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Ocupação Semanal
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                <Cell fill="#3B82F6" />
                <Cell fill="#E5E7EB" />
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}h`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela por dia */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Ocupação por Dia
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="text-left py-1 font-medium">Dia</th>
                <th className="text-right py-1 font-medium">Horas</th>
                <th className="text-right py-1 font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {DIAS.map((dia) => {
                const horas = room.porDia[dia] ?? 0
                const pct = Math.round((horas / MAX_HORAS_DIA) * 100)
                return (
                  <tr key={dia} className="border-t border-gray-50">
                    <td className="py-1.5 text-gray-700">{DIA_LABEL[dia] ?? dia}</td>
                    <td className="py-1.5 text-right text-gray-600">{horas.toFixed(1)}h</td>
                    <td className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-8 text-xs">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-1.5 font-semibold text-gray-800">Total</td>
                <td className="py-1.5 text-right font-semibold text-gray-800">
                  {room.totalHoras.toFixed(1)}h
                </td>
                <td className="py-1.5 text-right font-semibold text-gray-800">
                  {room.percentual}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
