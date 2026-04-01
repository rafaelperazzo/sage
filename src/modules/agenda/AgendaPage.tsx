import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { TeacherGrid } from './TeacherGrid'
import { useAlocacoes } from '../../hooks/useAlocacoes'
import { Search } from 'lucide-react'

export function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('professor') ?? '')
  const [selectedProfessor, setSelectedProfessor] = useState(searchParams.get('professor') ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { alocacoes, loading, error } = useAlocacoes()

  // Lista distinta de professores
  const professores = useMemo(() => {
    const set = new Set<string>()
    for (const a of alocacoes) {
      if (a.professor) set.add(a.professor)
    }
    return Array.from(set).sort()
  }, [alocacoes])

  // Filtrar sugestões com base na query
  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return professores.filter((p) => {
      const normalized = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return normalized.includes(q)
    }).slice(0, 8)
  }, [query, professores])

  // Alocações do professor selecionado
  const alocacoesProfessor = useMemo(() => {
    if (!selectedProfessor) return []
    return alocacoes.filter((a) => a.professor === selectedProfessor)
  }, [alocacoes, selectedProfessor])

  // Sincronizar com URL
  useEffect(() => {
    if (selectedProfessor) {
      setSearchParams({ professor: selectedProfessor }, { replace: true })
    }
  }, [selectedProfessor, setSearchParams])

  function handleSelect(professor: string) {
    setQuery(professor)
    setSelectedProfessor(professor)
    setShowSuggestions(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowSuggestions(true)
    if (value !== selectedProfessor) {
      setSelectedProfessor('')
    }
  }

  return (
    <PageShell
      title="SAGE Agenda"
      subtitle="Grade de horários por professor"
    >
      {/* Campo de busca */}
      <div className="relative mb-6 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o nome do professor..."
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((p) => (
              <li key={p}>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  onMouseDown={() => handleSelect(p)}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Carregando dados...</p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && !selectedProfessor && (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Pesquise e selecione um professor para ver a grade.</p>
        </div>
      )}

      {!loading && !error && selectedProfessor && alocacoesProfessor.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhuma alocação encontrada para <strong>{selectedProfessor}</strong>.</p>
        </div>
      )}

      {!loading && !error && selectedProfessor && alocacoesProfessor.length > 0 && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {alocacoesProfessor.length} alocação(ões) encontrada(s) para{' '}
            <strong>{selectedProfessor}</strong>
          </p>
          <TeacherGrid alocacoes={alocacoesProfessor} />
        </>
      )}
    </PageShell>
  )
}
