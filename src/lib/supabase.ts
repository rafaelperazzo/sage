import { createClient } from '@supabase/supabase-js'
import type { Alocacao, AlocacaoInput } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nome da tabela — isolado aqui para facilitar manutenção
export const TABLE_NAME = 'alocacao_2026.1'

// ── Operações CRUD ──────────────────────────────────────────────

export async function fetchAlocacoes(): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacoesPorSala(sala: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('sala', sala)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacoesPorProfessor(professor: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('professor', professor)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function insertAlocacao(input: AlocacaoInput): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ ...input, periodo: '2026.1' })
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function updateAlocacao(id: number, input: AlocacaoInput): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Alocacao
}

export async function deleteAlocacao(id: number): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) throw error
}
