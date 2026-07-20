export const CURSOS = [
  { sigla: 'BCC', nome: 'Bacharelado em Ciência da Computação' },
  { sigla: 'LC', nome: 'Licenciatura em Computação' },
] as const

export type CursoSigla = (typeof CURSOS)[number]['sigla']

export function getCursoNome(sigla: string): string | undefined {
  return CURSOS.find((c) => c.sigla === sigla)?.nome
}

export function isCursoSigla(sigla: string): sigla is CursoSigla {
  return CURSOS.some((c) => c.sigla === sigla)
}
