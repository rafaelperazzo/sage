import { useState, type ReactNode } from 'react'
import { OccupancyBarChart } from './OccupancyBarChart'
import { RoomDetail } from './RoomDetail'
import { TURNOS, MAX_HORAS_SEMANA, MAX_HORAS_TURNO_SEMANA } from './occupancyUtils'
import type { ReportSummary, RoomOccupancy, Turno } from './occupancyUtils'
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

type Metrica = 'total' | Turno

// Troca total/percentual pelos do turno, para o gráfico exibir o turno escolhido.
function salasNaMetrica(salas: RoomOccupancy[], metrica: Metrica): RoomOccupancy[] {
  if (metrica === 'total') return salas
  return salas.map((s) => ({ ...s, percentual: s.porTurno[metrica].percentual, totalHoras: s.porTurno[metrica].horas }))
}

function legendaMaximo(metrica: Metrica): string {
  if (metrica === 'total') {
    return `Máximo: ${MAX_HORAS_SEMANA}h/semana (seg-sex, 12h/dia: 08:00–12:00, 14:00–18:00 e 18:30–21:50; cada aula noturna de 50 min conta 1h) = 100%.`
  }
  const turno = TURNOS.find((t) => t.chave === metrica)!
  const aulaNoturna = metrica === 'noite' ? '; cada aula de 50 min conta 1h' : ''
  return `Máximo do turno: ${MAX_HORAS_TURNO_SEMANA}h/semana (seg-sex, ${turno.inicio}–${turno.fim}${aulaNoturna}) = 100%.`
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
  const [metrica, setMetrica] = useState<Metrica>('total')
  const selectedRoom = selectedSala ? summary.salas.find((s) => s.sala === selectedSala) : null

  function toggleSala(sala: string) {
    setSelectedSala(sala === selectedSala ? null : sala)
  }

  return (
    <>
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TURNOS.map((t) => (
          <div key={t.chave} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ocupação {t.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.mediaPorTurno[t.chave]}%</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.inicio}–{t.fim}</p>
          </div>
        ))}
      </div>

      {/* Gráfico geral */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Ocupação por Sala</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Clique em uma barra para ver detalhes. {legendaMaximo(metrica)}
        </p>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 mb-3" role="group" aria-label="Turno">
          {([{ chave: 'total', label: 'Total' }, ...TURNOS] as { chave: Metrica; label: string }[]).map((m) => (
            <button
              key={m.chave}
              type="button"
              aria-pressed={metrica === m.chave}
              onClick={() => setMetrica(m.chave)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                metrica === m.chave ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {topoGrafico}
        <OccupancyBarChart salas={salasNaMetrica(salasGrafico, metrica)} onSalaClick={toggleSala} nomeCurto={nomeCurto} />
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-4 py-2 font-medium">Sala</th>
                <th className="text-right px-4 py-2 font-medium">Horas/semana</th>
                {TURNOS.map((t) => (
                  <th key={t.chave} className="text-right px-4 py-2 font-medium">{t.label}</th>
                ))}
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
                  {TURNOS.map((t) => (
                    <td key={t.chave} className="px-4 py-2.5 text-right text-gray-500">{sala.porTurno[t.chave].percentual}%</td>
                  ))}
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
        </div>
      ))}
    </>
  )
}
