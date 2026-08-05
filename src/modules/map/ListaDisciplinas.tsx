import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { Alocacao } from '../../types'
import { agruparDisciplinas } from './listaDisciplinasUtils'

interface ListaDisciplinasProps {
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

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function ListaDisciplinas({ alocacoes, loading }: ListaDisciplinasProps) {
  const [query, setQuery] = useState('')

  const disciplinas = useMemo(() => agruparDisciplinas(alocacoes), [alocacoes])

  const filtradas = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return disciplinas
    return disciplinas.filter(
      (d) => normalize(d.disciplina).includes(q) || (d.professor && normalize(d.professor).includes(q))
    )
  }, [disciplinas, query])

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando dados...</p>
  }

  return (
    <div>
      <div className="relative max-w-md mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Filtrar por disciplina ou professor..."
        />
      </div>

      <p className="mb-3 text-xs text-gray-500">{filtradas.length} disciplina(s)</p>

      {filtradas.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma disciplina encontrada.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-4 py-2 font-medium">Disciplina</th>
                <th className="text-left px-4 py-2 font-medium">Curso</th>
                <th className="text-left px-4 py-2 font-medium">Sem.</th>
                <th className="text-left px-4 py-2 font-medium">Dia — Horário — Sala</th>
                <th className="text-left px-4 py-2 font-medium">Professor(a)</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((d) => (
                <tr key={`${d.disciplina}::${d.professor ?? ''}::${d.curso}`} className="border-t border-gray-50 align-top">
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{d.disciplina}</td>
                  <td className="px-4 py-2.5 text-gray-600">{d.curso}</td>
                  <td className="px-4 py-2.5 text-gray-600">{d.semestre > 0 ? d.semestre : ''}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {d.sessoes.map((s, i) => (
                      <div key={i} className="whitespace-nowrap">
                        {DIA_LABEL[s.dia_semana] ?? s.dia_semana} — {s.inicio}-{s.fim} — {s.sala}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{d.professor ?? 'A definir'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
