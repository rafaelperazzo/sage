import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Manutencao, ManutencaoInput } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useManutencao', () => ({ useManutencao: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const { useManutencao } = await import('../../hooks/useManutencao')
const { useAuth } = await import('../../hooks/useAuth')
const mockUseManutencao = vi.mocked(useManutencao)
const mockUseAuth = vi.mocked(useAuth)

const { ManutencaoPage } = await import('./ManutencaoPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeManutencao(overrides: Partial<Manutencao> = {}): Manutencao {
  return {
    id: 1,
    numero_rt: 'RT-001',
    sala_local: 'SALA 02',
    descricao_problema: 'Ar condicionado com defeito',
    status: 'Aberto',
    data_abertura: '2026-03-01',
    data_conclusao: null,
    observacao: null,
    ...overrides,
  }
}

const mockCRUD = {
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}

function setupManutencao(manutencoes: Manutencao[] = [], loading = false, error: string | null = null) {
  mockUseManutencao.mockReturnValue({
    manutencoes,
    loading,
    error,
    ...mockCRUD,
  })
}

function setupAuth(isAdmin = false) {
  mockUseAuth.mockReturnValue({
    user: isAdmin ? { id: '1', email: 'admin@test.com' } as never : null,
    isAdmin,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('ManutencaoPage — estrutura básica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuth(false)
    setupManutencao([])
  })

  it('exibe o título "SAGE Manutenção"', () => {
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByRole('heading', { name: /SAGE Manutenção/i })).toBeInTheDocument()
  })

  it('exibe os três campos de filtro', () => {
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByPlaceholderText(/Filtrar por RT/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Filtrar por local/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Filtrar por descrição/i)).toBeInTheDocument()
  })

  it('exibe cabeçalhos da tabela', () => {
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Nº RT/i)).toBeInTheDocument()
    expect(screen.getByText(/Local/i)).toBeInTheDocument()
    expect(screen.getByText(/Status/i)).toBeInTheDocument()
    expect(screen.getByText(/Abertura/i)).toBeInTheDocument()
  })

  it('exibe mensagem quando lista está vazia', () => {
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Nenhuma solicitação encontrada/i)).toBeInTheDocument()
  })
})

describe('ManutencaoPage — estados de loading e erro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuth(false)
  })

  it('exibe indicador de carregamento', () => {
    setupManutencao([], true)
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando fetch falha', () => {
    setupManutencao([], false, 'Falha na rede')
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Falha na rede/i)).toBeInTheDocument()
  })

  it('não exibe a tabela durante o carregamento', () => {
    setupManutencao([], true)
    renderWithRouter(<ManutencaoPage />)
    expect(screen.queryByText(/Nenhuma solicitação/i)).not.toBeInTheDocument()
  })
})

describe('ManutencaoPage — exibição de dados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuth(false)
  })

  it('exibe o número da RT na tabela', () => {
    setupManutencao([makeManutencao({ numero_rt: 'RT-042' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('RT-042')).toBeInTheDocument()
  })

  it('exibe o local na tabela', () => {
    setupManutencao([makeManutencao({ sala_local: 'LAB 37' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('LAB 37')).toBeInTheDocument()
  })

  it('exibe a descrição do problema', () => {
    setupManutencao([makeManutencao({ descricao_problema: 'Projetor sem sinal' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Projetor sem sinal/i)).toBeInTheDocument()
  })

  it('exibe badge de status "Aberto"', () => {
    setupManutencao([makeManutencao({ status: 'Aberto' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('Aberto')).toBeInTheDocument()
  })

  it('exibe badge de status "Em andamento"', () => {
    setupManutencao([makeManutencao({ status: 'Em andamento' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('exibe badge de status "Concluído"', () => {
    setupManutencao([makeManutencao({ status: 'Concluído' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('exibe data de abertura formatada em DD/MM/AAAA', () => {
    setupManutencao([makeManutencao({ data_abertura: '2026-03-15' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('15/03/2026')).toBeInTheDocument()
  })

  it('exibe "—" quando data_abertura é null', () => {
    setupManutencao([makeManutencao({ data_abertura: null })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('exibe contagem de solicitações encontradas', () => {
    setupManutencao([makeManutencao({ id: 1 }), makeManutencao({ id: 2, numero_rt: 'RT-002' })])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/2 solicitaç/i)).toBeInTheDocument()
  })
})

describe('ManutencaoPage — filtros', () => {
  const manutencoes = [
    makeManutencao({ id: 1, numero_rt: 'RT-001', sala_local: 'SALA 02', descricao_problema: 'Ar condicionado' }),
    makeManutencao({ id: 2, numero_rt: 'RT-099', sala_local: 'LAB 35', descricao_problema: 'Projetor quebrado' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupAuth(false)
    setupManutencao(manutencoes)
  })

  it('filtrar por RT mostra apenas resultados correspondentes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.type(screen.getByPlaceholderText(/Filtrar por RT/i), '099')

    expect(screen.getByText('RT-099')).toBeInTheDocument()
    expect(screen.queryByText('RT-001')).not.toBeInTheDocument()
  })

  it('filtrar por local mostra apenas resultados correspondentes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.type(screen.getByPlaceholderText(/Filtrar por local/i), 'LAB')

    expect(screen.getByText('LAB 35')).toBeInTheDocument()
    expect(screen.queryByText('SALA 02')).not.toBeInTheDocument()
  })

  it('filtrar por descrição mostra apenas resultados correspondentes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.type(screen.getByPlaceholderText(/Filtrar por descrição/i), 'projetor')

    expect(screen.getByText(/Projetor quebrado/i)).toBeInTheDocument()
    expect(screen.queryByText(/Ar condicionado/i)).not.toBeInTheDocument()
  })

  it('filtro com acento normalizado encontra resultado sem acento no texto', async () => {
    const manut = [makeManutencao({ numero_rt: 'RT-010', descricao_problema: 'Tomada elétrica com problema' })]
    setupManutencao(manut)
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    // Digitar sem acento deve encontrar texto com acento
    await user.type(screen.getByPlaceholderText(/Filtrar por descrição/i), 'eletrica')
    expect(screen.getByText(/Tomada elétrica/i)).toBeInTheDocument()
  })

  it('filtro sem correspondência exibe mensagem vazia', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.type(screen.getByPlaceholderText(/Filtrar por RT/i), 'ZZZ-999')

    expect(screen.getByText(/Nenhuma solicitação encontrada/i)).toBeInTheDocument()
  })
})

describe('ManutencaoPage — admin vs. usuário comum', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum NÃO vê botão "Nova RT"', () => {
    setupAuth(false)
    setupManutencao([])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.queryByRole('button', { name: /Nova RT/i })).not.toBeInTheDocument()
  })

  it('usuário comum NÃO vê badge "Modo Admin"', () => {
    setupAuth(false)
    setupManutencao([])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.queryByText(/Modo Admin/i)).not.toBeInTheDocument()
  })

  it('admin vê botão "Nova RT"', () => {
    setupAuth(true)
    setupManutencao([])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByRole('button', { name: /Nova RT/i })).toBeInTheDocument()
  })

  it('admin vê badge "Modo Admin"', () => {
    setupAuth(true)
    setupManutencao([])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Modo Admin/i)).toBeInTheDocument()
  })

  it('admin vê dica de clique para editar', () => {
    setupAuth(true)
    setupManutencao([makeManutencao()])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.getByText(/Clique em uma linha para editar/i)).toBeInTheDocument()
  })

  it('usuário comum NÃO vê dica de clique para editar', () => {
    setupAuth(false)
    setupManutencao([makeManutencao()])
    renderWithRouter(<ManutencaoPage />)
    expect(screen.queryByText(/Clique em uma linha para editar/i)).not.toBeInTheDocument()
  })
})

describe('ManutencaoPage — abertura de modais', () => {
  beforeEach(() => vi.clearAllMocks())

  it('admin clica em linha → abre modal de edição', async () => {
    setupAuth(true)
    setupManutencao([makeManutencao({ numero_rt: 'RT-001' })])
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.click(screen.getByText('RT-001'))
    // Modal de edição tem botão Salvar
    expect(await screen.findByRole('button', { name: /Salvar/i })).toBeInTheDocument()
  })

  it('usuário comum clica em linha → abre modal de visualização (sem Salvar)', async () => {
    setupAuth(false)
    setupManutencao([makeManutencao({ numero_rt: 'RT-001' })])
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.click(screen.getByText('RT-001'))
    // Modal de view não tem botão Salvar
    expect(await screen.findByRole('button', { name: /Fechar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Salvar/i })).not.toBeInTheDocument()
  })

  it('admin clica em "Nova RT" → abre formulário de criação', async () => {
    setupAuth(true)
    setupManutencao([])
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.click(screen.getByRole('button', { name: /Nova RT/i }))
    expect(await screen.findByRole('button', { name: /Salvar/i })).toBeInTheDocument()
  })
})

describe('ManutencaoPage — submit do formulário de criação', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submit do formulário chama create com os dados preenchidos', async () => {
    setupAuth(true)
    setupManutencao([])
    mockCRUD.create.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<ManutencaoPage />)

    await user.click(screen.getByRole('button', { name: /Nova RT/i }))

    // BaseModal não tem role="dialog"; encontrar via heading do modal
    await screen.findByText('Nova Solicitação de Manutenção')

    // ManutencaoForm não usa htmlFor — buscar pelos placeholders
    await user.type(screen.getByPlaceholderText(/Ex: RT-2024-001/i), 'RT-100')
    await user.type(screen.getByPlaceholderText(/Ex: LAB 35/i), 'SALA 42')
    await user.type(screen.getByPlaceholderText(/Descreva o problema/i), 'Lâmpada queimada')

    await user.click(screen.getByRole('button', { name: /Salvar/i }))

    expect(mockCRUD.create).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ManutencaoInput>>({
        numero_rt: 'RT-100',
        sala_local: 'SALA 42',
        descricao_problema: 'Lâmpada queimada',
      })
    )
  })
})
