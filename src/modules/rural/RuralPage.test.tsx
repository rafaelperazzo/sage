import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao, Manutencao, ReservaPontual } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoesExternas', () => ({
  useAlocacoesExternasPorSala: vi.fn(),
  useAlocacoesExternas: vi.fn(),
}))
vi.mock('../../hooks/useSalasExternas', () => ({ useSalasExternas: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useManutencao', () => ({ useManutencao: vi.fn() }))
vi.mock('../../hooks/useReservasPontuais', () => ({ useReservasPontuais: vi.fn() }))
vi.mock('../../contexts/PeriodoContext', () => ({ usePeriodo: () => ({ periodo: '2026.2' }) }))
vi.mock('../map/exportarGradePdf', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../map/exportarGradePdf')>()),
  exportarGradePdf: vi.fn().mockResolvedValue(undefined),
  exportarGradesPdf: vi.fn().mockResolvedValue(undefined),
}))

const { useAlocacoesExternasPorSala, useAlocacoesExternas } = await import('../../hooks/useAlocacoesExternas')
const { useSalasExternas } = await import('../../hooks/useSalasExternas')
const { useAuth } = await import('../../hooks/useAuth')
const { useManutencao } = await import('../../hooks/useManutencao')
const { useReservasPontuais } = await import('../../hooks/useReservasPontuais')
const { exportarGradePdf, exportarGradesPdf } = await import('../map/exportarGradePdf')
const mockPorSala = vi.mocked(useAlocacoesExternasPorSala)
const mockTodas = vi.mocked(useAlocacoesExternas)
const mockSalas = vi.mocked(useSalasExternas)
const mockUseAuth = vi.mocked(useAuth)
const mockUseManutencao = vi.mocked(useManutencao)
const mockUseReservas = vi.mocked(useReservasPontuais)

const { RuralPage } = await import('./RuralPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'AGRONOMIA I',
    inicio: '08:00',
    fim: '09:00',
    sala: 'PREDIO A - SALA 01',
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
  createMany: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  hasConflict: vi.fn().mockReturnValue(false),
}

function makeManutencao(overrides: Partial<Manutencao> = {}): Manutencao {
  return {
    id: 1,
    numero_rt: 'RT-001',
    sala_local: 'PREDIO A - SALA 01',
    descricao_problema: 'Cerca danificada',
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
  salas = ['PREDIO A - SALA 01', 'PREDIO A - SALA 02', 'PREDIO B - SALA 10'],
  loadingSalas = false,
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
  mockSalas.mockReturnValue({ salas, loading: loadingSalas, error: null })
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

  it('exibe seletor de prédio e, nele, apenas as salas do prédio (sem o prefixo)', () => {
    renderWithRouter(<RuralPage />)
    const predio = screen.getByLabelText('Prédio')
    const sala = screen.getByLabelText('Sala')
    expect(within(predio).getByRole('option', { name: 'PREDIO A' })).toBeInTheDocument()
    expect(within(predio).getByRole('option', { name: 'PREDIO B' })).toBeInTheDocument()
    expect(predio).toHaveValue('PREDIO A')
    expect(within(sala).getByRole('option', { name: 'SALA 01' })).toBeInTheDocument()
    expect(within(sala).getByRole('option', { name: 'SALA 02' })).toBeInTheDocument()
    expect(within(sala).queryByRole('option', { name: 'SALA 10' })).not.toBeInTheDocument()
    expect(sala).toHaveValue('PREDIO A - SALA 01')
  })

  it('primeira sala da lista está selecionada por padrão', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByText('PREDIO A - SALA 01', { selector: 'h2' })).toBeInTheDocument()
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

    await user.selectOptions(screen.getByLabelText('Sala'), 'PREDIO A - SALA 02')

    expect(screen.getByText('PREDIO A - SALA 02', { selector: 'h2' })).toBeInTheDocument()
  })

  it('trocar o prédio seleciona a primeira sala dele e atualiza a lista de salas', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.selectOptions(screen.getByLabelText('Prédio'), 'PREDIO B')

    expect(screen.getByText('PREDIO B - SALA 10', { selector: 'h2' })).toBeInTheDocument()
    const sala = screen.getByLabelText('Sala')
    expect(sala).toHaveValue('PREDIO B - SALA 10')
    expect(within(sala).queryByRole('option', { name: 'SALA 01' })).not.toBeInTheDocument()
    expect(mockPorSala).toHaveBeenLastCalledWith('PREDIO B - SALA 10')
  })

  it('sala sem o padrão "PREDIO - SALA" vira um prédio com ela mesma', () => {
    setupHooks({ salas: ['AUDITORIO CENTRAL'] })
    renderWithRouter(<RuralPage />)
    expect(screen.getByLabelText('Prédio')).toHaveValue('AUDITORIO CENTRAL')
    expect(screen.getByLabelText('Sala')).toHaveValue('AUDITORIO CENTRAL')
  })

  it('seletores ficam desabilitados enquanto as salas carregam', () => {
    setupHooks({ loadingSalas: true, salas: [] })
    renderWithRouter(<RuralPage />)
    expect(screen.getByLabelText('Prédio')).toBeDisabled()
    expect(screen.getByLabelText('Sala')).toBeDisabled()
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

describe('RuralPage — chamado de manutenção', () => {
  beforeEach(() => vi.clearAllMocks())

  it('não exibe aviso quando a sala não tem chamado em aberto', () => {
    setupHooks({ manutencoes: [] })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByText(/Chamado de manutenção em aberto/i)).not.toBeInTheDocument()
  })

  it('exibe a descrição do problema quando a sala selecionada tem chamado em aberto', () => {
    setupHooks({ manutencoes: [makeManutencao({ sala_local: 'PREDIO A - SALA 01', descricao_problema: 'Cerca danificada' })] })
    renderWithRouter(<RuralPage />)
    expect(screen.getByText(/Cerca danificada/)).toBeInTheDocument()
  })

  it('não exibe chamado de outra sala', () => {
    setupHooks({ manutencoes: [makeManutencao({ sala_local: 'PREDIO A - SALA 02', descricao_problema: 'Irrigação com vazamento' })] })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByText(/Irrigação com vazamento/)).not.toBeInTheDocument()
  })

  it('não exibe chamado com status "Concluído"', () => {
    setupHooks({
      manutencoes: [makeManutencao({ sala_local: 'PREDIO A - SALA 01', status: 'Concluído', descricao_problema: 'Já resolvido' })],
    })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByText(/Já resolvido/)).not.toBeInTheDocument()
  })

  it('trocar de sala no select atualiza o chamado exibido', async () => {
    const user = userEvent.setup()
    setupHooks({
      manutencoes: [
        makeManutencao({ id: 1, sala_local: 'PREDIO A - SALA 01', descricao_problema: 'Cerca danificada' }),
        makeManutencao({ id: 2, sala_local: 'PREDIO A - SALA 02', descricao_problema: 'Irrigação com vazamento' }),
      ],
    })
    renderWithRouter(<RuralPage />)

    expect(screen.getByText(/Cerca danificada/)).toBeInTheDocument()
    expect(screen.queryByText(/Irrigação com vazamento/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Sala'), 'PREDIO A - SALA 02')

    expect(screen.getByText(/Irrigação com vazamento/)).toBeInTheDocument()
    expect(screen.queryByText(/Cerca danificada/)).not.toBeInTheDocument()
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

  it('exibe a aba "Salas Livres Agora"', () => {
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('button', { name: /Salas Livres Agora/i })).toBeInTheDocument()
  })

  it('aba "Salas Livres Agora" oculta a grade', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /Salas Livres Agora/i }))

    expect(screen.queryByText('Seg')).not.toBeInTheDocument()
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

describe('RuralPage — reservas pontuais', () => {
  beforeEach(() => vi.clearAllMocks())

  it('carrega as reservas do módulo rural', () => {
    setupHooks()
    renderWithRouter(<RuralPage />)
    expect(mockUseReservas).toHaveBeenCalledWith('rural', expect.any(Array))
  })

  it('admin clica em slot livre e escolhe reserva → formulário com a sala selecionada', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getAllByText('LIVRE')[0]!)
    await user.click(await screen.findByRole('button', { name: /Reserva pontual/i }))

    expect(await screen.findByText(/Nova Reserva Pontual — PREDIO A - SALA 01/i)).toBeInTheDocument()
  })

  it('reserva da sala selecionada aparece na grade; de outra sala não', () => {
    setupHooks({
      reservas: [
        { id: 1, disciplina: 'OFICINA', professor: null, data: '2099-01-05', inicio: '14:00', fim: '16:00', sala: 'PREDIO A - SALA 01', modulo: 'rural' },
        { id: 2, disciplina: 'SEMINARIO', professor: null, data: '2099-01-05', inicio: '14:00', fim: '16:00', sala: 'PREDIO A - SALA 02', modulo: 'rural' },
      ],
    })
    renderWithRouter(<RuralPage />)
    expect(screen.getByText(/OFICINA/)).toBeInTheDocument()
    expect(screen.queryByText(/SEMINARIO/)).not.toBeInTheDocument()
  })
})

describe('RuralPage — exportar PDF', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exporta a grade da sala selecionada no prédio escolhido', async () => {
    setupHooks()
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.selectOptions(screen.getByLabelText('Prédio'), 'PREDIO B')
    await user.click(screen.getByRole('button', { name: /^Exportar PDF$/i }))

    await waitFor(() => expect(exportarGradePdf).toHaveBeenCalledOnce())
    expect(exportarGradePdf).toHaveBeenCalledWith(
      expect.objectContaining({ modulo: 'SAGE Rural', sala: 'PREDIO B - SALA 10', periodo: '2026.2', tipoSala: undefined })
    )
  })
})

describe('RuralPage — exportar grade do prédio', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gera um único PDF com uma página por sala do prédio selecionado', async () => {
    const a1 = makeAlocacao({ id: 1, sala: 'PREDIO A - SALA 01', disciplina: 'FILOSOFIA' })
    const a2 = makeAlocacao({ id: 2, sala: 'PREDIO A - SALA 02', disciplina: 'HISTÓRIA' })
    const outroPredio = makeAlocacao({ id: 3, sala: 'PREDIO B - SALA 10', disciplina: 'QUÍMICA' })
    setupHooks({ alocacoes: [a1, a2, outroPredio] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /Exportar grade do prédio/i }))

    await waitFor(() => expect(exportarGradesPdf).toHaveBeenCalledOnce())
    expect(exportarGradesPdf).toHaveBeenCalledWith({
      modulo: 'SAGE Rural',
      periodo: '2026.2',
      nomeArquivo: 'grades-predio-a-2026.2.pdf',
      paginas: [
        { sala: 'PREDIO A - SALA 01', alocacoes: [a1], reservas: [] },
        { sala: 'PREDIO A - SALA 02', alocacoes: [a2], reservas: [] },
      ],
    })
  })

  it('botão desabilitado enquanto as alocações do período carregam', () => {
    setupHooks({ loading: true })
    renderWithRouter(<RuralPage />)
    expect(screen.getByRole('button', { name: /Exportar grade do prédio/i })).toBeDisabled()
  })
})
