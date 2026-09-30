import { describe, it, expect } from 'vitest'
import { calcularOcupacao, MAX_HORAS_DIA, MAX_HORAS_SEMANA, MAX_HORAS_TURNO_SEMANA } from './occupancyUtils'
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
    curso: 'DC',
    semestre: 0,
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

  it('máximo = 08–12 + 14–18 + 18:30–21:50: 12h/dia, 60h/semana', () => {
    expect(MAX_HORAS_DIA).toBe(12)
    expect(MAX_HORAS_SEMANA).toBe(60)
  })

  it('percentual correto para 2h em 60h → arredondado para 3%', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '10:00' })
    const result = calcularOcupacao([aloc])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    // 2/60 = ~3.33% → arredondado para 3
    expect(sala02.percentual).toBe(3)
  })

  it('alocação no sábado não é considerada no cálculo', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', dia_semana: 'SÁBADO', inicio: '08:00', fim: '12:00' })
    const result = calcularOcupacao([aloc])
    const sala02 = result.salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(0)
    expect(sala02.porDia['SÁBADO']).toBeUndefined()
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

  it('sala 100% ocupada (grade inteira 07:00–21:50, seg-sex) → percentual 100', () => {
    const alocacoes: Alocacao[] = DIAS.map(dia =>
      makeAlocacao({ sala: 'LAB 35', dia_semana: dia, inicio: '07:00', fim: '21:50' })
    )
    const result = calcularOcupacao(alocacoes)
    const lab35 = result.salas.find(s => s.sala === 'LAB 35')!
    // 12h × 5 dias (seg-sex) = 60h → 100%; sábado é ignorado
    expect(lab35.totalHoras).toBe(60)
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
    // Grade inteira em SALA 02 → 100%; todas as demais → 0%
    const alocacoes: Alocacao[] = DIAS.map(dia =>
      makeAlocacao({ sala: 'SALA 02', dia_semana: dia, inicio: '07:00', fim: '21:50' })
    )
    const result = calcularOcupacao(alocacoes)
    // 100 / 13 salas ≈ 7.69% → arredondado para 8
    const expected = Math.round(100 / SALAS.length)
    expect(result.mediaOcupacao).toBe(expected)
  })
})

describe('calcularOcupacao — horário noturno (aulas de 50 min contam 1h)', () => {
  function horas(inicio: string, fim: string, extra: Partial<Alocacao>[] = []): number {
    const alocacoes = [makeAlocacao({ inicio, fim }), ...extra.map((e) => makeAlocacao(e))]
    return calcularOcupacao(alocacoes).salas.find(s => s.sala === 'SALA 02')!.totalHoras
  }

  it('18:30–20:10 conta 2h', () => expect(horas('18:30', '20:10')).toBe(2))
  it('20:10–21:50 conta 2h', () => expect(horas('20:10', '21:50')).toBe(2))
  it('18:30–21:50 conta 4h', () => expect(horas('18:30', '21:50')).toBe(4))
  it('uma aula noturna (18:30–19:20) conta 1h', () => expect(horas('18:30', '19:20')).toBe(1))

  it('18:30–20:10 + 20:10–21:50 somam 4h', () => {
    expect(horas('18:30', '20:10', [{ inicio: '20:10', fim: '21:50' }])).toBe(4)
  })

  it('intervalo que atravessa 18:30 é proporcional e ignora 18:00–18:30 (17:00–19:00 = 1h + 36 min)', () => {
    expect(horas('17:00', '19:00')).toBeCloseTo(1.6)
  })

  it('sobreposição no noturno não conta em dobro (18:30–20:10 + 19:20–21:00 = 18:30–21:00 = 3h)', () => {
    expect(horas('18:30', '20:10', [{ inicio: '19:20', fim: '21:00' }])).toBe(3)
  })

  it('horário diurno conta horas reais só em 08–12 e 14–18', () => {
    expect(horas('07:00', '18:30')).toBe(8)
  })

  it('18:30–21:50 seg-sex → 20h, 33%', () => {
    const alocacoes = DIAS.map((dia) => makeAlocacao({ sala: 'SALA 02', dia_semana: dia, inicio: '18:30', fim: '21:50' }))
    const sala02 = calcularOcupacao(alocacoes).salas.find(s => s.sala === 'SALA 02')!
    expect(sala02.totalHoras).toBe(20)
    expect(sala02.percentual).toBe(33)
  })
})

describe('calcularOcupacao — horários fora do cálculo', () => {
  function horas(inicio: string, fim: string): number {
    return calcularOcupacao([makeAlocacao({ inicio, fim })]).salas.find(s => s.sala === 'SALA 02')!.totalHoras
  }

  it('07:00–08:00 não conta', () => expect(horas('07:00', '08:00')).toBe(0))
  it('12:00–14:00 (almoço) não conta', () => expect(horas('12:00', '14:00')).toBe(0))
  it('18:00–18:30 não conta', () => expect(horas('18:00', '18:30')).toBe(0))
  it('11:00–15:00 conta só 11–12 e 14–15 = 2h', () => expect(horas('11:00', '15:00')).toBe(2))
})

describe('calcularOcupacao — por turno', () => {
  function sala02(alocacoes: Alocacao[]) {
    return calcularOcupacao(alocacoes).salas.find(s => s.sala === 'SALA 02')!
  }

  it('máximo de cada turno = 4h/dia × 5 dias = 20h/semana', () => {
    expect(MAX_HORAS_TURNO_SEMANA).toBe(20)
  })

  it('08:00–12:00 conta só na manhã (4h = 20%)', () => {
    const { porTurno } = sala02([makeAlocacao({ inicio: '08:00', fim: '12:00' })])
    expect(porTurno).toEqual({
      manha: { horas: 4, percentual: 20 },
      tarde: { horas: 0, percentual: 0 },
      noite: { horas: 0, percentual: 0 },
    })
  })

  it('11:00–15:00 → manhã 1h, tarde 1h, noite 0 (almoço fora)', () => {
    const { porTurno } = sala02([makeAlocacao({ inicio: '11:00', fim: '15:00' })])
    expect(porTurno.manha.horas).toBe(1)
    expect(porTurno.tarde.horas).toBe(1)
    expect(porTurno.noite.horas).toBe(0)
  })

  it('18:30–21:50 seg-sex → noite 20h = 100%', () => {
    const { porTurno } = sala02(DIAS.map(dia => makeAlocacao({ dia_semana: dia, inicio: '18:30', fim: '21:50' })))
    expect(porTurno.noite).toEqual({ horas: 20, percentual: 100 })
  })

  it('soma dos turnos = totalHoras, sem contar sobreposição em dobro', () => {
    const sala = sala02([
      makeAlocacao({ inicio: '07:00', fim: '15:00' }),
      makeAlocacao({ inicio: '14:00', fim: '19:20' }),
      makeAlocacao({ dia_semana: 'TERÇA', inicio: '20:10', fim: '21:50' }),
    ])
    const soma = sala.porTurno.manha.horas + sala.porTurno.tarde.horas + sala.porTurno.noite.horas
    expect(soma).toBeCloseTo(sala.totalHoras)
    expect(sala.porTurno).toMatchObject({ manha: { horas: 4 }, tarde: { horas: 4 }, noite: { horas: 3 } })
  })

  it('mediaPorTurno é a média dos percentuais do turno de todas as salas', () => {
    const alocacoes = DIAS.map(dia => makeAlocacao({ dia_semana: dia, inicio: '08:00', fim: '12:00' }))
    const result = calcularOcupacao(alocacoes)
    expect(result.mediaPorTurno).toEqual({ manha: Math.round(100 / SALAS.length), tarde: 0, noite: 0 })
  })
})

describe('calcularOcupacao — lista de salas informada (SAGE Rural)', () => {
  it('usa as salas informadas, com prédio e sem tipo; sala sem alocação fica com 0%', () => {
    const salas = [
      { nome: 'CEAGRI - SALA 01', predio: 'CEAGRI' },
      { nome: 'CEAGRI - SALA 02', predio: 'CEAGRI' },
    ]
    const aloc = makeAlocacao({ sala: 'CEAGRI - SALA 01', inicio: '18:30', fim: '20:10' })
    const result = calcularOcupacao([aloc, makeAlocacao({ sala: 'SALA 02' })], salas)

    expect(result.salas).toHaveLength(2)
    expect(result.salas[0]).toMatchObject({ sala: 'CEAGRI - SALA 01', predio: 'CEAGRI', tipo: undefined, totalHoras: 2 })
    expect(result.salas[1]).toMatchObject({ sala: 'CEAGRI - SALA 02', totalHoras: 0, percentual: 0 })
    expect(result.totalGeralHoras).toBe(2)
  })
})
