import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test/renderWithRouter'
import { SobrePage } from './SobrePage'

describe('SobrePage', () => {
  it('exibe o título principal', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: /Sobre o SAGE/i })).toBeInTheDocument()
  })

  it('exibe o subtítulo com nome do departamento', () => {
    renderWithRouter(<SobrePage />)
    // O subtítulo é único pois inclui "UFRPE" após a barra
    expect(screen.getByText(/Departamento de Computação \/ UFRPE/i)).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Map', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Map' })).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Agenda', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Agenda' })).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Report', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Report' })).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Grade', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Grade' })).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Auditório', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Auditório' })).toBeInTheDocument()
  })

  it('exibe card do módulo SAGE Manutenção', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByRole('heading', { name: 'SAGE Manutenção' })).toBeInTheDocument()
  })

  it('exibe 6 links "Acessar módulo"', () => {
    renderWithRouter(<SobrePage />)
    const links = screen.getAllByText(/Acessar módulo/i)
    expect(links).toHaveLength(6)
  })

  it('link do SAGE Map aponta para /map', () => {
    renderWithRouter(<SobrePage />)
    const links = screen.getAllByRole('link', { name: /Acessar módulo/i })
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/map')
  })

  it('exibe o e-mail de contato da direção', () => {
    renderWithRouter(<SobrePage />)
    const emailLink = screen.getByRole('link', { name: /diretoria.dc@ufrpe.br/i })
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute('href', 'mailto:diretoria.dc@ufrpe.br')
  })

  it('exibe texto sobre acesso público sem cadastro', () => {
    renderWithRouter(<SobrePage />)
    expect(screen.getByText(/nenhum cadastro é necessário/i)).toBeInTheDocument()
  })
})
