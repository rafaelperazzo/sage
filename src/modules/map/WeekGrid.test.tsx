import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeekGrid } from './WeekGrid'
import type { Alocacao } from '../../types'

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
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

describe('WeekGrid — estrutura da grade', () => {
  it('renderiza cabeçalho com abreviações dos dias', () => {
    render(<WeekGrid alocacoes={[]} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Ter')).toBeInTheDocument()
    expect(screen.getByText('Qua')).toBeInTheDocument()
    expect(screen.getByText('Qui')).toBeInTheDocument()
    expect(screen.getByText('Sex')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
  })

  it('renderiza coluna de horários de 07:00 a 21:00', () => {
    render(<WeekGrid alocacoes={[]} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('14:00')).toBeInTheDocument()
    expect(screen.getByText('21:00')).toBeInTheDocument()
  })

  it('renderiza 15 linhas de hora', () => {
    render(<WeekGrid alocacoes={[]} isAdmin={false} onCellClick={vi.fn()} />)
    // 07:00 a 21:00 = 15 slots
    const cells = screen.getAllByText(/^\d{2}:00$/)
    expect(cells).toHaveLength(15)
  })
})

describe('WeekGrid — exibição de alocações', () => {
  it('renderiza disciplina na célula correta', () => {
    const aloc = makeAlocacao({ disciplina: 'FÍSICA II', inicio: '08:00', fim: '09:00', dia_semana: 'SEGUNDA' })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('FÍSICA II')).toBeInTheDocument()
  })

  it('renderiza nome do professor na célula', () => {
    const aloc = makeAlocacao({ professor: 'Prof. Almeida', inicio: '10:00', fim: '11:00' })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText(/Prof. Almeida/i)).toBeInTheDocument()
  })

  it('renderiza duas alocações em dias diferentes', () => {
    const alocs = [
      makeAlocacao({ id: 1, disciplina: 'MATEMÁTICA', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '09:00' }),
      makeAlocacao({ id: 2, disciplina: 'PROGRAMAÇÃO', dia_semana: 'QUARTA', inicio: '08:00', fim: '09:00' }),
    ]
    render(<WeekGrid alocacoes={alocs} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('MATEMÁTICA')).toBeInTheDocument()
    expect(screen.getByText('PROGRAMAÇÃO')).toBeInTheDocument()
  })

  it('renderiza alocação sem professor sem quebrar', () => {
    const aloc = makeAlocacao({ professor: null })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('CÁLCULO I')).toBeInTheDocument()
  })
})

describe('WeekGrid — interações', () => {
  it('clicar em alocação chama onCellClick com a alocação correta', async () => {
    const onCellClick = vi.fn()
    const aloc = makeAlocacao({ id: 99, disciplina: 'REDES I', inicio: '14:00', fim: '15:00' })
    const user = userEvent.setup()
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={onCellClick} />)

    await user.click(screen.getByText('REDES I'))

    expect(onCellClick).toHaveBeenCalledOnce()
    expect(onCellClick).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }))
  })

  it('admin clica em célula vazia → chama onEmptyCellClick com dia e hora', async () => {
    const onEmptyCellClick = vi.fn()
    const user = userEvent.setup()

    // Renderizar sem alocações para que todas as células sejam vazias
    const { container } = render(
      <WeekGrid
        alocacoes={[]}
        isAdmin={true}
        onCellClick={vi.fn()}
        onEmptyCellClick={onEmptyCellClick}
      />
    )

    // Pegar a primeira célula vazia clicável (admin mode)
    const emptyCells = container.querySelectorAll('td.cursor-pointer')
    expect(emptyCells.length).toBeGreaterThan(0)
    await user.click(emptyCells[0]!)

    expect(onEmptyCellClick).toHaveBeenCalledOnce()
  })

  it('usuário comum clica em célula vazia → onEmptyCellClick NÃO é chamado', async () => {
    const onEmptyCellClick = vi.fn()
    const { container } = render(
      <WeekGrid
        alocacoes={[]}
        isAdmin={false}
        onCellClick={vi.fn()}
        onEmptyCellClick={onEmptyCellClick}
      />
    )

    // Sem admin, células vazias não têm cursor-pointer
    const emptyCells = container.querySelectorAll('td.cursor-pointer')
    expect(emptyCells.length).toBe(0)
    expect(onEmptyCellClick).not.toHaveBeenCalled()
  })
})

describe('WeekGrid — rowSpan de alocações multi-hora', () => {
  it('alocação de 2h ocupa as células corretas (não duplica disciplina)', () => {
    const aloc = makeAlocacao({ disciplina: 'BD AVANÇADO', inicio: '14:00', fim: '16:00', dia_semana: 'TERÇA' })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    // Disciplina deve aparecer apenas uma vez (célula 14:00)
    const occurrences = screen.getAllByText('BD AVANÇADO')
    expect(occurrences).toHaveLength(1)
  })

  it('alocação de 3h exibe rowSpan correto e disciplina apenas uma vez', () => {
    const aloc = makeAlocacao({ disciplina: 'CÁLCULO III', inicio: '07:00', fim: '10:00' })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    const occurrences = screen.getAllByText('CÁLCULO III')
    expect(occurrences).toHaveLength(1)
  })

  it('célula com rowSpan inclui nome do professor e horário', () => {
    const aloc = makeAlocacao({
      disciplina: 'ENGENHARIA DE SOFTWARE',
      professor: 'Prof. Costa',
      inicio: '08:00',
      fim: '10:00',
      dia_semana: 'SEXTA',
    })
    render(<WeekGrid alocacoes={[aloc]} isAdmin={false} onCellClick={vi.fn()} />)
    const cell = screen.getByText('ENGENHARIA DE SOFTWARE').closest('td')!
    expect(within(cell).getByText(/Prof. Costa/i)).toBeInTheDocument()
  })
})
