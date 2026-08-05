import type { Alocacao } from '../../types'
import { DIAS } from '../../constants/salas'
import { timeToMinutes } from './gridUtils'

// Cursos excluídos da lista consolidada (possuem listagem própria)
const CURSOS_EXCLUIDOS = new Set(['BSI', 'DCC'])

export interface DisciplinaSessao {
  dia_semana: string
  inicio: string
  fim: string
  sala: string
}

export interface DisciplinaAgrupada {
  disciplina: string
  professor: string | null
  curso: string
  semestre: number
  sessoes: DisciplinaSessao[]
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// A ordena\u00e7\u00e3o alfab\u00e9tica ignora o c\u00f3digo num\u00e9rico que prefixa o nome da
// disciplina (ex: "06214 - ALGORITMOS..." ordena em "A", n\u00e3o em "0").
function nomeParaOrdenacao(disciplina: string): string {
  return normalize(disciplina.replace(/^\d+\s*-\s*/, ''))
}

function ordenarSessoes(a: DisciplinaSessao, b: DisciplinaSessao): number {
  const diaDiff = DIAS.indexOf(a.dia_semana as typeof DIAS[number]) - DIAS.indexOf(b.dia_semana as typeof DIAS[number])
  if (diaDiff !== 0) return diaDiff
  return timeToMinutes(a.inicio) - timeToMinutes(b.inicio)
}

/**
 * Agrupa alocações em disciplinas únicas, em ordem alfabética, para a
 * listagem consolidada de todos os cursos (exceto BSI/DCC). Sessões da
 * mesma disciplina, professor e curso são combinadas em um só registro;
 * quando o mesmo par disciplina+professor atende turmas de cursos
 * diferentes, cada curso vira uma linha separada.
 */
export function agruparDisciplinas(alocacoes: Alocacao[]): DisciplinaAgrupada[] {
  const grupos = new Map<string, DisciplinaAgrupada>()

  for (const a of alocacoes) {
    if (CURSOS_EXCLUIDOS.has(a.curso)) continue

    const chave = `${normalize(a.disciplina)}::${normalize(a.professor ?? '')}::${a.curso}`
    let grupo = grupos.get(chave)
    if (!grupo) {
      grupo = { disciplina: a.disciplina, professor: a.professor, curso: a.curso, semestre: a.semestre, sessoes: [] }
      grupos.set(chave, grupo)
    }

    const sessaoExiste = grupo.sessoes.some(
      (s) => s.dia_semana === a.dia_semana && s.inicio === a.inicio && s.fim === a.fim && s.sala === a.sala
    )
    if (!sessaoExiste) {
      grupo.sessoes.push({ dia_semana: a.dia_semana, inicio: a.inicio, fim: a.fim, sala: a.sala })
    }
  }

  const resultado = Array.from(grupos.values())
  for (const grupo of resultado) {
    grupo.sessoes.sort(ordenarSessoes)
  }

  resultado.sort((a, b) => {
    const nomeDiff = nomeParaOrdenacao(a.disciplina).localeCompare(nomeParaOrdenacao(b.disciplina))
    if (nomeDiff !== 0) return nomeDiff
    return a.curso.localeCompare(b.curso)
  })

  return resultado
}
