import { describe, it, expect } from 'vitest'
import type { Alocacao } from '../../types'
import { agruparDisciplinas } from './listaDisciplinasUtils'

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '10:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Silva',
    periodo: '2026.1',
    curso: 'BCC',
    semestre: 1,
    ...overrides,
  }
}

describe('agruparDisciplinas', () => {
  it('agrupa sessões da mesma disciplina e professor em um único registro', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' }),
      makeAlocacao({ id: 2, dia_semana: 'QUINTA', inicio: '16:00', fim: '18:00' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado).toHaveLength(1)
    expect(resultado[0]!.sessoes).toHaveLength(2)
  })

  it('mantém disciplinas com o mesmo nome mas professores diferentes como registros separados', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, professor: 'Prof. A' }),
      makeAlocacao({ id: 2, professor: 'Prof. B' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado).toHaveLength(2)
  })

  it('exclui alocações dos cursos BSI e DCC', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, curso: 'BSI' }),
      makeAlocacao({ id: 2, curso: 'DCC' }),
      makeAlocacao({ id: 3, curso: 'BCC' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado).toHaveLength(1)
    expect(resultado[0]!.curso).toBe('BCC')
  })

  it('separa em linhas diferentes quando o mesmo par disciplina+professor atende cursos diferentes', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, curso: 'BCC', semestre: 1 }),
      makeAlocacao({ id: 2, curso: 'LC', semestre: 2, dia_semana: 'QUARTA' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado).toHaveLength(2)
    expect(resultado.map((d) => d.curso)).toEqual(['BCC', 'LC'])
    expect(resultado.map((d) => d.semestre)).toEqual([1, 2])
  })

  it('ordena o resultado alfabeticamente pelo nome da disciplina', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, disciplina: 'ZOOLOGIA COMPUTACIONAL' }),
      makeAlocacao({ id: 2, disciplina: 'ÁLGEBRA LINEAR' }),
      makeAlocacao({ id: 3, disciplina: 'BANCO DE DADOS' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado.map((d) => d.disciplina)).toEqual([
      'ÁLGEBRA LINEAR',
      'BANCO DE DADOS',
      'ZOOLOGIA COMPUTACIONAL',
    ])
  })

  it('ordena ignorando o código numérico que prefixa o nome da disciplina', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, disciplina: '06214 - ALGORITMOS E ESTRUTURAS DE DADOS' }),
      makeAlocacao({ id: 2, disciplina: '14088 - BANCO DE DADOS' }),
      makeAlocacao({ id: 3, disciplina: '05139 - FUNDAMENTOS FILOSÓFICOS' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado.map((d) => d.disciplina)).toEqual([
      '06214 - ALGORITMOS E ESTRUTURAS DE DADOS',
      '14088 - BANCO DE DADOS',
      '05139 - FUNDAMENTOS FILOSÓFICOS',
    ])
  })

  it('ordena as sessões de cada disciplina por dia da semana e horário', () => {
    const alocacoes = [
      makeAlocacao({ id: 1, dia_semana: 'SEXTA', inicio: '16:00', fim: '18:00' }),
      makeAlocacao({ id: 2, dia_semana: 'TERÇA', inicio: '14:00', fim: '16:00' }),
    ]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado[0]!.sessoes.map((s) => s.dia_semana)).toEqual(['TERÇA', 'SEXTA'])
  })

  it('não duplica sessões idênticas repetidas na fonte de dados', () => {
    const alocacoes = [makeAlocacao({ id: 1 }), makeAlocacao({ id: 2 })]

    const resultado = agruparDisciplinas(alocacoes)

    expect(resultado[0]!.sessoes).toHaveLength(1)
  })
})
