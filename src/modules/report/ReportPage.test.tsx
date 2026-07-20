import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao } from '../../types'
import { SALAS } from '../../constants/salas'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAlocacoes', () => ({ useAlocacoes: vi.fn() }))

// Recharts usa ResizeObserver que não existe no jsdom — mockar componentes que usam gráficos
vi.mock('../report/OccupancyBarChart', () => ({
  OccupancyBarChart: ({ salas, onSalaClick }: { salas: { sala: string }[]; onSalaClick: (s: string) => void }) => (
    <div data-testid="bar-chart">
      {salas.map(s => (
        <button key={s.sala} onClick={() => onSalaClick(s.sala)}>{s.sala}</button>
      ))}
    </div>
  ),
}))

vi.mock('../report/RoomDetail', () => ({
  RoomDetail: ({ onClose }: { room: { sala: string }; onClose: () => void }) => (
    <div data-testid="room-detail">
      <p>Segunda</p>
      <button onClick={onClose}>Fechar detalhes</button>
    </div>
  ),
}))

const { useAlocacoes } = await import('../../hooks/useAlocacoes')
const mockUseAlocacoes = vi.mocked(useAlocacoes)

const { ReportPage } = await import('./ReportPage')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '10:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Silva',
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

describe('ReportPage — estrutura básica', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe título "SAGE Report"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByRole('heading', { name: /SAGE Report/i })).toBeInTheDocument()
  })

  it('exibe card "Total de Salas"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Total de Salas/i)).toBeInTheDocument()
    expect(screen.getByText(String(SALAS.length))).toBeInTheDocument()
  })

  it('exibe card "Horas Alocadas"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Horas Alocadas/i)).toBeInTheDocument()
  })

  it('exibe card "Média de Ocupação"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Média de Ocupação/i)).toBeInTheDocument()
  })

  it('exibe seção "Ocupação por Sala" com gráfico', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Ocupação por Sala/i)).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('exibe as três seções de grupos de salas', () => {
    renderWithRouter(<ReportPage />)
    // getAllByText pois legenda + cabeçalho da tabela repetem os rótulos
    expect(screen.getAllByText('Salas de Aula').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Salas de Inovação').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Laboratórios').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe todas as 13 salas na tabela de resumo', () => {
    renderWithRouter(<ReportPage />)
    SALAS.forEach(s => {
      expect(screen.getAllByText(s.nome).length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('ReportPage — estados de loading e erro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe indicador de carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument()
  })

  it('não exibe cards de resumo durante carregamento', () => {
    setupHooks({ loading: true })
    renderWithRouter(<ReportPage />)
    expect(screen.queryByText(/Total de Salas/i)).not.toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    setupHooks({ error: 'Erro de rede' })
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Erro de rede/i)).toBeInTheDocument()
  })
})

describe('ReportPage — dados de ocupação', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sem alocações → horas alocadas = 0h', () => {
    setupHooks({ alocacoes: [] })
    renderWithRouter(<ReportPage />)
    expect(screen.getByText('0h')).toBeInTheDocument()
  })

  it('com 2h de alocação em SALA 02 → exibe 2.0h na tabela', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '10:00', dia_semana: 'SEGUNDA' })
    setupHooks({ alocacoes: [aloc] })
    renderWithRouter(<ReportPage />)
    expect(screen.getByText('2.0h')).toBeInTheDocument()
  })

  it('exibe percentual de ocupação para a sala com alocações', () => {
    const aloc = makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '10:00' })
    setupHooks({ alocacoes: [aloc] })
    renderWithRouter(<ReportPage />)
    // 2h / 72h = ~3%
    expect(screen.getByText('3%')).toBeInTheDocument()
  })
})

describe('ReportPage — seleção de sala no gráfico e tabela', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupHooks({ alocacoes: [makeAlocacao({ sala: 'SALA 02', inicio: '08:00', fim: '10:00' })] })
  })

  it('clicar em sala no gráfico exibe painel de detalhes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ReportPage />)

    // O mock do gráfico renderiza botões clicáveis
    await user.click(screen.getByRole('button', { name: 'SALA 02' }))

    // RoomDetail renderiza detalhes por dia
    expect(await screen.findByText(/Segunda|Terça|Quarta/i)).toBeInTheDocument()
  })

  it('clicar na mesma sala duas vezes fecha o painel de detalhes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ReportPage />)

    await user.click(screen.getByRole('button', { name: 'SALA 02' }))
    await user.click(screen.getByRole('button', { name: 'SALA 02' }))

    // Painel deve ter fechado — RoomDetail tem botão de fechar
    expect(screen.queryByRole('button', { name: /fechar/i })).not.toBeInTheDocument()
  })

  it('clicar em linha da tabela abre painel de detalhes da sala', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ReportPage />)

    // SALA 02 aparece na tabela — clicar na linha
    const linhas = screen.getAllByText('SALA 02')
    // A linha da tabela é o elemento pai clicável
    await user.click(linhas[linhas.length - 1]!)

    expect(await screen.findByText(/Segunda|Terça|Quarta/i)).toBeInTheDocument()
  })
})

describe('ReportPage — legenda do gráfico', () => {
  beforeEach(() => { vi.clearAllMocks(); setupHooks() })

  it('exibe legenda "Salas de Aula"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getAllByText('Salas de Aula').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe legenda "Salas de Inovação"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getAllByText('Salas de Inovação').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe legenda "Laboratórios"', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getAllByText('Laboratórios').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe instrução de interação com o gráfico', () => {
    renderWithRouter(<ReportPage />)
    expect(screen.getByText(/Clique em uma barra para ver detalhes/i)).toBeInTheDocument()
  })
})
