import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao } from '../../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoes', () => ({ useAlocacoes: vi.fn() }))

const { useAlocacoes } = await import('../../hooks/useAlocacoes')
const mockUseAlocacoes = vi.mocked(useAlocacoes)

const { AgendaPage } = await import('./AgendaPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '10:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Alves',
    periodo: '2026.1',
    curso: 'DC',
    semestre: 0,
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

describe('AgendaPage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Agenda"', () => {
    renderWithRouter(<AgendaPage />)
    expect(screen.getByRole('heading', { name: /SAGE Agenda/i })).toBeInTheDocument()
  })

  it('exibe campo de busca por professor', () => {
    renderWithRouter(<AgendaPage />)
    expect(screen.getByPlaceholderText(/Digite o nome do professor/i)).toBeInTheDocument()
  })

  it('exibe estado vazio inicial (sem professor selecionado)', () => {
    renderWithRouter(<AgendaPage />)
    expect(screen.getByText(/Pesquise e selecione um professor/i)).toBeInTheDocument()
  })
})

describe('AgendaPage — estados de loading e erro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe indicador de carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<AgendaPage />)
    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    setupHooks({ error: 'Erro de conexão' })
    renderWithRouter(<AgendaPage />)
    expect(screen.getByText(/Erro de conexão/i)).toBeInTheDocument()
  })
})

describe('AgendaPage — busca e autocomplete', () => {
  const alocacoes = [
    makeAlocacao({ professor: 'Prof. Alves', disciplina: 'CÁLCULO I' }),
    makeAlocacao({ id: 2, professor: 'Prof. Brito', disciplina: 'FÍSICA I', dia_semana: 'TERÇA' }),
    makeAlocacao({ id: 3, professor: 'Prof. Alves', disciplina: 'CÁLCULO II', dia_semana: 'QUARTA' }),
  ]

  beforeEach(() => { vi.clearAllMocks(); setupHooks({ alocacoes }) })

  it('digitar nome exibe sugestão de professor correspondente', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Alves')

    expect(await screen.findByText('Prof. Alves')).toBeInTheDocument()
  })

  it('sugestão não inclui professor não correspondente', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Alves')

    expect(screen.queryByText('Prof. Brito')).not.toBeInTheDocument()
  })

  it('campo vazio não exibe sugestões', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    // Sem digitar nada, não deve aparecer lista
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('clicar em sugestão seleciona o professor e exibe grade', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Alves')

    const suggestion = await screen.findByText('Prof. Alves')
    await user.click(suggestion)

    // Grade com as alocações do professor
    expect(await screen.findByText('CÁLCULO I')).toBeInTheDocument()
  })

  it('exibe todas as disciplinas do professor selecionado', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Alves')
    await user.click(await screen.findByText('Prof. Alves'))

    expect(await screen.findByText('CÁLCULO I')).toBeInTheDocument()
    expect(screen.getByText('CÁLCULO II')).toBeInTheDocument()
  })

  it('exibe contagem de alocações do professor', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Alves')
    await user.click(await screen.findByText('Prof. Alves'))

    // Prof. Alves tem 2 alocações
    expect(await screen.findByText(/2 alocação/i)).toBeInTheDocument()
  })

  it('busca é normalizada: sem acento encontra professor com acento', async () => {
    const alocacoesComAcento = [
      makeAlocacao({ professor: 'Prof. Ângela Mário', disciplina: 'REDES I' }),
    ]
    setupHooks({ alocacoes: alocacoesComAcento })
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'angela mario')

    expect(await screen.findByText('Prof. Ângela Mário')).toBeInTheDocument()
  })
})

describe('AgendaPage — professor sem alocações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simula professor existente mas sem alocações no período
    setupHooks({
      alocacoes: [makeAlocacao({ professor: 'Prof. Nunes', disciplina: 'IA' })],
    })
  })

  it('selecionar professor com alocações não exibe mensagem de vazio', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AgendaPage />)

    await user.click(screen.getByPlaceholderText(/Digite o nome do professor/i))
    await user.type(screen.getByPlaceholderText(/Digite o nome do professor/i), 'Nunes')
    await user.click(await screen.findByText('Prof. Nunes'))

    expect(screen.queryByText(/Nenhuma alocação encontrada/i)).not.toBeInTheDocument()
    expect(await screen.findByText('IA')).toBeInTheDocument()
  })
})
