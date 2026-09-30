import { describe, it, expect } from 'vitest'
import type { Alocacao } from '../../types'
import {
  mesmaDisciplina,
  outrasAlocacoesDaDisciplina,
  comCamposDaDisciplina,
  conflitoAlocacoes,
  paraInput,
} from './alocacoesDisciplinaUtils'

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
    semestre: 1,
    ...overrides,
  }
}

describe('mesmaDisciplina', () => {
  it('compara nome, professor e curso ignorando caixa e espaços', () => {
    const a = makeAlocacao()
    expect(mesmaDisciplina(a, makeAlocacao({ disciplina: ' cálculo i ', professor: 'PROF. SILVA ', curso: 'dc' }))).toBe(true)
  })

  it('professor null equivale a vazio', () => {
    expect(mesmaDisciplina(makeAlocacao({ professor: null }), makeAlocacao({ professor: '' }))).toBe(true)
  })

  it('curso ou professor diferente não é a mesma disciplina', () => {
    const a = makeAlocacao()
    expect(mesmaDisciplina(a, makeAlocacao({ curso: 'BCC' }))).toBe(false)
    expect(mesmaDisciplina(a, makeAlocacao({ professor: 'Prof. Costa' }))).toBe(false)
  })
})

describe('outrasAlocacoesDaDisciplina', () => {
  it('retorna as outras da disciplina (de qualquer sala) ordenadas por dia e início, sem o alvo', () => {
    const alvo = makeAlocacao({ id: 1, dia_semana: 'QUARTA' })
    const sexta = makeAlocacao({ id: 2, dia_semana: 'SEXTA' })
    const segundaTarde = makeAlocacao({ id: 3, dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00', sala: 'LAB 35' })
    const segundaManha = makeAlocacao({ id: 4, dia_semana: 'SEGUNDA' })
    const outraDisciplina = makeAlocacao({ id: 5, disciplina: 'FÍSICA I' })
    const outroCurso = makeAlocacao({ id: 6, curso: 'BCC' })

    const result = outrasAlocacoesDaDisciplina(alvo, [alvo, sexta, segundaTarde, segundaManha, outraDisciplina, outroCurso])
    expect(result.map((a) => a.id)).toEqual([4, 3, 2])
  })
})

describe('comCamposDaDisciplina', () => {
  it('copia disciplina, professor, curso e sala, mantendo dia e horário', () => {
    const outra = makeAlocacao({ id: 2, dia_semana: 'QUARTA', inicio: '10:00', fim: '12:00' })
    const input = { ...paraInput(makeAlocacao()), disciplina: 'CÁLCULO II', professor: null, curso: 'BCC', sala: 'LAB 35', dia_semana: 'SEXTA', inicio: '14:00' }
    expect(comCamposDaDisciplina(outra, input)).toEqual({
      ...outra,
      disciplina: 'CÁLCULO II',
      professor: null,
      curso: 'BCC',
      sala: 'LAB 35',
    })
  })
})

describe('conflitoAlocacoes', () => {
  it('sem conflito retorna null', () => {
    const linha = makeAlocacao({ id: 1, sala: 'LAB 35' })
    expect(conflitoAlocacoes([linha], [makeAlocacao({ id: 1 }), makeAlocacao({ id: 9, dia_semana: 'TERÇA', sala: 'LAB 35' })])).toBeNull()
  })

  it('detecta conflito na nova sala nomeando a alocação que ocupa', () => {
    const ocupante = makeAlocacao({ id: 9, disciplina: 'REDES', professor: 'Prof. Lima', sala: 'LAB 35', dia_semana: 'QUARTA', inicio: '09:00', fim: '11:00' })
    const linhas = [
      makeAlocacao({ id: 1, sala: 'LAB 35' }),
      makeAlocacao({ id: 2, sala: 'LAB 35', dia_semana: 'QUARTA' }),
    ]
    expect(conflitoAlocacoes(linhas, [ocupante])).toBe(
      'Conflito de horário: QUARTA 08:00–10:00 · LAB 35 já está ocupado por REDES — Prof. Lima (09:00–11:00).'
    )
  })

  it('ignora as próprias alocações sendo alteradas (valores antigos)', () => {
    const antiga = makeAlocacao({ id: 1 })
    expect(conflitoAlocacoes([makeAlocacao({ id: 1, inicio: '09:00', fim: '11:00' })], [antiga])).toBeNull()
  })

  it('detecta conflito entre as próprias alocações do lote', () => {
    const linhas = [
      makeAlocacao({ id: 1, sala: 'LAB 35' }),
      makeAlocacao({ id: 2, sala: 'LAB 35', inicio: '09:00', fim: '11:00' }),
    ]
    expect(conflitoAlocacoes(linhas, [])).toMatch(/entre as alocações selecionadas/)
  })
})
