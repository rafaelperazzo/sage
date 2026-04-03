import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { User } from '@supabase/supabase-js'

// ── Mock do hook useAuth ──────────────────────────────────────────────────────

const mockSignIn = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const { useAuth } = await import('../../hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

function setupAuth(overrides: { user?: User | null; isAdmin?: boolean } = {}) {
  mockUseAuth.mockReturnValue({
    user: overrides.user ?? null,
    isAdmin: overrides.isAdmin ?? false,
    loading: false,
    signIn: mockSignIn,
    signOut: mockSignOut,
  })
}

const { LoginPage } = await import('./LoginPage')

// ── Testes ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuth()
  })

  it('exibe o título "Acesso Administrativo"', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByRole('heading', { name: /Acesso Administrativo/i })).toBeInTheDocument()
  })

  it('exibe campo de e-mail', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByPlaceholderText(/admin@exemplo.com/i)).toBeInTheDocument()
  })

  it('exibe campo de senha', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
  })

  it('botão de submit exibe "Entrar" no estado inicial', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
  })

  it('botão não está desabilitado no estado inicial', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByRole('button', { name: /Entrar/i })).not.toBeDisabled()
  })

  it('não exibe mensagem de erro no estado inicial', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.queryByText(/inválidos/i)).not.toBeInTheDocument()
  })

  it('preencher e-mail e senha chama signIn com os valores corretos', async () => {
    mockSignIn.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<LoginPage />)

    await user.type(screen.getByPlaceholderText(/admin@exemplo.com/i), 'admin@teste.com')
    await user.type(screen.getByPlaceholderText(/••••••••/), 'senha123')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('admin@teste.com', 'senha123')
    })
  })

  it('exibe mensagem de erro quando signIn falha', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    renderWithRouter(<LoginPage />)

    await user.type(screen.getByPlaceholderText(/admin@exemplo.com/i), 'errado@teste.com')
    await user.type(screen.getByPlaceholderText(/••••••••/), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/E-mail ou senha inválidos/i)).toBeInTheDocument()
    })
  })

  it('botão exibe "Entrando..." durante o loading', async () => {
    // signIn que nunca resolve para manter estado de loading
    mockSignIn.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderWithRouter(<LoginPage />)

    await user.type(screen.getByPlaceholderText(/admin@exemplo.com/i), 'admin@teste.com')
    await user.type(screen.getByPlaceholderText(/••••••••/), 'senha123')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entrando/i })).toBeDisabled()
    })
  })

  it('não renderiza o formulário quando usuário já está autenticado', () => {
    setupAuth({ user: { id: '1', email: 'admin@test.com' } as User })
    renderWithRouter(<LoginPage />)
    // Quando user != null, o componente retorna null (sem formulário)
    expect(screen.queryByRole('heading', { name: /Acesso Administrativo/i })).not.toBeInTheDocument()
  })
})
