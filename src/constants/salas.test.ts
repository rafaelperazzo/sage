import { describe, it, expect } from 'vitest'
import { SALAS, DIAS, HORAS, LIMITES, getSalaInfo } from './salas'

function toMinutes(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

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

// ── LIMITES / HORAS ─────────────────────────────────────────────────────────────

describe('LIMITES', () => {
  it('começa em 07:00 e termina em 22:00', () => {
    expect(LIMITES[0]).toBe('07:00')
    expect(LIMITES[LIMITES.length - 1]).toBe('22:00')
  })

  it('é estritamente crescente (sem marcos duplicados ou fora de ordem)', () => {
    for (let i = 1; i < LIMITES.length; i++) {
      expect(toMinutes(LIMITES[i]!)).toBeGreaterThan(toMinutes(LIMITES[i - 1]!))
    }
  })

  it('inclui os marcos horários legados do período noturno (19:00, 20:00, 21:00)', () => {
    expect(LIMITES).toContain('19:00')
    expect(LIMITES).toContain('20:00')
    expect(LIMITES).toContain('21:00')
  })

  it('inclui os marcos reais das aulas noturnas de 50min', () => {
    expect(LIMITES).toEqual(expect.arrayContaining(['18:30', '19:20', '20:10', '21:50']))
  })
})

describe('HORAS', () => {
  it('tem exatamente 19 slots (todos os marcos de LIMITES exceto o último)', () => {
    expect(HORAS).toHaveLength(19)
    expect(HORAS).toEqual(LIMITES.slice(0, -1))
  })

  it('começa em 07:00', () => {
    expect(HORAS[0]).toBe('07:00')
  })

  it('termina em 21:50 (início da última linha da grade)', () => {
    expect(HORAS[HORAS.length - 1]).toBe('21:50')
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
