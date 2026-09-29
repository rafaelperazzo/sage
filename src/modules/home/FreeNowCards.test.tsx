import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { Alocacao, ReservaPontual } from '../../types'

let mockAlocacoes: Alocacao[] = []
vi.mock('../../hooks/useAlocacoes', () => ({
  useAlocacoes: () => ({ alocacoes: mockAlocacoes, loading: false, error: null, reload: vi.fn() }),
}))
let mockReservas: ReservaPontual[] = []
vi.mock('../../hooks/useReservasPontuais', () => ({
  useReservasPontuais: () => ({ reservas: mockReservas, loading: false, error: null }),
}))

const { FreeNowCards } = await import('./FreeNowCards')

// getByText por padrão só concatena os text nodes diretos de um elemento,
// ignorando o texto de elementos filhos (o <span> do nome da sala) — por
// isso usamos um matcher customizado comparando o textContent completo do <li>.
function getLine(sala: string, ate: string) {
  return screen.getByText(
    (_, node) => node?.tagName === 'LI' && node.textContent === `${sala} - Livre até as ${ate}`
  )
}

function alocacao(overrides: Partial<Alocacao>): Alocacao {
  return {
    id: Math.random(),
    disciplina: 'Disciplina',
    inicio: '10:00',
    fim: '12:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.1',
    curso: 'BCC',
    semestre: 1,
    ...overrides,
  }
}

describe('FreeNowCards', () => {
  beforeEach(() => {
    mockAlocacoes = []
    mockReservas = []
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('não renderiza nada fora do horário 08h-22h', () => {
    vi.setSystemTime(new Date('2026-08-03T07:59:00'))
    const { container } = renderWithRouter(<FreeNowCards />)
    expect(container).toBeEmptyDOMElement()
  })

  it('não renderiza nada no sábado', () => {
    vi.setSystemTime(new Date('2026-08-08T14:00:00')) // sábado
    const { container } = renderWithRouter(<FreeNowCards />)
    expect(container).toBeEmptyDOMElement()
  })

  it('exibe os dois cards dentro do horário comercial (seg-sex, 08h-22h)', () => {
    vi.setSystemTime(new Date('2026-08-03T14:03:00')) // segunda
    renderWithRouter(<FreeNowCards />)
    expect(screen.getByText('Laboratórios Livres Agora')).toBeInTheDocument()
    expect(screen.getByText('Salas Livres Agora')).toBeInTheDocument()
  })

  it('mostra a sala/lab livre com o horário até quando está livre', () => {
    mockAlocacoes = [
      // LAB 43 livre agora, próxima aula às 16:00
      alocacao({ sala: 'LAB 43', dia_semana: 'SEGUNDA', inicio: '10:00', fim: '12:00' }),
      alocacao({ sala: 'LAB 43', dia_semana: 'SEGUNDA', inicio: '16:00', fim: '18:00' }),
      // LAB 37 ocupado agora (14:03 está dentro de 13:00-15:00)
      alocacao({ sala: 'LAB 37', dia_semana: 'SEGUNDA', inicio: '13:00', fim: '15:00' }),
    ]
    vi.setSystemTime(new Date('2026-08-03T14:03:00'))
    renderWithRouter(<FreeNowCards />)

    expect(getLine('LAB 43', '16:00')).toBeInTheDocument()
    expect(screen.queryByText(/LAB 37/)).not.toBeInTheDocument()
  })

  it('assume fim de expediente (22:00) quando não há mais alocações no dia', () => {
    mockAlocacoes = []
    vi.setSystemTime(new Date('2026-08-03T14:03:00'))
    renderWithRouter(<FreeNowCards />)

    expect(getLine('LAB 35', '22:00')).toBeInTheDocument()
    expect(getLine('SALA 02', '22:00')).toBeInTheDocument()
  })

  it('mostra mensagem de indisponibilidade quando não há laboratórios/salas livres', () => {
    const todasSalas = [
      'SALA 02', 'SALA 03', 'SALA 36', 'SALA 38', 'SALA 40', 'SALA 42',
      'LAB 35', 'LAB 37', 'LAB 39', 'LAB 41', 'LAB 43',
      'LAB CEAGRI I - 10', 'LAB CEAGRI I - 15',
    ]
    mockAlocacoes = todasSalas.map((sala) =>
      alocacao({ sala, dia_semana: 'SEGUNDA', inicio: '13:00', fim: '15:00' })
    )
    vi.setSystemTime(new Date('2026-08-03T14:03:00'))
    renderWithRouter(<FreeNowCards />)

    expect(screen.getByText('Nenhum laboratório disponível no momento.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma sala disponível no momento.')).toBeInTheDocument()
  })

  it('considera reservas pontuais de hoje (ocupa agora / antecipa o "livre até")', () => {
    const reserva = (sala: string, inicio: string, fim: string, data = '2026-08-03'): ReservaPontual => ({
      id: Math.random(), disciplina: 'Reserva', professor: null, data, inicio, fim, sala, modulo: 'map',
    })
    mockReservas = [
      reserva('LAB 37', '14:00', '15:00'),              // ocupa agora
      reserva('LAB 43', '17:00', '18:00'),              // livre até 17:00
      reserva('LAB 35', '14:00', '16:00', '2026-08-10'), // outra data: ignorada
    ]
    vi.setSystemTime(new Date('2026-08-03T14:03:00'))
    renderWithRouter(<FreeNowCards />)

    expect(screen.queryByText(/LAB 37/)).not.toBeInTheDocument()
    expect(getLine('LAB 43', '17:00')).toBeInTheDocument()
    expect(getLine('LAB 35', '22:00')).toBeInTheDocument()
  })
})
