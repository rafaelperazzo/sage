import { describe, it, expect } from 'vitest'
import { calcularOcupacao } from './occupancyUtils'
import { SALAS, DIAS } from '../../constants/salas'
import type { Alocacao } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

let _nextId = 1
function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: _nextId++,
    disciplina: 'DISCIPLINA TESTE',
    inicio: '08:00',
    fim: '09:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.1',
    ...overrides,
  }
}

// ── calcularOcupacao ──────────────────────────────────────────────────────────

describe('calcularOcupacao', () => {
  it('array vazio → totais zerados', () => {
    const result = calcularOcupacao([])
    expect(result.totalGeralHoras).toBe(0)
    expect(result.mediaOcupacao).toBe(0)
    result.salas.forEach(s => {
      expect(s.totalHoras).toBe(0)
      expect(s.percentual).toBe(0)
    })
  })

  it('retorna uma entrada para cada sala cadastrada', () => {
    const result = calcularOcupacao([])
    expect(result.salas).toHaveLength(SALAS.length)
    const nomes = result.salas.map(s => s.sala)
    SALAS.forEach(s => expect(nomes).toContain(s.nome))
  })

  it('1 alocação de 1h → sala com totalHoras 1', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    const result = calcularOcupacao([aloc])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(1)
    expect(sala02.porDia['SEGUNDA']).toBe(1)
  })

  it('percentual correto para 1h em 72h → arredondado para 1%', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '09:00' })
    const result = calcularOcupacao([aloc])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    // 1/72 = ~1.39% → arredondado para 1
    expect(sala02.percentual).toBe(1)
  })

  it('2 alocações sem sobreposição → soma simples das horas', () => {
    const aloc1 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    const aloc2 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '15:00', fim: '16:00' })
    const result = calcularOcupacao([aloc1, aloc2])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(2)
    expect(sala02.porDia['SEGUNDA']).toBe(2)
  })

  it('2 alocações com sobreposição exata → merge evita dupla contagem', () => {
    const aloc1 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const aloc2 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    const result = calcularOcupacao([aloc1, aloc2])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(2) // não 4
  })

  it('2 alocações com sobreposição parcial → merge conta apenas o intervalo unido', () => {
    // 14:00–15:30 + 15:00–16:00 → merged = 14:00–16:00 = 2h
    const aloc1 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:30' })
    const aloc2 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '15:00', fim: '16:00' })
    const result = calcularOcupacao([aloc1, aloc2])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(2)
  })

  it('alocação em sala desconhecida → não afeta nenhuma sala cadastrada', () => {
    const aloc = makeAlocacao({ sala: 'SALA INEXISTENTE', inicio: '08:00', fim: '10:00' })
    const result = calcularOcupacao([aloc])
    expect(result.totalGeralHoras).toBe(0)
  })

  it('sala 100% ocupada (72h/semana) → percentual 100', () => {
    const alocacoes: Alocacao[] = DIAS.map(dia =>
      makeAlocacao({ sala: 'LAB 35', dia_semana: dia, inicio: '07:00', fim: '19:00' })
    )
    const result = calcularOcupacao(alocacoes)
    const lab35 = result.salas.find(s => s.sala === 'LAB 35')!
    // 12h × 6 dias = 72h → percentual exato de 100%
    expect(lab35.totalHoras).toBe(72)
    expect(lab35.percentual).toBe(100)
  })

  it('distribui horas corretamente pelo porDia', () => {
    const aloc1 = makeAlocacao({ sala: 'SALA 03', dia_semana: 'TERÇA', inicio: '08:00', fim: '10:00' })
    const aloc2 = makeAlocacao({ sala: 'SALA 03', dia_semana: 'QUINTA', inicio: '14:00', fim: '16:00' })
    const result = calcularOcupacao([aloc1, aloc2])
    const sala03 = result.salas.find(s => s.sala === 'SALA 03')!
    expect(sala03.porDia['TERÇA']).toBe(2)
    expect(sala03.porDia['QUINTA']).toBe(2)
    expect(sala03.porDia['SEGUNDA']).toBe(0)
    expect(sala03.totalHoras).toBe(4)
  })

  it('alocações em salas diferentes não se misturam', () => {
    const aloc1 = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '10:00' })
    const aloc2 = makeAlocacao({ sala: 'SALA 03', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '10:00' })
    const result = calcularOcupacao([aloc1, aloc2])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    const sala03 = result.salas.find(s => s.sala === 'SALA 03')!
    expect(sala02.totalHoras).toBe(2)
    expect(sala03.totalHoras).toBe(2)
  })

  it('totalGeralHoras soma todas as salas', () => {
    const aloc1 = makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '10:00' }) // 2h
    const aloc2 = makeAlocacao({ sala: 'LAB 35', inicio: '14:00', fim: '15:00' })  // 1h
    const result = calcularOcupacao([aloc1, aloc2])
    expect(result.totalGeralHoras).toBe(3)
  })

  it('mediaOcupacao é a média dos percentuais de todas as salas', () => {
    // 72h em SALA 02 → 100%; todas as demais → 0%
    const alocacoes: Alocacao[] = DIAS.map(dia =>
      makeAlocacao({ sala: 'SALA 02', dia_semana: dia, inicio: '07:00', fim: '19:00' })
    )
    const result = calcularOcupacao(alocacoes)
    // 100 / 13 salas ≈ 7.69% → arredondado para 8
    const expected = Math.round(100 / SALAS.length)
    expect(result.mediaOcupacao).toBe(expected)
  })
})
