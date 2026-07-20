import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoes', () => ({ useAlocacoes: vi.fn() }))

const { useAlocacoes } = await import('../../hooks/useAlocacoes')
const mockUseAlocacoes = vi.mocked(useAlocacoes)

const { GradePage } = await import('./GradePage')

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function setupHooks({
  alocacoes = [] as Alocacao[],
  loading = false,
  error = null as string | null,
} = {}) {
  mockUseAlocacoes.mockReturnValue({ alocacoes, loading, error, reload: vi.fn() })
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GradePage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Grade Semestral"', () => {
    renderWithRouter(<GradePage />)
    expect(screen.getByRole('heading', { name: /SAGE Grade Semestral/i })).toBeInTheDocument()
  })

  it('exibe botões de curso BCC e LC', () => {
    renderWithRouter(<GradePage />)
    expect(screen.getByRole('button', { name: 'BCC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LC' })).toBeInTheDocument()
  })
})

describe('GradePage — estados de loading e erro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe indicador de carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<GradePage />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    setupHooks({ error: 'Erro de conexão' })
    renderWithRouter(<GradePage />)
    expect(screen.getByText(/Erro de conexão/i)).toBeInTheDocument()
  })
})

describe('GradePage — sem disciplinas para o curso', () => {
  it('exibe estado vazio quando não há semestre disponível para BCC', () => {
    setupHooks({ alocacoes: [] })
    renderWithRouter(<GradePage />)
    expect(screen.getByText(/Nenhuma disciplina cadastrada para BCC/i)).toBeInTheDocument()
  })
})

describe('GradePage — abas de semestre e filtragem', () => {
  const alocacoes = [
    makeAlocacao({ id: 1, disciplina: 'CÁLCULO NI', curso: 'BCC', semestre: 1 }),
    makeAlocacao({ id: 2, disciplina: 'CÁLCULO NII', curso: 'BCC', semestre: 2, dia_semana: 'TERÇA' }),
    makeAlocacao({ id: 3, disciplina: 'LIBRAS', curso: 'LC', semestre: 1, dia_semana: 'QUARTA' }),
  ]

  beforeEach(() => { vi.clearAllMocks(); setupHooks({ alocacoes }) })

  it('por padrão mostra BCC, no primeiro semestre disponível', async () => {
    renderWithRouter(<GradePage />)
    expect(await screen.findByText('CÁLCULO NI')).toBeInTheDocument()
    expect(screen.queryByText('CÁLCULO NII')).not.toBeInTheDocument()
  })

  it('trocar de aba de semestre filtra as disciplinas exibidas', async () => {
    const user = userEvent.setup()
    renderWithRouter(<GradePage />)

    await screen.findByText('CÁLCULO NI')
    await user.click(screen.getByRole('button', { name: '2º' }))

    expect(await screen.findByText('CÁLCULO NII')).toBeInTheDocument()
    expect(screen.queryByText('CÁLCULO NI')).not.toBeInTheDocument()
  })

  it('trocar para o curso LC filtra apenas disciplinas de LC', async () => {
    const user = userEvent.setup()
    renderWithRouter(<GradePage />)

    await screen.findByText('CÁLCULO NI')
    await user.click(screen.getByRole('button', { name: 'LC' }))

    expect(await screen.findByText('LIBRAS')).toBeInTheDocument()
    expect(screen.queryByText('CÁLCULO NI')).not.toBeInTheDocument()
  })
})
