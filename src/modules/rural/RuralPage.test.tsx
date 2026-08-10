import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoesExternas', () => ({
  useAlocacoesExternasPorSala: vi.fn(),
  useAlocacoesExternas: vi.fn(),
}))
vi.mock('../../hooks/useSalasExternas', () => ({ useSalasExternas: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const { useAlocacoesExternasPorSala, useAlocacoesExternas } = await import('../../hooks/useAlocacoesExternas')
const { useSalasExternas } = await import('../../hooks/useSalasExternas')
const { useAuth } = await import('../../hooks/useAuth')
const mockPorSala = vi.mocked(useAlocacoesExternasPorSala)
const mockTodas = vi.mocked(useAlocacoesExternas)
const mockSalas = vi.mocked(useSalasExternas)
const mockUseAuth = vi.mocked(useAuth)

const { RuralPage } = await import('./RuralPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'AGRONOMIA I',
    inicio: '08:00',
    fim: '09:00',
    sala: 'SALA RURAL 01',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Souza',
    periodo: '2026.1',
    curso: 'AGRO',
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
  salas = ['SALA RURAL 01', 'SALA RURAL 02'],
  loadingSalas = false,
} = {}) {
  mockPorSala.mockReturnValue({ alocacoes, loading, error, ...mockCRUD })
  mockTodas.mockReturnValue({ alocacoes, loading, error, reload: vi.fn() })
  mockSalas.mockReturnValue({ salas, loading: loadingSalas, error: null })
  mockUseAuth.mockReturnValue({
    user: isAdmin ? { id: '1', email: 'a@b.com' } as never : null,
    isAdmin,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('RuralPage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Rural"', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('heading', { name: /SAGE Rural/i })).toBeInTheDocument()
  })

  it('exibe as abas "Grade Semanal" e "Buscar Sala"', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('button', { name: /Grade Semanal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buscar Sala/i })).toBeInTheDocument()
  })

  it('exibe caixa de seleção de salas com os valores dinâmicos', () => {
    renderWithRouter(<RuralPage />)
    const select = screen.getByRole('combobox')
    expect(screen.getByRole('option', { name: 'SALA RURAL 01' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'SALA RURAL 02' })).toBeInTheDocument()
    expect(select).toHaveValue('SALA RURAL 01')
  })

  it('primeira sala da lista está selecionada por padrão', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByText('SALA RURAL 01', { selector: 'h2' })).toBeInTheDocument()
  })

  it('exibe grade semanal após carregar, apenas de segunda a sexta', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Sex')).toBeInTheDocument()
    expect(screen.queryByText('Sáb')).not.toBeInTheDocument()
  })
})

describe('RuralPage — seleção de sala dinâmica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('trocar a sala no select atualiza o cabeçalho exibido', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.selectOptions(screen.getByRole('combobox'), 'SALA RURAL 02')

    expect(screen.getByText('SALA RURAL 02', { selector: 'h2' })).toBeInTheDocument()
  })

  it('caixa de seleção fica desabilitada enquanto as salas carregam', () => {
    setupHooks({ loadingSalas: true, salas: [] })
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

describe('RuralPage — infraestrutura da sala', () => {
  beforeEach(() => vi.clearAllMocks())

  it('não exibe nada sobre infraestrutura quando não há registro em infra_salas', () => {
    setupHooks()
    renderWithRouter(<RuralPage />)
    expect(screen.queryByText(/não cadastrada/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cadastrar/i)).not.toBeInTheDocument()
  })
})

describe('RuralPage — abas', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('aba "Buscar Sala" oculta a grade e exibe busca', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /Buscar Sala/i }))

    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
  })

  it('exibe a aba "Lista de Disciplinas"', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('button', { name: /Lista de Disciplinas/i })).toBeInTheDocument()
  })
})

describe('RuralPage — admin vs. usuário comum', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum NÃO vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByText(/Modo Admin/i)).not.toBeInTheDocument()
  })

  it('admin vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<RuralPage />)
    expect(screen.getByText(/Modo Admin/i)).toBeInTheDocument()
  })
})

describe('RuralPage — abertura de modais', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum clica em alocação → abre modal de visualização', async () => {
    const aloc = makeAlocacao({ id: 5, disciplina: 'SOLOS', inicio: '08:00', fim: '09:00' })
    setupHooks({ alocacoes: [aloc], isAdmin: false })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByText('SOLOS'))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Salvar/i })).not.toBeInTheDocument()
    })
  })

  it('admin clica em alocação → abre modal de edição', async () => {
    const aloc = makeAlocacao({ id: 5, disciplina: 'IRRIGAÇÃO', inicio: '08:00', fim: '09:00' })
    setupHooks({ alocacoes: [aloc], isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByText('IRRIGAÇÃO'))

    expect(await screen.findByRole('button', { name: /Salvar/i })).toBeInTheDocument()
  })
})
