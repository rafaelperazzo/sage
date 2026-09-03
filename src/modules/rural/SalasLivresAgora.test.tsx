import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SalaExternaLivreAgora } from './salasExternasLivresAgora'

vi.mock('../../hooks/useSalasExternasLivresAgora', () => ({ useSalasExternasLivresAgora: vi.fn() }))

const { useSalasExternasLivresAgora } = await import('../../hooks/useSalasExternasLivresAgora')
const mockHook = vi.mocked(useSalasExternasLivresAgora)

const { SalasLivresAgora } = await import('./SalasLivresAgora')

function setup(overrides: Partial<{ visivel: boolean; livres: SalaExternaLivreAgora[] }> = {}) {
  mockHook.mockReturnValue({ visivel: true, livres: [], ...overrides })
}

const props = { salas: ['SALA RURAL 01', 'SALA RURAL 02'], alocacoes: [], loading: false }

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

  it('exibe as salas livres com o horário até quando permanecem livres', () => {
    setup({ livres: [{ sala: 'SALA RURAL 01', livreAte: '16:00' }, { sala: 'SALA RURAL 02', livreAte: '22:00' }] })
    render(<SalasLivresAgora {...props} />)
    expect(screen.getByText('SALA RURAL 01')).toBeInTheDocument()
    expect(screen.getByText(/Livre até as 16:00/)).toBeInTheDocument()
    expect(screen.getByText('SALA RURAL 02')).toBeInTheDocument()
    expect(screen.getByText(/Livre até as 22:00/)).toBeInTheDocument()
  })
})
