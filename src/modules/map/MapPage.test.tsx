import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao, Manutencao, ReservaPontual } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoes', () => ({
  useAlocacoesPorSala: vi.fn(),
  useAlocacoes: vi.fn(),
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useManutencao', () => ({ useManutencao: vi.fn() }))
vi.mock('../../hooks/useReservasPontuais', () => ({ useReservasPontuais: vi.fn() }))
// AllocationForm lê o período atual do contexto.
vi.mock('../../contexts/PeriodoContext', () => ({ usePeriodo: () => ({ periodo: '2026.2' }) }))

const { useAlocacoesPorSala, useAlocacoes } = await import('../../hooks/useAlocacoes')
const { useAuth } = await import('../../hooks/useAuth')
const { useManutencao } = await import('../../hooks/useManutencao')
const { useReservasPontuais } = await import('../../hooks/useReservasPontuais')
const mockPorSala = vi.mocked(useAlocacoesPorSala)
const mockTodas = vi.mocked(useAlocacoes)
const mockUseAuth = vi.mocked(useAuth)
const mockUseManutencao = vi.mocked(useManutencao)
const mockUseReservas = vi.mocked(useReservasPontuais)

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

function makeReserva(overrides: Partial<ReservaPontual> = {}): ReservaPontual {
  return {
    id: 1,
    disciplina: 'PALESTRA IA',
    professor: 'Prof. Souza',
    data: '2099-01-05', // segunda-feira
    inicio: '14:00',
    fim: '16:00',
    sala: 'SALA 02',
    modulo: 'map',
    ...overrides,
  }
}

const mockCRUD = {
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  hasConflict: vi.fn().mockReturnValue(false),
}

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

function setupHooks({
  alocacoes = [] as Alocacao[],
  loading = false,
  error = null as string | null,
  isAdmin = false,
  manutencoes = [] as Manutencao[],
  reservas = [] as ReservaPontual[],
} = {}) {
  mockUseReservas.mockReturnValue({
    reservas,
    loading: false,
    error: null,
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getConflito: vi.fn().mockReturnValue(null),
  })
  mockPorSala.mockReturnValue({ alocacoes, loading, error, ...mockCRUD })
  mockTodas.mockReturnValue({ alocacoes, loading, error, reload: vi.fn() })
  mockUseAuth.mockReturnValue({
    user: isAdmin ? { id: '1', email: 'a@b.com' } as never : null,
    isAdmin,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
  mockUseManutencao.mockReturnValue({
    manutencoes,
    loading: false,
    error: null,
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

  it('exibe grade semanal após carregar, apenas de segunda a sexta', () => {
    renderWithRouter(<MapPage />)
    // WeekGrid renderiza cabeçalhos de dias
    expect(screen.getByText('Seg')).toBeInTheDocument()
    expect(screen.getByText('Sex')).toBeInTheDocument()
    expect(screen.queryByText('Sáb')).not.toBeInTheDocument()
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

describe('MapPage — chamado de manutenção', () => {
  beforeEach(() => vi.clearAllMocks())

  it('não exibe aviso quando a sala não tem chamado em aberto', () => {
    setupHooks({ manutencoes: [] })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Chamado de manutenção em aberto/i)).not.toBeInTheDocument()
  })

  it('exibe a descrição do problema quando a sala selecionada tem chamado em aberto', () => {
    setupHooks({ manutencoes: [makeManutencao({ sala_local: 'SALA 02', descricao_problema: 'Ar condicionado com defeito' })] })
    renderWithRouter(<MapPage />)
    expect(screen.getByText(/Ar condicionado com defeito/)).toBeInTheDocument()
  })

  it('não exibe chamado de outra sala', () => {
    setupHooks({ manutencoes: [makeManutencao({ sala_local: 'LAB 35', descricao_problema: 'Projetor não liga' })] })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Projetor não liga/)).not.toBeInTheDocument()
  })

  it('não exibe chamado com status "Concluído"', () => {
    setupHooks({
      manutencoes: [makeManutencao({ sala_local: 'SALA 02', status: 'Concluído', descricao_problema: 'Já resolvido' })],
    })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Já resolvido/)).not.toBeInTheDocument()
  })

  it('trocar de sala atualiza o chamado exibido', async () => {
    const user = userEvent.setup()
    setupHooks({
      manutencoes: [
        makeManutencao({ id: 1, sala_local: 'SALA 02', descricao_problema: 'Ar condicionado com defeito' }),
        makeManutencao({ id: 2, sala_local: 'LAB 35', descricao_problema: 'Projetor não liga' }),
      ],
    })
    renderWithRouter(<MapPage />)

    expect(screen.getByText(/Ar condicionado com defeito/)).toBeInTheDocument()
    expect(screen.queryByText(/Projetor não liga/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'LAB 35' }))

    expect(screen.getByText(/Projetor não liga/)).toBeInTheDocument()
    expect(screen.queryByText(/Ar condicionado com defeito/)).not.toBeInTheDocument()
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

  it('exibe a aba "Lista de Disciplinas"', () => {
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('button', { name: /Lista de Disciplinas/i })).toBeInTheDocument()
  })

  it('aba "Lista de Disciplinas" oculta a grade e exibe a listagem', async () => {
    const user = userEvent.setup()
    setupHooks({
      alocacoes: [
        {
          id: 1,
          disciplina: 'CÁLCULO I',
          inicio: '08:00',
          fim: '10:00',
          sala: 'SALA 02',
          dia_semana: 'SEGUNDA',
          professor: 'Prof. Silva',
          periodo: '2026.1',
          curso: 'BCC',
          semestre: 1,
        },
      ],
    })
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /Lista de Disciplinas/i }))

    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
    expect(screen.getByText('CÁLCULO I')).toBeInTheDocument()
    expect(screen.getByText('Prof. Silva')).toBeInTheDocument()
  })

  it('acessar com "?tab=lista" na URL abre direto na Lista de Disciplinas', () => {
    renderWithRouter(<MapPage />, { initialEntries: ['/map?tab=lista'] })

    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lista de Disciplinas/i })).toHaveClass('border-blue-600')
  })

  it('acessar com "?tab=busca" na URL abre direto na Buscar Sala', () => {
    renderWithRouter(<MapPage />, { initialEntries: ['/map?tab=busca'] })

    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buscar Sala/i })).toHaveClass('border-blue-600')
  })

  it('valor inválido de "tab" na URL cai para "Grade Semanal"', () => {
    renderWithRouter(<MapPage />, { initialEntries: ['/map?tab=inexistente'] })

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
    expect(screen.getByText(/Clique em uma célula livre/i)).toBeInTheDocument()
  })

  it('usuário comum NÃO vê dica de interação', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<MapPage />)
    expect(screen.queryByText(/Clique em uma célula livre/i)).not.toBeInTheDocument()
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

describe('MapPage — reservas pontuais', () => {
  beforeEach(() => vi.clearAllMocks())

  it('admin clica em slot livre → pergunta entre alocação e reserva', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getAllByText('LIVRE')[0]!)

    expect(await screen.findByRole('button', { name: /Nova alocação/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reserva pontual/i })).toBeInTheDocument()
  })

  it('escolher "Reserva pontual" abre o formulário de reserva', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getAllByText('LIVRE')[0]!)
    await user.click(await screen.findByRole('button', { name: /Reserva pontual/i }))

    expect(await screen.findByText(/Nova Reserva Pontual — SALA 02/i)).toBeInTheDocument()
    expect(screen.getByText('Data *')).toBeInTheDocument()
  })

  it('escolher "Nova alocação" abre o formulário de alocação existente', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getAllByText('LIVRE')[0]!)
    await user.click(await screen.findByRole('button', { name: /Nova alocação/i }))

    expect(await screen.findByText(/Nova Alocação —/i)).toBeInTheDocument()
  })

  it('reserva aparece na célula livre e usuário comum abre os detalhes', async () => {
    setupHooks({ isAdmin: false, reservas: [makeReserva()] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByText(/PALESTRA IA/))

    expect(await screen.findByText('Detalhes da Reserva Pontual')).toBeInTheDocument()
    expect(screen.getByText(/05\/01\/2099/)).toBeInTheDocument()
  })

  it('admin clica na reserva → abre edição com botão Remover', async () => {
    setupHooks({ isAdmin: true, reservas: [makeReserva()] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByText(/PALESTRA IA/))

    expect(await screen.findByText(/Editar Reserva Pontual/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remover/i })).toBeInTheDocument()
  })

  it('nova alocação sobre reserva futura é bloqueada com a reserva indicada', async () => {
    setupHooks({ isAdmin: true, reservas: [makeReserva({ inicio: '08:00', fim: '10:00' })] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    // Primeiro slot livre é segunda 08:00–10:00, onde está a reserva.
    await user.click(screen.getAllByText('LIVRE')[0]!)
    await user.click(await screen.findByRole('button', { name: /Nova alocação/i }))
    await user.type(await screen.findByPlaceholderText('Nome da disciplina'), 'REDES')

    expect(
      await screen.findByText(/Conflito com a reserva pontual: PALESTRA IA — Prof. Souza em Segunda-feira, 05\/01\/2099, 08:00–10:00/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeDisabled()
  })
})
