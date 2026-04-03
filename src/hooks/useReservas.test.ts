import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Reserva, ReservaInput } from '../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  AUDITORIO_TABLE: 'auditorio',
  fetchReservasMes: vi.fn(),
  insertReserva: vi.fn(),
  updateReserva: vi.fn(),
  deleteReserva: vi.fn(),
}))

const { useReservas } = await import('./useReservas')
const supabaseMocks = await import('../lib/supabase')
const fetchMock = vi.mocked(supabaseMocks.fetchReservasMes)
const insertMock = vi.mocked(supabaseMocks.insertReserva)
const updateMock = vi.mocked(supabaseMocks.updateReserva)
const deleteMock = vi.mocked(supabaseMocks.deleteReserva)

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: 1,
    data: '2026-04-10',
    inicio: '09:00',
    fim: '10:00',
    responsavel: null,
    ...overrides,
  }
}

function makeInput(overrides: Partial<ReservaInput> = {}): ReservaInput {
  return {
    data: '2026-04-15',
    inicio: '14:00',
    fim: '15:00',
    responsavel: null,
    ...overrides,
  }
}

// ── Testes de hasConflict ─────────────────────────────────────────────────────

describe('useReservas — hasConflict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem reservas existentes → hasConflict sempre false', async () => {
    fetchMock.mockResolvedValue([])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasConflict(makeInput())).toBe(false)
  })

  it('mesma data e horário exato → conflito', async () => {
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('sobreposição parcial → conflito', async () => {
    // Existente: 09:00–10:00 | Nova: 09:30–10:30
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '09:30', fim: '10:30' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('horários adjacentes (fim == início da nova) → sem conflito', async () => {
    // Existente: 09:00–10:00 | Nova: 10:00–11:00
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '10:00', fim: '11:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('datas diferentes → sem conflito mesmo com horário igual', async () => {
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-11', inicio: '09:00', fim: '10:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('formato HH:MM:SS (retorno do Supabase) não causa erro de parsing', async () => {
    // Supabase retorna time como "HH:MM:SS"; timeToMinutes deve truncar os segundos
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00:00', fim: '10:00:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Deve detectar conflito mesmo com formato diferente
    const input = makeInput({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('excludeId ignora a própria reserva (update sem auto-conflito)', async () => {
    const existente = makeReserva({ id: 7, data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    expect(result.current.hasConflict(input, 7)).toBe(false)
    expect(result.current.hasConflict(input)).toBe(true) // sem excludeId → conflita
  })
})

// ── Testes de create ──────────────────────────────────────────────────────────

describe('useReservas — create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem conflito → chama insertReserva e recarrega', async () => {
    fetchMock.mockResolvedValue([])
    insertMock.mockResolvedValue(makeReserva({ id: 99 }))

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput()
    await act(async () => { await result.current.create(input) })

    expect(insertMock).toHaveBeenCalledOnce()
    expect(insertMock).toHaveBeenCalledWith(input)
    expect(fetchMock).toHaveBeenCalledTimes(2) // mount + após insert
  })

  it('com conflito → lança erro e não chama insertReserva', async () => {
    const existente = makeReserva({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    fetchMock.mockResolvedValue([existente])

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    await expect(result.current.create(input)).rejects.toThrow('Conflito de horário')
    expect(insertMock).not.toHaveBeenCalled()
  })
})

// ── Testes de update ──────────────────────────────────────────────────────────

describe('useReservas — update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem conflito → chama updateReserva', async () => {
    const existente = makeReserva({ id: 3 })
    fetchMock.mockResolvedValue([existente])
    updateMock.mockResolvedValue(makeReserva({ id: 3, inicio: '11:00', fim: '12:00' }))

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ data: '2026-04-10', inicio: '11:00', fim: '12:00' })
    await act(async () => { await result.current.update(3, input) })

    expect(updateMock).toHaveBeenCalledWith(3, input)
  })

  it('conflito com outra reserva → lança erro', async () => {
    const r1 = makeReserva({ id: 1, data: '2026-04-10', inicio: '09:00', fim: '10:00' })
    const r2 = makeReserva({ id: 2, data: '2026-04-10', inicio: '11:00', fim: '12:00' })
    fetchMock.mockResolvedValue([r1, r2])

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Tentar mover r1 para o horário de r2
    const input = makeInput({ data: '2026-04-10', inicio: '11:00', fim: '12:00' })
    await expect(result.current.update(1, input)).rejects.toThrow('Conflito de horário')
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ── Testes de remove ──────────────────────────────────────────────────────────

describe('useReservas — remove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('chama deleteReserva com o id correto e recarrega', async () => {
    fetchMock.mockResolvedValue([makeReserva({ id: 8 })])
    deleteMock.mockResolvedValue(undefined)

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.remove(8) })

    expect(deleteMock).toHaveBeenCalledWith(8)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ── Carregamento e erros ──────────────────────────────────────────────────────

describe('useReservas — carregamento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('expõe reservas carregadas', async () => {
    const dados = [makeReserva({ id: 1 }), makeReserva({ id: 2, data: '2026-04-20' })]
    fetchMock.mockResolvedValue(dados)

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.reservas).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('erro no fetch → expõe mensagem de erro', async () => {
    fetchMock.mockRejectedValue(new Error('Falha na rede'))

    const { result } = renderHook(() => useReservas(2026, 4))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Falha na rede')
    expect(result.current.reservas).toHaveLength(0)
  })

  it('chama fetchReservasMes com ano e mês corretos', async () => {
    fetchMock.mockResolvedValue([])

    renderHook(() => useReservas(2026, 12))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(2026, 12))
  })
})
