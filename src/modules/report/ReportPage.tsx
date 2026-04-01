import { useState, useMemo } from 'react'
import { PageShell } from '../../components/Layout/PageShell'
import { OccupancyBarChart } from './OccupancyBarChart'
import { RoomDetail } from './RoomDetail'
import { useAlocacoes } from '../../hooks/useAlocacoes'
import { calcularOcupacao } from './occupancyUtils'
import { TIPO_COLOR } from '../../constants/salas'
import type { TipoSala } from '../../types'
import { BarChart2 } from 'lucide-react'

const TIPO_GROUPS: { tipo: TipoSala; label: string }[] = [
  { tipo: 'sala_aula', label: 'Salas de Aula' },
  { tipo: 'sala_inovacao', label: 'Salas de Inovação' },
  { tipo: 'laboratorio', label: 'Laboratórios' },
]

export function ReportPage() {
  const { alocacoes, loading, error } = useAlocacoes()
  const [selectedSala, setSelectedSala] = useState<string | null>(null)

  const summary = useMemo(() => calcularOcupacao(alocacoes), [alocacoes])

  const selectedRoom = selectedSala
    ? summary.salas.find((s) => s.sala === selectedSala)
    : null

  return (
    <PageShell
      title="SAGE Report"
      subtitle="Relatório de ocupação e disponibilidade de salas"
    >
      {loading && <p className="text-sm text-gray-400">Carregando dados...</p>}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total de Salas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.salas.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Horas Alocadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalGeralHoras.toFixed(0)}h</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Média de Ocupação</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.mediaOcupacao}%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Período</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">2026.1</p>
            </div>
          </div>

          {/* Gráfico geral */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Ocupação por Sala</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Clique em uma barra para ver detalhes. Máximo: 72h/semana = 100%.
            </p>
            <div className="flex gap-4 mb-3">
              {TIPO_GROUPS.map(({ tipo, label }) => (
                <div key={tipo} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`inline-block w-3 h-3 rounded-sm ${TIPO_COLOR[tipo].split(' ')[0] ?? ''}`} />
                  {label}
                </div>
              ))}
            </div>
            <OccupancyBarChart
              salas={summary.salas}
              onSalaClick={(sala) => setSelectedSala(sala === selectedSala ? null : sala)}
            />
          </div>

          {/* Detalhes da sala selecionada */}
          {selectedRoom && (
            <div className="mb-6">
              <RoomDetail
                room={selectedRoom}
                onClose={() => setSelectedSala(null)}
              />
            </div>
          )}

          {/* Tabela resumo por grupo */}
          {TIPO_GROUPS.map(({ tipo, label }) => {
            const salasGrupo = summary.salas.filter((s) => s.tipo === tipo)
            return (
              <div key={tipo} className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className={`px-4 py-3 border-b border-gray-100 ${TIPO_COLOR[tipo]}`}>
                  <h3 className="text-sm font-semibold">{label}</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left px-4 py-2 font-medium">Sala</th>
                      <th className="text-right px-4 py-2 font-medium">Horas/semana</th>
                      <th className="text-right px-4 py-2 font-medium">Ocupação</th>
                      <th className="px-4 py-2 w-32" />
                    </tr>
                  </thead>
                  <tbody>
                    {salasGrupo.map((sala) => (
                      <tr
                        key={sala.sala}
                        className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSala(sala.sala === selectedSala ? null : sala.sala)}
                      >
                        <td className="px-4 py-2.5 text-gray-800 font-medium">{sala.sala}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {sala.totalHoras.toFixed(1)}h
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {sala.percentual}%
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(sala.percentual, 100)}%`,
                                backgroundColor:
                                  sala.tipo === 'sala_aula'
                                    ? '#3B82F6'
                                    : sala.tipo === 'sala_inovacao'
                                    ? '#8B5CF6'
                                    : '#10B981',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </>
      )}
    </PageShell>
  )
}
