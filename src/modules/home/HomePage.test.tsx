import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test/renderWithRouter'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('exibe o título SAGE', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE' })).toBeInTheDocument()
  })

  it('exibe o subtítulo com nome do departamento', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByText(/Departamento de Computação/i)).toBeInTheDocument()
  })

  it('exibe card do SAGE Map', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Map' })).toBeInTheDocument()
  })

  it('exibe card do SAGE Agenda', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Agenda' })).toBeInTheDocument()
  })

  it('exibe card do SAGE Report', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Report' })).toBeInTheDocument()
  })

  it('exibe card do SAGE Grade', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Grade' })).toBeInTheDocument()
  })

  it('exibe card do SAGE Auditório', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Auditório' })).toBeInTheDocument()
  })

  it('exibe card do SAGE Manutenção', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Manutenção' })).toBeInTheDocument()
  })

  it('exibe 6 links "Acessar"', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getAllByText(/Acessar →/i)).toHaveLength(6)
  })

  it('link do SAGE Map aponta para /map', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Map/i })
    expect(link).toHaveAttribute('href', '/map')
  })

  it('link do SAGE Agenda aponta para /agenda', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Agenda/i })
    expect(link).toHaveAttribute('href', '/agenda')
  })

  it('link do SAGE Report aponta para /report', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Report/i })
    expect(link).toHaveAttribute('href', '/report')
  })

  it('link do SAGE Grade aponta para /grade', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Grade/i })
    expect(link).toHaveAttribute('href', '/grade')
  })

  it('link do SAGE Auditório aponta para /auditorio', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Auditório/i })
    expect(link).toHaveAttribute('href', '/auditorio')
  })

  it('link do SAGE Manutenção aponta para /manutencao', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /SAGE Manutenção/i })
    expect(link).toHaveAttribute('href', '/manutencao')
  })

  it('exibe a descrição do SAGE Map', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByText(/Grade semanal de todas as salas/i)).toBeInTheDocument()
  })

  it('exibe a descrição do SAGE Manutenção', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByText(/solicitações de manutenção/i)).toBeInTheDocument()
  })

  it('exibe o card do App SAGE com QR code', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { name: 'App SAGE' })).toBeInTheDocument()
  })

  it('link do App SAGE aponta para a Play Store, em nova aba', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /App SAGE/i })
    expect(link).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.rafaelperazzo.appdc'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('o card do App SAGE renderiza um QR code (SVG)', () => {
    renderWithRouter(<HomePage />)
    const link = screen.getByRole('link', { name: /App SAGE/i })
    expect(link.querySelector('svg')).toBeInTheDocument()
  })
})
