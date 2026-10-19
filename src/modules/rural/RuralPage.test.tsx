import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao, InfraSala, Manutencao, ReservaPontual } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoesExternas', () => ({
  useAlocacoesExternasPorSala: vi.fn(),
  useAlocacoesExternas: vi.fn(),
}))
vi.mock('../../hooks/useSalasExternas', () => ({ useSalasExternas: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
// Sem mock, o hook usaria o client real do Supabase (rede/realtime).
vi.mock('../../hooks/useInfraSalas', () => ({ useInfraSalas: vi.fn() }))
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
const { useInfraSalas } = await import('../../hooks/useInfraSalas')
const { useManutencao } = await import('../../hooks/useManutencao')
const { useReservasPontuais } = await import('../../hooks/useReservasPontuais')
const { exportarGradePdf, exportarGradesPdf } = await import('../map/exportarGradePdf')
const mockPorSala = vi.mocked(useAlocacoesExternasPorSala)
const mockTodas = vi.mocked(useAlocacoesExternas)
const mockSalas = vi.mocked(useSalasExternas)
const mockUseAuth = vi.mocked(useAuth)
const mockUseInfraSalas = vi.mocked(useInfraSalas)
const mockSaveInfra = vi.fn()
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
  updateMany: vi.fn(),
  removeMany: vi.fn(),
  hasConflict: vi.fn().mockReturnValue(false),
}

const mockCadastrar = vi.fn()
const mockEditar = vi.fn()
const mockRemover = vi.fn()

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
  todas = undefined as Alocacao[] | undefined,
  loading = false,
  error = null as string | null,
  isAdmin = false,
  salas = ['PREDIO A - SALA 01', 'PREDIO A - SALA 02', 'PREDIO B - SALA 10'],
  cadastradas = [] as { id: number; sala: string }[],
  loadingSalas = false,
  manutencoes = [] as Manutencao[],
  reservas = [] as ReservaPontual[],
  infraSalas = [] as InfraSala[],
} = {}) {
  mockUseInfraSalas.mockReturnValue({ infraSalas, loading: false, error: null, save: mockSaveInfra })
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
  mockTodas.mockReturnValue({ alocacoes: todas ?? alocacoes, loading, error, reload: vi.fn() })
  mockSalas.mockReturnValue({ salas, cadastradas, loading: loadingSalas, error: null, cadastrar: mockCadastrar, editar: mockEditar, remover: mockRemover })
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

  it('sem registro em infra_salas: usuário comum vê "não cadastrada", sem opção de cadastrar', () => {
    setupHooks()
    renderWithRouter(<RuralPage />)
    expect(screen.getByText('Infraestrutura da sala não cadastrada.')).toBeInTheDocument()
    expect(screen.queryByText(/cadastrar/i)).not.toBeInTheDocument()
  })

  it('admin cadastra a infraestrutura inicial da sala pelo modal', async () => {
    mockSaveInfra.mockResolvedValue(undefined)
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByText('Infraestrutura da sala não cadastrada.'))
    expect(screen.getByText('Infraestrutura — PREDIO A - SALA 01')).toBeInTheDocument()
    const [cadeiras, computadores] = screen.getAllByRole('spinbutton')
    await user.type(cadeiras!, '40')
    await user.type(computadores!, '0')
    await user.click(screen.getByRole('checkbox', { name: /Projetor/i }))
    await user.click(screen.getByRole('checkbox', { name: /Ar-condicionado/i }))
    await user.click(screen.getByRole('button', { name: /^Salvar$/i }))

    await waitFor(() =>
      expect(mockSaveInfra).toHaveBeenCalledWith({
        sala: 'PREDIO A - SALA 01',
        cadeiras: 40,
        computadores: 0,
        projetor: true,
        tv: false,
        hdmi: false,
        arCondicionado: true,
      })
    )
  })

  it('exibe a infraestrutura cadastrada da sala selecionada', () => {
    setupHooks({
      infraSalas: [
        { id: 1, sala: 'PREDIO A - SALA 01', cadeiras: 40, computadores: 2, projetor: true, tv: false, hdmi: true, arCondicionado: true },
      ],
    })
    renderWithRouter(<RuralPage />)
    expect(screen.getByText('40 cadeiras')).toBeInTheDocument()
    expect(screen.getByText('2 computadores')).toBeInTheDocument()
    expect(screen.queryByText(/não cadastrada/i)).not.toBeInTheDocument()
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

  it('reserva da sala selecionada aparece na lista "VER RESERVAS"; de outra sala não', async () => {
    setupHooks({
      reservas: [
        { id: 1, disciplina: 'OFICINA', professor: null, data: '2099-01-05', inicio: '14:00', fim: '16:00', sala: 'PREDIO A - SALA 01', modulo: 'rural' },
        { id: 2, disciplina: 'SEMINARIO', professor: null, data: '2099-01-05', inicio: '14:00', fim: '16:00', sala: 'PREDIO A - SALA 02', modulo: 'rural' },
      ],
    })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)
    await user.click(screen.getByRole('button', { name: /^VER RESERVAS/ }))
    expect(screen.getByText(/OFICINA/)).toBeInTheDocument()
    expect(screen.queryByText(/SEMINARIO/)).not.toBeInTheDocument()
  })
})

describe('RuralPage — refletir edição/remoção nos outros dias da disciplina', () => {
  beforeEach(() => vi.clearAllMocks())

  const seg = makeAlocacao({ id: 1, inicio: '08:00', fim: '10:00', dia_semana: 'SEGUNDA' })
  const qua = makeAlocacao({ id: 2, inicio: '08:00', fim: '10:00', dia_semana: 'QUARTA' })

  async function abrirEdicao(todas: Alocacao[]) {
    setupHooks({ alocacoes: [seg, qua], todas, isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)
    await user.click(screen.getAllByText('AGRONOMIA I')[0]!)
    return { user, modal: within((await screen.findByText('Editar Alocação')).parentElement!.parentElement!) }
  }

  it('refletindo, troca a sala das outras mantendo seus dias e horários', async () => {
    const { user, modal } = await abrirEdicao([seg, qua])
    await user.selectOptions(modal.getAllByRole('combobox')[0]!, 'PREDIO A - SALA 02')
    await user.click(modal.getByLabelText(/Refletir em outros dias/i))
    await user.click(modal.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockCRUD.updateMany).toHaveBeenCalledWith([
        { ...seg, sala: 'PREDIO A - SALA 02' },
        { ...qua, sala: 'PREDIO A - SALA 02' },
      ])
    )
  })

  it('bloqueia quando a nova sala está ocupada no horário de outra alocação refletida', async () => {
    const ocupante = makeAlocacao({ id: 9, disciplina: 'SOLOS', sala: 'PREDIO A - SALA 02', dia_semana: 'QUARTA', inicio: '08:00', fim: '09:00' })
    const { user, modal } = await abrirEdicao([seg, qua, ocupante])
    await user.selectOptions(modal.getAllByRole('combobox')[0]!, 'PREDIO A - SALA 02')
    await user.click(modal.getByLabelText(/Refletir em outros dias/i))

    expect(modal.getByText(/já está ocupado por SOLOS/)).toBeInTheDocument()
    expect(modal.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('remoção refletindo remove todas as marcadas', async () => {
    const { user } = await abrirEdicao([seg, qua])
    await user.click(screen.getByRole('button', { name: /Remover/i }))
    await user.click(await screen.findByLabelText(/Refletir em outros dias/i))
    await user.click(screen.getByRole('button', { name: 'Confirmar Remoção' }))

    await waitFor(() => expect(mockCRUD.removeMany).toHaveBeenCalledWith([1, 2]))
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

describe('RuralPage — botão Nova Alocação', () => {
  beforeEach(() => vi.clearAllMocks())

  it('aparece só para admin', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByRole('button', { name: /^Nova Alocação$/i })).not.toBeInTheDocument()
  })

  it('abre o formulário de alocação sem escolher um slot, com a sala selecionada', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Nova Alocação$/i }))

    expect(await screen.findByText(/Nova Alocação — 2026.2/i)).toBeInTheDocument()
    const form = screen.getByText(/Nova Alocação — 2026.2/i).closest('div')!.parentElement!
    expect(within(form).getByLabelText('Prédio *')).toHaveValue('PREDIO A')
    expect(within(form).getByLabelText('Sala *')).toHaveValue('PREDIO A - SALA 01')
  })

  it('separa prédio e sala; trocar o prédio seleciona a primeira sala dele', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Nova Alocação$/i }))
    const form = screen.getByText(/Nova Alocação — 2026.2/i).closest('div')!.parentElement!
    const sala = within(form).getByLabelText('Sala *')
    expect(within(sala).getAllByRole('option').map((o) => o.textContent)).toEqual(['SALA 01', 'SALA 02'])

    await user.selectOptions(within(form).getByLabelText('Prédio *'), 'PREDIO B')

    expect(sala).toHaveValue('PREDIO B - SALA 10')
    expect(within(sala).getAllByRole('option').map((o) => o.textContent)).toEqual(['SALA 10'])
  })

  it('bloqueia conflito com alocação de outra sala escolhida no formulário', async () => {
    const ocupada = makeAlocacao({ sala: 'PREDIO B - SALA 10', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '16:00' })
    setupHooks({ isAdmin: true, alocacoes: [], todas: [ocupada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Nova Alocação$/i }))
    const form = screen.getByText(/Nova Alocação — 2026.2/i).closest('div')!.parentElement!
    await user.selectOptions(within(form).getByLabelText('Prédio *'), 'PREDIO B')
    await user.type(within(form).getByPlaceholderText('Nome da disciplina'), 'SOLOS')

    expect(await within(form).findByText(/Conflito de horário: este slot já está ocupado/i)).toBeInTheDocument()
    expect(within(form).getByRole('button', { name: /Salvar/i })).toBeDisabled()
  })

  it('salvar em outra sala cria a alocação e seleciona essa sala na grade', async () => {
    setupHooks({ isAdmin: true })
    mockCRUD.create.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Nova Alocação$/i }))
    const form = screen.getByText(/Nova Alocação — 2026.2/i).closest('div')!.parentElement!
    await user.selectOptions(within(form).getByLabelText('Prédio *'), 'PREDIO B')
    await user.type(within(form).getByPlaceholderText('Nome da disciplina'), 'SOLOS')
    await user.type(within(form).getByPlaceholderText('BCC, LC, DC...'), 'AGRO')
    await user.click(within(form).getByRole('button', { name: /Salvar/i }))

    await waitFor(() => expect(mockCRUD.create).toHaveBeenCalledOnce())
    expect(mockCRUD.create.mock.calls[0]![0]).toMatchObject({ sala: 'PREDIO B - SALA 10', disciplina: 'SOLOS' })
    await waitFor(() => expect(mockPorSala).toHaveBeenLastCalledWith('PREDIO B - SALA 10'))
    expect(screen.getByRole('heading', { name: 'PREDIO B - SALA 10' })).toBeInTheDocument()
  })
})

describe('RuralPage — Cadastrar Sala', () => {
  beforeEach(() => vi.clearAllMocks())

  it('aparece só para admin', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<RuralPage />)
    expect(screen.queryByRole('button', { name: /^Cadastrar Sala$/i })).not.toBeInTheDocument()
  })

  it('cadastra a sala no prédio selecionado e passa a exibi-la', async () => {
    mockCadastrar.mockResolvedValue(undefined)
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    const { rerender } = renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Cadastrar Sala$/i }))
    expect(screen.getByLabelText('Prédio *')).toHaveValue('PREDIO A')
    await user.type(screen.getByLabelText('Sala *'), ' sala  03 ')
    expect(screen.getByText('PREDIO A - SALA 03')).toBeInTheDocument()

    // O hook recarrega a lista após o cadastro.
    setupHooks({ isAdmin: true, salas: ['PREDIO A - SALA 01', 'PREDIO A - SALA 02', 'PREDIO A - SALA 03', 'PREDIO B - SALA 10'] })
    await user.click(screen.getByRole('button', { name: /^Cadastrar$/i }))

    await waitFor(() => expect(mockCadastrar).toHaveBeenCalledWith('PREDIO A - SALA 03'))
    rerender(<RuralPage />)
    await waitFor(() => expect(mockPorSala).toHaveBeenLastCalledWith('PREDIO A - SALA 03'))
    expect(screen.queryByText('Cadastrar Sala', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('não cadastra sala fora do padrão "SALA XX" / "LAB XX" e explica como nomear', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Cadastrar Sala$/i }))
    await user.type(screen.getByLabelText('Sala *'), 'sala 3')
    expect(screen.getByLabelText('Sala *')).toHaveValue('SALA 3')
    await user.click(screen.getByRole('button', { name: /^Cadastrar$/i }))

    expect(
      await screen.findByText('O nome da sala deve seguir o padrão "SALA XX" ou "LAB XX", com dois dígitos (ex: SALA 02, LAB 15).')
    ).toBeInTheDocument()
    expect(mockCadastrar).not.toHaveBeenCalled()
  })

  it('não cadastra sala que já existe', async () => {
    setupHooks({ isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await user.click(screen.getByRole('button', { name: /^Cadastrar Sala$/i }))
    await user.type(screen.getByLabelText('Sala *'), 'Sala 02')
    await user.click(screen.getByRole('button', { name: /^Cadastrar$/i }))

    expect(await screen.findByText('A sala PREDIO A - SALA 02 já existe.')).toBeInTheDocument()
    expect(mockCadastrar).not.toHaveBeenCalled()
  })
})

describe('RuralPage — Editar Sala', () => {
  beforeEach(() => vi.clearAllMocks())

  const cadastrada = { id: 7, sala: 'PREDIO A - SALA 02' }

  async function abrirSalaCadastrada(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(screen.getByLabelText('Sala'), 'PREDIO A - SALA 02')
    await user.click(screen.getByRole('button', { name: /^Editar Sala$/i }))
  }

  it('aparece só para admin e só em sala cadastrada', async () => {
    setupHooks({ isAdmin: true, cadastradas: [cadastrada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    // Sala selecionada (SALA 01) vem das alocações, não do cadastro.
    expect(screen.queryByRole('button', { name: /^Editar Sala$/i })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Sala'), 'PREDIO A - SALA 02')
    expect(screen.getByRole('button', { name: /^Editar Sala$/i })).toBeInTheDocument()
  })

  it('não aparece para usuário comum', async () => {
    setupHooks({ isAdmin: false, cadastradas: [cadastrada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)
    await user.selectOptions(screen.getByLabelText('Sala'), 'PREDIO A - SALA 02')
    expect(screen.queryByRole('button', { name: /^Editar Sala$/i })).not.toBeInTheDocument()
  })

  it('renomeia a sala e passa a exibi-la', async () => {
    mockEditar.mockResolvedValue(undefined)
    setupHooks({ isAdmin: true, cadastradas: [cadastrada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await abrirSalaCadastrada(user)
    expect(screen.getByLabelText('Prédio *')).toHaveValue('PREDIO A')
    expect(screen.getByLabelText('Sala *')).toHaveValue('SALA 02')
    await user.clear(screen.getByLabelText('Sala *'))
    await user.type(screen.getByLabelText('Sala *'), 'sala 03')
    setupHooks({
      isAdmin: true,
      salas: ['PREDIO A - SALA 01', 'PREDIO A - SALA 03', 'PREDIO B - SALA 10'],
      cadastradas: [{ id: 7, sala: 'PREDIO A - SALA 03' }],
    })
    await user.click(screen.getByRole('button', { name: /^Salvar$/i }))

    await waitFor(() => expect(mockEditar).toHaveBeenCalledWith(cadastrada, 'PREDIO A - SALA 03'))
    await waitFor(() => expect(mockPorSala).toHaveBeenLastCalledWith('PREDIO A - SALA 03'))
  })

  it('remove a sala após confirmação e seleciona outra do mesmo prédio', async () => {
    mockRemover.mockResolvedValue(undefined)
    setupHooks({ isAdmin: true, cadastradas: [cadastrada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await abrirSalaCadastrada(user)
    await user.click(screen.getByRole('button', { name: /^Remover$/i }))
    expect(screen.getByText('Tem certeza que deseja remover a sala:')).toBeInTheDocument()
    setupHooks({ isAdmin: true, salas: ['PREDIO A - SALA 01', 'PREDIO B - SALA 10'] })
    await user.click(screen.getByRole('button', { name: /Confirmar Remoção/i }))

    await waitFor(() => expect(mockRemover).toHaveBeenCalledWith(cadastrada))
    await waitFor(() => expect(mockPorSala).toHaveBeenLastCalledWith('PREDIO A - SALA 01'))
  })

  it('mostra o erro quando a sala está em uso', async () => {
    mockRemover.mockRejectedValue(new Error('A sala PREDIO A - SALA 02 está em uso (alocações) e não pode ser removida.'))
    setupHooks({ isAdmin: true, cadastradas: [cadastrada] })
    const user = userEvent.setup()
    renderWithRouter(<RuralPage />)

    await abrirSalaCadastrada(user)
    await user.click(screen.getByRole('button', { name: /^Remover$/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar Remoção/i }))

    expect(await screen.findByText(/está em uso \(alocações\) e não pode ser removida/)).toBeInTheDocument()
  })
})
