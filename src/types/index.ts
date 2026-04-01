export interface Alocacao {
  id: number
  disciplina: string
  inicio: string      // "HH:MM"
  fim: string         // "HH:MM"
  sala: string        // "SALA 02" | "LAB 35" | ...
  dia_semana: string  // "SEGUNDA" | "TERÇA" | "QUARTA" | "QUINTA" | "SEXTA" | "SÁBADO"
  professor: string | null
  periodo: string     // "2026.1"
}

export type AlocacaoInput = Omit<Alocacao, 'id' | 'periodo'>

export type TipoSala = 'sala_aula' | 'sala_inovacao' | 'laboratorio'

export interface SalaInfo {
  nome: string
  tipo: TipoSala
}

export interface Reserva {
  id: number
  data: string          // "YYYY-MM-DD"
  inicio: string        // "HH:MM:SS" (Supabase time) — normalizar com normalizeTime()
  fim: string           // "HH:MM:SS"
  responsavel: string | null
}

export type ReservaInput = Omit<Reserva, 'id'>
