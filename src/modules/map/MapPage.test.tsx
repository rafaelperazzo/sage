import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoes', () => ({
  useAlocacoesPorSala: vi.fn(),
  useAlocacoes: vi.fn(),
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const { useAlocacoesPorSala, useAlocacoes } = await import('../../hooks/useAlocacoes')
const { useAuth } = await import('../../hooks/useAuth')
const mockPorSala = vi.mocked(useAlocacoesPorSala)
const mockTodas = vi.mocked(useAlocacoes)
const mockUseAuth = vi.mocked(useAuth)

const { MapPage } = await import('./MapPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '09:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Silva',
    periodo: '2026.1',
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

const mockCRUD = {
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  hasConflict: vi.fn().mockReturnValue(false),
}

function setupHooks({
  alocacoes = [] as Alocacao[],
  loading = false,
  error = null as string | null,
  isAdmin = false,
} = {}) {
  mockPorSala.mockReturnValue({ alocacoes, loading, error, ...mockCRUD })
  mockTodas.mockReturnValue({ alocacoes, loading, error, reload: vi.fn() })
  mockUseAuth.mockReturnValue({
    user: isAdmin ? { id: '1', email: 'a@b.com' } as never : null,
    isAdmin,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('MapPage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Map"', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('heading', { name: /SAGE Map/i })).toBeInTheDocument()
  })

  it('exibe as abas "Grade Semanal" e "Buscar Sala"', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('button', { name: /Grade Semanal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buscar Sala/i })).toBeInTheDocument()
  })

  it('exibe botões de seleção de salas', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('button', { name: 'SALA 02' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LAB 35' })).toBeInTheDocument()
  })

  it('SALA 02 está selecionada por padrão', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByText('SALA 02', { selector: 'h2' })).toBeInTheDocument()
  })

  it('exibe grade semanal após carregar', () => {
    renderWithRouter(<MapPage />)
    // WeekGrid renderiza cabeçalhos de dias
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
  })
})

describe('MapPage — estados de loading e erro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe indicador de carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<MapPage />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    setupHooks({ error: 'Falha na conexão' })
    renderWithRouter(<MapPage />)
    expect(screen.getByText(/Falha na conexão/i)).toBeInTheDocument()
  })

  it('não exibe a grade durante o carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<MapPage />)
    // Grade não deve aparecer (Seg/Ter são cabeçalhos da WeekGrid)
    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
  })
})

describe('MapPage — seleção de sala', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('clicar em sala diferente atualiza o cabeçalho exibido', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: 'LAB 35' }))

    expect(screen.getByText('LAB 35', { selector: 'h2' })).toBeInTheDocument()
  })

  it('exibe badge de tipo da sala selecionada', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByText('Sala de Aula')).toBeInTheDocument()
  })

  it('trocar para laboratório exibe badge correto', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: 'LAB 35' }))

    expect(await screen.findByText('Laboratório')).toBeInTheDocument()
  })
})

describe('MapPage — abas', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('aba "Buscar Sala" oculta a grade e exibe busca', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /Buscar Sala/i }))

    // Seletor de salas some, busca aparece
    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
  })

  it('voltar para "Grade Semanal" reexibe a grade', async () => {
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /Buscar Sala/i }))
    await user.click(screen.getByRole('button', { name: /Grade Semanal/i }))

    expect(screen.getByText('Seg')).toBeInTheDocument()
  })
})

describe('MapPage — admin vs. usuário comum', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum NÃO vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Modo Admin/i)).not.toBeInTheDocument()
  })

  it('admin vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<MapPage />)
    expect(screen.getByText(/Modo Admin/i)).toBeInTheDocument()
  })

  it('admin vê dica de interação com as células', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<MapPage />)
    expect(screen.getByText(/Clique em uma célula vazia/i)).toBeInTheDocument()
  })

  it('usuário comum NÃO vê dica de interação', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Clique em uma célula vazia/i)).not.toBeInTheDocument()
  })
})

describe('MapPage — abertura de modais', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum clica em alocação → abre modal de visualização', async () => {
    const aloc = makeAlocacao({ id: 5, disciplina: 'BANCO DE DADOS', inicio: '08:00', fim: '09:00' })
    setupHooks({ alocacoes: [aloc], isAdmin: false })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByText('BANCO DE DADOS'))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Salvar/i })).not.toBeInTheDocument()
    })
  })

  it('admin clica em alocação → abre modal de edição', async () => {
    const aloc = makeAlocacao({ id: 5, disciplina: 'COMPILADORES', inicio: '08:00', fim: '09:00' })
    setupHooks({ alocacoes: [aloc], isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByText('COMPILADORES'))

    expect(await screen.findByRole('button', { name: /Salvar/i })).toBeInTheDocument()
  })
})
