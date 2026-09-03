import { describe, it, expect } from 'vitest'
import { getSalasExternasLivresAgora, getPredioDaSala, getNomeSalaSemPredio, getPredios } from './salasExternasLivresAgora'
import type { Alocacao } from '../../types'

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'AGRONOMIA I',
    inicio: '10:00',
    fim: '12:00',
    sala: 'SALA RURAL 01',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.1',
    curso: 'AGRO',
    semestre: 0,
    ...overrides,
  }
}

describe('getSalasExternasLivresAgora', () => {
  it('sala sem nenhuma alocação hoje → livre até o fim do expediente (22:00)', () => {
    const now = new Date(2026, 6, 27, 14, 0) // segunda-feira
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [], now)
    expect(result).toEqual([{ sala: 'SALA RURAL 01', livreAte: '22:00' }])
  })

  it('sala ocupada agora → não aparece no resultado', () => {
    const aloc = makeAlocacao({ inicio: '13:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    const now = new Date(2026, 6, 27, 14, 0)
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [aloc], now)
    expect(result).toEqual([])
  })

  it('sala livre agora, com próxima aula hoje → livre até o início dela', () => {
    const aloc = makeAlocacao({ inicio: '16:00', fim: '18:00', dia_semana: 'SEGUNDA' })
    const now = new Date(2026, 6, 27, 14, 0)
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [aloc], now)
    expect(result).toEqual([{ sala: 'SALA RURAL 01', livreAte: '16:00' }])
  })

  it('ignora alocações de outros dias da semana', () => {
    const aloc = makeAlocacao({ inicio: '13:00', fim: '15:00', dia_semana: 'TERÇA' })
    const now = new Date(2026, 6, 27, 14, 0) // segunda-feira
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [aloc], now)
    expect(result).toEqual([{ sala: 'SALA RURAL 01', livreAte: '22:00' }])
  })

  it('ignora alocações de outras salas', () => {
    const aloc = makeAlocacao({ sala: 'SALA RURAL 02', inicio: '13:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    const now = new Date(2026, 6, 27, 14, 0)
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [aloc], now)
    expect(result).toEqual([{ sala: 'SALA RURAL 01', livreAte: '22:00' }])
  })

  it('domingo (fora da grade) → nenhuma sala livre', () => {
    const now = new Date(2026, 6, 26, 14, 0) // domingo
    const result = getSalasExternasLivresAgora(['SALA RURAL 01'], [], now)
    expect(result).toEqual([])
  })

  it('múltiplas salas: filtra as ocupadas e mantém as livres, cada uma com seu próprio "livre até"', () => {
    const alocs = [
      makeAlocacao({ sala: 'SALA RURAL 01', inicio: '13:00', fim: '15:00', dia_semana: 'SEGUNDA' }),
      makeAlocacao({ sala: 'SALA RURAL 02', inicio: '16:30', fim: '18:00', dia_semana: 'SEGUNDA' }),
    ]
    const now = new Date(2026, 6, 27, 14, 0)
    const result = getSalasExternasLivresAgora(['SALA RURAL 01', 'SALA RURAL 02', 'SALA RURAL 03'], alocs, now)
    expect(result).toEqual([
      { sala: 'SALA RURAL 02', livreAte: '16:30' },
      { sala: 'SALA RURAL 03', livreAte: '22:00' },
    ])
  })
})

describe('getPredioDaSala', () => {
  it('extrai o prédio do padrão "PREDIO - SALA XX"', () => {
    expect(getPredioDaSala('PREDIO A - SALA 01')).toBe('PREDIO A')
  })

  it('sem separador " - " → retorna o nome inteiro como prédio', () => {
    expect(getPredioDaSala('SALA RURAL 01')).toBe('SALA RURAL 01')
  })
})

describe('getNomeSalaSemPredio', () => {
  it('remove o prefixo do prédio', () => {
    expect(getNomeSalaSemPredio('PREDIO A - SALA 01')).toBe('SALA 01')
  })

  it('sem separador " - " → retorna o nome inteiro', () => {
    expect(getNomeSalaSemPredio('SALA RURAL 01')).toBe('SALA RURAL 01')
  })
})

describe('getPredios', () => {
  it('lista prédios únicos em ordem alfabética', () => {
    const salas = ['PREDIO B - SALA 01', 'PREDIO A - SALA 02', 'PREDIO A - SALA 01', 'PREDIO B - SALA 02']
    expect(getPredios(salas)).toEqual(['PREDIO A', 'PREDIO B'])
  })

  it('lista vazia → retorna lista vazia', () => {
    expect(getPredios([])).toEqual([])
  })
})
