import { describe, it, expect } from 'vitest'
import { SALAS, DIAS, HORAS, getSalaInfo } from './salas'

// ── getSalaInfo ───────────────────────────────────────────────────────────────

describe('getSalaInfo', () => {
  it('retorna informações corretas para sala de aula', () => {
    expect(getSalaInfo('SALA 02')).toEqual({ nome: 'SALA 02', tipo: 'sala_aula' })
  })

  it('retorna informações corretas para laboratório', () => {
    expect(getSalaInfo('LAB 35')).toEqual({ nome: 'LAB 35', tipo: 'laboratorio' })
  })

  it('retorna informações corretas para sala de inovação', () => {
    expect(getSalaInfo('SALA 40')).toEqual({ nome: 'SALA 40', tipo: 'sala_inovacao' })
  })

  it('retorna informações corretas para lab com nome composto', () => {
    expect(getSalaInfo('LAB CEAGRI I - 10')).toEqual({ nome: 'LAB CEAGRI I - 10', tipo: 'laboratorio' })
  })

  it('retorna undefined para sala inexistente', () => {
    expect(getSalaInfo('SALA INEXISTENTE')).toBeUndefined()
  })

  it('é case-sensitive — lowercase não encontra', () => {
    expect(getSalaInfo('sala 02')).toBeUndefined()
  })

  it('é case-sensitive — parcialmente maiúsculo não encontra', () => {
    expect(getSalaInfo('Sala 02')).toBeUndefined()
  })
})

// ── HORAS ─────────────────────────────────────────────────────────────────────

describe('HORAS', () => {
  it('tem exatamente 15 slots (07:00 a 21:00)', () => {
    expect(HORAS).toHaveLength(15)
  })

  it('começa em 07:00', () => {
    expect(HORAS[0]).toBe('07:00')
  })

  it('termina em 21:00', () => {
    expect(HORAS[HORAS.length - 1]).toBe('21:00')
  })

  it('todos os slots estão no formato HH:00', () => {
    HORAS.forEach(h => {
      expect(h).toMatch(/^\d{2}:00$/)
    })
  })

  it('slots são consecutivos de hora em hora', () => {
    for (let i = 1; i < HORAS.length; i++) {
      const prev = parseInt(HORAS[i - 1]!.split(':')[0]!, 10)
      const curr = parseInt(HORAS[i]!.split(':')[0]!, 10)
      expect(curr - prev).toBe(1)
    }
  })
})

// ── DIAS ──────────────────────────────────────────────────────────────────────

describe('DIAS', () => {
  it('tem exatamente 6 dias', () => {
    expect(DIAS).toHaveLength(6)
  })

  it('começa na SEGUNDA', () => {
    expect(DIAS[0]).toBe('SEGUNDA')
  })

  it('termina no SÁBADO (com acento)', () => {
    expect(DIAS[DIAS.length - 1]).toBe('SÁBADO')
  })

  it('contém todos os dias úteis esperados', () => {
    const expected = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
    expected.forEach(dia => expect(DIAS).toContain(dia))
  })

  it('não contém DOMINGO', () => {
    expect(DIAS).not.toContain('DOMINGO')
  })
})

// ── SALAS ─────────────────────────────────────────────────────────────────────

describe('SALAS', () => {
  it('tem 13 salas cadastradas', () => {
    expect(SALAS).toHaveLength(13)
  })

  it('cada sala tem nome e tipo definidos', () => {
    SALAS.forEach(s => {
      expect(s.nome).toBeTruthy()
      expect(['sala_aula', 'sala_inovacao', 'laboratorio']).toContain(s.tipo)
    })
  })

  it('não há nomes duplicados', () => {
    const nomes = SALAS.map(s => s.nome)
    const unicos = new Set(nomes)
    expect(unicos.size).toBe(nomes.length)
  })
})
