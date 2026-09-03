import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SalaExternaLivreAgora } from './salasExternasLivresAgora'

vi.mock('../../hooks/useSalasExternasLivresAgora', () => ({ useSalasExternasLivresAgora: vi.fn() }))

const { useSalasExternasLivresAgora } = await import('../../hooks/useSalasExternasLivresAgora')
const mockHook = vi.mocked(useSalasExternasLivresAgora)

const { SalasLivresAgora } = await import('./SalasLivresAgora')

function setup(overrides: Partial<{ visivel: boolean; livres: SalaExternaLivreAgora[] }> = {}) {
  mockHook.mockReturnValue({ visivel: true, livres: [], ...overrides })
}

const props = { salas: ['PREDIO A - SALA 01', 'PREDIO A - SALA 02'], alocacoes: [], loading: false }

describe('SalasLivresAgora', () => {
  it('exibe "Carregando" enquanto os dados carregam', () => {
    setup()
    render(<SalasLivresAgora {...props} loading />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('fora da janela de exibição (08h-22h, seg-sex) → exibe mensagem informativa', () => {
    setup({ visivel: false })
    render(<SalasLivresAgora {...props} />)
    expect(screen.getByText(/segunda a sexta, das 08:00 às 22:00/i)).toBeInTheDocument()
  })

  it('sem nenhuma sala livre → exibe mensagem de indisponibilidade', () => {
    setup({ livres: [] })
    render(<SalasLivresAgora {...props} />)
    expect(screen.getByText('Nenhuma sala externa disponível no momento.')).toBeInTheDocument()
  })

  it('exibe as salas livres (sem o prefixo do prédio) com o horário até quando permanecem livres', () => {
    setup({ livres: [{ sala: 'PREDIO A - SALA 01', livreAte: '16:00' }, { sala: 'PREDIO A - SALA 02', livreAte: '22:00' }] })
    render(<SalasLivresAgora {...props} />)
    expect(screen.getByText('SALA 01')).toBeInTheDocument()
    expect(screen.getByText(/Livre até as 16:00/)).toBeInTheDocument()
    expect(screen.getByText('SALA 02')).toBeInTheDocument()
    expect(screen.getByText(/Livre até as 22:00/)).toBeInTheDocument()
  })
})

describe('SalasLivresAgora — agrupamento por prédio', () => {
  const salas = ['PREDIO B - SALA 01', 'PREDIO A - SALA 02', 'PREDIO A - SALA 01']

  it('exibe select com os prédios em ordem alfabética, prédio A selecionado por padrão', () => {
    setup()
    render(<SalasLivresAgora salas={salas} alocacoes={[]} loading={false} />)

    const select = screen.getByRole('combobox')
    expect(screen.getByRole('option', { name: 'PREDIO A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'PREDIO B' })).toBeInTheDocument()
    expect(select).toHaveValue('PREDIO A')
  })

  it('passa ao hook apenas as salas do prédio selecionado por padrão', () => {
    setup()
    render(<SalasLivresAgora salas={salas} alocacoes={[]} loading={false} />)

    expect(mockHook).toHaveBeenLastCalledWith(['PREDIO A - SALA 02', 'PREDIO A - SALA 01'], [])
  })

  it('trocar o prédio no select passa ao hook apenas as salas do novo prédio', () => {
    setup()
    render(<SalasLivresAgora salas={salas} alocacoes={[]} loading={false} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PREDIO B' } })

    expect(mockHook).toHaveBeenLastCalledWith(['PREDIO B - SALA 01'], [])
  })

  it('sem nenhuma sala cadastrada → não exibe o select de prédio', () => {
    setup()
    render(<SalasLivresAgora salas={[]} alocacoes={[]} loading={false} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('usuário consegue selecionar o prédio via interação de teclado/mouse', async () => {
    const user = userEvent.setup()
    setup()
    render(<SalasLivresAgora salas={salas} alocacoes={[]} loading={false} />)

    await user.selectOptions(screen.getByRole('combobox'), 'PREDIO B')

    expect(screen.getByRole('combobox')).toHaveValue('PREDIO B')
  })
})
