import { useState, type ReactNode } from 'react'
import { OccupancyBarChart } from './OccupancyBarChart'
import { RoomDetail } from './RoomDetail'
import type { ReportSummary, RoomOccupancy } from './occupancyUtils'
import { BarChart2 } from 'lucide-react'

export interface GrupoTabela {
  chave: string
  titulo: string
  corCabecalho: string   // classes do cabeçalho da tabela
  corBarra: string       // cor da barra de progresso
  salas: RoomOccupancy[]
}

interface OcupacaoViewProps {
  summary: ReportSummary
  periodo: string
  grupos: GrupoTabela[]
  // Salas exibidas no gráfico (padrão: todas do resumo).
  salasGrafico?: RoomOccupancy[]
  // Controles/legenda exibidos acima do gráfico.
  topoGrafico?: ReactNode
  nomeCurto?: (sala: string) => string
  // Nome da sala nas tabelas (padrão: nome completo).
  nomeTabela?: (sala: string) => string
}

// Cards de resumo + gráfico de ocupação + detalhe da sala + tabelas por grupo.
export function OcupacaoView({
  summary,
  periodo,
  grupos,
  salasGrafico = summary.salas,
  topoGrafico,
  nomeCurto,
  nomeTabela = (sala) => sala,
}: OcupacaoViewProps) {
  const [selectedSala, setSelectedSala] = useState<string | null>(null)
  const selectedRoom = selectedSala ? summary.salas.find((s) => s.sala === selectedSala) : null

  function toggleSala(sala: string) {
    setSelectedSala(sala === selectedSala ? null : sala)
  }

  return (
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{periodo}</p>
        </div>
      </div>

      {/* Gráfico geral */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Ocupação por Sala</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Clique em uma barra para ver detalhes. Máximo: 77,5h/semana (seg-sex, 07:00–21:50; cada aula noturna de 50 min conta 1h) = 100%.
        </p>
        {topoGrafico}
        <OccupancyBarChart salas={salasGrafico} onSalaClick={toggleSala} nomeCurto={nomeCurto} />
      </div>

      {/* Detalhes da sala selecionada */}
      {selectedRoom && (
        <div className="mb-6">
          <RoomDetail room={selectedRoom} onClose={() => setSelectedSala(null)} />
        </div>
      )}

      {/* Tabela resumo por grupo */}
      {grupos.map((grupo) => (
        <div key={grupo.chave} className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className={`px-4 py-3 border-b border-gray-100 ${grupo.corCabecalho}`}>
            <h3 className="text-sm font-semibold">{grupo.titulo}</h3>
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
              {grupo.salas.map((sala) => (
                <tr
                  key={sala.sala}
                  className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleSala(sala.sala)}
                >
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{nomeTabela(sala.sala)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{sala.totalHoras.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{sala.percentual}%</td>
                  <td className="px-4 py-2.5">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(sala.percentual, 100)}%`, backgroundColor: grupo.corBarra }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
