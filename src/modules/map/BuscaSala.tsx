import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { Alocacao } from '../../types'
import { DIAS, getSalaInfo, TIPO_COLOR, TIPO_LABEL } from '../../constants/salas'

interface BuscaSalaProps {
  alocacoes: Alocacao[]
  loading: boolean
}

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  'TERÇA': 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  'SÁBADO': 'Sábado',
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function SalaBadge({ sala }: { sala: string }) {
  const info = getSalaInfo(sala)
  const color = info ? TIPO_COLOR[info.tipo] : 'bg-gray-100 text-gray-700 border-gray-200'
  const label = info ? TIPO_LABEL[info.tipo] : sala
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${color}`}>{sala}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm space-y-1.5">
      {children}
    </div>
  )
}

interface AutocompleteProps {
  label: string
  placeholder: string
  query: string
  suggestions: string[]
  showSuggestions: boolean
  onQueryChange: (v: string) => void
  onSelect: (v: string) => void
  onFocus: () => void
  onBlur: () => void
}

function Autocomplete({
  label, placeholder, query, suggestions, showSuggestions,
  onQueryChange, onSelect, onFocus, onBlur,
}: AutocompleteProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  onMouseDown={() => onSelect(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function BuscaSala({ alocacoes, loading }: BuscaSalaProps) {
  // ── Busca por disciplina ───────────────────────────────────────
  const [queryDisc, setQueryDisc] = useState('')
  const [selectedDisc, setSelectedDisc] = useState('')
  const [showDisc, setShowDisc] = useState(false)

  // ── Busca por professor ────────────────────────────────────────
  const [queryProf, setQueryProf] = useState('')
  const [selectedProf, setSelectedProf] = useState('')
  const [showProf, setShowProf] = useState(false)

  const disciplinas = useMemo(() =>
    Array.from(new Set(alocacoes.map((a) => a.disciplina))).sort()
  , [alocacoes])

  const professores = useMemo(() =>
    Array.from(new Set(alocacoes.filter((a) => a.professor).map((a) => a.professor!))).sort()
  , [alocacoes])

  const sugDisc = useMemo(() => {
    if (!queryDisc.trim()) return []
    const q = normalize(queryDisc)
    return disciplinas.filter((d) => normalize(d).includes(q)).slice(0, 8)
  }, [queryDisc, disciplinas])

  const sugProf = useMemo(() => {
    if (!queryProf.trim()) return []
    const q = normalize(queryProf)
    return professores.filter((p) => normalize(p).includes(q)).slice(0, 8)
  }, [queryProf, professores])

  const resultadosDisc = useMemo(() =>
    !selectedDisc ? [] :
    alocacoes
      .filter((a) => a.disciplina === selectedDisc)
      .sort((a, b) => DIAS.indexOf(a.dia_semana as typeof DIAS[number]) - DIAS.indexOf(b.dia_semana as typeof DIAS[number]))
  , [alocacoes, selectedDisc])

  const resultadosProf = useMemo(() =>
    !selectedProf ? [] :
    alocacoes
      .filter((a) => a.professor === selectedProf)
      .sort((a, b) => DIAS.indexOf(a.dia_semana as typeof DIAS[number]) - DIAS.indexOf(b.dia_semana as typeof DIAS[number]))
  , [alocacoes, selectedProf])

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando dados...</p>
  }

  return (
    <div className="space-y-8">

      {/* ── Busca por disciplina ─────────────────────────────── */}
      <section>
        <Autocomplete
          label="Buscar por Disciplina"
          placeholder="Digite o nome da disciplina..."
          query={queryDisc}
          suggestions={sugDisc}
          showSuggestions={showDisc}
          onQueryChange={(v) => { setQueryDisc(v); setShowDisc(true); if (v !== selectedDisc) setSelectedDisc('') }}
          onSelect={(v) => { setQueryDisc(v); setSelectedDisc(v); setShowDisc(false) }}
          onFocus={() => setShowDisc(true)}
          onBlur={() => setTimeout(() => setShowDisc(false), 150)}
        />

        {selectedDisc && resultadosDisc.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">Nenhuma alocação encontrada para <strong>{selectedDisc}</strong>.</p>
        )}

        {resultadosDisc.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">
              {resultadosDisc.length} alocação(ões) — <strong>{selectedDisc}</strong>
            </p>
            {resultadosDisc.map((a) => (
              <ResultCard key={a.id}>
                <SalaBadge sala={a.sala} />
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span className="font-medium">{DIA_LABEL[a.dia_semana] ?? a.dia_semana}</span>
                  <span className="font-mono text-xs text-gray-500">{a.inicio}–{a.fim}</span>
                </div>
                {a.professor && (
                  <p className="text-xs text-gray-500">{a.professor}</p>
                )}
              </ResultCard>
            ))}
          </div>
        )}
      </section>

      <hr className="border-gray-100" />

      {/* ── Busca por professor ──────────────────────────────── */}
      <section>
        <Autocomplete
          label="Buscar por Professor"
          placeholder="Digite o nome do professor..."
          query={queryProf}
          suggestions={sugProf}
          showSuggestions={showProf}
          onQueryChange={(v) => { setQueryProf(v); setShowProf(true); if (v !== selectedProf) setSelectedProf('') }}
          onSelect={(v) => { setQueryProf(v); setSelectedProf(v); setShowProf(false) }}
          onFocus={() => setShowProf(true)}
          onBlur={() => setTimeout(() => setShowProf(false), 150)}
        />

        {selectedProf && resultadosProf.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">Nenhuma alocação encontrada para <strong>{selectedProf}</strong>.</p>
        )}

        {resultadosProf.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">
              {resultadosProf.length} alocação(ões) — <strong>{selectedProf}</strong>
            </p>
            {resultadosProf.map((a) => (
              <ResultCard key={a.id}>
                <p className="text-sm font-medium text-gray-800">{a.disciplina}</p>
                <SalaBadge sala={a.sala} />
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span className="font-medium">{DIA_LABEL[a.dia_semana] ?? a.dia_semana}</span>
                  <span className="font-mono text-xs text-gray-500">{a.inicio}–{a.fim}</span>
                </div>
              </ResultCard>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
