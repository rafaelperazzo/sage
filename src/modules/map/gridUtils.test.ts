import { describe, it, expect } from 'vitest'
import { timeToMinutes, buildGridMatrix, getHorasVisiveis, markFreeSlots, isAlocacaoAgora, formatFreeRange } from './gridUtils'
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
    curso: 'DC',
    semestre: 0,
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

// ── getHorasVisiveis ─────────────────────────────────────────────────────────

describe('getHorasVisiveis', () => {
  it('matrix vazia → nenhum horário visível', () => {
    const matrix = buildGridMatrix([])
    expect(getHorasVisiveis(matrix)).toEqual([])
  })

  it('uma alocação de 1h → só o horário de início é visível', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    expect(getHorasVisiveis(matrix)).toEqual(['14:00'])
  })

  it('alocação de 2h → mantém a linha do meio (skip) visível', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '16:00', dia_semana: 'SEGUNDA' })
    const matrix = buildGridMatrix([aloc])
    expect(getHorasVisiveis(matrix)).toEqual(['14:00', '15:00'])
  })

  it('alocações em horários distintos → todos aparecem, ordenados por HORAS', () => {
    const aloc1 = makeAlocacao({ id: 1, inicio: '18:00', fim: '19:00', dia_semana: 'SEXTA' })
    const aloc2 = makeAlocacao({ id: 2, inicio: '08:00', fim: '09:00', dia_semana: 'TERÇA' })
    const matrix = buildGridMatrix([aloc1, aloc2])
    expect(getHorasVisiveis(matrix)).toEqual(['08:00', '18:00'])
  })
})

// ── markFreeSlots ─────────────────────────────────────────────────────────────

describe('markFreeSlots', () => {
  it('dia totalmente vago → agrupa em blocos de 2h, pulando 07:00, 12:00 e 13:00', () => {
    const matrix = markFreeSlots(buildGridMatrix([]))
    // 07:00 desconsiderado → fica vazio; 08-10, 10-12 pareados
    expect(matrix['07:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    expect(matrix['08:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 2 })
    expect(matrix['09:00']!['SEGUNDA']).toMatchObject({ type: 'skip' })
    expect(matrix['10:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 2 })
    expect(matrix['11:00']!['SEGUNDA']).toMatchObject({ type: 'skip' })
    // 12:00 e 13:00 desconsiderados → ficam vazios
    expect(matrix['12:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    expect(matrix['13:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    // 14-16, 16-18, 18-20, 20-22 pareados
    expect(matrix['14:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 2 })
    expect(matrix['20:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 2 })
    expect(matrix['21:00']!['SEGUNDA']).toMatchObject({ type: 'skip' })
  })

  it('07:00, 12:00 e 13:00 nunca são marcados como livre, mesmo vagos', () => {
    const matrix = markFreeSlots(buildGridMatrix([]))
    for (const dia of ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']) {
      expect(matrix['07:00']![dia]).toMatchObject({ type: 'empty' })
      expect(matrix['12:00']![dia]).toMatchObject({ type: 'empty' })
      expect(matrix['13:00']![dia]).toMatchObject({ type: 'empty' })
    }
  })

  it('08:00 vago não pareia com 07:00 (desconsiderado), fica livre de 1h se 09:00 estiver ocupado', () => {
    const aloc = makeAlocacao({ inicio: '09:00', fim: '10:00', dia_semana: 'SEGUNDA' })
    const matrix = markFreeSlots(buildGridMatrix([aloc]))
    expect(matrix['07:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    expect(matrix['08:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 1 })
  })

  it('14:00 vago não pareia com 13:00 (desconsiderado), fica livre de 1h se 15:00 estiver ocupado', () => {
    const aloc = makeAlocacao({ inicio: '15:00', fim: '16:00', dia_semana: 'SEGUNDA' })
    const matrix = markFreeSlots(buildGridMatrix([aloc]))
    expect(matrix['13:00']!['SEGUNDA']).toMatchObject({ type: 'empty' })
    expect(matrix['14:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 1 })
  })

  it('hora isolada entre duas alocações vira bloco livre de 1h', () => {
    const aloc1 = makeAlocacao({ id: 1, inicio: '08:00', fim: '09:00', dia_semana: 'SEGUNDA' })
    const aloc2 = makeAlocacao({ id: 2, inicio: '10:00', fim: '11:00', dia_semana: 'SEGUNDA' })
    const matrix = markFreeSlots(buildGridMatrix([aloc1, aloc2]))
    expect(matrix['09:00']!['SEGUNDA']).toMatchObject({ type: 'free', rowSpan: 1 })
  })

  it('célula ocupada por alocação não é sobrescrita', () => {
    const aloc = makeAlocacao({ inicio: '08:00', fim: '10:00', dia_semana: 'SEGUNDA' })
    const matrix = markFreeSlots(buildGridMatrix([aloc]))
    expect(matrix['08:00']!['SEGUNDA']).toMatchObject({ type: 'allocation', rowSpan: 2 })
    expect(matrix['09:00']!['SEGUNDA']).toMatchObject({ type: 'skip' })
  })
})

// ── formatFreeRange ───────────────────────────────────────────────────────────

describe('formatFreeRange', () => {
  it('bloco de 2h → "14:00-16:00"', () => {
    expect(formatFreeRange('14:00', 2)).toBe('14:00-16:00')
  })

  it('bloco de 1h → "11:00-12:00"', () => {
    expect(formatFreeRange('11:00', 1)).toBe('11:00-12:00')
  })

  it('hora de início com um dígito → mantém zero à esquerda', () => {
    expect(formatFreeRange('07:00', 2)).toBe('07:00-09:00')
  })

  it('último bloco do dia (21h, 1h) → "21:00-22:00"', () => {
    expect(formatFreeRange('21:00', 1)).toBe('21:00-22:00')
  })
})

// ── isAlocacaoAgora ───────────────────────────────────────────────────────────

describe('isAlocacaoAgora', () => {
  it('dia e horário correspondem ao intervalo → true', () => {
    const aloc = makeAlocacao({ dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    // Segunda-feira, 14:35 (2026-07-27 é segunda-feira)
    const now = new Date(2026, 6, 27, 14, 35)
    expect(isAlocacaoAgora(aloc, now)).toBe(true)
  })

  it('mesmo dia, mas fora do intervalo de horário → false', () => {
    const aloc = makeAlocacao({ dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const now = new Date(2026, 6, 27, 16, 1)
    expect(isAlocacaoAgora(aloc, now)).toBe(false)
  })

  it('horário bate, mas dia da semana diferente → false', () => {
    const aloc = makeAlocacao({ dia_semana: 'TERÇA', inicio: '14:00', fim: '16:00' })
    const now = new Date(2026, 6, 27, 14, 35) // segunda-feira
    expect(isAlocacaoAgora(aloc, now)).toBe(false)
  })

  it('exatamente no horário de início → true (intervalo inclusivo no início)', () => {
    const aloc = makeAlocacao({ dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const now = new Date(2026, 6, 27, 14, 0)
    expect(isAlocacaoAgora(aloc, now)).toBe(true)
  })

  it('exatamente no horário de fim → false (intervalo exclusivo no fim)', () => {
    const aloc = makeAlocacao({ dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const now = new Date(2026, 6, 27, 16, 0)
    expect(isAlocacaoAgora(aloc, now)).toBe(false)
  })

  it('domingo (sem alocações na grade) → sempre false', () => {
    const aloc = makeAlocacao({ dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const now = new Date(2026, 6, 26, 14, 35) // domingo
    expect(isAlocacaoAgora(aloc, now)).toBe(false)
  })
})
