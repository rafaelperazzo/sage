import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
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
vi.mock('./exportarGradePdf', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./exportarGradePdf')>()),
  exportarGradePdf: vi.fn().mockResolvedValue(undefined),
  exportarGradesPdf: vi.fn().mockResolvedValue(undefined),
}))

const { useAlocacoesPorSala, useAlocacoes } = await import('../../hooks/useAlocacoes')
const { useAuth } = await import('../../hooks/useAuth')
const { useManutencao } = await import('../../hooks/useManutencao')
const { useReservasPontuais } = await import('../../hooks/useReservasPontuais')
const { exportarGradePdf, exportarGradesPdf } = await import('./exportarGradePdf')
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
  createMany: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  updateMany: vi.fn(),
  removeMany: vi.fn(),
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
  todas = undefined as Alocacao[] | undefined,
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
  mockTodas.mockReturnValue({ alocacoes: todas ?? alocacoes, loading, error, reload: vi.fn() })
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

  it('célula livre mostra "VER RESERVAS" e usuário comum abre os detalhes pela lista', async () => {
    setupHooks({ isAdmin: false, reservas: [makeReserva()] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    expect(screen.queryByText(/PALESTRA IA/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^VER RESERVAS/ }))
    await user.click(screen.getByText(/PALESTRA IA/))

    expect(await screen.findByText('Detalhes da Reserva Pontual')).toBeInTheDocument()
    expect(screen.getByText(/05\/01\/2099/)).toBeInTheDocument()
  })

  it('admin clica na reserva → abre edição com botão Remover', async () => {
    setupHooks({ isAdmin: true, reservas: [makeReserva()] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /^VER RESERVAS/ }))
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

describe('MapPage — alocação em outro dia/horário', () => {
  beforeEach(() => vi.clearAllMocks())

  async function abrirNovaAlocacao(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getAllByText('LIVRE')[0]!) // segunda 08:00–10:00
    await user.click(await screen.findByRole('button', { name: /Nova alocação/i }))
    await user.type(await screen.findByPlaceholderText('Nome da disciplina'), 'REDES')
    await user.type(screen.getByPlaceholderText('BCC, LC, DC...'), 'BCC')
  }

  it('marcar o checkbox e salvar cria as duas alocações de uma vez', async () => {
    setupHooks({ isAdmin: true })
    mockCRUD.createMany.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await abrirNovaAlocacao(user)
    await user.click(screen.getByLabelText(/Alocar em outro dia\/horário/i))
    await user.selectOptions(screen.getByLabelText('Dia do segundo horário'), 'QUARTA')
    await user.selectOptions(screen.getByLabelText('Início do segundo horário'), '14:00')
    await user.selectOptions(screen.getByLabelText('Fim do segundo horário'), '16:00')
    await user.click(screen.getByRole('button', { name: /Salvar/i }))

    await waitFor(() => expect(mockCRUD.createMany).toHaveBeenCalledOnce())
    const [[primeira, segunda]] = mockCRUD.createMany.mock.calls[0]!
    expect(primeira).toMatchObject({ disciplina: 'REDES', curso: 'BCC', sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '10:00' })
    expect(segunda).toMatchObject({ disciplina: 'REDES', curso: 'BCC', sala: 'SALA 02', dia_semana: 'QUARTA', inicio: '14:00', fim: '16:00' })
    expect(mockCRUD.create).not.toHaveBeenCalled()
  })

  it('sem o checkbox, salva só uma alocação (fluxo atual)', async () => {
    setupHooks({ isAdmin: true })
    mockCRUD.create.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await abrirNovaAlocacao(user)
    await user.click(screen.getByRole('button', { name: /Salvar/i }))

    await waitFor(() => expect(mockCRUD.create).toHaveBeenCalledOnce())
    expect(mockCRUD.createMany).not.toHaveBeenCalled()
  })

  it('segundo horário com choque → mensagem e Salvar desabilitado', async () => {
    setupHooks({ isAdmin: true })
    // Conflita apenas quando o horário é na quarta-feira.
    mockCRUD.hasConflict.mockImplementation((d: { dia_semana: string }) => d.dia_semana === 'QUARTA')
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await abrirNovaAlocacao(user)
    await user.click(screen.getByLabelText(/Alocar em outro dia\/horário/i))
    await user.selectOptions(screen.getByLabelText('Dia do segundo horário'), 'QUARTA')

    expect(await screen.findByText(/Segundo horário: conflito de horário/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeDisabled()
    mockCRUD.hasConflict.mockReturnValue(false)
  })
})

describe('MapPage — refletir edição/remoção nos outros dias da disciplina', () => {
  beforeEach(() => vi.clearAllMocks())

  const seg = makeAlocacao({ id: 1, inicio: '08:00', fim: '10:00', dia_semana: 'SEGUNDA' })
  const qua = makeAlocacao({ id: 2, inicio: '08:00', fim: '10:00', dia_semana: 'QUARTA' })
  const sex = makeAlocacao({ id: 3, inicio: '10:00', fim: '12:00', dia_semana: 'SEXTA', sala: 'LAB 35' })

  async function abrirEdicao(todas: Alocacao[]) {
    setupHooks({ alocacoes: [seg, qua], todas, isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)
    await user.click(screen.getAllByText('CÁLCULO I')[0]!)
    await screen.findByText('Editar Alocação')
    return user
  }

  it('sem outras alocações da disciplina a opção não aparece', async () => {
    setupHooks({ alocacoes: [seg], isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)
    await user.click(screen.getByText('CÁLCULO I'))
    await screen.findByText('Editar Alocação')
    expect(screen.queryByLabelText(/Refletir em outros dias/i)).not.toBeInTheDocument()
  })

  it('opção vem desmarcada; salvar sem marcar altera só a alocação clicada', async () => {
    const user = await abrirEdicao([seg, qua])
    expect(screen.getByLabelText(/Refletir em outros dias/i)).not.toBeChecked()
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'LAB 35')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(mockCRUD.update).toHaveBeenCalledWith(1, expect.objectContaining({ sala: 'LAB 35', dia_semana: 'SEGUNDA' })))
    expect(mockCRUD.updateMany).not.toHaveBeenCalled()
  })

  it('refletindo, troca a sala das outras mantendo seus dias e horários', async () => {
    const user = await abrirEdicao([seg, qua, sex])
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'SALA 36')
    await user.click(screen.getByLabelText(/Refletir em outros dias/i))
    // Desmarca a de sexta: só a de quarta acompanha.
    await user.click(screen.getByLabelText(/SEXTA 10:00–12:00 · LAB 35/))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockCRUD.updateMany).toHaveBeenCalledWith([
        { ...seg, sala: 'SALA 36' },
        { ...qua, sala: 'SALA 36' },
      ])
    )
    expect(mockCRUD.update).not.toHaveBeenCalled()
  })

  it('bloqueia quando a nova sala está ocupada no horário de outra alocação refletida', async () => {
    const ocupante = makeAlocacao({ id: 9, disciplina: 'REDES', professor: 'Prof. Lima', sala: 'SALA 36', dia_semana: 'QUARTA', inicio: '09:00', fim: '11:00' })
    const user = await abrirEdicao([seg, qua, ocupante])
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'SALA 36')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()

    await user.click(screen.getByLabelText(/Refletir em outros dias/i))

    expect(screen.getByText(/QUARTA 08:00–10:00 · SALA 36 já está ocupado por REDES — Prof. Lima/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('edição simples também checa conflito na nova sala (fora da sala selecionada)', async () => {
    const ocupante = makeAlocacao({ id: 9, disciplina: 'REDES', sala: 'SALA 36', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '09:00' })
    const user = await abrirEdicao([seg, qua, ocupante])
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'SALA 36')

    expect(screen.getByText(/já está ocupado por REDES/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('remoção refletindo remove a clicada e as marcadas', async () => {
    const user = await abrirEdicao([seg, qua, sex])
    await user.click(screen.getByRole('button', { name: /Remover/i }))
    await user.click(await screen.findByLabelText(/Refletir em outros dias/i))
    await user.click(screen.getByLabelText(/QUARTA 08:00–10:00 · SALA 02/))
    await user.click(screen.getByRole('button', { name: 'Confirmar Remoção' }))

    await waitFor(() => expect(mockCRUD.removeMany).toHaveBeenCalledWith([1, 3]))
    expect(mockCRUD.remove).not.toHaveBeenCalled()
  })

  it('remoção sem marcar remove só a clicada', async () => {
    const user = await abrirEdicao([seg, qua])
    await user.click(screen.getByRole('button', { name: /Remover/i }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar Remoção' }))

    await waitFor(() => expect(mockCRUD.remove).toHaveBeenCalledWith(1))
    expect(mockCRUD.removeMany).not.toHaveBeenCalled()
  })
})

describe('MapPage — exportar PDF', () => {
  beforeEach(() => vi.clearAllMocks())

  it('qualquer usuário exporta a grade da sala visualizada', async () => {
    const aloc = makeAlocacao()
    const reserva = makeReserva()
    setupHooks({ isAdmin: false, alocacoes: [aloc], reservas: [reserva, makeReserva({ id: 2, sala: 'LAB 35' })] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /^Exportar PDF$/i }))

    await waitFor(() => expect(exportarGradePdf).toHaveBeenCalledOnce())
    expect(exportarGradePdf).toHaveBeenCalledWith({
      modulo: 'SAGE Map',
      sala: 'SALA 02',
      tipoSala: 'Sala de Aula',
      periodo: '2026.2',
      alocacoes: [aloc],
      reservas: [reserva],
    })
  })

  it('botão desabilitado enquanto a grade carrega', () => {
    setupHooks({ loading: true })
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('button', { name: /^Exportar PDF$/i })).toBeDisabled()
  })
})

describe('MapPage — exportar grade de todas as salas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gera um único PDF com uma página por sala, na ordem dos botões', async () => {
    const a02 = makeAlocacao({ id: 1, sala: 'SALA 02', disciplina: 'REDES' })
    const aLab = makeAlocacao({ id: 2, sala: 'LAB 35', disciplina: 'COMPILADORES' })
    const reservaLab = makeReserva({ sala: 'LAB 35' })
    setupHooks({ alocacoes: [a02, aLab], reservas: [reservaLab] })
    const user = userEvent.setup()
    renderWithRouter(<MapPage />)

    await user.click(screen.getByRole('button', { name: /Exportar grade de todas as salas/i }))

    await waitFor(() => expect(exportarGradesPdf).toHaveBeenCalledOnce())
    const params = vi.mocked(exportarGradesPdf).mock.calls[0]![0]
    expect(params).toMatchObject({ modulo: 'SAGE Map', periodo: '2026.2', nomeArquivo: 'grades-sage-map-2026.2.pdf' })
    expect(params.paginas.map((p) => p.sala)).toEqual([
      'SALA 02', 'SALA 03', 'SALA 36', 'SALA 38', 'SALA 40', 'SALA 42',
      'LAB 35', 'LAB 37', 'LAB 39', 'LAB 41', 'LAB 43', 'LAB CEAGRI I - 10', 'LAB CEAGRI I - 15',
    ])
    expect(params.paginas[0]).toEqual({ sala: 'SALA 02', tipoSala: 'Sala de Aula', alocacoes: [a02], reservas: [] })
    expect(params.paginas[6]).toEqual({ sala: 'LAB 35', tipoSala: 'Laboratório', alocacoes: [aLab], reservas: [reservaLab] })
  })

  it('botão desabilitado enquanto as alocações do período carregam', () => {
    setupHooks({ loading: true })
    renderWithRouter(<MapPage />)
    expect(screen.getByRole('button', { name: /Exportar grade de todas as salas/i })).toBeDisabled()
  })
})
