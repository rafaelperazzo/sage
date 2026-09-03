import type { SalaInfo, TipoSala } from '../types'

export const SALAS: SalaInfo[] = [
  { nome: 'SALA 02', tipo: 'sala_aula' },
  { nome: 'SALA 03', tipo: 'sala_aula' },
  { nome: 'SALA 36', tipo: 'sala_aula' },
  { nome: 'SALA 38', tipo: 'sala_aula' },
  { nome: 'SALA 40', tipo: 'sala_inovacao' },
  { nome: 'SALA 42', tipo: 'sala_inovacao' },
  { nome: 'LAB 35', tipo: 'laboratorio' },
  { nome: 'LAB 37', tipo: 'laboratorio' },
  { nome: 'LAB 39', tipo: 'laboratorio' },
  { nome: 'LAB 41', tipo: 'laboratorio' },
  { nome: 'LAB 43', tipo: 'laboratorio' },
  { nome: 'LAB CEAGRI I - 10', tipo: 'laboratorio' },
  { nome: 'LAB CEAGRI I - 15', tipo: 'laboratorio' },
]

export const DIAS = [
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SÁBADO',
] as const

export type DiaSemana = (typeof DIAS)[number]

// Marcos que delimitam as linhas da grade. Os marcos noturnos legados de
// hora cheia (19:00, 20:00, 21:00) convivem com os marcos reais das aulas
// noturnas de 50min (18:30, 19:20, 20:10, 21:50) para que a grade funcione
// tanto com dados antigos quanto após a correção no Supabase, em qualquer
// ordem.
export const LIMITES: string[] = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
  '18:30', '19:00', '19:20', '20:00', '20:10', '21:00', '21:50', '22:00',
]

// Início de cada linha da grade (todos os marcos exceto o último).
export const HORAS: string[] = LIMITES.slice(0, -1)

export const TIPO_LABEL: Record<TipoSala, string> = {
  sala_aula: 'Sala de Aula',
  sala_inovacao: 'Sala de Inovação',
  laboratorio: 'Laboratório',
}

export const TIPO_COLOR: Record<TipoSala, string> = {
  sala_aula: 'bg-blue-100 text-blue-800 border-blue-200',
  sala_inovacao: 'bg-violet-100 text-violet-800 border-violet-200',
  laboratorio: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const TIPO_CELL_COLOR: Record<TipoSala, string> = {
  sala_aula: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  sala_inovacao: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  laboratorio: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
}

export function getSalaInfo(nomeSala: string): SalaInfo | undefined {
  return SALAS.find((s) => s.nome === nomeSala)
}

export const PERIODO_ATUAL = '2026.1'
