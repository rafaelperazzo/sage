import { describe, it, expect } from 'vitest'
import {
  diaSemanaDeData,
  formatarData,
  formatarDataCurta,
  proximaDataDoDia,
  reservasNoBloco,
  conflitoReservaPontual,
  alocacaoConflitaComReserva,
  mensagemConflitoReserva,
} from './reservasPontuaisUtils'
import { dataISO, getOcupacoesDoDia } from './gridUtils'
import type { Alocacao, AlocacaoInput, ReservaPontual, ReservaPontualInput } from '../../types'

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '10:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Silva',
    periodo: '2026.2',
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

function makeReserva(overrides: Partial<ReservaPontual> = {}): ReservaPontual {
  return {
    id: 10,
    disciplina: 'PALESTRA',
    professor: 'Prof. Souza',
    data: '2026-10-05', // segunda-feira
    inicio: '14:00',
    fim: '16:00',
    sala: 'SALA 02',
    modulo: 'map',
    ...overrides,
  }
}

function makeInput(overrides: Partial<ReservaPontualInput> = {}): ReservaPontualInput {
  const { id: _id, ...rest } = makeReserva(overrides)
  return rest
}

describe('datas', () => {
  it('diaSemanaDeData usa o fuso local', () => {
    expect(diaSemanaDeData('2026-10-05')).toBe('SEGUNDA')
    expect(diaSemanaDeData('2026-10-09')).toBe('SEXTA')
    expect(diaSemanaDeData('2026-10-10')).toBe('SÁBADO')
    expect(diaSemanaDeData('2026-10-11')).toBeUndefined() // domingo
  })

  it('formata datas', () => {
    expect(formatarData('2026-10-05')).toBe('05/10/2026')
    expect(formatarDataCurta('2026-10-05')).toBe('05/10')
  })

  it('dataISO formata a data local', () => {
    expect(dataISO(new Date(2026, 0, 7, 23, 59))).toBe('2026-01-07')
  })

  it('proximaDataDoDia retorna hoje quando coincide, senão a próxima ocorrência', () => {
    const terca = new Date(2026, 8, 29, 10, 0) // terça 29/09/2026
    expect(proximaDataDoDia('TERÇA', terca)).toBe('2026-09-29')
    expect(proximaDataDoDia('QUARTA', terca)).toBe('2026-09-30')
    expect(proximaDataDoDia('SEGUNDA', terca)).toBe('2026-10-05')
  })
})

describe('reservasNoBloco', () => {
  it('retorna reservas do dia da semana sobrepostas ao bloco, ordenadas por data', () => {
    const r1 = makeReserva({ id: 1, data: '2026-10-12' })
    const r2 = makeReserva({ id: 2, data: '2026-10-05', inicio: '15:00', fim: '16:00' })
    const outroDia = makeReserva({ id: 3, data: '2026-10-06' })
    const outroHorario = makeReserva({ id: 4, inicio: '08:00', fim: '10:00' })
    expect(reservasNoBloco([r1, r2, outroDia, outroHorario], 'SEGUNDA', '14:00', '16:00')).toEqual([r2, r1])
  })

  it('fim == início do bloco não conta como sobreposição', () => {
    expect(reservasNoBloco([makeReserva({ inicio: '12:00', fim: '14:00' })], 'SEGUNDA', '14:00', '16:00')).toEqual([])
  })
})

describe('conflitoReservaPontual', () => {
  it('sem conflitos → null', () => {
    expect(conflitoReservaPontual(makeInput(), [makeAlocacao()], [])).toBeNull()
  })

  it('conflita com alocação da sala no mesmo dia da semana', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '16:00', disciplina: 'REDES' })
    expect(conflitoReservaPontual(makeInput(), [aloc], [])).toMatch(/Conflito com a alocação REDES/)
  })

  it('alocação em outro dia da semana ou outra sala não conflita', () => {
    const outroDia = makeAlocacao({ inicio: '14:00', fim: '16:00', dia_semana: 'TERÇA' })
    const outraSala = makeAlocacao({ inicio: '14:00', fim: '16:00', sala: 'SALA 03' })
    expect(conflitoReservaPontual(makeInput(), [outroDia, outraSala], [])).toBeNull()
  })

  it('conflita com outra reserva da mesma sala e data', () => {
    const existente = makeReserva({ id: 99, inicio: '15:00', fim: '17:00' })
    expect(conflitoReservaPontual(makeInput(), [], [existente])).toMatch(/Conflito com a reserva pontual PALESTRA de 05\/10\/2026/)
  })

  it('reserva em outra data não conflita', () => {
    const existente = makeReserva({ id: 99, data: '2026-10-12' })
    expect(conflitoReservaPontual(makeInput(), [], [existente])).toBeNull()
  })

  it('ignora a própria reserva na edição (excludeId)', () => {
    const existente = makeReserva({ id: 99 })
    expect(conflitoReservaPontual(makeInput(), [], [existente], 99)).toBeNull()
  })
})

describe('alocacaoConflitaComReserva', () => {
  const input: AlocacaoInput = {
    disciplina: 'REDES', professor: null, curso: 'BCC', dia_semana: 'SEGUNDA', sala: 'SALA 02', inicio: '14:00', fim: '16:00',
  }

  it('retorna a reserva na mesma sala, dia da semana e horário', () => {
    const r = makeReserva()
    expect(alocacaoConflitaComReserva(input, [r])).toBe(r)
  })

  it('outra sala, dia ou horário → undefined', () => {
    expect(alocacaoConflitaComReserva(input, [makeReserva({ sala: 'SALA 03' })])).toBeUndefined()
    expect(alocacaoConflitaComReserva(input, [makeReserva({ data: '2026-10-06' })])).toBeUndefined()
    expect(alocacaoConflitaComReserva(input, [makeReserva({ inicio: '16:00', fim: '18:00' })])).toBeUndefined()
  })

  it('mensagem identifica a reserva', () => {
    expect(mensagemConflitoReserva(makeReserva())).toBe(
      'Conflito com a reserva pontual: PALESTRA — Prof. Souza em Segunda-feira, 05/10/2026, 14:00–16:00.'
    )
  })
})

describe('getOcupacoesDoDia', () => {
  it('junta alocações do dia da semana e reservas da data, ordenadas', () => {
    const now = new Date(2026, 9, 5, 9, 0) // segunda 05/10/2026
    const aloc = makeAlocacao({ inicio: '10:00', fim: '12:00' })
    const reservaHoje = makeReserva({ inicio: '08:00', fim: '09:00' })
    const reservaOutraData = makeReserva({ id: 11, data: '2026-10-12' })
    const result = getOcupacoesDoDia('SALA 02', [aloc], [reservaHoje, reservaOutraData], now)
    expect(result.map((o) => o.inicio)).toEqual(['08:00', '10:00'])
  })
})
