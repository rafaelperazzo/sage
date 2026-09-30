import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { OcupacaoView, type GrupoTabela } from './OcupacaoView'
import { useAlocacoes } from '../../hooks/useAlocacoes'
import { useAlocacoesExternas } from '../../hooks/useAlocacoesExternas'
import { useSalasExternas } from '../../hooks/useSalasExternas'
import { usePeriodo } from '../../contexts/PeriodoContext'
import { calcularOcupacao } from './occupancyUtils'
import { getPredios, getPredioDaSala, getNomeSalaSemPredio } from '../rural/salasExternasLivresAgora'
import { TIPO_COLOR } from '../../constants/salas'
import type { TipoSala } from '../../types'

const TIPO_GROUPS: { tipo: TipoSala; label: string; corBarra: string }[] = [
  { tipo: 'sala_aula', label: 'Salas de Aula', corBarra: '#3B82F6' },
  { tipo: 'sala_inovacao', label: 'Salas de Inovação', corBarra: '#8B5CF6' },
  { tipo: 'laboratorio', label: 'Laboratórios', corBarra: '#10B981' },
]

const ABAS = ['map', 'rural'] as const
type Aba = (typeof ABAS)[number]

const ABA_LABEL: Record<Aba, string> = { map: 'SAGE Map', rural: 'SAGE Rural' }

function Estado({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="text-sm text-gray-400">Carregando dados...</p>
  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
        Erro ao carregar dados: {error}
      </div>
    )
  }
  return null
}

function ReportMap() {
  const { alocacoes, loading, error } = useAlocacoes()
  const { periodo } = usePeriodo()
  const summary = useMemo(() => calcularOcupacao(alocacoes), [alocacoes])

  if (loading || error) return <Estado loading={loading} error={error} />

  const grupos: GrupoTabela[] = TIPO_GROUPS.map(({ tipo, label, corBarra }) => ({
    chave: tipo,
    titulo: label,
    corCabecalho: TIPO_COLOR[tipo],
    corBarra,
    salas: summary.salas.filter((s) => s.tipo === tipo),
  }))

  return (
    <OcupacaoView
      modulo="SAGE Map"
      summary={summary}
      periodo={periodo}
      grupos={grupos}
      topoGrafico={
        <div className="flex gap-4 mb-3">
          {TIPO_GROUPS.map(({ tipo, label }) => (
            <div key={tipo} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`inline-block w-3 h-3 rounded-sm ${TIPO_COLOR[tipo].split(' ')[0] ?? ''}`} />
              {label}
            </div>
          ))}
        </div>
      }
    />
  )
}

function ReportRural() {
  const { alocacoes, loading, error } = useAlocacoesExternas()
  const { salas, loading: loadingSalas, error: errorSalas } = useSalasExternas()
  const { periodo } = usePeriodo()
  const predios = useMemo(() => getPredios(salas), [salas])
  const [predioGrafico, setPredioGrafico] = useState('')

  useEffect(() => {
    if (!predios.includes(predioGrafico) && predios.length > 0) setPredioGrafico(predios[0]!)
  }, [predios, predioGrafico])

  const summary = useMemo(
    () => calcularOcupacao(alocacoes, salas.map((nome) => ({ nome, predio: getPredioDaSala(nome) }))),
    [alocacoes, salas]
  )

  if (loading || loadingSalas || error || errorSalas) {
    return <Estado loading={loading || loadingSalas} error={error ?? errorSalas} />
  }

  // Uma tabela por prédio.
  const grupos: GrupoTabela[] = predios.map((predio) => ({
    chave: predio,
    titulo: predio,
    corCabecalho: 'bg-amber-100 text-amber-800 border-amber-200',
    corBarra: '#F59E0B',
    salas: summary.salas.filter((s) => s.predio === predio),
  }))

  return (
    <OcupacaoView
      modulo="SAGE Rural"
      summary={summary}
      periodo={periodo}
      grupos={grupos}
      salasGrafico={summary.salas.filter((s) => s.predio === predioGrafico)}
      nomeCurto={getNomeSalaSemPredio}
      nomeTabela={getNomeSalaSemPredio}
      topoGrafico={
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 mr-2" htmlFor="report-predio">
            Prédio
          </label>
          <select
            id="report-predio"
            value={predioGrafico}
            onChange={(e) => setPredioGrafico(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {predios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      }
    />
  )
}

export function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const aba: Aba = searchParams.get('aba') === 'rural' ? 'rural' : 'map'

  function handleAbaChange(next: Aba) {
    setSearchParams(next === 'map' ? {} : { aba: next }, { replace: true })
  }

  return (
    <PageShell
      title="SAGE Report"
      subtitle="Relatório de ocupação e disponibilidade de salas"
    >
      <div className="mb-5 flex border-b border-gray-200">
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => handleAbaChange(a)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === a
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {ABA_LABEL[a]}
          </button>
        ))}
      </div>

      {aba === 'map' ? <ReportMap /> : <ReportRural />}
    </PageShell>
  )
}
