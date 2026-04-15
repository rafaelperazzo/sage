import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { Alocacao, AlocacaoInput, Reserva, ReservaInput, Manutencao, ManutencaoInput } from '../types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.')
}

// SecureStore tem limite de ~2KB no iOS; tokens grandes vão para AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const secureVal = await SecureStore.getItemAsync(key)
    if (secureVal !== null) return secureVal
    return AsyncStorage.getItem(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length > 1800) {
      await AsyncStorage.setItem(key, value)
    } else {
      await SecureStore.setItemAsync(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key)
    await AsyncStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

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

// ── Auditório ───────────────────────────────────────────────────

export const AUDITORIO_TABLE = 'auditorio'

export async function fetchReservasMes(ano: number, mes: number): Promise<Reserva[]> {
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data')
    .order('inicio')

  if (error) throw error
  return data as Reserva[]
}

export async function insertReserva(input: ReservaInput): Promise<Reserva> {
  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Reserva
}

export async function updateReserva(id: number, input: ReservaInput): Promise<Reserva> {
  const { data, error } = await supabase
    .from(AUDITORIO_TABLE)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reserva
}

export async function deleteReserva(id: number): Promise<void> {
  const { error } = await supabase
    .from(AUDITORIO_TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Manutenção ──────────────────────────────────────────────────

export const MANUTENCAO_TABLE = 'manutencao'

export async function fetchManutencoes(): Promise<Manutencao[]> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .select('*')
    .order('data_abertura', { ascending: false })

  if (error) throw error
  return data as Manutencao[]
}

export async function insertManutencao(input: ManutencaoInput): Promise<Manutencao> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Manutencao
}

export async function updateManutencao(id: number, input: ManutencaoInput): Promise<Manutencao> {
  const { data, error } = await supabase
    .from(MANUTENCAO_TABLE)
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Manutencao
}

export async function deleteManutencao(id: number): Promise<void> {
  const { error } = await supabase
    .from(MANUTENCAO_TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}
