import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Manutencao } from '../../types'
import { ManutencaoSalaInfo } from './ManutencaoSalaInfo'

function makeManutencao(overrides: Partial<Manutencao> = {}): Manutencao {
  return {
    id: 1,
    numero_rt: 'RT-001',
    sala_local: 'SALA 02',
    descricao_problema: 'Ar condicionado com defeito',
    status: 'Aberto',
    data_abertura: '2026-03-01',
    data_conclusao: null,
    observacoes: null,
    ...overrides,
  }
}

describe('ManutencaoSalaInfo', () => {
  it('não renderiza nada durante o carregamento', () => {
    const { container } = render(<ManutencaoSalaInfo manutencoes={[makeManutencao()]} loading />)
    expect(container).toBeEmptyDOMElement()
  })

  it('não renderiza nada quando não há chamados', () => {
    const { container } = render(<ManutencaoSalaInfo manutencoes={[]} loading={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('exibe a descrição do problema do chamado em aberto', () => {
    render(<ManutencaoSalaInfo manutencoes={[makeManutencao()]} loading={false} />)
    expect(screen.getByText(/Ar condicionado com defeito/)).toBeInTheDocument()
    expect(screen.getByText(/Chamado de manutenção em aberto/i)).toBeInTheDocument()
  })

  it('exibe múltiplos chamados quando houver mais de um', () => {
    render(
      <ManutencaoSalaInfo
        manutencoes={[
          makeManutencao({ id: 1, descricao_problema: 'Ar condicionado com defeito' }),
          makeManutencao({ id: 2, descricao_problema: 'Projetor não liga' }),
        ]}
        loading={false}
      />
    )
    expect(screen.getByText(/Ar condicionado com defeito/)).toBeInTheDocument()
    expect(screen.getByText(/Projetor não liga/)).toBeInTheDocument()
  })
})
