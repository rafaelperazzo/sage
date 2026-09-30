import type { Alocacao, AlocacaoInput } from '../../types'
import { DIAS } from '../../constants/salas'
import { timeToMinutes } from './gridUtils'

function normalizar(valor: string | null): string {
  return (valor ?? '').trim().toUpperCase()
}

/** Mesma disciplina = mesmo nome, professor e curso (sem diferenciar caixa/espaços). */
export function mesmaDisciplina(a: AlocacaoInput, b: AlocacaoInput): boolean {
  return (
    normalizar(a.disciplina) === normalizar(b.disciplina) &&
    normalizar(a.professor) === normalizar(b.professor) &&
    normalizar(a.curso) === normalizar(b.curso)
  )
}

/** Demais alocações da mesma disciplina de `alvo`, ordenadas por dia e início. */
export function outrasAlocacoesDaDisciplina(alvo: Alocacao, todas: Alocacao[]): Alocacao[] {
  const ordemDia = (dia: string) => DIAS.indexOf(dia as (typeof DIAS)[number])
  return todas
    .filter((a) => a.id !== alvo.id && mesmaDisciplina(a, alvo))
    .sort(
      (a, b) =>
        ordemDia(a.dia_semana) - ordemDia(b.dia_semana) || timeToMinutes(a.inicio) - timeToMinutes(b.inicio)
    )
}

/**
 * Alocação `outra` com disciplina, professor, curso e sala de `input` — dia e
 * horário de `outra` são mantidos (refletir uma edição nos outros dias).
 */
export function comCamposDaDisciplina(outra: Alocacao, input: AlocacaoInput): Alocacao {
  return { ...outra, disciplina: input.disciplina, professor: input.professor, curso: input.curso, sala: input.sala }
}

/** "SEGUNDA 08:00–10:00 · SALA 02" */
export function formatarAlocacaoCurta(a: AlocacaoInput): string {
  return `${a.dia_semana} ${a.inicio}–${a.fim} · ${a.sala}`
}

function conflitam(a: AlocacaoInput, b: AlocacaoInput): boolean {
  return (
    a.sala === b.sala &&
    a.dia_semana === b.dia_semana &&
    timeToMinutes(a.inicio) < timeToMinutes(b.fim) &&
    timeToMinutes(a.fim) > timeToMinutes(b.inicio)
  )
}

/**
 * Verifica se as alocações `linhas` (com os valores novos, já com id) podem
 * ser gravadas juntas: nenhuma pode sobrepor outra alocação do período (em
 * qualquer sala; as próprias linhas são ignoradas, pois serão substituídas)
 * nem as demais linhas. Retorna a mensagem de conflito ou null.
 */
export function conflitoAlocacoes(linhas: Alocacao[], todas: Alocacao[]): string | null {
  const ids = new Set(linhas.map((l) => l.id))
  for (const linha of linhas) {
    const ocupada = todas.find((a) => !ids.has(a.id) && conflitam(linha, a))
    if (ocupada) {
      const professor = ocupada.professor ? ` — ${ocupada.professor}` : ''
      return `Conflito de horário: ${formatarAlocacaoCurta(linha)} já está ocupado por ${ocupada.disciplina}${professor} (${ocupada.inicio}–${ocupada.fim}).`
    }
  }
  for (const [i, a] of linhas.entries()) {
    const b = linhas.slice(i + 1).find((l) => conflitam(a, l))
    if (b) {
      return `Conflito de horário entre as alocações selecionadas: ${formatarAlocacaoCurta(a)} e ${formatarAlocacaoCurta(b)}.`
    }
  }
  return null
}

/** Alocação sem os campos que não são editados pelo formulário. */
export function paraInput({ id: _id, periodo: _periodo, semestre: _semestre, ...input }: Alocacao): AlocacaoInput {
  return input
}
