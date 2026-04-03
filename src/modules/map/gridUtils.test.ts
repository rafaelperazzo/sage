import { describe, it, expect } from 'vitest'
import { timeToMinutes, buildGridMatrix } from './gridUtils'
import type { Alocacao } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'DISCIPLINA TESTE',
    inicio: '14:00',
    fim: '15:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.1',
    ...overrides,
  }
}

// ── timeToMinutes ─────────────────────────────────────────────────────────────

describe('timeToMinutes', () => {
  it('converte horário de início da grade', () => {
    expect(timeToMinutes('07:00')).toBe(420)
  })

  it('converte horário intermediário', () => {
    expect(timeToMinutes('14:30')).toBe(870)
  })

  it('converte meia-noite', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })

  it('converte horário de fim da grade', () => {
    expect(timeToMinutes('22:00')).toBe(1320)
  })

  it('ignora os segundos quando o formato é HH:MM:SS (Supabase)', () => {
    // split(':') retorna ['14', '30', '00'] — só h e m são usados
    expect(timeToMinutes('14:30:00')).toBe(870)
  })

  it('converte hora cheia sem minutos extras', () => {
    expect(timeToMinutes('09:00')).toBe(540)
  })
})

// ── buildGridMatrix ───────────────────────────────────────────────────────────

describe('buildGridMatrix', () => {
  it('array vazio → todos os slots são empty', () => {
    const matrix = buildGridMatrix([])
    // Verifica dois extremos
    expect(matrix['07:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    expect(matrix['21:00']!['SÁBADO']).toMatchObject({ type: 'empty' })
  })

  it('alocação de 1h → rowSpan 1 na célula de início', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    const cell = matrix['14:00']!['SEGUNDA']!
    expect(cell).toMatchObject({ type: 'allocation', rowSpan: 1 })
    if (cell.type === 'allocation') {
      expect(cell.alocacao.id).toBe(1)
    }
  })

  it('alocação de 2h → rowSpan 2 e slot seguinte marcado como skip', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '16:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    expect(matrix['14:00']!['SEGUNDA']).toMatchObject({ type: 'allocation', rowSpan: 2 })
    expect(matrix['15:00']!['SEGUNDA']).toMatchObject({ type: 'skip' })
    expect(matrix['16:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
  })

  it('alocação de 3h → rowSpan 3 e dois slots subsequentes como skip', () => {
    const aloc = makeAlocacao({ inicio: '07:00', fim: '10:00', dia_semana: 'TERÇA' })
    const matrix = buildGridMatrix([aloc])
    expect(matrix['07:00']!['TERÇA']).toMatchObject({ type: 'allocation', rowSpan: 3 })
    expect(matrix['08:00']!['TERÇA']).toMatchObject({ type: 'skip' })
    expect(matrix['09:00']!['TERÇA']).toMatchObject({ type: 'skip' })
    expect(matrix['10:00']!['TERÇA']).toMatchObject({ type: 'empty' })
  })

  it('dia_semana inválido → ignorado, matrix não é alterada', () => {
    const aloc = makeAlocacao({ dia_semana: 'DOMINGO' })
    const matrix = buildGridMatrix([aloc])
    // Nenhum slot deve ser allocation ou skip
    const allCells = Object.values(matrix).flatMap(row => Object.values(row))
    expect(allCells.every(c => c.type === 'empty')).toBe(true)
  })

  it('início fora da grade (06:00) → ignorado', () => {
    const aloc = makeAlocacao({ inicio: '06:00', fim: '07:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    const allCells = Object.values(matrix).flatMap(row => Object.values(row))
    expect(allCells.every(c => c.type === 'empty')).toBe(true)
  })

  it('alocação com início === fim (0h) → ignorada', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '14:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    expect(matrix['14:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
  })

  it('alocação com rowSpan negativo → ignorada', () => {
    // fim < inicio
    const aloc = makeAlocacao({ inicio: '15:00', fim: '14:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    const allCells = Object.values(matrix).flatMap(row => Object.values(row))
    expect(allCells.every(c => c.type === 'empty')).toBe(true)
  })

  it('duas alocações em dias diferentes aparecem corretamente', () => {
    const aloc1 = makeAlocacao({ id: 1, inicio: '08:00', fim: '09:00', dia_semana: 'SEGUNDA' })
    const aloc2 = makeAlocacao({ id: 2, inicio: '08:00', fim: '09:00', dia_semana: 'QUARTA' })
    const matrix = buildGridMatrix([aloc1, aloc2])
    expect(matrix['08:00']!['SEGUNDA']).toMatchObject({ type: 'allocation', rowSpan: 1 })
    expect(matrix['08:00']!['QUARTA']).toMatchObject({ type: 'allocation', rowSpan: 1 })
    expect(matrix['08:00']!['TERÇA']).toMatchObject({ type: 'empty' })
  })

  it('alocação no último slot da grade (21:00–22:00) → rowSpan 1', () => {
    const aloc = makeAlocacao({ inicio: '21:00', fim: '22:00', dia_semana: 'SEXTA' })
    const matrix = buildGridMatrix([aloc])
    expect(matrix['21:00']!['SEXTA']).toMatchObject({ type: 'allocation', rowSpan: 1 })
  })

  it('duas alocações no mesmo dia em horários distintos', () => {
    const aloc1 = makeAlocacao({ id: 1, inicio: '08:00', fim: '10:00', dia_semana: 'QUINTA' })
    const aloc2 = makeAlocacao({ id: 2, inicio: '14:00', fim: '16:00', dia_semana: 'QUINTA' })
    const matrix = buildGridMatrix([aloc1, aloc2])
    expect(matrix['08:00']!['QUINTA']).toMatchObject({ type: 'allocation', rowSpan: 2 })
    expect(matrix['14:00']!['QUINTA']).toMatchObject({ type: 'allocation', rowSpan: 2 })
    expect(matrix['11:00']!['QUINTA']).toMatchObject({ type: 'empty' })
  })
})
