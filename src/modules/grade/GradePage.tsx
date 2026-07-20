import { useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { GradeGrid } from './GradeGrid'
import { useAlocacoes } from '../../hooks/useAlocacoes'
import { CURSOS, isCursoSigla, getCursoNome, type CursoSigla } from '../../constants/cursos'
import { RefreshCw } from 'lucide-react'

export function GradePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { alocacoes, loading, error } = useAlocacoes()

  const cursoParam = searchParams.get('curso')
  const curso: CursoSigla = cursoParam && isCursoSigla(cursoParam) ? cursoParam : 'BCC'

  const alocacoesCurso = useMemo(
    () => alocacoes.filter((a) => a.curso === curso),
    [alocacoes, curso]
  )

  const semestresDisponiveis = useMemo(() => {
    const set = new Set(alocacoesCurso.map((a) => a.semestre))
    return Array.from(set).filter((s) => s > 0).sort((a, b) => a - b)
  }, [alocacoesCurso])

  const semestreParam = searchParams.get('semestre')
  const semestreNum = semestreParam ? Number(semestreParam) : NaN
  const semestre = semestresDisponiveis.includes(semestreNum)
    ? semestreNum
    : (semestresDisponiveis[0] ?? null)

  // Mantém a URL sincronizada com o curso/semestre efetivos (inclusive quando um default é aplicado)
  useEffect(() => {
    const params: Record<string, string> = { curso }
    if (semestre !== null) params.semestre = String(semestre)
    setSearchParams(params, { replace: true })
  }, [curso, semestre, setSearchParams])

  const alocacoesSemestre = useMemo(
    () => (semestre === null ? [] : alocacoesCurso.filter((a) => a.semestre === semestre)),
    [alocacoesCurso, semestre]
  )

  function handleCursoChange(next: CursoSigla) {
    setSearchParams({ curso: next }, { replace: true })
  }

  function handleSemestreChange(next: number) {
    setSearchParams({ curso, semestre: String(next) }, { replace: true })
  }

  return (
    <PageShell title="SAGE Grade Semestral" subtitle={getCursoNome(curso)}>
      {/* Toggle de curso */}
      <div className="mb-5 flex flex-wrap gap-2">
        {CURSOS.map((c) => (
          <button
            key={c.sigla}
            onClick={() => handleCursoChange(c.sigla)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              curso === c.sigla
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200 ring-2 ring-offset-1 ring-indigo-400'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {c.sigla}
          </button>
        ))}
      </div>

      {loading && (
        <span className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <RefreshCw size={12} className="animate-spin" />
          Carregando...
        </span>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && semestresDisponiveis.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhuma disciplina cadastrada para {curso} neste período.</p>
        </div>
      )}

      {!loading && !error && semestresDisponiveis.length > 0 && (
        <>
          {/* Abas de semestre */}
          <div className="mb-5 flex flex-wrap gap-1 border-b border-gray-200">
            {semestresDisponiveis.map((s) => (
              <button
                key={s}
                onClick={() => handleSemestreChange(s)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  semestre === s
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {s}º
              </button>
            ))}
          </div>

          <GradeGrid alocacoes={alocacoesSemestre} />
        </>
      )}
    </PageShell>
  )
}
