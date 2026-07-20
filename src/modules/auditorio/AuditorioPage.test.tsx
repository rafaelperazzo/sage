import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Reserva } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useReservas', () => ({ useReservas: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

// AuditorioReport usa Recharts ResponsiveContainer que precisa de ResizeObserver
vi.mock('./AuditorioReport', () => ({
  AuditorioReport: ({ reservas }: { reservas: { id: number }[] }) => (
    <div data-testid="auditorio-report">
      <p>Ocupação Mensal</p>
      <p>{reservas.length} reserva(s)</p>
    </div>
  ),
}))

const { useReservas } = await import('../../hooks/useReservas')
const { useAuth } = await import('../../hooks/useAuth')
const mockUseReservas = vi.mocked(useReservas)
const mockUseAuth = vi.mocked(useAuth)

const { AuditorioPage } = await import('./AuditorioPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: 1,
    data: '2026-04-10',
    inicio: '09:00',
    fim: '11:00',
    responsavel: 'Departamento de TI',
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
  reservas = [] as Reserva[],
  loading = false,
  error = null as string | null,
  isAdmin = false,
} = {}) {
  mockUseReservas.mockReturnValue({ reservas, loading, error, ...mockCRUD })
  mockUseAuth.mockReturnValue({
    user: isAdmin ? { id: '1', email: 'a@b.com' } as never : null,
    isAdmin,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('AuditorioPage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Auditório"', () => {
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByRole('heading', { name: /SAGE Auditório/i })).toBeInTheDocument()
  })

  it('exibe as abas "Calendário" e "Relatório"', () => {
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByRole('button', { name: /Calendário/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Relatório/i })).toBeInTheDocument()
  })

  it('a aba Calendário é exibida por padrão', () => {
    renderWithRouter(<AuditorioPage />)
    // MonthCalendar renderiza botões de navegação de mês
    expect(screen.getByRole('button', { name: /anterior|prev|◀|‹/i }) ??
           screen.queryAllByRole('button').length).toBeTruthy()
  })

  it('exibe aviso de contato por e-mail para usuário comum', () => {
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/diretoria.dc@ufrpe.br/i)).toBeInTheDocument()
  })
})

describe('AuditorioPage — estados de loading e erro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe indicador de carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    setupHooks({ error: 'Falha na conexão' })
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/Falha na conexão/i)).toBeInTheDocument()
  })
})

describe('AuditorioPage — admin vs. usuário comum', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usuário comum vê aviso de e-mail', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/envie um e-mail/i)).toBeInTheDocument()
  })

  it('admin NÃO vê aviso de e-mail', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<AuditorioPage />)
    expect(screen.queryByText(/envie um e-mail/i)).not.toBeInTheDocument()
  })

  it('admin vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/Modo Admin/i)).toBeInTheDocument()
  })

  it('usuário comum NÃO vê badge "Modo Admin"', () => {
    setupHooks({ isAdmin: false })
    renderWithRouter(<AuditorioPage />)
    expect(screen.queryByText(/Modo Admin/i)).not.toBeInTheDocument()
  })

  it('admin vê dica de interação', () => {
    setupHooks({ isAdmin: true })
    renderWithRouter(<AuditorioPage />)
    expect(screen.getByText(/Clique em um dia para adicionar/i)).toBeInTheDocument()
  })
})

describe('AuditorioPage — navegação de mês', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe botões de navegação de mês no calendário', () => {
    renderWithRouter(<AuditorioPage />)
    // MonthCalendar renderiza dois botões de chevron
    const buttons = screen.getAllByRole('button')
    // Pelo menos 3 botões: Calendário (tab), Relatório (tab), + navegação
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })
})

describe('AuditorioPage — aba Relatório', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('clicar na aba "Relatório" exibe o componente de relatório', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AuditorioPage />)

    await user.click(screen.getByRole('button', { name: /Relatório/i }))

    expect(await screen.findByTestId('auditorio-report')).toBeInTheDocument()
  })

  it('clicar em "Calendário" volta para a aba de calendário', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AuditorioPage />)

    await user.click(screen.getByRole('button', { name: /Relatório/i }))
    await user.click(screen.getByRole('button', { name: /Calendário/i }))

    // MonthCalendar renderiza os dias abreviados — findAllByText para múltiplos matches
    const segCells = await screen.findAllByText('Seg')
    expect(segCells.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AuditorioPage — exibição de reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // AuditorioPage inicializa o mês exibido com `new Date()` — fixamos apenas o
    // Date (não os timers) no mesmo mês das reservas de teste (2026-04-10),
    // para não depender da data real nem quebrar os delays internos do user-event.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-04-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reserva exibida no calendário é clicável e abre modal de visualização', async () => {
    // MonthCalendar mostra: "{hora} {primeiraWordDoResponsavel}" no chip
    // Ex: responsavel="Comissão UFRPE" → mostra "09:00 Comissão"
    const reserva = makeReserva({ data: '2026-04-10', inicio: '09:00', responsavel: 'Comissão UFRPE' })
    setupHooks({ reservas: [reserva] })
    const user = userEvent.setup()
    renderWithRouter(<AuditorioPage />)

    // O chip mostra a hora + primeira palavra do responsável
    const reservaBtn = await screen.findByText(/Comissão/i)
    await user.click(reservaBtn)

    // Modal de view (não admin) tem botão Fechar mas não Salvar
    expect(await screen.findByRole('button', { name: /Fechar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Salvar/i })).not.toBeInTheDocument()
  })

  it('admin clica em reserva → abre modal de edição', async () => {
    const reserva = makeReserva({ data: '2026-04-10', inicio: '14:00', responsavel: 'Diretoria Depto' })
    setupHooks({ reservas: [reserva], isAdmin: true })
    const user = userEvent.setup()
    renderWithRouter(<AuditorioPage />)

    const reservaBtn = await screen.findByText(/Diretoria/i)
    await user.click(reservaBtn)

    expect(await screen.findByRole('button', { name: /Salvar/i })).toBeInTheDocument()
  })
})
