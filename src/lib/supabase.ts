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

// ── Períodos letivos ────────────────────────────────────────────

export async function fetchPeriodos(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('periodo')

  if (error) throw error

  const periodos = Array.from(
    new Set((data as { periodo: string }[]).map((r) => r.periodo).filter(Boolean))
  ).sort()

  return periodos
}

// ── Operações de leitura (filtradas por período) ────────────────

export async function fetchAlocacoes(periodo: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('periodo', periodo)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

export async function fetchAlocacoesPorSala(sala: string, periodo: string): Promise<Alocacao[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('sala', sala)
    .eq('periodo', periodo)
    .order('dia_semana')
    .order('inicio')

  if (error) throw error
  return data as Alocacao[]
}

// ── Operações CRUD ──────────────────────────────────────────────

export async function insertAlocacao(input: AlocacaoInput, periodo: string): Promise<Alocacao> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ ...input, periodo })
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
