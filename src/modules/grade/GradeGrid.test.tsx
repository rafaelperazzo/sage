import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GradeGrid } from './GradeGrid'
import type { Alocacao } from '../../types'

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: '14117 - INTRODUÇÃO À PROGRAMAÇÃO I',
    inicio: '14:00',
    fim: '16:00',
    sala: 'LAB 35',
    dia_semana: 'SEGUNDA',
    professor: 'Péricles Miranda',
    periodo: '2026.2',
    curso: 'BCC',
    semestre: 1,
    ...overrides,
  }
}

describe('GradeGrid — estrutura da grade', () => {
  it('renderiza cabeçalho com abreviações dos dias, incluindo Sábado', () => {
    render(<GradeGrid alocacoes={[makeAlocacao()]} />)
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
  })

  it('sem alocações, exibe mensagem de estado vazio e nenhuma tabela', () => {
    render(<GradeGrid alocacoes={[]} />)
    expect(screen.getByText(/Nenhuma disciplina cadastrada para este semestre/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('oculta linhas de horário 100% vazias', () => {
    const aloc = makeAlocacao({ inicio: '18:00', fim: '19:00', dia_semana: 'SEXTA' })
    render(<GradeGrid alocacoes={[aloc]} />)
    expect(screen.getByText('18:00')).toBeInTheDocument()
    expect(screen.queryByText('07:00')).not.toBeInTheDocument()
    expect(screen.queryByText('21:00')).not.toBeInTheDocument()
  })

  it('mantém visível a linha intermediária de um bloco de 2h (skip)', () => {
    const aloc = makeAlocacao({ inicio: '14:00', fim: '16:00', dia_semana: 'QUARTA' })
    render(<GradeGrid alocacoes={[aloc]} />)
    expect(screen.getByText('14:00')).toBeInTheDocument()
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })
})

describe('GradeGrid — exibição de alocações', () => {
  it('renderiza disciplina, professor e sala na célula', () => {
    const aloc = makeAlocacao()
    render(<GradeGrid alocacoes={[aloc]} />)
    const cell = screen.getByText(aloc.disciplina).closest('td')!
    expect(within(cell).getByText(/Péricles Miranda/i)).toBeInTheDocument()
    expect(within(cell).getByText('LAB 35')).toBeInTheDocument()
  })

  it('renderiza duas alocações em semestres já filtrados (sem duplicar)', () => {
    const alocs = [
      makeAlocacao({ id: 1, disciplina: 'CÁLCULO NI', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' }),
      makeAlocacao({ id: 2, disciplina: 'MATEMÁTICA DISCRETA I', dia_semana: 'QUARTA', inicio: '16:00', fim: '18:00' }),
    ]
    render(<GradeGrid alocacoes={alocs} />)
    expect(screen.getByText('CÁLCULO NI')).toBeInTheDocument()
    expect(screen.getByText('MATEMÁTICA DISCRETA I')).toBeInTheDocument()
  })
})

describe('GradeGrid — interações', () => {
  it('clicar em uma célula abre o modal de detalhes (ViewModal)', async () => {
    const aloc = makeAlocacao({ disciplina: 'REDES I' })
    const user = userEvent.setup()
    render(<GradeGrid alocacoes={[aloc]} />)

    await user.click(screen.getByText('REDES I'))

    expect(screen.getByText('Detalhes da Alocação')).toBeInTheDocument()
  })
})

describe('GradeGrid — rowSpan de alocações multi-hora', () => {
  it('alocação de 2h exibe disciplina apenas uma vez', () => {
    const aloc = makeAlocacao({ disciplina: 'BD AVANÇADO', inicio: '14:00', fim: '16:00', dia_semana: 'TERÇA' })
    render(<GradeGrid alocacoes={[aloc]} />)
    expect(screen.getAllByText('BD AVANÇADO')).toHaveLength(1)
  })
})
